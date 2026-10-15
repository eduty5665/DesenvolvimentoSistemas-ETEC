// Dados de exemplo para testar e apresentar o app (senha de todos: 123456).
// Rodam sozinhos na primeira vez que a API sobe. Para recomeçar do zero: npm run db:reset
const bcrypt = require('bcryptjs');
const { db, agora } = require('../src/db');
const entregas = require('../src/services/entregas');
const chat = require('../src/services/chat');

// Data daqui a N dias, no formato AAAA-MM-DD
const emDias = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

function limpar() {
  for (const tabela of ['avaliacoes', 'mensagens', 'candidaturas', 'entregas', 'curriculo_arquivos', 'curriculo_itens', 'usuarios']) {
    db.executar(`DELETE FROM ${tabela}`);
  }
  db.executar("DELETE FROM sqlite_sequence");
}

async function popularExemplos() {
  limpar();
  const senhaHash = await bcrypt.hash('123456', 10);
  const usuario = (dados) => db.inserir('usuarios', { senhaHash, criadoEm: agora(), ...dados });

  // ---------------- clientes (empresas)
  const pencil = usuario({
    tipo: 'CLIENTE', email: 'empresa@lookby.com', usuario: 'pencilcase', nome: 'Pencil Case Store',
    cnpj: '12.345.678/0001-90', telefone: '(11) 4198-1000', localizacao: 'Rua XXX, 55 - Bairro P, Barueri',
    nicho: 'Materiais escolares e diversos',
    historia: 'Loja tradicional de Barueri. Desde 1998 atendendo escolas e papelarias da região.',
  });
  const mercado = usuario({
    tipo: 'CLIENTE', email: 'mercado@lookby.com', usuario: 'mercadobomdia', nome: 'Mercado Bom Dia',
    cnpj: '98.765.432/0001-10', telefone: '(11) 4199-2000', localizacao: 'Av. Central, 800 - Centro, Santana de Parnaíba',
    nicho: 'Supermercado de bairro',
    historia: 'Mercado familiar com entregas diárias para clientes e pequenos comércios.',
  });

  // ---------------- entregadores
  const ricardo = usuario({
    tipo: 'ENTREGADOR', email: 'entregador@lookby.com', usuario: 'ricardo.lima', nome: 'Ricardo Lima',
    dataNascimento: '1996-03-12', cpf: '535.879.268-67', cnh: '78104634857',
    telefone: '(11) 99913-2752', telefone2: '(11) 97248-7342', veiculo: 'VAN', placa: 'ABC1D23',
  });
  const marcos = usuario({
    tipo: 'ENTREGADOR', email: 'marcos@lookby.com', usuario: 'marcos.silva', nome: 'Marcos Silva',
    dataNascimento: '1990-08-25', cpf: '123.456.789-09', cnh: '01234567890',
    telefone: '(11) 96666-5555', veiculo: 'MOTO', placa: 'XYZ9K87',
  });

  const item = (usuarioId, secao, titulo, subtitulo, periodo, descricao) =>
    db.inserir('curriculo_itens', { usuarioId, secao, titulo, subtitulo, periodo, descricao });
  item(ricardo, 'ESCOLARIDADE', 'Ensino Médio completo', 'E.E. Prof. Antônio Furlan', '2011 - 2013', null);
  item(ricardo, 'EXPERIENCIA', 'Motorista de entregas', 'Transportes Oeste', '2019 - 2023', 'Entregas de última milha em Barueri e região.');
  item(ricardo, 'EXPERIENCIA', 'Ajudante de carga', 'Depósito São Jorge', '2016 - 2019', null);
  item(ricardo, 'CONTATO', 'WhatsApp', '(11) 99913-2752', null, null);
  item(marcos, 'EXPERIENCIA', 'Motoboy', 'Autônomo', '2018 - hoje', 'Documentos e pequenas encomendas.');

  // ---------------- entregas publicadas
  const cajamar = entregas.publicar(pencil, {
    titulo: 'Entrega Cajamar', carga: 'Carga de materiais escolares para uma loja de bairro',
    tipoCarga: 'MATERIAIS', data: emDias(3), horarioRetirada: '09:00', horarioEntrega: '11:00',
    enderecoRetirada: 'Rua XXX, 55 - Bairro P', cidadeRetirada: 'Barueri',
    enderecoEntrega: 'Rua XXXX, 222 - Bairro Y', cidadeEntrega: 'Cajamar',
    observacoes: '30 caixas. Precisa de van ou caminhão pequeno.', valor: 1500,
  });
  const santoAmaro = entregas.publicar(pencil, {
    titulo: 'Entrega Santo Amaro', carga: 'Cadernos e mochilas para revenda',
    tipoCarga: 'MATERIAIS', data: emDias(1), horarioRetirada: '16:00', horarioEntrega: '18:00',
    enderecoRetirada: 'Rua XXX, 55 - Bairro P', cidadeRetirada: 'Barueri',
    enderecoEntrega: 'Rua XXXX, 444 - Bairro Z', cidadeEntrega: 'Santo Amaro',
    observacoes: null, valor: 380,
  });
  entregas.publicar(mercado, {
    titulo: 'Entrega Alphaville', carga: 'Cestas básicas (20 unidades)',
    tipoCarga: 'ALIMENTOS', data: emDias(2), horarioRetirada: '08:00', horarioEntrega: '09:30',
    enderecoRetirada: 'Av. Central, 800 - Centro', cidadeRetirada: 'Santana de Parnaíba',
    enderecoEntrega: 'Alameda Rio Negro, 100', cidadeEntrega: 'Alphaville',
    observacoes: 'Manter as cestas em pé.', valor: 220,
  });
  entregas.publicar(mercado, {
    titulo: 'Documentos Osasco', carga: 'Envelope com notas fiscais',
    tipoCarga: 'DOCUMENTOS', data: emDias(1), horarioRetirada: '14:00', horarioEntrega: '15:00',
    enderecoRetirada: 'Av. Central, 800 - Centro', cidadeRetirada: 'Santana de Parnaíba',
    enderecoEntrega: 'Rua da Estação, 45 - Centro', cidadeEntrega: 'Osasco',
    observacoes: null, valor: 60,
  });

  // Marcos se candidatou à entrega de Cajamar e já conversou com a empresa
  const candMarcos = entregas.candidatar(cajamar.id, marcos);
  const conversa = () => chat.candidaturaDoUsuario(candMarcos.id, marcos);
  chat.enviarTexto(conversa(), marcos, 'Boa tarde! Tenho disponibilidade nesse dia.');
  chat.enviarTexto(conversa(), pencil, 'Olá, Marcos. São 30 caixas, você consegue levar de moto?');

  // Ricardo já foi confirmado na entrega de Santo Amaro (aparece em "Entregas" dele)
  const candRicardo = entregas.candidatar(santoAmaro.id, ricardo);
  chat.enviarTexto(chat.candidaturaDoUsuario(candRicardo.id, ricardo), ricardo, 'Olá! Faço essa rota toda semana, posso carregar às 16h.');
  entregas.aceitarCandidatura(candRicardo.id, pencil);
}

module.exports = { popularExemplos, limpar };

// Permite rodar direto:  node database/seed.js
if (require.main === module) {
  popularExemplos().then(() => {
    console.log('Dados de exemplo recriados. Senha de todos: 123456');
    console.log('  empresa@lookby.com, mercado@lookby.com (clientes)');
    console.log('  entregador@lookby.com, marcos@lookby.com (entregadores)');
    db.fechar();
  });
}
