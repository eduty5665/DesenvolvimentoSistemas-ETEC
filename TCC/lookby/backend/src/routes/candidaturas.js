const { Router } = require('express');
const { z } = require('zod');
const { db } = require('../db');
const { validar } = require('../errors');
const { autenticar, somente } = require('../middleware/auth');
const chat = require('../services/chat');
const e = require('../services/entregas');
const u = require('../services/usuarios');

// Candidaturas e o chat de cada uma
const router = Router();
router.use(autenticar);

// GET /candidaturas  (minhas conversas: do entregador ou de todas as entregas do cliente)
router.get('/', (req, res) => {
  const { id } = req.usuario;
  const lista = db.todos(
    `SELECT c.*, e.titulo AS entrega_titulo, e.status AS entrega_status, e.cliente_id
       FROM candidaturas c JOIN entregas e ON e.id = c.entrega_id
      WHERE (c.entregador_id = ? OR e.cliente_id = ?) AND c.status <> 'DESISTIU'`,
    id, id
  );
  const conversas = lista.map((c) => ({
    ...c,
    outro: u.publicoPorId(c.entregadorId === id ? c.clienteId : c.entregadorId),
    naoLidas: chat.naoLidas(c.id, id),
    ultimaMensagem: chat.ultimaMensagem(c.id),
  }));
  const momento = (c) => c.ultimaMensagem?.criadoEm || c.criadoEm;
  conversas.sort((a, b) => momento(b).localeCompare(momento(a)));
  res.json(conversas);
});

// GET /candidaturas/:id  (abre o chat: dados da candidatura, da entrega, do outro lado e as mensagens)
router.get('/:id', (req, res) => {
  const { id } = req.usuario;
  const conversa = chat.candidaturaDoUsuario(Number(req.params.id), id);
  chat.marcarComoLidas(conversa, id);

  const outroId = conversa.candidatura.entregadorId === id ? conversa.entrega.clienteId : conversa.candidatura.entregadorId;
  const outro = u.buscarUsuario(outroId);
  res.json({
    ...conversa.candidatura,
    entrega: e.montarEntrega(conversa.entrega),
    outro: { ...u.usuarioPublico(outro), ...u.presenca(outro) },
    mensagens: chat.listarMensagens(conversa.candidatura.id),
  });
});

// POST /candidaturas/:id/lidas  (marca as mensagens recebidas como lidas)
router.post('/:id/lidas', (req, res) => {
  chat.marcarComoLidas(chat.candidaturaDoUsuario(Number(req.params.id), req.usuario.id), req.usuario.id);
  res.json({ ok: true });
});

// POST /candidaturas/:id/mensagens  { texto }
router.post('/:id/mensagens', (req, res) => {
  const { texto } = validar(
    z.object({ texto: z.string().trim().min(1, 'escreva uma mensagem').max(1000) }),
    req.body
  );
  const conversa = chat.candidaturaDoUsuario(Number(req.params.id), req.usuario.id);
  res.status(201).json(chat.enviarTexto(conversa, req.usuario.id, texto));
});

// POST /candidaturas/:id/propostas  { valor }
router.post('/:id/propostas', (req, res) => {
  const { valor } = validar(
    z.object({ valor: z.coerce.number({ message: 'informe o valor' }).positive('o valor deve ser maior que zero') }),
    req.body
  );
  const conversa = chat.candidaturaDoUsuario(Number(req.params.id), req.usuario.id);
  res.status(201).json(chat.enviarProposta(conversa, req.usuario.id, valor));
});

// POST /candidaturas/propostas/:mensagemId/aceitar | recusar
router.post('/propostas/:mensagemId/aceitar', (req, res) => {
  res.json(chat.aceitarProposta(Number(req.params.mensagemId), req.usuario.id));
});
router.post('/propostas/:mensagemId/recusar', (req, res) => {
  res.json(chat.recusarProposta(Number(req.params.mensagemId), req.usuario.id));
});

// POST /candidaturas/:id/aceitar   (cliente confirma este entregador)
router.post('/:id/aceitar', somente('CLIENTE'), (req, res) => {
  const entrega = e.aceitarCandidatura(Number(req.params.id), req.usuario.id);
  res.json(e.montarEntrega(entrega, req.usuario));
});

// POST /candidaturas/:id/recusar   (cliente recusa este candidato)
router.post('/:id/recusar', somente('CLIENTE'), (req, res) => {
  res.json(e.recusarCandidatura(Number(req.params.id), req.usuario.id));
});

// POST /candidaturas/:id/desistir  (entregador retira a candidatura)
router.post('/:id/desistir', somente('ENTREGADOR'), (req, res) => {
  res.json(e.desistir(Number(req.params.id), req.usuario.id));
});

module.exports = router;
