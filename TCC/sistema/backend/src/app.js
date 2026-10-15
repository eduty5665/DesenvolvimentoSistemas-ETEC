const express = require('express');
const cors = require('cors');
const { AppError } = require('./errors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => res.json({ nome: 'API Sistema de Entregas', status: 'ok' }));

app.use('/auth', require('./routes/auth'));
app.use('/usuarios', require('./routes/usuarios'));
app.use('/pedidos', require('./routes/pedidos'));
app.use('/conversas', require('./routes/conversas'));

app.use((_req, _res) => {
  throw new AppError('Rota não encontrada', 404);
});

// Tratamento central de erros (Express 5 captura erros de funções async)
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof AppError) return res.status(err.status).json({ erro: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ erro: 'JSON inválido' });
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

module.exports = app;
