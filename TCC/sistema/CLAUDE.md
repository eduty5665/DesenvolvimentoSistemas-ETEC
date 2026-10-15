# Sistema de Entregas (TCC ETEC)

App que conecta clientes a entregadores; os dois negociam valor/rota/mercadoria num chat.
Tudo em português (código, mensagens, commits). Leia README.md para o fluxo e as regras de negócio.

- `backend/`: Node + Express 5 + Knex (SQLite) + Socket.IO. CommonJS.
  - Colunas no banco são snake_case; no código use camelCase (conversão automática em knexfile.js).
  - Regras de negociação ficam em `src/services/negociacao.js`.
  - Sempre rode `npm test` depois de mudar a API; adicione casos em `tests/fluxo.test.js`.
- `mobile/`: Expo SDK 57 + Expo Router, JavaScript (sem TypeScript). Veja `mobile/AGENTS.md`.
  - Telas em `src/app/`, componentes em `src/components/ui.js`, cores em `src/theme.js`.
  - Instale pacotes com `npx expo install <pacote>`.
