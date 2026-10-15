const { Router } = require('express');
const { z } = require('zod');
const { db } = require('../db');
const { AppError, validar } = require('../errors');
const { autenticar } = require('../middleware/auth');
const { usuarioPublico, CAMPOS_PUBLICOS } = require('../services/formatar');
const { VEICULOS } = require('./auth');

const router = Router();
router.use(autenticar);

async function estatisticas(usuarioId) {
  const r = await db('avaliacoes')
    .where({ avaliadoId: usuarioId })
    .avg('nota as media')
    .count('* as total')
    .first();
  const entregas = await db('pedidos')
    .where({ entregadorId: usuarioId, status: 'CONCLUIDO' })
    .count('* as total')
    .first();
  return {
    avaliacoes: { media: r.media ? Number(Number(r.media).toFixed(1)) : null, total: Number(r.total) },
    entregasConcluidas: Number(entregas.total),
  };
}

// GET /usuarios/me
router.get('/me', async (req, res) => {
  const usuario = await db('usuarios').where({ id: req.usuario.id }).first();
  if (!usuario) throw new AppError('Usuário não encontrado', 404);
  res.json({ ...usuarioPublico(usuario), ...(await estatisticas(usuario.id)) });
});

// PUT /usuarios/me
router.put('/me', async (req, res) => {
  const dados = validar(
    z.object({
      nome: z.string().trim().min(2, 'informe seu nome').optional(),
      telefone: z.string().trim().min(8, 'telefone inválido').optional(),
      veiculo: z.enum(VEICULOS).optional(),
      placa: z.string().trim().optional(),
    }),
    req.body
  );
  if (Object.keys(dados).length) await db('usuarios').where({ id: req.usuario.id }).update(dados);
  const usuario = await db('usuarios').where({ id: req.usuario.id }).first();
  res.json(usuarioPublico(usuario));
});

// GET /usuarios/:id  (perfil público com avaliações)
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const usuario = await db('usuarios').select(CAMPOS_PUBLICOS).where({ id }).first();
  if (!usuario) throw new AppError('Usuário não encontrado', 404);
  const ultimasAvaliacoes = await db('avaliacoes')
    .join('usuarios', 'usuarios.id', 'avaliacoes.avaliadorId')
    .select('avaliacoes.nota', 'avaliacoes.comentario', 'avaliacoes.criadoEm', 'usuarios.nome as avaliadorNome')
    .where('avaliacoes.avaliadoId', id)
    .orderBy('avaliacoes.id', 'desc')
    .limit(10);
  res.json({ ...usuario, ...(await estatisticas(id)), ultimasAvaliacoes });
});

module.exports = router;
