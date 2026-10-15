# LookBy entregas (TCC ETEC)

App que conecta clientes/empresas a entregadores: a empresa publica a entrega, entregadores se candidatam,
negociam no chat e a empresa confirma um. Tudo em português (código, mensagens, commits).
Leia README.md para o fluxo e a tabela de regras de negócio (RN01–RN17).

- `backend/`: Node + Express 5 + `node:sqlite` + Socket.IO. CommonJS, sem ORM.
  - Colunas no banco são snake_case; no código use camelCase (conversão em `src/db.js`).
  - Tabelas em `database/schema.sql`. Mudou o schema? Apague `database/lookby.db` ou rode `npm run db:reset`.
  - Regras de negócio em `src/services/entregas.js` e `src/services/chat.js`; as rotas só validam e chamam os serviços.
  - Sempre rode `npm test` depois de mudar a API e cubra regra nova em `tests/fluxo.test.js`.
- `mobile/`: Expo SDK 57 + Expo Router, JavaScript (sem TypeScript). Veja `mobile/AGENTS.md`.
  - O visual segue o Figma: use `src/theme.js` (cores e fontes) e os componentes de `src/components/`
    (`Tela` para o cabeçalho/menu, `Botao`, `Campo`, `Caixa`, `Confirmacao`, cartões). Não crie estilos soltos.
  - Telas em `src/app/`. Instale pacotes com `npx expo install <pacote>`.
