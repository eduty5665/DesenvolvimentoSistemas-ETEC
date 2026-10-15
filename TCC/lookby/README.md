# LookBy entregas — TCC Desenvolvimento de Sistemas (ETEC)

App mobile que conecta **empresas/clientes** que precisam transportar algo com **entregadores**.
A empresa publica a entrega, os entregadores se candidatam, os dois conversam no chat para combinar
**valor, rota e carga**, e a empresa confirma um candidato. Depois da entrega, um avalia o outro.

O visual segue o protótipo do Figma (tema escuro, cabeçalho cinza, círculo "LookBy" que abre o menu,
cartões azuis com moldura branca e as mesmas fontes).

## Tecnologias

| Parte | Tecnologia |
|---|---|
| App mobile | React Native + Expo (SDK 57), Expo Router, JavaScript |
| API | Node.js + Express 5 |
| Tempo real (chat, candidaturas, avisos) | Socket.IO |
| Banco de dados | SQLite embutido no Node (`node:sqlite`): não precisa instalar nem compilar nada |
| Autenticação | JWT + senha criptografada com bcrypt |
| Uploads (foto e arquivos do currículo) | multer |

```
lookby/
├── backend/
│   ├── database/schema.sql   script de criação das tabelas (serve para a documentação do TCC)
│   ├── database/seed.js      dados de exemplo
│   ├── src/routes/           auth, usuarios, curriculo, empresas, entregas, candidaturas
│   ├── src/services/         regras de negócio (entregas.js) e chat (chat.js)
│   ├── src/realtime.js       eventos em tempo real
│   └── tests/fluxo.test.js   testes das regras de negócio
└── mobile/
    └── src/
        ├── app/              telas (cada arquivo é uma rota)
        ├── components/       Tela (cabeçalho + menu), cartões, botões, caixas de confirmação
        ├── contexts/         sessão do usuário, socket e avisos
        └── theme.js          cores e fontes do Figma
```

## Como rodar (Windows)

Pré-requisitos: **Node.js 22.13 ou mais novo** (recomendado o 24) e o app **Expo Go** no celular.
Não é preciso Visual Studio Build Tools: o banco é o SQLite que já vem no Node.

### 1. API

```bash
cd backend
npm install
npm run dev
```

Na primeira vez a API cria o banco (`backend/database/lookby.db`) com dados de exemplo.
O terminal mostra o endereço para o celular, por exemplo `No celular: http://192.168.0.10:3333`.

> Se o Windows perguntar sobre o Firewall, permita o acesso em **redes privadas**.

Para apagar tudo e recriar os dados de exemplo: `npm run db:reset`.

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

### Usuários de exemplo (senha `123456`)

| E-mail | Quem é |
|---|---|
| empresa@lookby.com | Cliente: Pencil Case Store |
| mercado@lookby.com | Cliente: Mercado Bom Dia |
| entregador@lookby.com | Entregador: Ricardo (van) |
| marcos@lookby.com | Entregador: Marcos (moto) |

Dica para apresentar: abra o app no celular como **entregador@lookby.com** e no navegador como
**empresa@lookby.com**. Dá para ver a candidatura e as mensagens chegando na hora do outro lado.

## Fluxo do sistema

1. **Cliente publica** a entrega (carga, tipo, data, retirada, entrega e valor oferecido).
2. A entrega aparece em **Oportunidades** para todos os entregadores, em tempo real.
3. O **entregador se candidata** ("Deseja se candidatar a vaga?"). A candidatura fica aguardando a empresa.
4. O cliente vê as **candidaturas daquela entrega**: quem é cada candidato, veículo, nota, currículo.
5. No **chat**, cliente e candidato combinam os detalhes. O botão **R$** envia uma **proposta de valor**;
   o outro lado aceita ou recusa. O valor aceito vira o **valor combinado**.
6. O **cliente confirma um candidato**. A entrega vai para **Entregas** do entregador e as outras
   candidaturas são recusadas automaticamente (com aviso no chat de cada uma).
7. O entregador toca em **Confirmar** quando entregar ("Confirmar sua entrega?").
8. O cliente **confirma o recebimento** (ou **contesta**, explicando o motivo).
9. Os dois **se avaliam** de 1 a 5 estrelas. A nota e o histórico aparecem no perfil.

```
entrega:      ABERTA → ACEITA → ENTREGUE → CONCLUIDA        (ou CONTESTADA / CANCELADA)
candidatura:  PENDENTE → ACEITA | RECUSADA | DESISTIU
proposta:     PENDENTE → ACEITA | RECUSADA | SUBSTITUIDA | ENCERRADA
```

## Regras de negócio

| # | Regra |
|---|---|
| RN01 | Só clientes publicam entregas; só entregadores se candidatam. |
| RN02 | A data da entrega não pode estar no passado e o valor deve ser maior que zero. |
| RN03 | Para se candidatar, o entregador precisa ter telefone e veículo no perfil, e CNH se o veículo for motorizado. |
| RN04 | Cada entregador tem uma candidatura por entrega, e só em entregas abertas. |
| RN05 | O entregador pode desistir enquanto a candidatura está pendente (e pode se candidatar de novo). |
| RN06 | Só o dono da entrega vê todas as candidaturas; cada entregador vê apenas a sua. |
| RN07 | O chat é só entre o cliente e aquele candidato. Conversa de candidatura recusada ou entrega cancelada fica só para leitura. |
| RN08 | Propostas de valor só valem enquanto a entrega está aberta. Ninguém aceita a própria proposta. Uma proposta nova substitui a anterior. |
| RN09 | Aceitar uma proposta registra o valor combinado, mas quem fecha o negócio é o cliente ao confirmar o candidato. |
| RN10 | Ao confirmar um candidato, a entrega é fechada uma única vez; as demais candidaturas pendentes são recusadas. Sem proposta aceita, vale o valor publicado. |
| RN11 | Só o entregador confirmado declara a entrega; só depois disso o cliente confirma o recebimento ou contesta. |
| RN12 | O cliente pode cancelar a entrega enquanto ela está aberta ou aceita (antes de o entregador confirmar a entrega). |
| RN13 | Avaliação só depois de concluída ou contestada, uma por pessoa, apenas entre quem participou. |
| RN14 | Contestações ficam no histórico do entregador; entregas concluídas e nota média aparecem no perfil dos dois. |
| RN15 | Alterar usuário, e-mail ou senha exige a senha atual. E-mail e nome de usuário são únicos. |
| RN16 | Recuperação de senha por código de 4 dígitos, válido por 15 minutos e por no máximo 5 tentativas. |
| RN17 | O currículo do entregador é visível para os clientes; CPF, CNH, e-mail e telefone não aparecem no perfil público. |

