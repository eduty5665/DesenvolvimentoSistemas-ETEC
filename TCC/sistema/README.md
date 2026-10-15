# Sistema de Entregas — TCC Desenvolvimento de Sistemas (ETEC)

App mobile que conecta **clientes** que precisam transportar algo com **entregadores/motoboys**.
O cliente publica o pedido e os entregadores interessados conversam com ele pelo chat, onde
os dois negociam **valor, rota, horário e o que será transportado**. Quando um lado aceita a
proposta de valor do outro, o acordo é fechado, e depois da entrega um avalia o outro.

> O nome "Entregas" é provisório. Para trocar, altere `name` em `mobile/app.json` e o texto da tela de login.

## Tecnologias

| Parte | Tecnologia |
|---|---|
| App mobile | React Native + Expo (SDK 57), Expo Router |
| API | Node.js + Express 5 |
| Tempo real (chat) | Socket.IO |
| Banco de dados | SQLite (desenvolvimento) via Knex. Dá para trocar para MySQL depois |
| Autenticação | JWT + senha criptografada com bcrypt |

```
sistema/
├── backend/            API REST + Socket.IO
│   ├── src/
│   │   ├── routes/     auth, usuarios, pedidos, conversas
│   │   ├── services/   regras de negociação (propostas, aceite)
│   │   ├── middleware/ autenticação JWT
│   │   └── realtime.js eventos em tempo real
│   ├── database/       migrations (tabelas) e seeds (dados de teste)
│   └── tests/          teste do fluxo completo
└── mobile/             App Expo
    └── src/
        ├── app/        telas (cada arquivo é uma rota)
        ├── components/ botões, campos, cartões
        ├── contexts/   sessão do usuário + socket
        └── services/   chamadas à API
```

## Como rodar (Windows)

