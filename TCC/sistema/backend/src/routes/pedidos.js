const { Router } = require('express');
const { z } = require('zod');
const { db, agora, inserir } = require('../db');
const { AppError, validar } = require('../errors');
const { autenticar, somente } = require('../middleware/auth');
const { comUsuarios, RELACOES_PEDIDO } = require('../services/formatar');
const realtime = require('../realtime');
const neg = require('../services/negociacao');
const { anexarUltimaMensagem } = require('./conversas');

const router = Router();
router.use(autenticar);

const CATEGORIAS = ['ENCOMENDA', 'DOCUMENTOS', 'COMPRAS', 'ALIMENTOS', 'MUDANCA', 'OUTRO'];

const pedidoSchema = z.object({
  titulo: z.string().trim().min(3, 'informe um título'),
  descricao: z.string().trim().min(3, 'descreva o que será transportado'),
  categoria: z.enum(CATEGORIAS),
  origem: z.string().trim().min(3, 'informe o endereço de retirada'),
  destino: z.string().trim().min(3, 'informe o endereço de entrega'),
  valorSugerido: z.coerce.number().positive('o valor deve ser maior que zero').optional().nullable(),
});

// POST /pedidos  (cliente cria uma solicitação de serviço)
router.post('/', somente('CLIENTE'), async (req, res) => {
  const dados = validar(pedidoSchema, req.body);
  const data = agora();
  const id = await inserir('pedidos', {
    ...dados,
    clienteId: req.usuario.id,
    status: 'ABERTO',
    criadoEm: data,
    atualizadoEm: data,
  });
  const pedido = await neg.buscarPedido(id);
  realtime.paraEntregadores('pedido:novo', { pedido });
  res.status(201).json(pedido);
});

// GET /pedidos/meus  (cliente: pedidos que criou | entregador: pedidos que assumiu)
router.get('/meus', async (req, res) => {
  const campo = req.usuario.tipo === 'CLIENTE' ? 'clienteId' : 'entregadorId';
  const pedidos = await db('pedidos')
    .select('pedidos.*')
    .select(
      db('conversas').count('*').where('conversas.pedidoId', db.ref('pedidos.id')).as('totalConversas')
    )
    .where({ [campo]: req.usuario.id })
    .orderBy('id', 'desc');
  res.json(await comUsuarios(pedidos, RELACOES_PEDIDO));
});

// GET /pedidos/disponiveis?categoria=ENCOMENDA  (entregador vê pedidos abertos)
router.get('/disponiveis', somente('ENTREGADOR'), async (req, res) => {
  const { categoria } = req.query;
  const consulta = db('pedidos').where({ status: 'ABERTO' }).orderBy('id', 'desc');
  if (CATEGORIAS.includes(categoria)) consulta.andWhere({ categoria });
  res.json(await comUsuarios(await consulta, RELACOES_PEDIDO));
});

// GET /pedidos/:id  (detalhes + negociações visíveis para quem pede)
router.get('/:id', async (req, res) => {
  const pedido = await neg.buscarPedido(Number(req.params.id));
  const { id, tipo } = req.usuario;
  const ehCliente = pedido.clienteId === id;
  const envolvido = ehCliente || pedido.entregadorId === id;
  if (!envolvido && !(tipo === 'ENTREGADOR' && pedido.status === 'ABERTO')) {
    throw new AppError('Você não tem acesso a este pedido', 403);
  }
  // O cliente vê todas as negociações; o entregador só a dele
  const consulta = db('conversas').where({ pedidoId: pedido.id }).orderBy('id', 'asc');
  if (!ehCliente) consulta.andWhere({ entregadorId: id });
  const conversas = await comUsuarios(await consulta, { entregadorId: 'entregador' });
  await anexarUltimaMensagem(conversas);

  const avaliacao = await db('avaliacoes').where({ pedidoId: pedido.id, avaliadorId: id }).first();
  res.json({ ...pedido, conversas, jaAvaliei: Boolean(avaliacao) });
});

