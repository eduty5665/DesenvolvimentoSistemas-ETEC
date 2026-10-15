const { db } = require('../db');

// Campos de usuário que podem aparecer para outras pessoas
const CAMPOS_PUBLICOS = ['id', 'nome', 'tipo', 'veiculo', 'placa'];

// Remove campos sensíveis antes de enviar o próprio usuário para o app
function usuarioPublico(u) {
  if (!u) return null;
  const { senhaHash, cnh, ...resto } = u;
  return resto;
}

// Completa uma lista de registros com os dados dos usuários relacionados.
// Ex.: comUsuarios(pedidos, { clienteId: 'cliente', entregadorId: 'entregador' })
async function comUsuarios(registros, relacoes) {
  const lista = Array.isArray(registros) ? registros : [registros];
  const ids = new Set();
  for (const r of lista) for (const campo of Object.keys(relacoes)) if (r[campo]) ids.add(r[campo]);

  const usuarios = ids.size ? await db('usuarios').select(CAMPOS_PUBLICOS).whereIn('id', [...ids]) : [];
  const porId = new Map(usuarios.map((u) => [u.id, u]));

  for (const r of lista) {
    for (const [campo, nome] of Object.entries(relacoes)) r[nome] = porId.get(r[campo]) || null;
  }
  return registros;
}

const RELACOES_PEDIDO = { clienteId: 'cliente', entregadorId: 'entregador' };

module.exports = { CAMPOS_PUBLICOS, usuarioPublico, comUsuarios, RELACOES_PEDIDO };
