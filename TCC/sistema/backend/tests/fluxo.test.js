// Teste do fluxo completo: cadastro -> pedido -> negociação no chat -> aceite -> entrega -> avaliação
// Uso: npm test   (usa um banco temporário, não mexe no banco de desenvolvimento)
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');

const arquivoBanco = path.join(os.tmpdir(), `entregas-teste-${process.pid}.db`);
process.env.DB_FILE = arquivoBanco;
process.env.JWT_SECRET = 'teste';

const { db } = require('../src/db');
const app = require('../src/app');
const realtime = require('../src/realtime');
const { io: conectarSocket } = require('socket.io-client');

let servidor;
let base;
const sockets = [];

async function api(metodo, rota, corpo, token) {
  const resp = await fetch(base + rota, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  return { status: resp.status, dados: await resp.json() };
}

function ouvir(token) {
  const socket = conectarSocket(base, { auth: { token }, transports: ['websocket'] });
  sockets.push(socket);
  const eventos = [];
  socket.onAny((nome, dados) => eventos.push({ nome, dados }));
  return new Promise((ok, erro) => {
    socket.on('connect', () => ok(eventos));
    socket.on('connect_error', erro);
  });
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

before(async () => {
  await db.migrate.latest();
  servidor = http.createServer(app);
  realtime.iniciar(servidor);
  await new Promise((r) => servidor.listen(0, r));
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  sockets.forEach((s) => s.close());
  servidor.close();
  await db.destroy();
  fs.rmSync(arquivoBanco, { force: true });
});

test('fluxo completo de negociação e entrega', async () => {
  // Cadastros
  const cli = await api('POST', '/auth/cadastro', {
    nome: 'Paula', email: 'paula@x.com', senha: '123456', telefone: '11999999999', tipo: 'CLIENTE',
  });
  assert.equal(cli.status, 201);
  assert.equal(cli.dados.usuario.senhaHash, undefined);

  const semVeiculo = await api('POST', '/auth/cadastro', {
    nome: 'Sem', email: 'sem@x.com', senha: '123456', telefone: '11999999999', tipo: 'ENTREGADOR',
  });
  assert.equal(semVeiculo.status, 400);

  const ent1 = await api('POST', '/auth/cadastro', {
    nome: 'Ricardo', email: 'ricardo@x.com', senha: '123456', telefone: '11988888888',
    tipo: 'ENTREGADOR', veiculo: 'MOTO', placa: 'ABC1D23',
  });
  const ent2 = await api('POST', '/auth/cadastro', {
    nome: 'Marcos', email: 'marcos@x.com', senha: '123456', telefone: '11977777777',
    tipo: 'ENTREGADOR', veiculo: 'CARRO',
  });
  const tc = cli.dados.token, t1 = ent1.dados.token, t2 = ent2.dados.token;

  const duplicado = await api('POST', '/auth/cadastro', {
    nome: 'Xis', email: 'PAULA@x.com', senha: '123456', telefone: '11999999999', tipo: 'CLIENTE',
  });
  assert.equal(duplicado.status, 409);

  const login = await api('POST', '/auth/login', { email: 'paula@x.com', senha: 'errada' });
  assert.equal(login.status, 401);

  const eventosCliente = await ouvir(tc);
  const eventosEnt1 = await ouvir(t1);
  const eventosEnt2 = await ouvir(t2);

  // Entregador não pode criar pedido
  assert.equal((await api('POST', '/pedidos', {}, t1)).status, 403);

  // Cliente cria pedido -> entregadores são avisados
  const ped = await api('POST', '/pedidos', {
    titulo: 'Levar bolo', descricao: 'Bolo 3kg', categoria: 'ALIMENTOS',
    origem: 'Rua A, 1', destino: 'Rua B, 2', valorSugerido: 20,
  }, tc);
  assert.equal(ped.status, 201);
  assert.equal(ped.dados.cliente.nome, 'Paula');
  await esperar(100);
  assert.ok(eventosEnt1.some((e) => e.nome === 'pedido:novo'));

  const disp = await api('GET', '/pedidos/disponiveis?categoria=ALIMENTOS', null, t1);
  assert.equal(disp.dados.length, 1);

  // Dois entregadores abrem negociação
  const conv1 = (await api('POST', `/pedidos/${ped.dados.id}/conversas`, null, t1)).dados;
  const conv2 = (await api('POST', `/pedidos/${ped.dados.id}/conversas`, null, t2)).dados;
  // Abrir de novo devolve a mesma conversa
  assert.equal((await api('POST', `/pedidos/${ped.dados.id}/conversas`, null, t1)).dados.id, conv1.id);

  // Entregador 2 não enxerga a conversa do entregador 1
  assert.equal((await api('GET', `/conversas/${conv1.id}`, null, t2)).status, 403);

  // Chat
  const msg = await api('POST', `/conversas/${conv1.id}/mensagens`, { texto: 'Oi, posso levar' }, t1);
  assert.equal(msg.status, 201);
  await esperar(100);
  assert.ok(eventosCliente.some((e) => e.nome === 'mensagem:nova' && e.dados.mensagem.texto === 'Oi, posso levar'));

  // Propostas: entregador pede 30, cliente contrapropõe 25
  const p1 = (await api('POST', `/conversas/${conv1.id}/propostas`, { valor: 30 }, t1)).dados;
  assert.equal(p1.statusProposta, 'PENDENTE');
  // Não pode aceitar a própria proposta
  assert.equal((await api('POST', `/conversas/propostas/${p1.id}/aceitar`, null, t1)).status, 403);

  const p2 = (await api('POST', `/conversas/${conv1.id}/propostas`, { valor: 25 }, tc)).dados;
  const hist = (await api('GET', `/conversas/${conv1.id}`, null, tc)).dados;
  assert.equal(hist.mensagens.find((m) => m.id === p1.id).statusProposta, 'RECUSADA');
  assert.equal(hist.pedido.titulo, 'Levar bolo');

  // Entregador 2 também propõe
  const p3 = (await api('POST', `/conversas/${conv2.id}/propostas`, { valor: 22 }, t2)).dados;

  // Cliente vê as duas negociações no pedido
  const det = (await api('GET', `/pedidos/${ped.dados.id}`, null, tc)).dados;
  assert.equal(det.conversas.length, 2);
  assert.equal((await api('GET', `/pedidos/${ped.dados.id}`, null, t2)).dados.conversas.length, 1);

  // Entregador 1 aceita a contraproposta de 25
  const aceito = await api('POST', `/conversas/propostas/${p2.id}/aceitar`, null, t1);
  assert.equal(aceito.status, 200);
  assert.equal(aceito.dados.status, 'ACEITO');
  assert.equal(aceito.dados.valorFinal, 25);
  assert.equal(aceito.dados.entregador.nome, 'Ricardo');

  // Proposta do entregador 2 foi encerrada e não pode mais ser aceita
  const conv2Hist = (await api('GET', `/conversas/${conv2.id}`, null, t2)).dados;
  assert.equal(conv2Hist.mensagens.find((m) => m.id === p3.id).statusProposta, 'RECUSADA');
  assert.equal((await api('POST', `/conversas/propostas/${p3.id}/aceitar`, null, tc)).status, 409);
  await esperar(100);
  assert.ok(eventosEnt2.some((e) => e.nome === 'pedido:atualizado'));

  // Pedido sumiu da lista de disponíveis
  assert.equal((await api('GET', '/pedidos/disponiveis', null, t2)).dados.length, 0);

  // Status: entregador 2 não pode mexer; cliente não pode concluir
  assert.equal((await api('PATCH', `/pedidos/${ped.dados.id}/status`, { status: 'EM_ANDAMENTO' }, t2)).status, 403);
  assert.equal((await api('PATCH', `/pedidos/${ped.dados.id}/status`, { status: 'CONCLUIDO' }, t1)).status, 409);
  assert.equal((await api('PATCH', `/pedidos/${ped.dados.id}/status`, { status: 'EM_ANDAMENTO' }, t1)).status, 200);
  // Avaliar antes de concluir não pode
  assert.equal((await api('POST', `/pedidos/${ped.dados.id}/avaliacoes`, { nota: 5 }, tc)).status, 409);
  assert.equal((await api('PATCH', `/pedidos/${ped.dados.id}/status`, { status: 'CONCLUIDO' }, t1)).status, 200);

  // Avaliações
  assert.equal((await api('POST', `/pedidos/${ped.dados.id}/avaliacoes`, { nota: 5, comentario: 'Ótimo' }, tc)).status, 201);
  assert.equal((await api('POST', `/pedidos/${ped.dados.id}/avaliacoes`, { nota: 4 }, tc)).status, 409);
  assert.equal((await api('POST', `/pedidos/${ped.dados.id}/avaliacoes`, { nota: 4 }, t2)).status, 403);

  const perfil = (await api('GET', `/usuarios/${ent1.dados.usuario.id}`, null, tc)).dados;
  assert.equal(perfil.avaliacoes.media, 5);
  assert.equal(perfil.entregasConcluidas, 1);
  assert.equal(perfil.ultimasAvaliacoes[0].avaliadorNome, 'Paula');

  const me = (await api('GET', '/usuarios/me', null, t1)).dados;
  assert.equal(me.nome, 'Ricardo');
  assert.equal(me.cnh, undefined);

  // Listas
  const meusCli = (await api('GET', '/pedidos/meus', null, tc)).dados;
  assert.equal(meusCli[0].totalConversas, 2);
  const meusEnt = (await api('GET', '/pedidos/meus', null, t1)).dados;
  assert.equal(meusEnt.length, 1);
  const conversas = (await api('GET', '/conversas', null, tc)).dados;
  assert.equal(conversas.length, 2);
  assert.ok(conversas[0].ultimaMensagem);
  assert.equal(conversas[0].pedidoTitulo, 'Levar bolo');

  // Sem token
  assert.equal((await api('GET', '/conversas')).status, 401);
});

test('cliente cancela pedido aberto', async () => {
  const cli = await api('POST', '/auth/cadastro', {
    nome: 'Ana', email: 'ana@x.com', senha: '123456', telefone: '11999999999', tipo: 'CLIENTE',
  });
  const t = cli.dados.token;
  const ped = await api('POST', '/pedidos', {
    titulo: 'Docs', descricao: 'Envelope', categoria: 'DOCUMENTOS', origem: 'Rua A', destino: 'Rua B',
  }, t);
  const r = await api('PATCH', `/pedidos/${ped.dados.id}/status`, { status: 'CANCELADO' }, t);
  assert.equal(r.status, 200);
  assert.equal(r.dados.status, 'CANCELADO');
});
