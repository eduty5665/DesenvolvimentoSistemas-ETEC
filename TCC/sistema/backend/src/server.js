require('dotenv').config({ quiet: true });
const http = require('http');
const os = require('os');
const app = require('./app');
const realtime = require('./realtime');

const PORT = Number(process.env.PORT) || 3333;

const server = http.createServer(app);
realtime.iniciar(server);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`API rodando em http://localhost:${PORT}`);
  // Mostra o IP da rede local para configurar no app (celular precisa estar no mesmo Wi-Fi)
  for (const lista of Object.values(os.networkInterfaces())) {
    for (const net of lista || []) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`No celular use: http://${net.address}:${PORT}`);
      }
    }
  }
});
