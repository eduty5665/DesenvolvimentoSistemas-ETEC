const knex = require('knex');
const config = require('../knexfile');

// Uma única conexão com o banco para toda a aplicação
const db = knex(config);

// Data/hora atual em ISO (UTC), usada nos campos criadoEm/atualizadoEm
const agora = () => new Date().toISOString();

// Insere e devolve o id criado (funciona em SQLite, MySQL e PostgreSQL)
async function inserir(tabela, dados) {
  const [linha] = await db(tabela).insert(dados).returning('id');
  return typeof linha === 'object' ? linha.id : linha;
}

module.exports = { db, agora, inserir };
