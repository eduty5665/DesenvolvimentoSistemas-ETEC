// Regras de negociação entre cliente e entregador:
// mensagens, propostas de valor, aceite/recusa e notificações em tempo real.
const { db, agora, inserir } = require('../db');
const { AppError } = require('../errors');
const realtime = require('../realtime');
const { comUsuarios, RELACOES_PEDIDO } = require('./formatar');

function participantes(conversa) {
  return [conversa.clienteId, conversa.entregadorId];
}

async function buscarPedido(id) {
  const pedido = await db('pedidos').where({ id }).first();
  if (!pedido) throw new AppError('Pedido não encontrado', 404);
  return comUsuarios(pedido, RELACOES_PEDIDO);
}

// Busca a conversa (com pedido e participantes) e garante que o usuário participa dela
async function conversaDoUsuario(conversaId, usuarioId) {
  const conversa = await db('conversas').where({ id: conversaId }).first();
  if (!conversa) throw new AppError('Conversa não encontrada', 404);
  if (!participantes(conversa).includes(usuarioId)) {
    throw new AppError('Você não participa desta conversa', 403);
  }
  conversa.pedido = await db('pedidos').where({ id: conversa.pedidoId }).first();
  return comUsuarios(conversa, RELACOES_PEDIDO);
}

async function buscarMensagem(id) {
  const m = await db('mensagens').where({ id }).first();
  return m && comUsuarios(m, { autorId: 'autor' });
}

async function listarMensagens(conversaId) {
  const lista = await db('mensagens').where({ conversaId }).orderBy('id', 'asc');
  return comUsuarios(lista, { autorId: 'autor' });
}

async function criarMensagem(conversa, dados) {
  const id = await inserir('mensagens', { conversaId: conversa.id, criadoEm: agora(), ...dados });
  const mensagem = await buscarMensagem(id);
  realtime.paraUsuarios(participantes(conversa), 'mensagem:nova', {
    conversaId: conversa.id,
    mensagem,
  });
  return mensagem;
}

// Mensagem automática do sistema (ex.: "Acordo fechado")
function mensagemSistema(conversa, texto) {
  // O autor de mensagens de sistema é o cliente dono do pedido (só para manter a chave estrangeira)
  return criarMensagem(conversa, { tipo: 'SISTEMA', texto, autorId: conversa.clienteId });
}

function enviarTexto(conversa, autorId, texto) {
  if (conversa.pedido.status === 'CANCELADO') throw new AppError('Este pedido foi cancelado', 409);
  return criarMensagem(conversa, { tipo: 'TEXTO', texto, autorId });
}

async function atualizarProposta(conversa, mensagemId, statusProposta) {
  await db('mensagens').where({ id: mensagemId }).update({ statusProposta });
  const mensagem = await buscarMensagem(mensagemId);
  realtime.paraUsuarios(participantes(conversa), 'mensagem:atualizada', {
    conversaId: conversa.id,
    mensagem,
  });
  return mensagem;
}

async function recusarPendentes(conversa) {
  const pendentes = await db('mensagens')
    .where({ conversaId: conversa.id, tipo: 'PROPOSTA', statusProposta: 'PENDENTE' })
    .select('id');
  for (const p of pendentes) await atualizarProposta(conversa, p.id, 'RECUSADA');
}

const formatarReais = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Qualquer um dos lados pode propor um valor. Uma nova proposta substitui a anterior pendente.
async function enviarProposta(conversa, autorId, valor, texto) {
  if (conversa.pedido.status !== 'ABERTO') {
    throw new AppError('Só é possível negociar valores enquanto o pedido está aberto', 409);
  }
  await recusarPendentes(conversa);
  return criarMensagem(conversa, {
    tipo: 'PROPOSTA',
    texto: texto?.trim() || `Proposta de ${formatarReais(valor)}`,
    valorProposta: valor,
    statusProposta: 'PENDENTE',
    autorId,
  });
}

async function buscarPropostaPendente(mensagemId, usuarioId) {
  const proposta = await db('mensagens').where({ id: mensagemId }).first();
  if (!proposta || proposta.tipo !== 'PROPOSTA') throw new AppError('Proposta não encontrada', 404);
  const conversa = await conversaDoUsuario(proposta.conversaId, usuarioId);
  if (proposta.statusProposta !== 'PENDENTE') throw new AppError('Esta proposta já foi respondida', 409);
  if (proposta.autorId === usuarioId) {
    throw new AppError('Você não pode responder a sua própria proposta', 403);
  }
  return { proposta, conversa };
}

// Aceitar fecha o acordo: o pedido passa para ACEITO com o entregador e o valor combinados
async function aceitarProposta(mensagemId, usuarioId) {
  const { proposta, conversa } = await buscarPropostaPendente(mensagemId, usuarioId);

  // O filtro por status evita que duas propostas do mesmo pedido sejam aceitas ao mesmo tempo
  const alterados = await db('pedidos')
    .where({ id: conversa.pedidoId, status: 'ABERTO' })
    .update({
      status: 'ACEITO',
      entregadorId: conversa.entregadorId,
      valorFinal: proposta.valorProposta,
      atualizadoEm: agora(),
    });
  if (alterados === 0) throw new AppError('Este pedido não está mais aberto', 409);

  await atualizarProposta(conversa, proposta.id, 'ACEITA');
  await mensagemSistema(
    conversa,
    `Acordo fechado por ${formatarReais(proposta.valorProposta)}! O entregador já pode buscar a mercadoria.`
  );

  // Encerra as outras negociações do mesmo pedido
  const outras = await db('conversas')
    .where({ pedidoId: conversa.pedidoId })
    .whereNot({ id: conversa.id });
  for (const c of outras) {
    await recusarPendentes(c);
    await mensagemSistema(c, 'O cliente fechou este pedido com outro entregador.');
  }

  const pedido = await buscarPedido(conversa.pedidoId);
  await notificarPedido(pedido);
  return pedido;
}

async function recusarProposta(mensagemId, usuarioId) {
  const { proposta, conversa } = await buscarPropostaPendente(mensagemId, usuarioId);
  return atualizarProposta(conversa, proposta.id, 'RECUSADA');
}

// Avisa cliente, entregador escolhido e todos que negociaram que o pedido mudou
async function notificarPedido(pedido) {
  const conversas = await db('conversas').where({ pedidoId: pedido.id }).select('entregadorId');
  const ids = [pedido.clienteId, pedido.entregadorId, ...conversas.map((c) => c.entregadorId)];
  realtime.paraUsuarios(ids.filter(Boolean), 'pedido:atualizado', { pedido });
}

module.exports = {
  buscarPedido,
  conversaDoUsuario,
  listarMensagens,
  mensagemSistema,
  enviarTexto,
  enviarProposta,
  aceitarProposta,
  recusarProposta,
  notificarPedido,
};
