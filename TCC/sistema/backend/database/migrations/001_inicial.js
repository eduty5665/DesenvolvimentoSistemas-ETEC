// Estrutura inicial do banco do Sistema de Entregas.
// Tabelas: usuarios, pedidos, conversas, mensagens, avaliacoes

exports.up = async (knex) => {
  await knex.schema.createTable('usuarios', (t) => {
    t.increments('id');
    t.string('nome', 100).notNullable();
    t.string('email', 150).notNullable().unique();
    t.string('senhaHash', 100).notNullable();
    t.string('telefone', 20).notNullable();
    t.string('tipo', 20).notNullable(); // CLIENTE | ENTREGADOR
    t.string('veiculo', 20); // MOTO | CARRO | BICICLETA | VAN | CAMINHAO (entregador)
    t.string('placa', 10);
    t.string('cnh', 20);
    t.string('criadoEm', 30).notNullable();
  });

  await knex.schema.createTable('pedidos', (t) => {
    t.increments('id');
    t.string('titulo', 100).notNullable();
    t.text('descricao').notNullable();
    t.string('categoria', 20).notNullable();
    t.string('origem', 255).notNullable();
    t.string('destino', 255).notNullable();
    t.decimal('valorSugerido', 10, 2);
    t.decimal('valorFinal', 10, 2);
    t.string('status', 20).notNullable().defaultTo('ABERTO');
    // ABERTO | ACEITO | EM_ANDAMENTO | CONCLUIDO | CANCELADO
    t.integer('clienteId').notNullable().references('id').inTable('usuarios');
    t.integer('entregadorId').references('id').inTable('usuarios');
    t.string('criadoEm', 30).notNullable();
    t.string('atualizadoEm', 30).notNullable();
    t.index(['status']);
  });

  // Uma conversa = negociação entre o cliente e UM entregador sobre UM pedido
  await knex.schema.createTable('conversas', (t) => {
    t.increments('id');
    t.integer('pedidoId').notNullable().references('id').inTable('pedidos').onDelete('CASCADE');
    t.integer('clienteId').notNullable().references('id').inTable('usuarios');
    t.integer('entregadorId').notNullable().references('id').inTable('usuarios');
    t.string('criadoEm', 30).notNullable();
    t.unique(['pedidoId', 'entregadorId']);
  });

  await knex.schema.createTable('mensagens', (t) => {
    t.increments('id');
    t.integer('conversaId').notNullable().references('id').inTable('conversas').onDelete('CASCADE');
    t.integer('autorId').notNullable().references('id').inTable('usuarios');
    t.string('tipo', 20).notNullable().defaultTo('TEXTO'); // TEXTO | PROPOSTA | SISTEMA
    t.text('texto').notNullable();
    t.decimal('valorProposta', 10, 2);
    t.string('statusProposta', 20); // PENDENTE | ACEITA | RECUSADA
    t.string('criadoEm', 30).notNullable();
    t.index(['conversaId']);
  });

  await knex.schema.createTable('avaliacoes', (t) => {
    t.increments('id');
    t.integer('pedidoId').notNullable().references('id').inTable('pedidos').onDelete('CASCADE');
    t.integer('avaliadorId').notNullable().references('id').inTable('usuarios');
    t.integer('avaliadoId').notNullable().references('id').inTable('usuarios');
    t.integer('nota').notNullable(); // 1 a 5
    t.string('comentario', 500);
    t.string('criadoEm', 30).notNullable();
    t.unique(['pedidoId', 'avaliadorId']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('avaliacoes');
  await knex.schema.dropTableIfExists('mensagens');
  await knex.schema.dropTableIfExists('conversas');
  await knex.schema.dropTableIfExists('pedidos');
  await knex.schema.dropTableIfExists('usuarios');
};
