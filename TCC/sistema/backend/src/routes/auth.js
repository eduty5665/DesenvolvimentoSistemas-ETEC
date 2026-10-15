const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { db, agora, inserir } = require('../db');
const { AppError, validar } = require('../errors');
const { gerarToken } = require('../middleware/auth');
const { usuarioPublico } = require('../services/formatar');

const router = Router();

const VEICULOS = ['MOTO', 'CARRO', 'BICICLETA', 'VAN', 'CAMINHAO'];

const cadastroSchema = z
  .object({
    nome: z.string().trim().min(2, 'informe seu nome'),
    email: z.string().trim().toLowerCase().email('e-mail inválido'),
    senha: z.string().min(6, 'a senha deve ter pelo menos 6 caracteres'),
    telefone: z.string().trim().min(8, 'telefone inválido'),
    tipo: z.enum(['CLIENTE', 'ENTREGADOR']),
    veiculo: z.enum(VEICULOS).optional(),
    placa: z.string().trim().optional(),
    cnh: z.string().trim().optional(),
  })
  .refine((d) => d.tipo !== 'ENTREGADOR' || d.veiculo, {
    message: 'entregadores precisam informar o veículo',
    path: ['veiculo'],
  });

// POST /auth/cadastro
router.post('/cadastro', async (req, res) => {
  const { senha, ...dados } = validar(cadastroSchema, req.body);

  const existe = await db('usuarios').where({ email: dados.email }).first();
  if (existe) throw new AppError('Este e-mail já está cadastrado', 409);

  // Cliente não guarda dados de veículo
  if (dados.tipo === 'CLIENTE') {
    delete dados.veiculo;
    delete dados.placa;
    delete dados.cnh;
  }

  const id = await inserir('usuarios', {
    ...dados,
    senhaHash: await bcrypt.hash(senha, 10),
    criadoEm: agora(),
  });
  const usuario = await db('usuarios').where({ id }).first();

  res.status(201).json({ token: gerarToken(usuario), usuario: usuarioPublico(usuario) });
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('e-mail inválido'),
  senha: z.string().min(1, 'informe a senha'),
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, senha } = validar(loginSchema, req.body);

  const usuario = await db('usuarios').where({ email }).first();
  if (!usuario || !(await bcrypt.compare(senha, usuario.senhaHash))) {
    throw new AppError('E-mail ou senha incorretos', 401);
  }

  res.json({ token: gerarToken(usuario), usuario: usuarioPublico(usuario) });
});

module.exports = router;
module.exports.VEICULOS = VEICULOS;
