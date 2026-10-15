const { Server } = require('socket.io');
const { verificarToken } = require('./middleware/auth');

// Comunicação em tempo real (chat e atualizações de pedidos).
// O app envia mensagens pela API REST; o servidor avisa os envolvidos por aqui.
//
// Salas:
//   usuario:<id>  -> cada usuário conectado
//   entregadores  -> todos os entregadores (recebem pedidos novos)
//
// Eventos emitidos pelo servidor:
//   mensagem:nova      { conversaId, mensagem }
//   mensagem:atualizada{ conversaId, mensagem }   (proposta aceita/recusada)
//   pedido:novo        { pedido }
//   pedido:atualizado  { pedido }

let io = null;

function iniciar(httpServer) {
  io = new Server(httpServer, { cors: { origin: '*' } });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      socket.usuario = verificarToken(token);
      next();
    } catch {
      next(new Error('Não autorizado'));
    }
  });

  io.on('connection', (socket) => {
    const { id, tipo } = socket.usuario;
    socket.join(`usuario:${id}`);
    if (tipo === 'ENTREGADOR') socket.join('entregadores');
  });

  return io;
}

function paraUsuarios(ids, evento, dados) {
  if (!io) return;
  for (const id of new Set(ids)) io.to(`usuario:${id}`).emit(evento, dados);
}

function paraEntregadores(evento, dados) {
  if (!io) return;
  io.to('entregadores').emit(evento, dados);
}

module.exports = { iniciar, paraUsuarios, paraEntregadores };
