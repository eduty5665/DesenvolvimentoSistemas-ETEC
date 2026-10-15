// Testa as regras de negócio pela API, de ponta a ponta:
// cadastro -> publicar entrega -> candidaturas -> chat/propostas -> confirmar candidato
// -> confirmar entrega -> confirmar recebimento -> avaliação
// Uso: npm test   (usa um banco temporário, não mexe no banco de desenvolvimento)
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');

const pastaTemp = fs.mkdtempSync(path.join(os.tmpdir(), 'lookby-teste-'));
process.env.DB_FILE = path.join(pastaTemp, 'teste.db');
process.env.UPLOADS_DIR = path.join(pastaTemp, 'uploads');
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
const amanha = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const novaEntrega = (extra = {}) => ({
  titulo: 'Entrega Cajamar', carga: 'Materiais escolares', tipoCarga: 'MATERIAIS', data: amanha,
  horarioRetirada: '09:00', horarioEntrega: '11:00',
  enderecoRetirada: 'Rua A, 1', cidadeRetirada: 'Barueri',
  enderecoEntrega: 'Rua B, 2', cidadeEntrega: 'Cajamar', valor: 1500, ...extra,
});

async function cadastrar(nome, email, tipo) {
  const r = await api('POST', '/auth/cadastro', { nome, email, senha: '123456', tipo });
  assert.equal(r.status, 201, JSON.stringify(r.dados));
  return { token: r.dados.token, id: r.dados.usuario.id };
}

const PERFIL_COMPLETO = { telefone: '(11) 99999-0000', cnh: '12345678900', veiculo: 'VAN', placa: 'ABC1D23' };

before(async () => {
  servidor = http.createServer(app);
  realtime.iniciar(servidor);
  await new Promise((r) => servidor.listen(0, r));
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  sockets.forEach((s) => s.close());
  await new Promise((r) => servidor.close(r));
  await esperar(50);
  db.fechar();
  fs.rmSync(pastaTemp, { recursive: true, force: true });
});

test('cadastro, login e recuperação de senha', async () => {
  const r = await api('POST', '/auth/cadastro', { nome: 'Ana', email: 'Ana.Souza@x.com', senha: '123456', tipo: 'ENTREGADOR' });
  assert.equal(r.status, 201);
  assert.equal(r.dados.usuario.email, 'ana.souza@x.com');
  assert.equal(r.dados.usuario.usuario, 'ana.souza');
  assert.equal(r.dados.usuario.senhaHash, undefined);

  assert.equal((await api('POST', '/auth/cadastro', { nome: 'Ana', email: 'ana.souza@x.com', senha: '123456', tipo: 'CLIENTE' })).status, 409);
  assert.equal((await api('POST', '/auth/cadastro', { nome: 'Ana', email: 'b@x.com', senha: '123', tipo: 'CLIENTE' })).status, 400);
  assert.equal((await api('POST', '/auth/login', { email: 'ana.souza@x.com', senha: 'errada' })).status, 401);
  assert.equal((await api('GET', '/usuarios/me')).status, 401);

  // Recuperação: código errado não passa, o certo devolve token para trocar a senha
  const pedido = await api('POST', '/auth/esqueci-senha', { email: 'ana.souza@x.com' });
  assert.match(pedido.dados.codigoDev, /^\d{4}$/);
  const inexistente = await api('POST', '/auth/esqueci-senha', { email: 'ninguem@x.com' });
  assert.equal(inexistente.status, 200);
  assert.equal(inexistente.dados.codigoDev, undefined);

  const errado = pedido.dados.codigoDev === '0000' ? '1111' : '0000';
  assert.equal((await api('POST', '/auth/verificar-codigo', { email: 'ana.souza@x.com', codigo: errado })).status, 400);
  const ok = await api('POST', '/auth/verificar-codigo', { email: 'ana.souza@x.com', codigo: pedido.dados.codigoDev });
  assert.equal(ok.status, 200);
  // O código só vale uma vez
  assert.equal((await api('POST', '/auth/verificar-codigo', { email: 'ana.souza@x.com', codigo: pedido.dados.codigoDev })).status, 400);
  // Token de sessão não serve para trocar senha, e vice-versa
  assert.equal((await api('POST', '/auth/nova-senha', { tokenRedefinicao: r.dados.token, senha: 'novasenha' })).status, 401);
  assert.equal((await api('GET', '/usuarios/me', null, ok.dados.tokenRedefinicao)).status, 401);
  assert.equal((await api('POST', '/auth/nova-senha', { tokenRedefinicao: ok.dados.tokenRedefinicao, senha: 'novasenha' })).status, 200);
  assert.equal((await api('POST', '/auth/login', { email: 'ana.souza@x.com', senha: 'novasenha' })).status, 200);
  assert.equal((await api('POST', '/auth/login', { email: 'ana.souza@x.com', senha: '123456' })).status, 401);
});

