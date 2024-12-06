const multer = require('multer');
const path = require('path');

// Configuração de armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Diretório onde os arquivos serão armazenados
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Filtro de arquivos para aceitar apenas imagens e vídeos
const fileFilter = (req, file, cb) => {
  const fileTypes = /jpeg|jpg|png|gif|mp4|avi|mkv/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens e vídeos são permitidos.'));
  }
};

// Configuração do Multer
const upload = multer({
  storage,
  fileFilter,
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 },
]);

module.exports = upload;
