const { Router } = require('express');
const { db } = require('../db');
const { AppError } = require('../errors');
const { autenticar } = require('../middleware/auth');
const u = require('../services/usuarios');
const e = require('../services/entregas');

// "Empresas" do menu: os clientes que publicam entregas no LookBy
const router = Router();
router.use(autenticar);

// GET /empresas?busca=texto
router.get('/', (req, res) => {
  const busca = `%${String(req.query.busca || '').trim()}%`;
  const empresas = db.todos(
    `SELECT u.*, (SELECT COUNT(*) FROM entregas e WHERE e.cliente_id = u.id AND e.status = 'ABERTA') AS entregas_abertas
       FROM usuarios u
      WHERE u.tipo = 'CLIENTE' AND (u.nome LIKE ? OR IFNULL(u.nicho, '') LIKE ? OR IFNULL(u.localizacao, '') LIKE ?)
      ORDER BY entregas_abertas DESC, u.nome`,
    busca, busca, busca
  );
  res.json(empresas.map((emp) => ({ ...u.usuarioPublico(emp), entregasAbertas: emp.entregasAbertas })));
});

// GET /empresas/:id  (dados da empresa, histórico e oportunidades abertas dela)
router.get('/:id', (req, res) => {
  const empresa = u.buscarUsuario(Number(req.params.id));
  if (empresa.tipo !== 'CLIENTE') throw new AppError('Empresa não encontrada', 404);
  const abertas = db.todos(
    "SELECT * FROM entregas WHERE cliente_id = ? AND status = 'ABERTA' ORDER BY data, id DESC",
    empresa.id
  );
  res.json({
    ...u.usuarioPublico(empresa),
    ...u.estatisticas(empresa),
    oportunidades: abertas.map((ent) => e.montarEntrega(ent, req.usuario)),
  });
});

module.exports = router;