test('fluxo completo: publicar, candidatar, negociar, confirmar e avaliar', async () => {
  const empresa = await cadastrar('Pencil Case Store', 'pencil@x.com', 'CLIENTE');
  const ricardo = await cadastrar('Ricardo Lima', 'ricardo@x.com', 'ENTREGADOR');
  const marcos = await cadastrar('Marcos Silva', 'marcos@x.com', 'ENTREGADOR');

  const evEmpresa = await ouvir(empresa.token);
  const evRicardo = await ouvir(ricardo.token);
  const evMarcos = await ouvir(marcos.token);

  // --- publicar: só cliente, com dados válidos
  assert.equal((await api('POST', '/entregas', novaEntrega(), ricardo.token)).status, 403);
  assert.equal((await api('POST', '/entregas', novaEntrega({ data: '2020-01-01' }), empresa.token)).status, 400);
  assert.equal((await api('POST', '/entregas', novaEntrega({ valor: 0 }), empresa.token)).status, 400);
  assert.equal((await api('POST', '/entregas', novaEntrega({ horarioRetirada: '25:00' }), empresa.token)).status, 400);
  const pub = await api('POST', '/entregas', novaEntrega(), empresa.token);
  assert.equal(pub.status, 201, JSON.stringify(pub.dados));
  const entregaId = pub.dados.id;
  assert.equal(pub.dados.status, 'ABERTA');
  assert.equal(pub.dados.cliente.nome, 'Pencil Case Store');
  await esperar(80);
  assert.ok(evRicardo.some((e) => e.nome === 'entrega:nova'));

  // --- oportunidades
  const oport = await api('GET', '/entregas/oportunidades', null, ricardo.token);
  assert.equal(oport.dados.length, 1);
  assert.equal(oport.dados[0].minhaCandidatura, null);
  assert.equal((await api('GET', '/entregas/oportunidades?busca=cajamar', null, ricardo.token)).dados.length, 1);
  assert.equal((await api('GET', '/entregas/oportunidades?busca=xyz', null, ricardo.token)).dados.length, 0);
  assert.equal((await api('GET', '/entregas/oportunidades?tipoCarga=ALIMENTOS', null, ricardo.token)).dados.length, 0);

  // --- candidatura: exige perfil completo; cliente não se candidata; sem duplicar
  const semPerfil = await api('POST', `/entregas/${entregaId}/candidaturas`, null, ricardo.token);
  assert.equal(semPerfil.status, 422);
  assert.match(semPerfil.dados.erro, /telefone/);
  await api('PUT', '/usuarios/me', PERFIL_COMPLETO, ricardo.token);
  await api('PUT', '/usuarios/me', { telefone: '(11) 98888-0000', veiculo: 'BICICLETA' }, marcos.token); // bicicleta não exige CNH
  assert.equal((await api('POST', `/entregas/${entregaId}/candidaturas`, null, empresa.token)).status, 403);

  const c1 = await api('POST', `/entregas/${entregaId}/candidaturas`, null, ricardo.token);
  assert.equal(c1.status, 201, JSON.stringify(c1.dados));
  assert.equal(c1.dados.status, 'PENDENTE');
  assert.equal((await api('POST', `/entregas/${entregaId}/candidaturas`, null, ricardo.token)).status, 409);
  const c2 = await api('POST', `/entregas/${entregaId}/candidaturas`, null, marcos.token);
  assert.equal(c2.status, 201);
  await esperar(80);
  assert.equal(evEmpresa.filter((e) => e.nome === 'candidatura:nova').length, 2);

  // --- o cliente vê as candidaturas da entrega; entregador só vê a dele
  const detCliente = (await api('GET', `/entregas/${entregaId}`, null, empresa.token)).dados;
  assert.equal(detCliente.candidaturas.length, 2);
  assert.equal(detCliente.candidaturasPendentes, 2);
  assert.equal(detCliente.candidaturas[0].entregador.nome, 'Ricardo Lima');
  assert.equal(detCliente.candidaturas[0].entregador.veiculo, 'VAN');
  const detRicardo = (await api('GET', `/entregas/${entregaId}`, null, ricardo.token)).dados;
  assert.equal(detRicardo.candidaturas, undefined);
  assert.equal(detRicardo.minhaCandidatura.status, 'PENDENTE');
  assert.equal((await api('GET', '/usuarios/resumo', null, empresa.token)).dados.candidaturasPendentes, 2);

  // --- chat: só os dois participantes; mensagens chegam em tempo real e contam como não lidas
  assert.equal((await api('GET', `/candidaturas/${c1.dados.id}`, null, marcos.token)).status, 403);
  const m1 = await api('POST', `/candidaturas/${c1.dados.id}/mensagens`, { texto: 'Olá, tenho van disponível.' }, ricardo.token);
  assert.equal(m1.status, 201);
  await esperar(80);
  assert.ok(evEmpresa.some((e) => e.nome === 'mensagem:nova' && e.dados.mensagem.texto === 'Olá, tenho van disponível.'));
  assert.ok((await api('GET', '/usuarios/resumo', null, empresa.token)).dados.naoLidas >= 1);

  const chatEmpresa = (await api('GET', `/candidaturas/${c1.dados.id}`, null, empresa.token)).dados;
  assert.equal(chatEmpresa.outro.nome, 'Ricardo Lima');
  assert.equal(chatEmpresa.outro.online, true);
  assert.equal(chatEmpresa.entrega.titulo, 'Entrega Cajamar');
  assert.ok(chatEmpresa.mensagens.some((m) => m.tipo === 'SISTEMA'));
  // abrir o chat marca como lidas
  const lista = (await api('GET', '/candidaturas', null, empresa.token)).dados;
  assert.equal(lista.find((c) => c.id === c1.dados.id).naoLidas, 0);
  assert.equal(lista.find((c) => c.id === c2.dados.id).naoLidas, 1); // aviso de candidatura do Marcos

  await api('POST', `/candidaturas/${c1.dados.id}/mensagens`, { texto: 'Ótimo! Consegue por 1300?' }, empresa.token);

  // --- propostas de valor: não aceita a própria; nova proposta substitui a pendente
  const p1 = (await api('POST', `/candidaturas/${c1.dados.id}/propostas`, { valor: 1300 }, empresa.token)).dados;
  assert.equal(p1.statusProposta, 'PENDENTE');
  assert.equal((await api('POST', `/candidaturas/propostas/${p1.id}/aceitar`, null, empresa.token)).status, 403);
  const p2 = (await api('POST', `/candidaturas/${c1.dados.id}/propostas`, { valor: 1400 }, ricardo.token)).dados;
  const hist = (await api('GET', `/candidaturas/${c1.dados.id}`, null, ricardo.token)).dados;
  assert.equal(hist.mensagens.find((m) => m.id === p1.id).statusProposta, 'SUBSTITUIDA');
  const aceite = await api('POST', `/candidaturas/propostas/${p2.id}/aceitar`, null, empresa.token);
  assert.equal(aceite.dados.statusProposta, 'ACEITA');
  assert.equal((await api('GET', `/candidaturas/${c1.dados.id}`, null, ricardo.token)).dados.valorCombinado, 1400);
  // aceitar o valor ainda não fecha a entrega
  assert.equal((await api('GET', `/entregas/${entregaId}`, null, empresa.token)).dados.status, 'ABERTA');

  const p3 = (await api('POST', `/candidaturas/${c2.dados.id}/propostas`, { valor: 1200 }, marcos.token)).dados;

  // --- confirmar candidato: só o dono da entrega
  assert.equal((await api('POST', `/candidaturas/${c1.dados.id}/aceitar`, null, ricardo.token)).status, 403);
  const outraEmpresa = await cadastrar('Outra', 'outra@x.com', 'CLIENTE');
  assert.equal((await api('POST', `/candidaturas/${c1.dados.id}/aceitar`, null, outraEmpresa.token)).status, 403);
  assert.equal((await api('GET', `/entregas/${entregaId}`, null, outraEmpresa.token)).status, 403);

  const confirmado = await api('POST', `/candidaturas/${c1.dados.id}/aceitar`, null, empresa.token);
  assert.equal(confirmado.status, 200, JSON.stringify(confirmado.dados));
  assert.equal(confirmado.dados.status, 'ACEITA');
  assert.equal(confirmado.dados.valorCombinado, 1400);
  assert.equal(confirmado.dados.entregador.nome, 'Ricardo Lima');

  // a outra candidatura foi recusada, a proposta dela encerrada e ela não pode mais ser aceita
  const chatMarcos = (await api('GET', `/candidaturas/${c2.dados.id}`, null, marcos.token)).dados;
  assert.equal(chatMarcos.status, 'RECUSADA');
  assert.equal(chatMarcos.mensagens.find((m) => m.id === p3.id).statusProposta, 'ENCERRADA');
  assert.equal((await api('POST', `/candidaturas/${c2.dados.id}/aceitar`, null, empresa.token)).status, 409);
  assert.equal((await api('POST', `/candidaturas/${c2.dados.id}/mensagens`, { texto: 'oi' }, marcos.token)).status, 409);
  assert.equal((await api('POST', `/candidaturas/${c1.dados.id}/propostas`, { valor: 2000 }, ricardo.token)).status, 409);
  await esperar(80);
  assert.ok(evMarcos.some((e) => e.nome === 'candidatura:atualizada'));
  assert.ok(evRicardo.some((e) => e.nome === 'entrega:atualizada'));

  // saiu das oportunidades e aparece em "Entregas" do entregador confirmado
  assert.equal((await api('GET', '/entregas/oportunidades', null, marcos.token)).dados.length, 0);
  const minhasRicardo = (await api('GET', '/entregas/minhas', null, ricardo.token)).dados;
  assert.equal(minhasRicardo[0].minhaCandidatura.status, 'ACEITA');
  // depois de fechada, quem não participou não enxerga mais a entrega
  const terceiro = await cadastrar('Terceiro', 'terceiro@x.com', 'ENTREGADOR');
  assert.equal((await api('GET', `/entregas/${entregaId}`, null, terceiro.token)).status, 403);
  assert.equal((await api('POST', `/entregas/${entregaId}/candidaturas`, null, terceiro.token)).status, 409);

  // --- andamento: cada passo só por quem pode e na ordem certa
  assert.equal((await api('POST', `/entregas/${entregaId}/confirmar-recebimento`, null, empresa.token)).status, 409);
  assert.equal((await api('POST', `/entregas/${entregaId}/confirmar-entrega`, null, marcos.token)).status, 403);
  assert.equal((await api('POST', `/entregas/${entregaId}/avaliacoes`, { nota: 5 }, empresa.token)).status, 409);
  const entregue = await api('POST', `/entregas/${entregaId}/confirmar-entrega`, null, ricardo.token);
  assert.equal(entregue.dados.status, 'ENTREGUE');
  assert.equal((await api('POST', `/entregas/${entregaId}/confirmar-entrega`, null, ricardo.token)).status, 409);
  assert.equal((await api('POST', `/entregas/${entregaId}/cancelar`, null, empresa.token)).status, 409);
  const concluida = await api('POST', `/entregas/${entregaId}/confirmar-recebimento`, null, empresa.token);
  assert.equal(concluida.dados.status, 'CONCLUIDA');

  // --- avaliação: uma por pessoa, só participantes
  assert.equal((await api('POST', `/entregas/${entregaId}/avaliacoes`, { nota: 5, comentario: 'Pontual' }, empresa.token)).status, 201);
  assert.equal((await api('POST', `/entregas/${entregaId}/avaliacoes`, { nota: 4 }, empresa.token)).status, 409);
  assert.equal((await api('POST', `/entregas/${entregaId}/avaliacoes`, { nota: 4 }, marcos.token)).status, 403);
  assert.equal((await api('POST', `/entregas/${entregaId}/avaliacoes`, { nota: 4 }, ricardo.token)).status, 201);
  assert.equal((await api('GET', `/entregas/${entregaId}`, null, empresa.token)).dados.jaAvaliei, true);

  const perfil = (await api('GET', `/usuarios/${ricardo.id}`, null, empresa.token)).dados;
  assert.equal(perfil.avaliacoes.media, 5);
  assert.equal(perfil.entregasConcluidas, 1);
  assert.equal(perfil.cnh, undefined);
  assert.equal(perfil.email, undefined);
  assert.ok(perfil.curriculo);

  // --- empresas
  const empresas = (await api('GET', '/empresas', null, ricardo.token)).dados;
  assert.ok(empresas.some((e) => e.nome === 'Pencil Case Store'));
  const emp = (await api('GET', `/empresas/${empresa.id}`, null, ricardo.token)).dados;
  assert.equal(emp.entregasPublicadas, 1);
  assert.equal(emp.entregasConcluidas, 1);
  assert.equal(emp.avaliacoes.media, 4);
  assert.equal((await api('GET', `/empresas/${ricardo.id}`, null, ricardo.token)).status, 404);
});