// POST /pedidos/:id/conversas  (entregador abre negociação com o cliente)
router.post('/:id/conversas', somente('ENTREGADOR'), async (req, res) => {
  const pedido = await neg.buscarPedido(Number(req.params.id));
  if (pedido.status !== 'ABERTO') throw new AppError('Este pedido não está mais aberto', 409);

  const chave = { pedidoId: pedido.id, entregadorId: req.usuario.id };
  let conversa = await db('conversas').where(chave).first();
  if (!conversa) {
    const id = await inserir('conversas', { ...chave, clienteId: pedido.clienteId, criadoEm: agora() });
    conversa = await db('conversas').where({ id }).first();
    await neg.mensagemSistema(conversa, 'Um entregador entrou na negociação.');
  }
  res.status(201).json(conversa);
});

// Transições de status permitidas: status atual -> { novo status: quem pode fazer }
const TRANSICOES = {
  ABERTO: { CANCELADO: 'CLIENTE' },
  ACEITO: { EM_ANDAMENTO: 'ENTREGADOR', CANCELADO: 'CLIENTE' },
  EM_ANDAMENTO: { CONCLUIDO: 'ENTREGADOR' },
};

const TEXTO_STATUS = {
  EM_ANDAMENTO: 'O entregador retirou a mercadoria. Entrega em andamento.',
  CONCLUIDO: 'Entrega concluída! Não esqueça de avaliar.',
  CANCELADO: 'Pedido cancelado pelo cliente.',
};

// PATCH /pedidos/:id/status  { status }
router.patch('/:id/status', async (req, res) => {
  const { status } = validar(
    z.object({ status: z.enum(['EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO']) }),
    req.body
  );
  const pedido = await neg.buscarPedido(Number(req.params.id));
  const { id, tipo } = req.usuario;

  const quemPode = TRANSICOES[pedido.status]?.[status];
  if (!quemPode) throw new AppError(`Não é possível mudar de ${pedido.status} para ${status}`, 409);
  if (quemPode !== tipo) throw new AppError('Você não pode fazer essa alteração', 403);
  const participa = tipo === 'CLIENTE' ? pedido.clienteId === id : pedido.entregadorId === id;
  if (!participa) throw new AppError('Você não participa deste pedido', 403);

  await db('pedidos').where({ id: pedido.id }).update({ status, atualizadoEm: agora() });
  const atualizado = await neg.buscarPedido(pedido.id);

  // Registra no chat com o entregador escolhido (ou em todos, se ainda estava aberto)
  const conversas = await db('conversas')
    .where({ pedidoId: pedido.id })
    .modify((q) => pedido.entregadorId && q.andWhere({ entregadorId: pedido.entregadorId }));
  for (const c of conversas) await neg.mensagemSistema(c, TEXTO_STATUS[status]);

  await neg.notificarPedido(atualizado);
  res.json(atualizado);
});

// POST /pedidos/:id/avaliacoes  { nota, comentario }
router.post('/:id/avaliacoes', async (req, res) => {
  const { nota, comentario } = validar(
    z.object({
      nota: z.coerce.number().int().min(1, 'nota de 1 a 5').max(5, 'nota de 1 a 5'),
      comentario: z.string().trim().max(500).optional(),
    }),
    req.body
  );
  const pedido = await neg.buscarPedido(Number(req.params.id));
  const { id } = req.usuario;
  if (pedido.status !== 'CONCLUIDO') throw new AppError('Só é possível avaliar pedidos concluídos', 409);

  let avaliadoId;
  if (pedido.clienteId === id) avaliadoId = pedido.entregadorId;
  else if (pedido.entregadorId === id) avaliadoId = pedido.clienteId;
  else throw new AppError('Você não participa deste pedido', 403);

  const jaAvaliou = await db('avaliacoes').where({ pedidoId: pedido.id, avaliadorId: id }).first();
  if (jaAvaliou) throw new AppError('Você já avaliou este pedido', 409);

  const novoId = await inserir('avaliacoes', {
    pedidoId: pedido.id,
    avaliadorId: id,
    avaliadoId,
    nota,
    comentario: comentario || null,
    criadoEm: agora(),
  });
  res.status(201).json(await db('avaliacoes').where({ id: novoId }).first());
});

module.exports = router;
module.exports.CATEGORIAS = CATEGORIAS;
