const { Server } = require('socket.io');
const { verificarToken } = require('./middleware/auth');
const { db, agora } = require('./db');

// Comunicação em tempo real (chat, candidaturas e status das entregas).
// O app envia tudo pela API REST; o servidor avisa os envolvidos por aqui.
//
// Salas:
//   usuario:<id>  -> cada usuário conectado
//   entregadores  -> todos os entregadores (recebem oportunidades novas)
//
// Eventos emitidos pelo servidor:
//   mensagem:nova          { candidaturaId, mensagem }
//   mensagem:atualizada    { candidaturaId, mensagem }      (proposta aceita/recusada)
//   mensagens:lidas        { candidaturaId }
//   candidatura:nova       { candidatura }                  (para o cliente)
//   candidatura:atualizada { candidatura }                  (aceita, recusada, desistiu)
//   entrega:nova           { entrega }                      (para os entregadores)
//   entrega:atualizada     { entrega }
//   presenca               { usuarioId, online, vistoEm }

let io = null;
const conexoes = new Map(); // usuarioId -> quantidade de aparelhos conectados

function iniciar(httpServer) {
  io = new Server(httpServer, { cors: { origin: '*' } });

  io.use((socket, next) => {
    try {
      socket.usuario = verificarToken(socket.handshake.auth?.token);
      next();
    } catch {
      next(new Error('Não autorizado'));
    }
  });

  io.on('connection', (socket) => {
    const { id, tipo } = socket.usuario;
    socket.join(`usuario:${id}`);
    if (tipo === 'ENTREGADOR') socket.join('entregadores');

    conexoes.set(id, (conexoes.get(id) || 0) + 1);
    if (conexoes.get(id) === 1) io.emit('presenca', { usuarioId: id, online: true, vistoEm: null });

    socket.on('disconnect', () => {
      const restantes = (conexoes.get(id) || 1) - 1;
      if (restantes > 0) return conexoes.set(id, restantes);
      conexoes.delete(id);
      const vistoEm = agora();
      try {
        db.atualizar('usuarios', id, { vistoEm });
      } catch {
        // banco já fechado (servidor encerrando)
      }
      io.emit('presenca', { usuarioId: id, online: false, vistoEm });
    });
  });

  return io;
}

const estaOnline = (usuarioId) => conexoes.has(usuarioId);

function paraUsuarios(ids, evento, dados) {
  if (!io) return;
  for (const id of new Set(ids.filter(Boolean))) io.to(`usuario:${id}`).emit(evento, dados);
}

function paraEntregadores(evento, dados) {
  if (io) io.to('entregadores').emit(evento, dados);
}

module.exports = { iniciar, estaOnline, paraUsuarios, paraEntregadores };