test('desistir, recusar, cancelar e contestar', async () => {
  const empresa = await cadastrar('Mercado', 'mercado@x.com', 'CLIENTE');
  const joao = await cadastrar('João', 'joao@x.com', 'ENTREGADOR');
  const lia = await cadastrar('Lia', 'lia@x.com', 'ENTREGADOR');
  await api('PUT', '/usuarios/me', PERFIL_COMPLETO, joao.token);
  await api('PUT', '/usuarios/me', PERFIL_COMPLETO, lia.token);

  // desistir e voltar a se candidatar
  const e1 = (await api('POST', '/entregas', novaEntrega({ titulo: 'Entrega 1' }), empresa.token)).dados;
  const c = (await api('POST', `/entregas/${e1.id}/candidaturas`, null, joao.token)).dados;
  assert.equal((await api('POST', `/candidaturas/${c.id}/desistir`, null, lia.token)).status, 403);
  assert.equal((await api('POST', `/candidaturas/${c.id}/desistir`, null, joao.token)).dados.status, 'DESISTIU');
  assert.equal((await api('GET', '/entregas/minhas', null, joao.token)).dados.length, 0);
  assert.equal((await api('GET', `/entregas/${e1.id}`, null, empresa.token)).dados.candidaturas.length, 0);
  const denovo = await api('POST', `/entregas/${e1.id}/candidaturas`, null, joao.token);
  assert.equal(denovo.status, 201);
  assert.equal(denovo.dados.id, c.id);

  // recusar um candidato não fecha a entrega
  assert.equal((await api('POST', `/candidaturas/${c.id}/recusar`, null, empresa.token)).dados.status, 'RECUSADA');
  assert.equal((await api('GET', `/entregas/${e1.id}`, null, empresa.token)).dados.status, 'ABERTA');
  assert.equal((await api('POST', `/entregas/${e1.id}/candidaturas`, null, joao.token)).status, 409);

  // cancelar com candidato confirmado libera o entregador e encerra a conversa
  const cl = (await api('POST', `/entregas/${e1.id}/candidaturas`, null, lia.token)).dados;
  await api('POST', `/candidaturas/${cl.id}/aceitar`, null, empresa.token);
  assert.equal((await api('POST', `/entregas/${e1.id}/cancelar`, null, lia.token)).status, 403);
  const cancelada = (await api('POST', `/entregas/${e1.id}/cancelar`, null, empresa.token)).dados;
  assert.equal(cancelada.status, 'CANCELADA');
  assert.equal(cancelada.entregador, null);
  assert.equal((await api('POST', `/entregas/${e1.id}/confirmar-entrega`, null, lia.token)).status, 403);
  assert.equal((await api('POST', `/candidaturas/${cl.id}/mensagens`, { texto: 'oi' }, lia.token)).status, 409);

  // contestação: fica no histórico do entregador
  const e2 = (await api('POST', '/entregas', novaEntrega({ titulo: 'Entrega 2' }), empresa.token)).dados;
  const c2 = (await api('POST', `/entregas/${e2.id}/candidaturas`, null, lia.token)).dados;
  // sem proposta no chat, o valor combinado é o valor publicado
  assert.equal((await api('POST', `/candidaturas/${c2.id}/aceitar`, null, empresa.token)).dados.valorCombinado, 1500);
  assert.equal((await api('POST', `/entregas/${e2.id}/contestar`, { motivo: 'Não chegou' }, empresa.token)).status, 409);
  await api('POST', `/entregas/${e2.id}/confirmar-entrega`, null, lia.token);
  assert.equal((await api('POST', `/entregas/${e2.id}/contestar`, { motivo: 'x' }, empresa.token)).status, 400);
  const contestada = await api('POST', `/entregas/${e2.id}/contestar`, { motivo: 'Faltaram 5 caixas' }, empresa.token);
  assert.equal(contestada.dados.status, 'CONTESTADA');
  assert.equal((await api('GET', `/usuarios/${lia.id}`, null, empresa.token)).dados.entregasContestadas, 1);
});

