// Regras de negócio das entregas e candidaturas.
//
// Fluxo:
//   1. CLIENTE publica a entrega                      -> entrega ABERTA (aparece em Oportunidades)
//   2. ENTREGADOR se candidata                        -> candidatura PENDENTE (abre o chat com o cliente)
//   3. CLIENTE confirma um candidato                  -> candidatura ACEITA, entrega ACEITA, demais RECUSADAS
//   4. ENTREGADOR confirma que entregou               -> entrega ENTREGUE
//   5. CLIENTE confirma o recebimento (ou contesta)   -> entrega CONCLUIDA (ou CONTESTADA)
//   6. Os dois se avaliam
const { db, agora } = require('../db');
const { AppError } = require('../errors');
const realtime = require('../realtime');
const chat = require('./chat');
const usuarios = require('./usuarios');

const TIPOS_CARGA = ['DOCUMENTOS', 'ALIMENTOS', 'MATERIAIS', 'ELETRONICOS', 'MOVEIS', 'FRAGIL', 'OUTROS'];

function buscarEntrega(id) {
  const entrega = db.um('SELECT * FROM entregas WHERE id = ?', id);
  if (!entrega) throw new AppError('Entrega não encontrada', 404);
  return entrega;
}

function buscarCandidatura(id) {
  const candidatura = db.um('SELECT * FROM candidaturas WHERE id = ?', id);
  if (!candidatura) throw new AppError('Candidatura não encontrada', 404);
  return candidatura;
}

// Candidatura do ponto de vista de quem está olhando (com não lidas e última mensagem)
function montarCandidatura(c, usuarioId, { comEntregador = false } = {}) {
  const dados = {
    ...c,
    naoLidas: chat.naoLidas(c.id, usuarioId),
    ultimaMensagem: chat.ultimaMensagem(c.id),
  };
  if (comEntregador) {
    const entregador = usuarios.buscarUsuario(c.entregadorId);
    dados.entregador = {
      ...usuarios.usuarioPublico(entregador),
      ...usuarios.estatisticas(entregador),
      ...usuarios.presenca(entregador),
    };
  }
  return dados;
}

// Entrega pronta para o app: com cliente, entregador e o que interessa a quem está vendo
function montarEntrega(entrega, viewer) {
  const dados = {
    ...entrega,
    cliente: usuarios.publicoPorId(entrega.clienteId),
    entregador: usuarios.publicoPorId(entrega.entregadorId),
  };
  if (!viewer) return dados;

  if (viewer.tipo === 'ENTREGADOR') {
    const minha = db.um(
      'SELECT * FROM candidaturas WHERE entrega_id = ? AND entregador_id = ?',
      entrega.id,
      viewer.id
    );
    // Quem desistiu volta a ver a entrega como uma oportunidade comum
    dados.minhaCandidatura = minha && minha.status !== 'DESISTIU' ? montarCandidatura(minha, viewer.id) : null;
  } else if (entrega.clienteId === viewer.id) {
    const c = db.um(
      `SELECT COUNT(*) AS total, SUM(status = 'PENDENTE') AS pendentes
         FROM candidaturas WHERE entrega_id = ?`,
      entrega.id
    );
    dados.totalCandidaturas = c.total;
    dados.candidaturasPendentes = c.pendentes || 0;
    dados.naoLidas = db.um(
      `SELECT COUNT(*) AS total FROM mensagens m JOIN candidaturas c ON c.id = m.candidatura_id
        WHERE c.entrega_id = ? AND m.autor_id <> ? AND m.lida_em IS NULL`,
      entrega.id,
      viewer.id
    ).total;
  }
  return dados;
}

// Avisa todo mundo ligado à entrega (cliente e candidatos) para atualizar a tela
function notificarEntrega(entregaId, evento = 'entrega:atualizada') {
  const entrega = db.um('SELECT cliente_id FROM entregas WHERE id = ?', entregaId);
  const candidatos = db.todos('SELECT entregador_id FROM candidaturas WHERE entrega_id = ?', entregaId);
  realtime.paraUsuarios([entrega.clienteId, ...candidatos.map((c) => c.entregadorId)], evento, { entregaId });
}

// ---------------------------------------------------------------- publicar
function publicar(clienteId, dados) {
  const data = agora();
  const id = db.inserir('entregas', {
    ...dados,
    clienteId,
    status: 'ABERTA',
    criadoEm: data,
    atualizadoEm: data,
  });
  realtime.paraEntregadores('entrega:nova', { entregaId: id });
  return buscarEntrega(id);
}

