// Chat entre o cliente e o candidato de uma entrega.
// Cada candidatura tem a sua conversa. Além de texto, os dois podem trocar
// PROPOSTAS de valor; quando uma é aceita, vira o "valor combinado" da candidatura.
const { db, agora } = require('../db');
const { AppError } = require('../errors');
const realtime = require('../realtime');

const reais = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Busca a candidatura com a entrega e confere se o usuário participa da conversa
function candidaturaDoUsuario(candidaturaId, usuarioId) {
  const candidatura = db.um('SELECT * FROM candidaturas WHERE id = ?', candidaturaId);
  if (!candidatura) throw new AppError('Candidatura não encontrada', 404);
  const entrega = db.um('SELECT * FROM entregas WHERE id = ?', candidatura.entregaId);
  const participantes = [entrega.clienteId, candidatura.entregadorId];
  if (!participantes.includes(usuarioId)) throw new AppError('Você não participa desta conversa', 403);
  return { candidatura, entrega, participantes };
}

function buscarMensagem(id) {
  return db.um(
    `SELECT m.*, u.nome AS autor_nome, u.tipo AS autor_tipo, u.foto_url AS autor_foto_url
       FROM mensagens m JOIN usuarios u ON u.id = m.autor_id WHERE m.id = ?`,
    id
  );
}

function listarMensagens(candidaturaId) {
  return db.todos(
    `SELECT m.*, u.nome AS autor_nome, u.tipo AS autor_tipo, u.foto_url AS autor_foto_url
       FROM mensagens m JOIN usuarios u ON u.id = m.autor_id
      WHERE m.candidatura_id = ? ORDER BY m.id`,
    candidaturaId
  );
}

function ultimaMensagem(candidaturaId) {
  return db.um('SELECT * FROM mensagens WHERE candidatura_id = ? ORDER BY id DESC LIMIT 1', candidaturaId);
}

// Mensagens do outro lado que o usuário ainda não leu
function naoLidas(candidaturaId, usuarioId) {
  return db.um(
    'SELECT COUNT(*) AS total FROM mensagens WHERE candidatura_id = ? AND autor_id <> ? AND lida_em IS NULL',
    candidaturaId,
    usuarioId
  ).total;
}

function marcarComoLidas({ candidatura, participantes }, usuarioId) {
  const { changes } = db.executar(
    'UPDATE mensagens SET lida_em = ? WHERE candidatura_id = ? AND autor_id <> ? AND lida_em IS NULL',
    agora(),
    candidatura.id,
    usuarioId
  );
  if (changes) realtime.paraUsuarios(participantes, 'mensagens:lidas', { candidaturaId: candidatura.id });
}

function criarMensagem(conversa, dados) {
  const id = db.inserir('mensagens', {
    candidaturaId: conversa.candidatura.id,
    tipo: 'TEXTO',
    criadoEm: agora(),
    ...dados,
  });
  const mensagem = buscarMensagem(id);
  realtime.paraUsuarios(conversa.participantes, 'mensagem:nova', {
    candidaturaId: conversa.candidatura.id,
    entregaId: conversa.entrega.id,
    mensagem,
  });
  return mensagem;
}

// Aviso automático no chat (ex.: "Candidatura aceita"). autorId = quem provocou o aviso.
function avisoNoChat(candidaturaId, autorId, texto) {
  const conversa = candidaturaDoUsuario(candidaturaId, autorId);
  return criarMensagem(conversa, { tipo: 'SISTEMA', texto, autorId });
}

function conversaAberta({ candidatura, entrega }) {
  if (entrega.status === 'CANCELADA') throw new AppError('Esta entrega foi cancelada', 409);
  if (!['PENDENTE', 'ACEITA'].includes(candidatura.status)) {
    throw new AppError('Esta conversa foi encerrada', 409);
  }
}

function enviarTexto(conversa, autorId, texto) {
  conversaAberta(conversa);
  return criarMensagem(conversa, { tipo: 'TEXTO', texto, autorId });
}

