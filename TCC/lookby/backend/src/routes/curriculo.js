const { Router } = require('express');
const { z } = require('zod');
const { db, agora } = require('../db');
const { AppError, validar } = require('../errors');
const { autenticar, somente } = require('../middleware/auth');
const { uploadDocumento, removerArquivo } = require('../middleware/upload');
const { curriculoDe } = require('../services/usuarios');

// Currículo do entregador: é o que o cliente vê antes de confirmar um candidato
const router = Router();
router.use(autenticar, somente('ENTREGADOR'));

const itemSchema = z.object({
  secao: z.enum(['ESCOLARIDADE', 'EXPERIENCIA', 'CONTATO']),
  titulo: z.string().trim().min(2, 'preencha o primeiro campo').max(100),
  subtitulo: z.string().trim().max(100).optional().nullable(),
  periodo: z.string().trim().max(50).optional().nullable(),
  descricao: z.string().trim().max(500).optional().nullable(),
});

function meuItem(id, usuarioId) {
  const item = db.um('SELECT * FROM curriculo_itens WHERE id = ? AND usuario_id = ?', id, usuarioId);
  if (!item) throw new AppError('Item não encontrado', 404);
  return item;
}

// GET /curriculo
router.get('/', (req, res) => res.json(curriculoDe(req.usuario.id)));

// POST /curriculo/itens
router.post('/itens', (req, res) => {
  const dados = validar(itemSchema, req.body);
  const id = db.inserir('curriculo_itens', { ...dados, usuarioId: req.usuario.id });
  res.status(201).json(db.um('SELECT * FROM curriculo_itens WHERE id = ?', id));
});

// PUT /curriculo/itens/:id
router.put('/itens/:id', (req, res) => {
  const item = meuItem(Number(req.params.id), req.usuario.id);
  const { secao, ...dados } = validar(itemSchema, { ...req.body, secao: item.secao });
  db.atualizar('curriculo_itens', item.id, dados);
  res.json(db.um('SELECT * FROM curriculo_itens WHERE id = ?', item.id));
});

// DELETE /curriculo/itens/:id
router.delete('/itens/:id', (req, res) => {
  const item = meuItem(Number(req.params.id), req.usuario.id);
  db.executar('DELETE FROM curriculo_itens WHERE id = ?', item.id);
  res.json({ ok: true });
});

// POST /curriculo/arquivos  (multipart, campo "arquivo")
router.post('/arquivos', uploadDocumento, (req, res) => {
  if (!req.file) throw new AppError('Envie um arquivo', 400);
  const total = db.um('SELECT COUNT(*) AS n FROM curriculo_arquivos WHERE usuario_id = ?', req.usuario.id).n;
  if (total >= 5) {
    removerArquivo(`/uploads/${req.file.filename}`);
    throw new AppError('Limite de 5 arquivos no currículo', 409);
  }
  const id = db.inserir('curriculo_arquivos', {
    usuarioId: req.usuario.id,
    // O navegador/app envia o nome em latin1; converte para manter os acentos
    nome: Buffer.from(req.file.originalname, 'latin1').toString('utf8').slice(0, 120),
    url: `/uploads/${req.file.filename}`,
    tamanho: req.file.size,
    criadoEm: agora(),
  });
  res.status(201).json(db.um('SELECT * FROM curriculo_arquivos WHERE id = ?', id));
});

// DELETE /curriculo/arquivos/:id
router.delete('/arquivos/:id', (req, res) => {
  const arquivo = db.um(
    'SELECT * FROM curriculo_arquivos WHERE id = ? AND usuario_id = ?',
    Number(req.params.id),
    req.usuario.id
  );
  if (!arquivo) throw new AppError('Arquivo não encontrado', 404);
  removerArquivo(arquivo.url);
  db.executar('DELETE FROM curriculo_arquivos WHERE id = ?', arquivo.id);
  res.json({ ok: true });
});

module.exports = router;