// ---------------------------------------------------------------- candidatura
function candidatar(entregaId, entregadorId) {
  const entrega = buscarEntrega(entregaId);
  const entregador = usuarios.buscarUsuario(entregadorId);

  if (entrega.status !== 'ABERTA') throw new AppError('Esta entrega não está mais disponível', 409);

  const faltando = usuarios.pendenciasDoEntregador(entregador);
  if (faltando.length) {
    throw new AppError(`Complete seu perfil para se candidatar. Falta: ${faltando.join(', ')}.`, 422);
  }

  const existente = db.um(
    'SELECT * FROM candidaturas WHERE entrega_id = ? AND entregador_id = ?',
    entregaId,
    entregadorId
  );
  if (existente && existente.status !== 'DESISTIU') {
    throw new AppError('Você já se candidatou a esta entrega', 409);
  }

  const data = agora();
  let id;
  if (existente) {
    // Tinha desistido e voltou: reabre a mesma candidatura (mantém o histórico do chat)
    id = existente.id;
    db.atualizar('candidaturas', id, { status: 'PENDENTE', valorCombinado: null, atualizadoEm: data });
  } else {
    id = db.inserir('candidaturas', { entregaId, entregadorId, status: 'PENDENTE', criadoEm: data, atualizadoEm: data });
  }

  chat.avisoNoChat(id, entregadorId, `${entregador.nome} se candidatou a esta entrega.`);
  realtime.paraUsuarios([entrega.clienteId], 'candidatura:nova', { candidaturaId: id, entregaId });
  notificarEntrega(entregaId);
  return buscarCandidatura(id);
}

function desistir(candidaturaId, entregadorId) {
  const candidatura = buscarCandidatura(candidaturaId);
  if (candidatura.entregadorId !== entregadorId) throw new AppError('Esta candidatura não é sua', 403);
  if (candidatura.status !== 'PENDENTE') {
    throw new AppError('Só é possível desistir enquanto a candidatura está pendente', 409);
  }
  const conversa = chat.candidaturaDoUsuario(candidaturaId, entregadorId);
  chat.encerrarPropostasPendentes(conversa);
  chat.avisoNoChat(candidaturaId, entregadorId, 'O entregador desistiu da candidatura.');
  db.atualizar('candidaturas', candidaturaId, { status: 'DESISTIU', atualizadoEm: agora() });
  notificarEntrega(candidatura.entregaId, 'candidatura:atualizada');
  return buscarCandidatura(candidaturaId);
}

function candidaturaDoCliente(candidaturaId, clienteId) {
  const candidatura = buscarCandidatura(candidaturaId);
  const entrega = buscarEntrega(candidatura.entregaId);
  if (entrega.clienteId !== clienteId) throw new AppError('Esta entrega não é sua', 403);
  return { candidatura, entrega };
}

// O cliente confirma UM candidato. As outras candidaturas pendentes são recusadas.
function aceitarCandidatura(candidaturaId, clienteId) {
  const { candidatura, entrega } = candidaturaDoCliente(candidaturaId, clienteId);
  if (candidatura.status !== 'PENDENTE') throw new AppError('Esta candidatura não está mais pendente', 409);

  const valorCombinado = candidatura.valorCombinado ?? entrega.valor;
  const data = agora();

  const outras = db.transacao(() => {
    // O filtro por status garante que a entrega só é fechada uma vez
    const { changes } = db.executar(
      `UPDATE entregas SET status = 'ACEITA', entregador_id = ?, valor_combinado = ?, atualizado_em = ?
        WHERE id = ? AND status = 'ABERTA'`,
      candidatura.entregadorId,
      valorCombinado,
      data,
      entrega.id
    );
    if (!changes) throw new AppError('Esta entrega não está mais aberta', 409);

    db.atualizar('candidaturas', candidatura.id, { status: 'ACEITA', valorCombinado, atualizadoEm: data });
    const pendentes = db.todos(
      "SELECT id FROM candidaturas WHERE entrega_id = ? AND status = 'PENDENTE'",
      entrega.id
    );
    db.executar(
      "UPDATE candidaturas SET status = 'RECUSADA', atualizado_em = ? WHERE entrega_id = ? AND status = 'PENDENTE'",
      data,
      entrega.id
    );
    return pendentes;
  });

  chat.encerrarPropostasPendentes(chat.candidaturaDoUsuario(candidatura.id, clienteId));
  chat.avisoNoChat(
    candidatura.id,
    clienteId,
    `Candidatura confirmada! Valor combinado: ${chat.reais(valorCombinado)}. A entrega agora está em "Entregas".`
  );
  for (const outra of outras) {
    chat.encerrarPropostasPendentes(chat.candidaturaDoUsuario(outra.id, clienteId));
    chat.avisoNoChat(outra.id, clienteId, 'O cliente escolheu outro entregador para esta entrega.');
  }

  notificarEntrega(entrega.id, 'candidatura:atualizada');
  notificarEntrega(entrega.id);
  return buscarEntrega(entrega.id);
}

function recusarCandidatura(candidaturaId, clienteId) {
  const { candidatura, entrega } = candidaturaDoCliente(candidaturaId, clienteId);
  if (candidatura.status !== 'PENDENTE') throw new AppError('Esta candidatura não está mais pendente', 409);

  chat.encerrarPropostasPendentes(chat.candidaturaDoUsuario(candidatura.id, clienteId));
  chat.avisoNoChat(candidatura.id, clienteId, 'O cliente recusou esta candidatura.');
  db.atualizar('candidaturas', candidatura.id, { status: 'RECUSADA', atualizadoEm: agora() });
  notificarEntrega(entrega.id, 'candidatura:atualizada');
  return buscarCandidatura(candidatura.id);
}

