// Configuração do banco de dados (Knex).
// Desenvolvimento: SQLite em arquivo, não precisa instalar servidor de banco.
// Para usar MySQL depois: npm i mysql2 e troque "client" para "mysql2" com os dados de conexão.
require('dotenv').config({ quiet: true });
const path = require('path');

// Nomes em camelCase no código viram snake_case no banco (clienteId -> cliente_id)
const paraSnake = (s) => s.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
const paraCamel = (s) => s.replace(/_([a-z])/g, (_, l) => l.toUpperCase());

function converterChaves(resultado) {
  if (Array.isArray(resultado)) return resultado.map(converterChaves);
  if (resultado && typeof resultado === 'object' && !(resultado instanceof Date)) {
    return Object.fromEntries(Object.entries(resultado).map(([k, v]) => [paraCamel(k), v]));
  }
  return resultado;
}

module.exports = {
  client: 'better-sqlite3',
  connection: {
    filename: path.resolve(__dirname, process.env.DB_FILE || './database/entregas.db'),
  },
  useNullAsDefault: true,
  pool: {
    // SQLite: liga as chaves estrangeiras
    afterCreate: (conn, done) => {
      conn.pragma('foreign_keys = ON');
      done();
    },
  },
  migrations: { directory: path.join(__dirname, 'database/migrations') },
  seeds: { directory: path.join(__dirname, 'database/seeds') },
  wrapIdentifier: (valor, original) => original(valor === '*' ? valor : paraSnake(valor)),
  postProcessResponse: (resultado) => converterChaves(resultado),
};
