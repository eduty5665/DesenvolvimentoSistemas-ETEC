// Erro com status HTTP, lançado pelas rotas e serviços
class AppError extends Error {
  constructor(mensagem, status = 400) {
    super(mensagem);
    this.status = status;
  }
}

// Valida o corpo da requisição com um schema do zod
function validar(schema, dados) {
  const resultado = schema.safeParse(dados ?? {});
  if (!resultado.success) {
    // Mostra só a primeira pendência, com a primeira letra maiúscula
    const { message } = resultado.error.issues[0];
    throw new AppError(message.charAt(0).toUpperCase() + message.slice(1), 400);
  }
  return resultado.data;
}

module.exports = { AppError, validar };
