// Acesso ao banco de dados.
// Usa o SQLite que já vem embutido no Node (node:sqlite): não precisa instalar nem compilar nada.
// No banco as colunas são snake_case (cliente_id); no código usamos camelCase (clienteId).
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const RAIZ = path.resolve(__dirname, '..');
const arquivo = path.resolve(RAIZ, process.env.DB_FILE || './database/lookby.db');
fs.mkdirSync(path.dirname(arquivo), { recursive: true });

const conexao = new DatabaseSync(arquivo);
conexao.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
conexao.exec(fs.readFileSync(path.join(RAIZ, 'database/schema.sql'), 'utf8'));

const paraSnake = (s) => s.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
const paraCamel = (s) => s.replace(/_([a-z0-9])/g, (_, l) => l.toUpperCase());

function linha(obj) {
  if (!obj) return null;
  const novo = {};
  for (const chave of Object.keys(obj)) novo[paraCamel(chave)] = obj[chave];
  return novo;
}

// O SQLite não aceita undefined nem boolean como parâmetro
const param = (v) => (v === undefined ? null : typeof v === 'boolean' ? Number(v) : v);

const db = {
  // Várias linhas:  db.todos('SELECT * FROM entregas WHERE status = ?', 'ABERTA')
  todos: (sql, ...params) => conexao.prepare(sql).all(...params.map(param)).map(linha),
  // Uma linha (ou null)
  um: (sql, ...params) => linha(conexao.prepare(sql).get(...params.map(param))),
  // INSERT/UPDATE/DELETE: devolve { changes, lastInsertRowid }
  executar: (sql, ...params) => conexao.prepare(sql).run(...params.map(param)),

  // db.inserir('entregas', { clienteId: 1, titulo: '...' }) -> id criado
  inserir(tabela, dados) {
    const chaves = Object.keys(dados);
    const sql = `INSERT INTO ${tabela} (${chaves.map(paraSnake).join(', ')}) VALUES (${chaves.map(() => '?').join(', ')})`;
    return Number(db.executar(sql, ...chaves.map((c) => dados[c])).lastInsertRowid);
  },

  // db.atualizar('entregas', 5, { status: 'ACEITA' })
  atualizar(tabela, id, dados) {
    const chaves = Object.keys(dados);
    if (!chaves.length) return 0;
    const sql = `UPDATE ${tabela} SET ${chaves.map((c) => `${paraSnake(c)} = ?`).join(', ')} WHERE id = ?`;
    return db.executar(sql, ...chaves.map((c) => dados[c]), id).changes;
  },

  // Tudo ou nada: se a função lançar erro, as alterações são desfeitas
  transacao(fn) {
    conexao.exec('BEGIN IMMEDIATE');
    try {
      const resultado = fn();
      conexao.exec('COMMIT');
      return resultado;
    } catch (erro) {
      conexao.exec('ROLLBACK');
      throw erro;
    }
  },

  fechar: () => conexao.close(),
  arquivo,
};

// Data/hora atual em ISO (UTC), usada nos campos criado_em/atualizado_em
const agora = () => new Date().toISOString();

module.exports = { db, agora };
