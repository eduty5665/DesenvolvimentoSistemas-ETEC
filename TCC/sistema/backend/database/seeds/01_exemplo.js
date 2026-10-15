// Dados de exemplo para testar o app (senha de todos: 123456)
// Uso: npm run db:seed
const bcrypt = require('bcryptjs');

exports.seed = async (knex) => {
  await knex('avaliacoes').del();
  await knex('mensagens').del();
  await knex('conversas').del();
  await knex('pedidos').del();
  await knex('usuarios').del();

  const senhaHash = await bcrypt.hash('123456', 10);
  const agora = new Date().toISOString();

  await knex('usuarios').insert([
    { id: 1, nome: 'Paula Souza', email: 'paula@teste.com', telefone: '11988887777', tipo: 'CLIENTE', senhaHash, criadoEm: agora },
    { id: 2, nome: 'Ricardo Lima', email: 'ricardo@teste.com', telefone: '11977776666', tipo: 'ENTREGADOR', veiculo: 'MOTO', placa: 'ABC1D23', senhaHash, criadoEm: agora },
    { id: 3, nome: 'Marcos Silva', email: 'marcos@teste.com', telefone: '11966665555', tipo: 'ENTREGADOR', veiculo: 'CARRO', placa: 'XYZ9K87', senhaHash, criadoEm: agora },
  ]);

  await knex('pedidos').insert([
    {
      clienteId: 1, titulo: 'Entregar bolo de aniversário', categoria: 'ALIMENTOS',
      descricao: 'Bolo de 3 kg em caixa. Precisa ir na horizontal, com cuidado.',
      origem: 'Rua das Flores, 120 - Centro, Barueri', destino: 'Av. Brasil, 900 - Jardim Silveira, Barueri',
      valorSugerido: 25, status: 'ABERTO', criadoEm: agora, atualizadoEm: agora,
    },
    {
      clienteId: 1, titulo: 'Levar documentos ao cartório', categoria: 'DOCUMENTOS',
      descricao: 'Envelope A4 com documentos para reconhecimento de firma.',
      origem: 'Rua das Flores, 120 - Centro, Barueri', destino: 'Cartório de Barueri - Centro',
      status: 'ABERTO', criadoEm: agora, atualizadoEm: agora,
    },
  ]);
};
