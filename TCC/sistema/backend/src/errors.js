// Erro com status HTTP, lançado pelas rotas e serviços
class AppError extends Error {
  constructor(mensagem, status = 400) {
    super(mensagem);
    this.status = status;
  }
}

// Valida o corpo da requisição com um schema do zod
function validar(schema, dados) {
  const resultado = schema.safeParse(dados);
  if (!resultado.success) {
    const primeiro = resultado.error.issues[0];
    const campo = primeiro.path.join('.');
    throw new AppError(campo ? `${campo}: ${primeiro.message}` : primeiro.message, 400);
  }
  return resultado.data;
}

module.exports = { AppError, validar };
