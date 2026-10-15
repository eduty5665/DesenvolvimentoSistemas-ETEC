require('dotenv').config({ quiet: true });
const http = require('http');
const os = require('os');
const { db } = require('./db');
const app = require('./app');
const realtime = require('./realtime');
const { popularExemplos } = require('../database/seed');

const PORT = Number(process.env.PORT) || 3333;

// Banco novo? Cria os dados de demonstração para o app já abrir com conteúdo.
const vazio = db.um('SELECT COUNT(*) AS n FROM usuarios').n === 0;
if (vazio && process.env.NODE_ENV !== 'production' && process.env.SEED_DEMO !== 'false') {
  popularExemplos().then(() => {
    console.log('Banco criado com dados de exemplo (senha de todos: 123456):');
    console.log('  empresa@lookby.com     -> cliente (Pencil Case Store)');
    console.log('  entregador@lookby.com  -> entregador (Ricardo)');
  });
}

const server = http.createServer(app);
realtime.iniciar(server);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`API LookBy rodando em http://localhost:${PORT}`);
  // IP da rede local: o celular precisa estar no mesmo Wi-Fi do computador
  for (const lista of Object.values(os.networkInterfaces())) {
    for (const net of lista || []) {
      if (net.family === 'IPv4' && !net.internal) console.log(`No celular: http://${net.address}:${PORT}`);
    }
  }
});
