const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { AppError } = require('./errors');
const { PASTA: PASTA_UPLOADS } = require('./middleware/upload');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => res.json({ nome: 'API LookBy entregas', status: 'ok' }));
app.use('/uploads', express.static(PASTA_UPLOADS));

app.use('/auth', require('./routes/auth'));
app.use('/usuarios', require('./routes/usuarios'));
app.use('/curriculo', require('./routes/curriculo'));
app.use('/empresas', require('./routes/empresas'));
app.use('/entregas', require('./routes/entregas'));
app.use('/candidaturas', require('./routes/candidaturas'));

app.use((_req, _res) => {
  throw new AppError('Rota não encontrada', 404);
});

// Tratamento central de erros (o Express 5 já captura erros de funções async)
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof AppError) return res.status(err.status).json({ erro: err.message });
  if (err instanceof multer.MulterError) {
    const erro = err.code === 'LIMIT_FILE_SIZE' ? 'Arquivo grande demais' : 'Não foi possível receber o arquivo';
    return res.status(400).json({ erro });
  }
  if (err.type === 'entity.parse.failed') return res.status(400).json({ erro: 'JSON inválido' });
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

module.exports = app;
