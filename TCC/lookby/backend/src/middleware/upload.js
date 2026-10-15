// Upload de arquivos (foto de perfil e anexos do currículo).
// Os arquivos ficam na pasta backend/uploads e são servidos em /uploads/<arquivo>.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { AppError } = require('../errors');

const PASTA = path.resolve(__dirname, '../../', process.env.UPLOADS_DIR || 'uploads');
fs.mkdirSync(PASTA, { recursive: true });

const IMAGENS = ['.jpg', '.jpeg', '.png', '.webp'];
const DOCUMENTOS = [...IMAGENS, '.pdf', '.doc', '.docx'];

function criar(extensoes, limiteMb) {
  return multer({
    storage: multer.diskStorage({
      destination: PASTA,
      // Nome aleatório: evita sobrescrever arquivos e nomes maliciosos
      filename: (_req, file, cb) =>
        cb(null, crypto.randomBytes(12).toString('hex') + path.extname(file.originalname).toLowerCase()),
    }),
    limits: { fileSize: limiteMb * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (extensoes.includes(ext)) return cb(null, true);
      cb(new AppError(`Tipo de arquivo não permitido. Use: ${extensoes.join(', ')}`, 400));
    },
  });
}

function removerArquivo(url) {
  if (!url || !url.startsWith('/uploads/')) return;
  fs.rm(path.join(PASTA, path.basename(url)), { force: true }, () => {});
}

module.exports = {
  PASTA,
  uploadFoto: criar(IMAGENS, 5).single('foto'),
  uploadDocumento: criar(DOCUMENTOS, 8).single('arquivo'),
  removerArquivo,
};
