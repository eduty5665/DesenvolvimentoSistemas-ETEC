const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { db } = require('../db');
const { AppError, validar } = require('../errors');
const { autenticar } = require('../middleware/auth');
const { uploadFoto, removerArquivo } = require('../middleware/upload');
const u = require('../services/usuarios');

const router = Router();
router.use(autenticar);

const opcional = (schema) => schema.optional().nullable();
const texto = (max = 120) => z.string().trim().max(max);

function meuPerfil(id) {
  const usuario = u.buscarUsuario(id);
  return { ...u.usuarioPrivado(usuario), ...u.estatisticas(usuario) };
}

// GET /usuarios/me
router.get('/me', (req, res) => res.json(meuPerfil(req.usuario.id)));

// GET /usuarios/resumo  (números para os avisos do app)
router.get('/resumo', (req, res) => {
  const { id, tipo } = req.usuario;
  const naoLidas = db.um(
    `SELECT COUNT(*) AS total
       FROM mensagens m
       JOIN candidaturas c ON c.id = m.candidatura_id
       JOIN entregas e ON e.id = c.entrega_id
      WHERE m.autor_id <> ? AND m.lida_em IS NULL AND (c.entregador_id = ? OR e.cliente_id = ?)`,
    id, id, id
  ).total;
  const candidaturasPendentes =
    tipo === 'CLIENTE'
      ? db.um(
          `SELECT COUNT(*) AS total FROM candidaturas c JOIN entregas e ON e.id = c.entrega_id
            WHERE e.cliente_id = ? AND c.status = 'PENDENTE' AND e.status = 'ABERTA'`,
          id
        ).total
      : 0;
  res.json({ naoLidas, candidaturasPendentes });
});

// PUT /usuarios/me  (dados pessoais; para clientes, também os dados da empresa)
router.put('/me', (req, res) => {
  const dados = validar(
    z.object({
      nome: texto().min(2, 'informe o nome').optional(),
      dataNascimento: opcional(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'data inválida')),
      cpf: opcional(texto(20)),
      cnh: opcional(texto(20)),
      telefone: opcional(texto(20)),
      telefone2: opcional(texto(20)),
      veiculo: opcional(z.enum(u.VEICULOS)),
      placa: opcional(texto(10)),
      cnpj: opcional(texto(20)),
      localizacao: opcional(texto(200)),
      nicho: opcional(texto(100)),
      historia: opcional(texto(1000)),
    }),
    req.body
  );
  // Campos vazios viram NULL
  for (const chave of Object.keys(dados)) if (dados[chave] === '') dados[chave] = null;
  db.atualizar('usuarios', req.usuario.id, dados);
  res.json(meuPerfil(req.usuario.id));
});

// PUT /usuarios/me/conta  { usuario?, email?, novaSenha?, senhaAtual }
router.put('/me/conta', async (req, res) => {
  const dados = validar(
    z.object({
      usuario: texto(30)
        .toLowerCase()
        .regex(/^[a-z0-9._]{3,30}$/, 'use de 3 a 30 letras, números, ponto ou _')
        .optional(),
      email: z.string().trim().toLowerCase().email('e-mail inválido').optional(),
      novaSenha: z.string().min(6, 'a nova senha deve ter pelo menos 6 caracteres').optional(),
      senhaAtual: z.string().min(1, 'informe sua senha atual para confirmar'),
    }),
    req.body
  );
  const atual = u.buscarUsuario(req.usuario.id);
  // Regra: mexer em dados da conta exige a senha atual
  if (!(await bcrypt.compare(dados.senhaAtual, atual.senhaHash))) {
    throw new AppError('Senha atual incorreta', 401);
  }

  const mudancas = {};
  if (dados.usuario && dados.usuario !== atual.usuario) {
    if (db.um('SELECT id FROM usuarios WHERE usuario = ?', dados.usuario)) {
      throw new AppError('Este nome de usuário já está em uso', 409);
    }
    mudancas.usuario = dados.usuario;
  }
  if (dados.email && dados.email !== atual.email) {
    if (db.um('SELECT id FROM usuarios WHERE email = ?', dados.email)) {
      throw new AppError('Este e-mail já está cadastrado', 409);
    }
    mudancas.email = dados.email;
  }
  if (dados.novaSenha) mudancas.senhaHash = await bcrypt.hash(dados.novaSenha, 10);

  db.atualizar('usuarios', atual.id, mudancas);
  res.json(meuPerfil(atual.id));
});

// POST /usuarios/me/foto  (multipart, campo "foto")
router.post('/me/foto', uploadFoto, (req, res) => {
  if (!req.file) throw new AppError('Envie uma imagem', 400);
  const atual = u.buscarUsuario(req.usuario.id);
  removerArquivo(atual.fotoUrl);
  db.atualizar('usuarios', atual.id, { fotoUrl: `/uploads/${req.file.filename}` });
  res.json(meuPerfil(atual.id));
});

// GET /usuarios/:id  (perfil público: currículo do entregador ou dados da empresa)
router.get('/:id', (req, res) => {
  const usuario = u.buscarUsuario(Number(req.params.id));
  const perfil = { ...u.usuarioPublico(usuario), ...u.estatisticas(usuario), ...u.presenca(usuario) };
  // O currículo é para os clientes avaliarem o candidato (outros entregadores não veem)
  const podeVerCurriculo = req.usuario.tipo === 'CLIENTE' || req.usuario.id === usuario.id;
  if (usuario.tipo === 'ENTREGADOR' && podeVerCurriculo) perfil.curriculo = u.curriculoDe(usuario.id);
  perfil.ultimasAvaliacoes = db.todos(
    `SELECT a.nota, a.comentario, a.criado_em, av.nome AS avaliador_nome
       FROM avaliacoes a JOIN usuarios av ON av.id = a.avaliador_id
      WHERE a.avaliado_id = ? ORDER BY a.id DESC LIMIT 10`,
    usuario.id
  );
  res.json(perfil);
});

module.exports = router;