// ---------------------------------------------------------------- andamento
function mudarStatus(entrega, status, extras = {}) {
  db.atualizar('entregas', entrega.id, { status, atualizadoEm: agora(), ...extras });
  notificarEntrega(entrega.id);
  return buscarEntrega(entrega.id);
}

function candidaturaAceita(entregaId) {
  return db.um("SELECT * FROM candidaturas WHERE entrega_id = ? AND status = 'ACEITA'", entregaId);
}

// O entregador declara que entregou a carga como combinado
function confirmarEntrega(entregaId, entregadorId) {
  const entrega = buscarEntrega(entregaId);
  if (entrega.entregadorId !== entregadorId) throw new AppError('Esta entrega não é sua', 403);
  if (entrega.status !== 'ACEITA') throw new AppError('Esta entrega não pode ser confirmada agora', 409);

  chat.avisoNoChat(
    candidaturaAceita(entregaId).id,
    entregadorId,
    'O entregador confirmou a entrega. Falta o cliente confirmar o recebimento.'
  );
  return mudarStatus(entrega, 'ENTREGUE');
}

function entregaDoCliente(entregaId, clienteId) {
  const entrega = buscarEntrega(entregaId);
  if (entrega.clienteId !== clienteId) throw new AppError('Esta entrega não é sua', 403);
  return entrega;
}

function confirmarRecebimento(entregaId, clienteId) {
  const entrega = entregaDoCliente(entregaId, clienteId);
  if (entrega.status !== 'ENTREGUE') throw new AppError('O entregador ainda não confirmou a entrega', 409);
  chat.avisoNoChat(candidaturaAceita(entregaId).id, clienteId, 'Recebimento confirmado. Entrega concluída!');
  return mudarStatus(entrega, 'CONCLUIDA');
}

// O cliente informa que a carga NÃO chegou como combinado. Fica registrado no histórico do entregador.
function contestar(entregaId, clienteId, motivo) {
  const entrega = entregaDoCliente(entregaId, clienteId);
  if (entrega.status !== 'ENTREGUE') throw new AppError('Só é possível contestar uma entrega confirmada pelo entregador', 409);
  chat.avisoNoChat(candidaturaAceita(entregaId).id, clienteId, `O cliente contestou a entrega: ${motivo}`);
  return mudarStatus(entrega, 'CONTESTADA', { motivoContestacao: motivo });
}

function cancelar(entregaId, clienteId) {
  const entrega = entregaDoCliente(entregaId, clienteId);
  if (!['ABERTA', 'ACEITA'].includes(entrega.status)) {
    throw new AppError('Esta entrega não pode mais ser cancelada', 409);
  }
  const ativas = db.todos(
    "SELECT id FROM candidaturas WHERE entrega_id = ? AND status IN ('PENDENTE', 'ACEITA')",
    entregaId
  );
  for (const c of ativas) {
    chat.encerrarPropostasPendentes(chat.candidaturaDoUsuario(c.id, clienteId));
    chat.avisoNoChat(c.id, clienteId, 'A entrega foi cancelada pelo cliente.');
  }
  db.executar(
    "UPDATE candidaturas SET status = 'RECUSADA', atualizado_em = ? WHERE entrega_id = ? AND status IN ('PENDENTE', 'ACEITA')",
    agora(),
    entregaId
  );
  return mudarStatus(entrega, 'CANCELADA', { entregadorId: null });
}

// ---------------------------------------------------------------- avaliação
function avaliar(entregaId, avaliadorId, nota, comentario) {
  const entrega = buscarEntrega(entregaId);
  if (!['CONCLUIDA', 'CONTESTADA'].includes(entrega.status)) {
    throw new AppError('Só é possível avaliar depois que a entrega termina', 409);
  }
  let avaliadoId;
  if (entrega.clienteId === avaliadorId) avaliadoId = entrega.entregadorId;
  else if (entrega.entregadorId === avaliadorId) avaliadoId = entrega.clienteId;
  else throw new AppError('Você não participou desta entrega', 403);

  const ja = db.um('SELECT id FROM avaliacoes WHERE entrega_id = ? AND avaliador_id = ?', entregaId, avaliadorId);
  if (ja) throw new AppError('Você já avaliou esta entrega', 409);

  const id = db.inserir('avaliacoes', {
    entregaId,
    avaliadorId,
    avaliadoId,
    nota,
    comentario: comentario || null,
    criadoEm: agora(),
  });
  return db.um('SELECT * FROM avaliacoes WHERE id = ?', id);
}

module.exports = {
  TIPOS_CARGA,
  buscarEntrega,
  buscarCandidatura,
  montarEntrega,
  montarCandidatura,
  publicar,
  candidatar,
  desistir,
  aceitarCandidatura,
  recusarCandidatura,
  confirmarEntrega,
  confirmarRecebimento,
  contestar,
  cancelar,
  avaliar,
};