Pré-requisitos: **Node.js 24 ou superior** (https://nodejs.org) e o app **Expo Go** no celular (Play Store / App Store).
No Windows, a API também pode precisar do **Visual Studio Build Tools 2022** com a carga de trabalho **Desenvolvimento para desktop com C++** para compilar o SQLite nativo (`better-sqlite3`). Instale-o se `npm install` mostrar erro do `node-gyp` procurando Visual Studio.

### 1. API

```bash
cd backend
npm install
npm run db:migrate     # cria as tabelas
npm run db:seed        # cria usuários e pedidos de teste
npm run dev            # inicia a API na porta 3333
```

O terminal mostra o IP da sua máquina, por exemplo `No celular use: http://192.168.0.10:3333`.

> Na primeira vez o Windows pode perguntar sobre o Firewall. Permita o acesso em **redes privadas**, senão o celular não consegue falar com a API.

### 2. App

Em outro terminal:

```bash
cd mobile
npm install
npx expo start
```

Escaneie o QR Code com o Expo Go (celular e computador **no mesmo Wi-Fi**).
O app descobre sozinho o IP do computador. Se não conectar, crie `mobile/.env` com:

```
EXPO_PUBLIC_API_URL=http://SEU_IP:3333
```

Para testar no navegador, aperte `w` no terminal do Expo.

### Usuários de teste (senha `123456`)

| E-mail | Tipo |
|---|---|
| paula@teste.com | Cliente |
| ricardo@teste.com | Entregador (moto) |
| marcos@teste.com | Entregador (carro) |

Dica: abra o app no celular como **Paula** e no navegador como **Ricardo** para ver o chat funcionando em tempo real.

## Fluxo do sistema

1. **Cliente** cria um pedido: tipo de serviço, descrição, endereço de retirada e de entrega e valor sugerido (opcional).
2. **Entregadores** veem os pedidos abertos (com filtro por categoria) e tocam em *Negociar*.
3. No **chat**, os dois conversam e trocam **propostas de valor** (botão 💰). Uma nova proposta substitui a anterior.
4. Quando um lado **aceita** a proposta do outro, o pedido vira *Acordo fechado* com aquele entregador. As negociações com os outros entregadores são encerradas automaticamente.
5. O entregador marca **Retirei a mercadoria** e depois **Confirmar entrega**.
6. Cliente e entregador **se avaliam** (1 a 5 estrelas). A nota aparece no perfil.

Status do pedido: `ABERTO → ACEITO → EM_ANDAMENTO → CONCLUIDO` (ou `CANCELADO` pelo cliente antes da retirada).

## Regras de negócio implementadas

- Só clientes criam pedidos; só entregadores abrem negociação.
- Entregador precisa informar o veículo no cadastro.
- Cada entregador tem uma conversa por pedido; um entregador não vê a conversa dos outros.
- Ninguém aceita a própria proposta. Só é possível negociar valores com o pedido aberto.
- Aceitar uma proposta fecha o pedido de forma atômica: duas propostas nunca são aceitas ao mesmo tempo.
- Apenas o entregador escolhido avança o status; apenas o cliente cancela.
- Avaliação só depois de concluído, uma vez por pessoa.
- Senhas guardadas com hash (bcrypt); a CNH não é exibida para outros usuários.

## Banco de dados (dicionário resumido)

| Tabela | Campos principais |
|---|---|
| `usuarios` | id, nome, email (único), senha_hash, telefone, tipo (CLIENTE/ENTREGADOR), veiculo, placa, cnh, criado_em |
| `pedidos` | id, titulo, descricao, categoria, origem, destino, valor_sugerido, valor_final, status, cliente_id (FK), entregador_id (FK), criado_em, atualizado_em |
| `conversas` | id, pedido_id (FK), cliente_id (FK), entregador_id (FK), criado_em. Único por (pedido, entregador) |
| `mensagens` | id, conversa_id (FK), autor_id (FK), tipo (TEXTO/PROPOSTA/SISTEMA), texto, valor_proposta, status_proposta (PENDENTE/ACEITA/RECUSADA), criado_em |
| `avaliacoes` | id, pedido_id (FK), avaliador_id (FK), avaliado_id (FK), nota (1–5), comentario, criado_em |

A estrutura completa está em `backend/database/migrations/001_inicial.js`.

## Rotas da API

| Método | Rota | Quem | Descrição |
|---|---|---|---|
| POST | `/auth/cadastro` | todos | Cria conta e devolve token |
| POST | `/auth/login` | todos | Login |
| GET/PUT | `/usuarios/me` | logado | Meus dados / editar |
| GET | `/usuarios/:id` | logado | Perfil público com avaliações |
| POST | `/pedidos` | cliente | Criar pedido |
| GET | `/pedidos/meus` | logado | Pedidos do cliente / entregas do entregador |
| GET | `/pedidos/disponiveis?categoria=` | entregador | Pedidos abertos |
| GET | `/pedidos/:id` | envolvidos | Detalhes + negociações |
| POST | `/pedidos/:id/conversas` | entregador | Abrir negociação |
| PATCH | `/pedidos/:id/status` | cliente/entregador | EM_ANDAMENTO, CONCLUIDO, CANCELADO |
| POST | `/pedidos/:id/avaliacoes` | envolvidos | Avaliar |
| GET | `/conversas` | logado | Minhas conversas |
| GET | `/conversas/:id` | participantes | Histórico do chat |
| POST | `/conversas/:id/mensagens` | participantes | Enviar texto |
| POST | `/conversas/:id/propostas` | participantes | Enviar proposta de valor |
| POST | `/conversas/propostas/:id/aceitar` | outro lado | Aceitar proposta |
| POST | `/conversas/propostas/:id/recusar` | outro lado | Recusar proposta |

Eventos Socket.IO enviados pelo servidor: `mensagem:nova`, `mensagem:atualizada`, `pedido:novo`, `pedido:atualizado`.

## Testes

```bash
cd backend
npm test
```

Roda o fluxo inteiro (cadastro, pedido, negociação com dois entregadores, aceite, entrega e avaliação) num banco temporário.

## Próximos passos sugeridos

- Mapa com a rota (expo-location + react-native-maps) e acompanhamento do entregador
- Notificações push (expo-notifications)
- Foto de perfil e foto da mercadoria
- Versão web para empresas (prevista no BMC)
- Pagamento pelo app