function atualizarProposta(conversa, mensagemId, statusProposta) {
  db.atualizar('mensagens', mensagemId, { statusProposta });
  const mensagem = buscarMensagem(mensagemId);
  realtime.paraUsuarios(conversa.participantes, 'mensagem:atualizada', {
    candidaturaId: conversa.candidatura.id,
    mensagem,
  });
  return mensagem;
}

// Propostas sem resposta deixam de valer quando chega uma nova (SUBSTITUIDA)
// ou quando a negociação termina (ENCERRADA)
function encerrarPropostasPendentes(conversa, status = 'ENCERRADA') {
  const pendentes = db.todos(
    "SELECT id FROM mensagens WHERE candidatura_id = ? AND tipo = 'PROPOSTA' AND status_proposta = 'PENDENTE'",
    conversa.candidatura.id
  );
  for (const p of pendentes) atualizarProposta(conversa, p.id, status);
}

// Regra: só se negocia valor enquanto a entrega está ABERTA e a candidatura PENDENTE.
// Uma proposta nova substitui a anterior que ainda estava pendente.
function enviarProposta(conversa, autorId, valor) {
  if (conversa.entrega.status !== 'ABERTA' || conversa.candidatura.status !== 'PENDENTE') {
    throw new AppError('Só é possível negociar valores antes de o cliente confirmar o entregador', 409);
  }
  encerrarPropostasPendentes(conversa, 'SUBSTITUIDA');
  return criarMensagem(conversa, {
    tipo: 'PROPOSTA',
    texto: `Proposta de ${reais(valor)}`,
    valorProposta: valor,
    statusProposta: 'PENDENTE',
    autorId,
  });
}

function propostaPendente(mensagemId, usuarioId) {
  const proposta = db.um("SELECT * FROM mensagens WHERE id = ? AND tipo = 'PROPOSTA'", mensagemId);
  if (!proposta) throw new AppError('Proposta não encontrada', 404);
  const conversa = candidaturaDoUsuario(proposta.candidaturaId, usuarioId);
  if (proposta.statusProposta !== 'PENDENTE') throw new AppError('Esta proposta já foi respondida', 409);
  // Regra: ninguém responde a própria proposta
  if (proposta.autorId === usuarioId) throw new AppError('Aguarde a resposta da outra pessoa', 403);
  return { proposta, conversa };
}

// Aceitar uma proposta registra o valor combinado. Quem fecha o negócio é o cliente,
// ao confirmar o entregador na tela de candidaturas.
function aceitarProposta(mensagemId, usuarioId) {
  const { proposta, conversa } = propostaPendente(mensagemId, usuarioId);
  if (conversa.entrega.status !== 'ABERTA' || conversa.candidatura.status !== 'PENDENTE') {
    throw new AppError('Esta negociação já foi encerrada', 409);
  }
  db.atualizar('candidaturas', conversa.candidatura.id, {
    valorCombinado: proposta.valorProposta,
    atualizadoEm: agora(),
  });
  const mensagem = atualizarProposta(conversa, proposta.id, 'ACEITA');
  criarMensagem(conversa, {
    tipo: 'SISTEMA',
    autorId: usuarioId,
    texto: `Valor combinado: ${reais(proposta.valorProposta)}. Falta o cliente confirmar o entregador.`,
  });
  realtime.paraUsuarios(conversa.participantes, 'candidatura:atualizada', {
    candidaturaId: conversa.candidatura.id,
    entregaId: conversa.entrega.id,
  });
  return mensagem;
}

function recusarProposta(mensagemId, usuarioId) {
  const { proposta, conversa } = propostaPendente(mensagemId, usuarioId);
  return atualizarProposta(conversa, proposta.id, 'RECUSADA');
}

module.exports = {
  reais,
  candidaturaDoUsuario,
  listarMensagens,
  ultimaMensagem,
  naoLidas,
  marcarComoLidas,
  avisoNoChat,
  enviarTexto,
  enviarProposta,
  aceitarProposta,
  recusarProposta,
  encerrarPropostasPendentes,
};
