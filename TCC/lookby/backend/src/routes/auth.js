const { Router } = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { db, agora } = require('../db');
const { AppError, validar } = require('../errors');
const { gerarToken, gerarTokenRedefinicao, verificarTokenRedefinicao } = require('../middleware/auth');
const { usuarioPrivado } = require('../services/usuarios');

const router = Router();

const email = z.string({ message: 'informe o e-mail' }).trim().toLowerCase().email('e-mail inválido');
const senha = z.string({ message: 'informe a senha' }).min(6, 'a senha deve ter pelo menos 6 caracteres');

// Cria um nome de usuário único a partir do e-mail (joao.silva@x.com -> joao.silva, joao.silva2...)
function gerarNomeDeUsuario(enderecoEmail) {
  const base = enderecoEmail.split('@')[0].replace(/[^a-z0-9._]/g, '').slice(0, 20) || 'usuario';
  let nome = base;
  for (let n = 2; db.um('SELECT id FROM usuarios WHERE usuario = ?', nome); n++) nome = `${base}${n}`;
  return nome;
}

// POST /auth/cadastro  { email, senha, tipo, nome }
router.post('/cadastro', async (req, res) => {
  const dados = validar(
    z.object({
      email,
      senha,
      tipo: z.enum(['ENTREGADOR', 'CLIENTE'], { message: 'escolha entregador ou cliente' }),
      nome: z.string({ message: 'informe o nome' }).trim().min(2, 'informe o nome'),
    }),
    req.body
  );

  if (db.um('SELECT id FROM usuarios WHERE email = ?', dados.email)) {
    throw new AppError('Este e-mail já está cadastrado', 409);
  }

  const id = db.inserir('usuarios', {
    tipo: dados.tipo,
    email: dados.email,
    nome: dados.nome,
    usuario: gerarNomeDeUsuario(dados.email),
    senhaHash: await bcrypt.hash(dados.senha, 10),
    criadoEm: agora(),
  });
  const usuario = db.um('SELECT * FROM usuarios WHERE id = ?', id);
  res.status(201).json({ token: gerarToken(usuario), usuario: usuarioPrivado(usuario) });
});

// POST /auth/login  { email, senha }
router.post('/login', async (req, res) => {
  const dados = validar(z.object({ email, senha: z.string({ message: 'informe a senha' }).min(1, 'informe a senha') }), req.body);

  const usuario = db.um('SELECT * FROM usuarios WHERE email = ?', dados.email);
  if (!usuario || !(await bcrypt.compare(dados.senha, usuario.senhaHash))) {
    throw new AppError('E-mail ou senha incorretos', 401);
  }
  res.json({ token: gerarToken(usuario), usuario: usuarioPrivado(usuario) });
});

// ------------------------------------------------------------ recuperação de senha
// 1) /auth/esqueci-senha     -> gera um código de 4 dígitos (válido por 15 minutos)
// 2) /auth/verificar-codigo  -> confere o código e devolve um token temporário
// 3) /auth/nova-senha        -> troca a senha usando o token temporário

const emProducao = () => process.env.NODE_ENV === 'production';

// POST /auth/esqueci-senha  { email }
router.post('/esqueci-senha', async (req, res) => {
  const dados = validar(z.object({ email }), req.body);
  const usuario = db.um('SELECT * FROM usuarios WHERE email = ?', dados.email);

  // A resposta é a mesma existindo ou não a conta, para não revelar quem tem cadastro
  const resposta = { mensagem: 'Se o e-mail estiver cadastrado, enviamos um código de 4 dígitos.' };

  if (usuario) {
    const codigo = String(crypto.randomInt(0, 10000)).padStart(4, '0');
    db.atualizar('usuarios', usuario.id, {
      codigoHash: await bcrypt.hash(codigo, 8),
      codigoExpiraEm: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      codigoTentativas: 0,
    });
    // TODO(produção): enviar o código por e-mail (ex.: nodemailer).
    // Em desenvolvimento ele aparece no terminal da API e volta na resposta para facilitar o teste.
    if (!emProducao()) {
      console.log(`[recuperação de senha] código de ${usuario.email}: ${codigo}`);
      resposta.codigoDev = codigo;
    }
  }
  res.json(resposta);
});

async function conferirCodigo(enderecoEmail, codigo) {
  const usuario = db.um('SELECT * FROM usuarios WHERE email = ?', enderecoEmail);
  const invalido = new AppError('Código inválido ou expirado', 400);
  if (!usuario || !usuario.codigoHash) throw invalido;
  if (new Date(usuario.codigoExpiraEm) < new Date() || usuario.codigoTentativas >= 5) {
    db.atualizar('usuarios', usuario.id, { codigoHash: null, codigoExpiraEm: null });
    throw new AppError('Código expirado. Peça um novo.', 400);
  }
  if (!(await bcrypt.compare(codigo, usuario.codigoHash))) {
    db.atualizar('usuarios', usuario.id, { codigoTentativas: usuario.codigoTentativas + 1 });
    throw invalido;
  }
  return usuario;
}

// POST /auth/verificar-codigo  { email, codigo }
router.post('/verificar-codigo', async (req, res) => {
  const dados = validar(
    z.object({ email, codigo: z.string({ message: 'informe o código' }).trim().regex(/^\d{4}$/, 'o código tem 4 dígitos') }),
    req.body
  );
  const usuario = await conferirCodigo(dados.email, dados.codigo);
  db.atualizar('usuarios', usuario.id, { codigoHash: null, codigoExpiraEm: null, codigoTentativas: 0 });
  res.json({ tokenRedefinicao: gerarTokenRedefinicao(usuario) });
});

// POST /auth/nova-senha  { tokenRedefinicao, senha }
router.post('/nova-senha', async (req, res) => {
  const dados = validar(z.object({ tokenRedefinicao: z.string().min(10), senha }), req.body);
  const { id } = verificarTokenRedefinicao(dados.tokenRedefinicao);
  db.atualizar('usuarios', id, { senhaHash: await bcrypt.hash(dados.senha, 10) });
  res.json({ mensagem: 'Senha alterada. Faça login com a nova senha.' });
});

module.exports = router;
