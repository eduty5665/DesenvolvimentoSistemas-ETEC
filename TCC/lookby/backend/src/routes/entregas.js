const { Router } = require('express');
const { z } = require('zod');
const { db } = require('../db');
const { AppError, validar } = require('../errors');
const { autenticar, somente } = require('../middleware/auth');
const e = require('../services/entregas');

const router = Router();
router.use(autenticar);

const horario = (qual) => z.string({ message: `informe o horário de ${qual}` }).regex(/^([01]\d|2[0-3]):[0-5]\d$/, `horário de ${qual} inválido (use HH:MM)`);
const hoje = () => new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10); // horário de Brasília

const entregaSchema = z.object({
  titulo: z.string({ message: 'informe um título' }).trim().min(3, 'informe um título').max(60),
  carga: z.string({ message: 'descreva a carga' }).trim().min(3, 'descreva a carga').max(300),
  tipoCarga: z.enum(e.TIPOS_CARGA, { message: 'escolha o tipo da carga' }),
  data: z
    .string({ message: 'informe a data' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'data inválida')
    .refine((d) => !Number.isNaN(Date.parse(d)), 'data inválida')
    .refine((d) => d >= hoje(), 'a data não pode estar no passado'),
  horarioRetirada: horario('retirada'),
  horarioEntrega: horario('entrega'),
  enderecoRetirada: z.string({ message: 'informe o endereço de retirada' }).trim().min(3, 'informe o endereço de retirada').max(200),
  cidadeRetirada: z.string({ message: 'informe a cidade de retirada' }).trim().min(2, 'informe a cidade de retirada').max(60),
  enderecoEntrega: z.string({ message: 'informe o endereço de entrega' }).trim().min(3, 'informe o endereço de entrega').max(200),
  cidadeEntrega: z.string({ message: 'informe a cidade de entrega' }).trim().min(2, 'informe a cidade de entrega').max(60),
  observacoes: z.string().trim().max(500).optional().nullable(),
  valor: z.coerce.number({ message: 'informe o valor' }).positive('o valor deve ser maior que zero'),
});

// POST /entregas  (cliente publica uma entrega; ela aparece em Oportunidades)
router.post('/', somente('CLIENTE'), (req, res) => {
  const dados = validar(entregaSchema, req.body);
  const entrega = e.publicar(req.usuario.id, dados);
  res.status(201).json(e.montarEntrega(entrega, req.usuario));
});

// GET /entregas/oportunidades?busca=&tipoCarga=   (entregas abertas)
router.get('/oportunidades', (req, res) => {
  const busca = `%${String(req.query.busca || '').trim()}%`;
  const { tipoCarga } = req.query;
  const filtroTipo = e.TIPOS_CARGA.includes(tipoCarga) ? tipoCarga : null;
  const lista = db.todos(
    `SELECT * FROM entregas
      WHERE status = 'ABERTA'
        AND (titulo LIKE ? OR carga LIKE ? OR cidade_entrega LIKE ? OR cidade_retirada LIKE ?)
        AND (? IS NULL OR tipo_carga = ?)
      ORDER BY data, horario_retirada, id DESC`,
    busca, busca, busca, busca, filtroTipo, filtroTipo
  );
  res.json(lista.map((ent) => e.montarEntrega(ent, req.usuario)));
});

// GET /entregas/minhas
//   entregador: entregas em que se candidatou (pendentes, confirmadas, concluídas...)
//   cliente:    entregas que publicou
router.get('/minhas', (req, res) => {
  const { id, tipo } = req.usuario;
  const lista =
    tipo === 'CLIENTE'
      ? db.todos('SELECT * FROM entregas WHERE cliente_id = ? ORDER BY id DESC', id)
      : db.todos(
          `SELECT e.* FROM entregas e JOIN candidaturas c ON c.entrega_id = e.id
            WHERE c.entregador_id = ? AND c.status <> 'DESISTIU'
            ORDER BY c.atualizado_em DESC`,
          id
        );
  res.json(lista.map((ent) => e.montarEntrega(ent, req.usuario)));
});

// GET /entregas/:id
router.get('/:id', (req, res) => {
  const entrega = e.buscarEntrega(Number(req.params.id));
  const { id, tipo } = req.usuario;
  const dono = entrega.clienteId === id;

  // Entregas abertas são públicas para entregadores; depois disso só os envolvidos enxergam
  const candidato =
    tipo === 'ENTREGADOR' &&
    db.um('SELECT id FROM candidaturas WHERE entrega_id = ? AND entregador_id = ?', entrega.id, id);
  if (!dono && !candidato && !(tipo === 'ENTREGADOR' && entrega.status === 'ABERTA')) {
    throw new AppError('Você não tem acesso a esta entrega', 403);
  }

  const dados = e.montarEntrega(entrega, req.usuario);
  if (dono) {
    // O cliente vê todas as candidaturas da entrega
    dados.candidaturas = db
      .todos(
        `SELECT * FROM candidaturas WHERE entrega_id = ? AND status <> 'DESISTIU'
          ORDER BY CASE status WHEN 'ACEITA' THEN 0 WHEN 'PENDENTE' THEN 1 ELSE 2 END, id`,
        entrega.id
      )
      .map((c) => e.montarCandidatura(c, id, { comEntregador: true }));
  }
  dados.jaAvaliei = Boolean(
    db.um('SELECT id FROM avaliacoes WHERE entrega_id = ? AND avaliador_id = ?', entrega.id, id)
  );
  res.json(dados);
});

// POST /entregas/:id/candidaturas  (entregador se candidata)
router.post('/:id/candidaturas', somente('ENTREGADOR'), (req, res) => {
  const candidatura = e.candidatar(Number(req.params.id), req.usuario.id);
  res.status(201).json(e.montarCandidatura(candidatura, req.usuario.id));
});

const responder = (acao) => (req, res) => {
  const entrega = acao(Number(req.params.id), req.usuario.id, req.body);
  res.json(e.montarEntrega(entrega, req.usuario));
};

// POST /entregas/:id/confirmar-entrega      (entregador: "entreguei")
router.post('/:id/confirmar-entrega', somente('ENTREGADOR'), responder(e.confirmarEntrega));

// POST /entregas/:id/confirmar-recebimento  (cliente: "recebi")
router.post('/:id/confirmar-recebimento', somente('CLIENTE'), responder(e.confirmarRecebimento));

// POST /entregas/:id/contestar  { motivo }   (cliente: "não recebi como combinado")
router.post(
  '/:id/contestar',
  somente('CLIENTE'),
  responder((id, usuarioId, corpo) => {
    const { motivo } = validar(
      z.object({ motivo: z.string().trim().min(5, 'explique o que aconteceu').max(300) }),
      corpo || {}
    );
    return e.contestar(id, usuarioId, motivo);
  })
);

// POST /entregas/:id/cancelar  (cliente, antes de o entregador confirmar a entrega)
router.post('/:id/cancelar', somente('CLIENTE'), responder(e.cancelar));

// POST /entregas/:id/avaliacoes  { nota, comentario? }
router.post('/:id/avaliacoes', (req, res) => {
  const { nota, comentario } = validar(
    z.object({
      nota: z.coerce.number().int().min(1, 'dê uma nota de 1 a 5').max(5, 'dê uma nota de 1 a 5'),
      comentario: z.string().trim().max(300).optional().nullable(),
    }),
    req.body
  );
  res.status(201).json(e.avaliar(Number(req.params.id), req.usuario.id, nota, comentario));
});

module.exports = router;
