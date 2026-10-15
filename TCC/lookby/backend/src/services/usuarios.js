// Consultas e formatos de usuário usados em várias rotas
const { db } = require('../db');
const { AppError } = require('../errors');
const realtime = require('../realtime');

const VEICULOS = ['MOTO', 'CARRO', 'BICICLETA', 'VAN', 'CAMINHAO'];

// Dados do próprio usuário (tudo, menos senha e código de recuperação)
function usuarioPrivado(u) {
  if (!u) return null;
  const { senhaHash, codigoHash, codigoExpiraEm, codigoTentativas, ...resto } = u;
  return resto;
}

// O que outras pessoas podem ver de um usuário
function usuarioPublico(u) {
  if (!u) return null;
  const base = { id: u.id, tipo: u.tipo, nome: u.nome, usuario: u.usuario, fotoUrl: u.fotoUrl };
  if (u.tipo === 'ENTREGADOR') return { ...base, veiculo: u.veiculo, placa: u.placa };
  return { ...base, cnpj: u.cnpj, localizacao: u.localizacao, nicho: u.nicho, historia: u.historia };
}

function buscarUsuario(id) {
  const u = db.um('SELECT * FROM usuarios WHERE id = ?', id);
  if (!u) throw new AppError('Usuário não encontrado', 404);
  return u;
}

const publicoPorId = (id) => (id ? usuarioPublico(db.um('SELECT * FROM usuarios WHERE id = ?', id)) : null);

// Nota média recebida e histórico de entregas (aparece no perfil e no "Histórico" da empresa)
function estatisticas(u) {
  const nota = db.um('SELECT AVG(nota) AS media, COUNT(*) AS total FROM avaliacoes WHERE avaliado_id = ?', u.id);
  const avaliacoes = { media: nota.media ? Number(nota.media.toFixed(1)) : null, total: nota.total };

  if (u.tipo === 'ENTREGADOR') {
    const e = db.um(
      `SELECT SUM(status = 'CONCLUIDA') AS concluidas, SUM(status = 'CONTESTADA') AS contestadas
         FROM entregas WHERE entregador_id = ?`,
      u.id
    );
    return { avaliacoes, entregasConcluidas: e.concluidas || 0, entregasContestadas: e.contestadas || 0 };
  }
  const e = db.um(
    `SELECT COUNT(*) AS publicadas, SUM(status = 'CONCLUIDA') AS concluidas, SUM(status = 'ABERTA') AS abertas
       FROM entregas WHERE cliente_id = ?`,
    u.id
  );
  return {
    avaliacoes,
    entregasPublicadas: e.publicadas || 0,
    entregasConcluidas: e.concluidas || 0,
    entregasAbertas: e.abertas || 0,
  };
}

function curriculoDe(usuarioId) {
  const itens = db.todos('SELECT * FROM curriculo_itens WHERE usuario_id = ? ORDER BY id', usuarioId);
  return {
    escolaridade: itens.filter((i) => i.secao === 'ESCOLARIDADE'),
    experiencias: itens.filter((i) => i.secao === 'EXPERIENCIA'),
    contatos: itens.filter((i) => i.secao === 'CONTATO'),
    arquivos: db.todos('SELECT * FROM curriculo_arquivos WHERE usuario_id = ? ORDER BY id', usuarioId),
  };
}

// Online agora? Se não, quando foi visto por último
function presenca(u) {
  return { online: realtime.estaOnline(u.id), vistoEm: u.vistoEm };
}

// Regra: para se candidatar, o entregador precisa de telefone, veículo e (se motorizado) CNH
function pendenciasDoEntregador(u) {
  const faltando = [];
  if (!u.telefone) faltando.push('telefone');
  if (!u.veiculo) faltando.push('veículo');
  if (u.veiculo && u.veiculo !== 'BICICLETA' && !u.cnh) faltando.push('CNH');
  return faltando;
}

module.exports = {
  VEICULOS,
  usuarioPrivado,
  usuarioPublico,
  buscarUsuario,
  publicoPorId,
  estatisticas,
  curriculoDe,
  presenca,
  pendenciasDoEntregador,
};