test('perfil, conta e currículo', async () => {
  const bia = await cadastrar('Bia', 'bia@x.com', 'ENTREGADOR');
  const loja = await cadastrar('Loja', 'loja@x.com', 'CLIENTE');

  const editado = await api('PUT', '/usuarios/me', { nome: 'Bia Souza', dataNascimento: '2000-05-10', cpf: '111.222.333-44' }, bia.token);
  assert.equal(editado.dados.nome, 'Bia Souza');
  assert.equal((await api('PUT', '/usuarios/me', { veiculo: 'FOGUETE' }, bia.token)).status, 400);

  // dados da conta exigem a senha atual; usuário e e-mail são únicos
  assert.equal((await api('PUT', '/usuarios/me/conta', { usuario: 'biazinha', senhaAtual: 'errada' }, bia.token)).status, 401);
  assert.equal((await api('PUT', '/usuarios/me/conta', { usuario: 'loja', senhaAtual: '123456' }, bia.token)).status, 409);
  assert.equal((await api('PUT', '/usuarios/me/conta', { email: 'loja@x.com', senhaAtual: '123456' }, bia.token)).status, 409);
  const conta = await api('PUT', '/usuarios/me/conta', { usuario: 'biazinha', novaSenha: 'outra123', senhaAtual: '123456' }, bia.token);
  assert.equal(conta.dados.usuario, 'biazinha');
  assert.equal((await api('POST', '/auth/login', { email: 'bia@x.com', senha: 'outra123' })).status, 200);

  // currículo: só entregador; cada um mexe só no seu
  assert.equal((await api('GET', '/curriculo', null, loja.token)).status, 403);
  const item = await api('POST', '/curriculo/itens', { secao: 'EXPERIENCIA', titulo: 'Motorista', subtitulo: 'Empresa X', periodo: '2020-2023' }, bia.token);
  assert.equal(item.status, 201);
  await api('POST', '/curriculo/itens', { secao: 'ESCOLARIDADE', titulo: 'Ensino Médio', subtitulo: 'ETEC' }, bia.token);
  assert.equal((await api('PUT', `/curriculo/itens/${item.dados.id}`, { titulo: 'Motorista de van' }, bia.token)).dados.titulo, 'Motorista de van');
  const outro = await cadastrar('Caio', 'caio@x.com', 'ENTREGADOR');
  assert.equal((await api('DELETE', `/curriculo/itens/${item.dados.id}`, null, outro.token)).status, 404);
  const cv = (await api('GET', '/curriculo', null, bia.token)).dados;
  assert.equal(cv.experiencias.length, 1);
  assert.equal(cv.escolaridade.length, 1);

  // upload de arquivo do currículo e de foto
  const form = new FormData();
  form.append('arquivo', new Blob(['%PDF-1.4 teste'], { type: 'application/pdf' }), 'certificado.pdf');
  const up = await fetch(`${base}/curriculo/arquivos`, { method: 'POST', headers: { Authorization: `Bearer ${bia.token}` }, body: form });
  assert.equal(up.status, 201);
  const arquivo = await up.json();
  assert.equal(arquivo.nome, 'certificado.pdf');
  assert.equal((await fetch(base + arquivo.url)).status, 200);

  const ruim = new FormData();
  ruim.append('foto', new Blob(['x'], { type: 'text/plain' }), 'virus.exe');
  assert.equal((await fetch(`${base}/usuarios/me/foto`, { method: 'POST', headers: { Authorization: `Bearer ${bia.token}` }, body: ruim })).status, 400);
  const foto = new FormData();
  foto.append('foto', new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' }), 'eu.png');
  const upFoto = await fetch(`${base}/usuarios/me/foto`, { method: 'POST', headers: { Authorization: `Bearer ${bia.token}` }, body: foto });
  assert.equal(upFoto.status, 200);
  assert.match((await upFoto.json()).fotoUrl, /^\/uploads\/.+\.png$/);

  assert.equal((await api('DELETE', `/curriculo/arquivos/${arquivo.id}`, null, bia.token)).status, 200);
  assert.equal((await fetch(base + arquivo.url)).status, 404);

  // o currículo aparece para clientes, não para outros entregadores
  assert.ok((await api('GET', `/usuarios/${bia.id}`, null, loja.token)).dados.curriculo);
  assert.equal((await api('GET', `/usuarios/${bia.id}`, null, outro.token)).dados.curriculo, undefined);

  // código de recuperação: depois de 5 tentativas erradas nem o código certo vale mais
  const { codigoDev } = (await api('POST', '/auth/esqueci-senha', { email: 'caio@x.com' })).dados;
  const errado = codigoDev === '0000' ? '1111' : '0000';
  for (let i = 0; i < 5; i++) {
    assert.equal((await api('POST', '/auth/verificar-codigo', { email: 'caio@x.com', codigo: errado })).status, 400);
  }
  assert.equal((await api('POST', '/auth/verificar-codigo', { email: 'caio@x.com', codigo: codigoDev })).status, 400);

  // cliente edita os dados da empresa
  const emp = await api('PUT', '/usuarios/me', { cnpj: '12.345.678/0001-90', localizacao: 'Barueri', nicho: 'Papelaria', historia: 'Desde 1998.' }, loja.token);
  assert.equal(emp.dados.nicho, 'Papelaria');
  assert.equal((await api('GET', `/empresas/${loja.id}`, null, bia.token)).dados.historia, 'Desde 1998.');
});
