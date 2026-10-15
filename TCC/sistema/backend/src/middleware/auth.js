const jwt = require('jsonwebtoken');
const { AppError } = require('../errors');

const SEGREDO = () => process.env.JWT_SECRET || 'dev-secret';

function gerarToken(usuario) {
  return jwt.sign({ id: usuario.id, tipo: usuario.tipo }, SEGREDO(), { expiresIn: '7d' });
}

function verificarToken(token) {
  return jwt.verify(token, SEGREDO());
}

// Exige "Authorization: Bearer <token>" e coloca { id, tipo } em req.usuario
function autenticar(req, _res, next) {
  const header = req.headers.authorization || '';
  const [, token] = header.split(' ');
  if (!token) throw new AppError('Token não informado', 401);
  try {
    req.usuario = verificarToken(token);
  } catch {
    throw new AppError('Token inválido ou expirado', 401);
  }
  next();
}

// Restringe a rota a um tipo de usuário ("CLIENTE" ou "ENTREGADOR")
function somente(tipo) {
  return (req, _res, next) => {
    if (req.usuario.tipo !== tipo) {
      throw new AppError(`Apenas ${tipo.toLowerCase()}s podem fazer isso`, 403);
    }
    next();
  };
}

module.exports = { gerarToken, verificarToken, autenticar, somente };
