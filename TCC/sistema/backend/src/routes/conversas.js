const { Router } = require('express');
const { z } = require('zod');
const { db } = require('../db');
const { validar } = require('../errors');
const { autenticar } = require('../middleware/auth');
const { comUsuarios, RELACOES_PEDIDO } = require('../services/formatar');
const neg = require('../services/negociacao');

const router = Router();
router.use(autenticar);

// Coloca em cada conversa a última mensagem trocada (para a lista de conversas)
async function anexarUltimaMensagem(conversas) {
  if (!conversas.length) return conversas;
  const ids = conversas.map((c) => c.id);
  const ultimas = await db('mensagens').whereIn(
    'id',
    db('mensagens').max('id').whereIn('conversaId', ids).groupBy('conversaId')
  );
  const porConversa = new Map(ultimas.map((m) => [m.conversaId, m]));
  for (const c of conversas) c.ultimaMensagem = porConversa.get(c.id) || null;
  return conversas;
}

// GET /conversas  (todas as conversas do usuário, mais recentes primeiro)
router.get('/', async (req, res) => {
  const { id } = req.usuario;
  const conversas = await db('conversas')
    .join('pedidos', 'pedidos.id', 'conversas.pedidoId')
    .select('conversas.*', 'pedidos.titulo as pedidoTitulo', 'pedidos.status as pedidoStatus')
    .where('conversas.clienteId', id)
    .orWhere('conversas.entregadorId', id);

  await comUsuarios(conversas, RELACOES_PEDIDO);
  await anexarUltimaMensagem(conversas);
  const momento = (c) => c.ultimaMensagem?.criadoEm || c.criadoEm;
  conversas.sort((a, b) => momento(b).localeCompare(momento(a)));
  res.json(conversas);
});

// GET /conversas/:id  (dados da conversa + histórico de mensagens)
router.get('/:id', async (req, res) => {
  const conversa = await neg.conversaDoUsuario(Number(req.params.id), req.usuario.id);
  res.json({ ...conversa, mensagens: await neg.listarMensagens(conversa.id) });
});

// POST /conversas/:id/mensagens  { texto }
router.post('/:id/mensagens', async (req, res) => {
  const { texto } = validar(
    z.object({ texto: z.string().trim().min(1, 'mensagem vazia').max(2000) }),
    req.body
  );
  const conversa = await neg.conversaDoUsuario(Number(req.params.id), req.usuario.id);
  res.status(201).json(await neg.enviarTexto(conversa, req.usuario.id, texto));
});

// POST /conversas/:id/propostas  { valor, texto? }
router.post('/:id/propostas', async (req, res) => {
  const { valor, texto } = validar(
    z.object({
      valor: z.coerce.number().positive('o valor deve ser maior que zero'),
      texto: z.string().max(500).optional(),
    }),
    req.body
  );
  const conversa = await neg.conversaDoUsuario(Number(req.params.id), req.usuario.id);
  res.status(201).json(await neg.enviarProposta(conversa, req.usuario.id, valor, texto));
});

// POST /conversas/propostas/:mensagemId/aceitar
router.post('/propostas/:mensagemId/aceitar', async (req, res) => {
  res.json(await neg.aceitarProposta(Number(req.params.mensagemId), req.usuario.id));
});

// POST /conversas/propostas/:mensagemId/recusar
router.post('/propostas/:mensagemId/recusar', async (req, res) => {
  res.json(await neg.recusarProposta(Number(req.params.mensagemId), req.usuario.id));
});

module.exports = router;
module.exports.anexarUltimaMensagem = anexarUltimaMensagem;