As regras são conferidas nos testes automáticos (`cd backend && npm test`). A única parte sem teste é o prazo de 15 minutos do código da RN16.

## Telas

| Tela (Figma) | Arquivo |
|---|---|
| splash screen | `src/app/index.js` |
| login / cadastrar | `src/app/(auth)/login.js`, `cadastro.js` |
| env_cod_seg / cod seg / nova_senha | `src/app/(auth)/esqueci-senha.js` |
| home + menu + logout | `src/app/(app)/home.js`, `src/components/Tela.js` |
| oportunidades | `src/app/(app)/oportunidades.js` |
| oport-exemplo, entreg-exemplo e confirmações | `src/app/(app)/entrega/[id].js` |
| Entregas | `src/app/(app)/entregas.js` |
| Chat_exemplo | `src/app/(app)/chat/[id].js` |
| Empresas / empre-exemplo | `src/app/(app)/empresas.js`, `empresa/[id].js` |
| Currículo | `src/app/(app)/curriculo.js` |
| perfil (editar dados, foto, logout) | `src/app/(app)/perfil.js` |

Telas do **cliente**, que não estavam no Figma e foram feitas no mesmo estilo:
publicar entrega (`publicar.js`), candidaturas da entrega (dentro de `entrega/[id].js`),
dados da empresa (`minha-empresa.js`) e currículo do candidato (`usuario/[id].js`).

## Banco de dados

O script completo, comentado, está em `backend/database/schema.sql`.

| Tabela | Para que serve |
|---|---|
| `usuarios` | Entregadores e clientes (dados pessoais, da conta e da empresa) |
| `entregas` | Entregas publicadas, com status, valor oferecido e valor combinado |
| `candidaturas` | Candidatura de um entregador a uma entrega (única por par) |
| `mensagens` | Chat de cada candidatura: texto, proposta de valor ou aviso do sistema |
| `curriculo_itens` | Escolaridade, experiências e contatos do entregador |
| `curriculo_arquivos` | Arquivos anexados ao currículo |
| `avaliacoes` | Nota e comentário depois da entrega |

## Rotas principais da API

| Método | Rota | Quem | Descrição |
|---|---|---|---|
| POST | `/auth/cadastro`, `/auth/login` | todos | Criar conta / entrar |
| POST | `/auth/esqueci-senha`, `/auth/verificar-codigo`, `/auth/nova-senha` | todos | Recuperar senha |
| GET/PUT | `/usuarios/me`, `/usuarios/me/conta` | logado | Perfil e dados da conta |
| POST | `/usuarios/me/foto` | logado | Foto de perfil |
| GET | `/usuarios/:id` | logado | Perfil público (currículo do entregador) |
| GET/POST/PUT/DELETE | `/curriculo`, `/curriculo/itens`, `/curriculo/arquivos` | entregador | Currículo |
| GET | `/empresas`, `/empresas/:id` | logado | Empresas e suas entregas abertas |
| POST | `/entregas` | cliente | Publicar entrega |
| GET | `/entregas/oportunidades` | logado | Entregas abertas (busca e filtro por tipo) |
| GET | `/entregas/minhas`, `/entregas/:id` | envolvidos | Minhas entregas / detalhes e candidaturas |
| POST | `/entregas/:id/candidaturas` | entregador | Candidatar-se |
| POST | `/candidaturas/:id/aceitar`, `/recusar` | cliente | Confirmar ou recusar candidato |
| POST | `/candidaturas/:id/desistir` | entregador | Retirar a candidatura |
| GET | `/candidaturas/:id` | participantes | Abrir o chat |
| POST | `/candidaturas/:id/mensagens`, `/propostas` | participantes | Enviar mensagem / proposta de valor |
| POST | `/candidaturas/propostas/:id/aceitar`, `/recusar` | outro lado | Responder proposta |
| POST | `/entregas/:id/confirmar-entrega` | entregador | "Entreguei" |
| POST | `/entregas/:id/confirmar-recebimento`, `/contestar`, `/cancelar` | cliente | Concluir, contestar ou cancelar |
| POST | `/entregas/:id/avaliacoes` | envolvidos | Avaliar |

Eventos Socket.IO: `mensagem:nova`, `mensagem:atualizada`, `mensagens:lidas`, `candidatura:nova`,
`candidatura:atualizada`, `entrega:nova`, `entrega:atualizada`, `presenca`.

## O que ainda falta

- **Envio do código por e-mail.** Hoje, em desenvolvimento, o código de recuperação aparece na própria
  tela e no terminal da API. Para produção falta ligar um serviço de e-mail (ver `TODO` em `src/routes/auth.js`).
- Mapa com a rota e localização do entregador.
- Notificações push com o app fechado (hoje os avisos chegam com o app aberto).
- Versão web para empresas, prevista no BMC.
