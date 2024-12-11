const { Storage } = require('@google-cloud/storage');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const utilToken = require("./token");
const dbModel = require("../model/db");
const usuarioModel = require("../model/usuarioModal")
const { usuario } = require('../controller/usuarioController');

// Configurações do Google Cloud Storage
const storage = new Storage({
  credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON),
});
// const storage = new Storage();
const bucketName = 'reppsi'; // Substitua pelo nome do seu bucket

// Configurações do MongoDB
let singleton;

async function connectToDb() {
  if (singleton) return singleton;

  const client = new MongoClient(process.env.DB_HOST);
  await client.connect();

  singleton = client.db(process.env.DB_DATABASE);
  console.log('Conectado ao MongoDB');
  return singleton;
}

// Função para enviar arquivos ao bucket
const uploadFile = async (token, filePath, originalName) => {
  try {
    const userId = utilToken.returnIdUser(token)
    const user = await dbModel.findOneId("Usuarios",userId)
    console.log("nome capturado no upload da imagem:",user.nome)
    const username = user.nome;
    const db = await connectToDb();

    // Define o caminho do arquivo no bucket
    const destination = `${userId}/${originalName}`;
    await storage.bucket(bucketName).upload(filePath, { destination });

    // Salva os metadados no MongoDB
    const fileData = {
      userId,
      username,
      filename: destination,
      uploadedAt: new Date(),
    };

    await db.collection('files').insertOne(fileData);

    console.log(`${filePath} foi enviado para o bucket ${bucketName}`);
    return fileData;
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    throw error;
  }
};

// Função para gerar uma URL assinada para um arquivo
const generateSignedUrl = async (filename) => {
  try {
    if (!filename) {
      console.log('Nome do arquivo não fornecido');
      return null;
    }

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filename);

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutos
    });

    return url;
  } catch (error) {
    console.error('Erro ao gerar URL assinada:', error);
    return null;
  }
};
const listUserFiles = async (token, key) => {
  try {
    let files;

    if (token) {
      const userId = new ObjectId(utilToken.returnIdUser(token));
      files = await dbModel.findAllPostsForOneUserId("Postagens", userId);
    } else {
      files = await dbModel.findAllWithFilter("Postagens", key);
    }
    files = Array.isArray(files) ? files : [];
    const filesWithSignedUrls = await Promise.all(
      files.map(async (file) => ({
        ...file,
        posts: {
          ...file.posts, // Mantém o conteúdo original de posts
          imageURL: file.posts.imageURL
            ? await generateSignedUrl(file.posts.imageURL) // Atualiza somente imageURL
            : file.posts.imageURL, // Mantém o valor atual se não existir
        },
      }))
    );

    return filesWithSignedUrls;
  } catch (error) {
    console.error("Erro ao listar arquivos:", error);
    throw error;
  }
};

const listPsychologistFiles = async (filtro) => {
  try {
    let files;

    if (filtro) {
      files = await usuarioModel.buscarPsicologosComFiltro(filtro);
    } else {
      files = await usuarioModel.buscarPsicologos()
    }

    const filesWithSignedUrls = await Promise.all(
      files.map(async (file) => ({
        ...file,
        perfil: {
          ...file.perfil, // Mantém o conteúdo original de posts
          foto: file.perfil.foto
            ? await generateSignedUrl(file.perfil.foto) // Atualiza somente foto
            : file.perfil.foto, // Mantém o valor atual se não existir
        },
      }))
    );

    return filesWithSignedUrls;
  } catch (error) {
    console.error("Erro ao listar arquivos:", error);
    throw error;
  }
};

const uploadPictureProfile = async (token, filePath, originalName) => {
  try {
    const userId = utilToken.returnIdUser(token)
    const user = await dbModel.findOneId("Usuarios",userId)
    console.log("nome capturado no upload da imagem:",user.nome)
    const username = user.nome;

    // Define o caminho do arquivo no bucket
    const destination = `${userId}/${originalName}`;
    await storage.bucket(bucketName).upload(filePath, { destination });

    let usuario = await dbModel.updateOne("Usuarios",{'perfil.foto':destination},userId)

    console.log(`${filePath} foi enviado para o bucket ${bucketName}`);
    return usuario;
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    throw error;
  }
};
const listUserPicture = async (token) => {
  try {

      const userId = new ObjectId(utilToken.returnIdUser(token));
      let usuario = await dbModel.findOneId("Usuarios", userId);
      if (!usuario) {
        throw new Error("Nenhum usuario encontrado para para contnuar.");
      }
    
      // Atualiza o campo imageURL com a URL assinada
      const fileWithSignedUrl = {
        ...usuario,
        perfil: {
          ...usuario.perfil, // Preserva as propriedades existentes em posts
          foto: await generateSignedUrl(usuario.perfil.foto) // Atualiza imageURL
           
        },
      };

    return fileWithSignedUrl;
  } catch (error) {
    console.error("Erro ao listar arquivos:", error);
    throw error;
  }
};

// Função para listar arquivos de um usuário com URLs assinadas
const updateImageURLs = async (postagens) => {
  try {
    if (!postagens || postagens.length === 0) {
      console.log("Nenhuma postagem para processar");
      return [];
    }

    console.log(`Processando URLs para ${postagens.length} postagens`);

    const postagensAtualizadas = await Promise.all(
      postagens.map(async (postagem) => {
        try {
          // if (!postagem?.posts?.imageURL) {
          //   return postagem; // Retorna a postagem sem alterações se não houver imageURL
          // }

          const signedUrl = await generateSignedUrl(postagem.posts.imageURL);

          return {
            ...postagem,
            posts: {
              ...postagem.posts, // Preserva outras propriedades de posts
              imageURL: signedUrl, // Atualiza somente imageURL
            },
          };
        } catch (error) {
          console.error("Erro ao processar URL da postagem:", error);
          return postagem; // Retorna a postagem sem alterações em caso de erro
        }
      })
    );

    console.log("URLs processadas com sucesso");
    return postagensAtualizadas;
  } catch (error) {
    console.error("Erro ao atualizar URLs:", error);
    return postagens; // Retorna postagens sem alterações em caso de erro geral
  }
};

module.exports = {
  uploadFile,
  updateImageURLs,
  generateSignedUrl,
  listUserFiles,
  listPsychologistFiles,
  listUserPicture,
  uploadPictureProfile
};
