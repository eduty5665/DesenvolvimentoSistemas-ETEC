-- ============================================================
-- LookBy entregas — Script de criação do banco de dados (SQLite)
-- Executado automaticamente pela API quando o banco ainda não existe.
-- ============================================================

-- Usuários do app. tipo = ENTREGADOR (faz entregas) ou CLIENTE (empresa/pessoa que publica entregas)
CREATE TABLE IF NOT EXISTS usuarios (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo              TEXT    NOT NULL CHECK (tipo IN ('ENTREGADOR', 'CLIENTE')),
  email             TEXT    NOT NULL UNIQUE,
  senha_hash        TEXT    NOT NULL,
  usuario           TEXT    NOT NULL UNIQUE,     -- nome de usuário (apelido)
  nome              TEXT    NOT NULL,            -- nome da pessoa ou da empresa
  data_nascimento   TEXT,                        -- AAAA-MM-DD
  cpf               TEXT,
  cnh               TEXT,                        -- entregador
  telefone          TEXT,
  telefone2         TEXT,
  foto_url          TEXT,
  veiculo           TEXT,                        -- MOTO | CARRO | BICICLETA | VAN | CAMINHAO
  placa             TEXT,
  cnpj              TEXT,                        -- cliente (empresa)
  localizacao       TEXT,                        -- cliente: endereço/cidade da empresa
  nicho             TEXT,                        -- cliente: ramo de atuação
  historia          TEXT,                        -- cliente: história da empresa
  codigo_hash       TEXT,                        -- recuperação de senha
  codigo_expira_em  TEXT,
  codigo_tentativas INTEGER NOT NULL DEFAULT 0,
  visto_em          TEXT,                        -- última vez online
  criado_em         TEXT    NOT NULL
);

-- Entregas publicadas pelos clientes (aparecem em "Oportunidades" enquanto ABERTA)
-- status: ABERTA -> ACEITA -> ENTREGUE -> CONCLUIDA | CONTESTADA     (ou CANCELADA)
CREATE TABLE IF NOT EXISTS entregas (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id         INTEGER NOT NULL REFERENCES usuarios(id),
  entregador_id      INTEGER REFERENCES usuarios(id),   -- preenchido quando o cliente confirma um candidato
  titulo             TEXT    NOT NULL,
  carga              TEXT    NOT NULL,                  -- descrição do que será transportado
  tipo_carga         TEXT    NOT NULL,
  data               TEXT    NOT NULL,                  -- AAAA-MM-DD
  horario_retirada   TEXT    NOT NULL,                  -- HH:MM
  horario_entrega    TEXT    NOT NULL,                  -- HH:MM
  endereco_retirada  TEXT    NOT NULL,
  cidade_retirada    TEXT    NOT NULL,
  endereco_entrega   TEXT    NOT NULL,
  cidade_entrega     TEXT    NOT NULL,
  observacoes        TEXT,
  valor              REAL    NOT NULL,                  -- valor oferecido pelo cliente
  valor_combinado    REAL,                              -- valor final acordado
  status             TEXT    NOT NULL DEFAULT 'ABERTA',
  motivo_contestacao TEXT,
  criado_em          TEXT    NOT NULL,
  atualizado_em      TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_entregas_status ON entregas(status);

-- Candidatura de um entregador a uma entrega. Cada candidatura tem o seu chat.
-- status: PENDENTE -> ACEITA | RECUSADA | DESISTIU
CREATE TABLE IF NOT EXISTS candidaturas (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  entrega_id      INTEGER NOT NULL REFERENCES entregas(id) ON DELETE CASCADE,
  entregador_id   INTEGER NOT NULL REFERENCES usuarios(id),
  status          TEXT    NOT NULL DEFAULT 'PENDENTE',
  valor_combinado REAL,                                 -- valor negociado no chat (se houver)
  criado_em       TEXT    NOT NULL,
  atualizado_em   TEXT    NOT NULL,
  UNIQUE (entrega_id, entregador_id)
);

-- Mensagens do chat entre o cliente e o candidato
-- tipo: TEXTO | PROPOSTA (valor) | SISTEMA (avisos automáticos)
CREATE TABLE IF NOT EXISTS mensagens (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  candidatura_id  INTEGER NOT NULL REFERENCES candidaturas(id) ON DELETE CASCADE,
  autor_id        INTEGER NOT NULL REFERENCES usuarios(id),
  tipo            TEXT    NOT NULL DEFAULT 'TEXTO',
  texto           TEXT    NOT NULL,
  valor_proposta  REAL,
  status_proposta TEXT,                                 -- PENDENTE | ACEITA | RECUSADA | SUBSTITUIDA | ENCERRADA
  lida_em         TEXT,
  criado_em       TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mensagens_candidatura ON mensagens(candidatura_id);

-- Currículo do entregador: escolaridade, experiências e contatos
CREATE TABLE IF NOT EXISTS curriculo_itens (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  secao      TEXT    NOT NULL CHECK (secao IN ('ESCOLARIDADE', 'EXPERIENCIA', 'CONTATO')),
  titulo     TEXT    NOT NULL,   -- curso, cargo ou tipo de contato
  subtitulo  TEXT,               -- instituição, empresa ou o contato em si
  periodo    TEXT,
  descricao  TEXT
);

-- Arquivos anexados ao currículo (CNH, certificados...)
CREATE TABLE IF NOT EXISTS curriculo_arquivos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome       TEXT    NOT NULL,
  url        TEXT    NOT NULL,
  tamanho    INTEGER,
  criado_em  TEXT    NOT NULL
);

-- Avaliação entre cliente e entregador depois da entrega
CREATE TABLE IF NOT EXISTS avaliacoes (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  entrega_id   INTEGER NOT NULL REFERENCES entregas(id) ON DELETE CASCADE,
  avaliador_id INTEGER NOT NULL REFERENCES usuarios(id),
  avaliado_id  INTEGER NOT NULL REFERENCES usuarios(id),
  nota         INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario   TEXT,
  criado_em    TEXT    NOT NULL,
  UNIQUE (entrega_id, avaliador_id)
);
