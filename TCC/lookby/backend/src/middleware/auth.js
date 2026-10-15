const jwt = require('jsonwebtoken');
const { AppError } = require('../errors');

const SEGREDO = () => process.env.JWT_SECRET || 'lookby-dev';

// Token de sessão (7 dias)
function gerarToken(usuario) {
  return jwt.sign({ id: usuario.id, tipo: usuario.tipo }, SEGREDO(), { expiresIn: '7d' });
}

// Token curto, usado só para trocar a senha depois de validar o código
function gerarTokenRedefinicao(usuario) {
  return jwt.sign({ id: usuario.id, uso: 'redefinir-senha' }, SEGREDO(), { expiresIn: '10m' });
}

function verificarToken(token) {
  const dados = jwt.verify(token, SEGREDO());
  if (dados.uso) throw new Error('token de outro tipo');
  return dados;
}

function verificarTokenRedefinicao(token) {
  try {
    const dados = jwt.verify(token, SEGREDO());
    if (dados.uso !== 'redefinir-senha') throw new Error();
    return dados;
  } catch {
    throw new AppError('O código expirou. Peça um novo.', 401);
  }
}

// Exige "Authorization: Bearer <token>" e coloca { id, tipo } em req.usuario
function autenticar(req, _res, next) {
  const [, token] = (req.headers.authorization || '').split(' ');
  if (!token) throw new AppError('Faça login para continuar', 401);
  try {
    req.usuario = verificarToken(token);
  } catch {
    throw new AppError('Sessão expirada. Faça login novamente.', 401);
  }
  next();
}

// Restringe a rota a um tipo de usuário ("CLIENTE" ou "ENTREGADOR")
function somente(tipo) {
  const quem = tipo === 'CLIENTE' ? 'clientes' : 'entregadores';
  return (req, _res, next) => {
    if (req.usuario.tipo !== tipo) throw new AppError(`Apenas ${quem} podem fazer isso`, 403);
    next();
  };
}

module.exports = {
  gerarToken,
  gerarTokenRedefinicao,
  verificarToken,
  verificarTokenRedefinicao,
  autenticar,
  somente,
};
