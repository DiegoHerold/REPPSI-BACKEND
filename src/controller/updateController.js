const { uploadFile,listUserFiles, updateImageURLs, listUserPicture} = require('../util/googleCloudStorage'); // Função de upload
const { Storage } = require('@google-cloud/storage');
const googleCloudStorage = require('../util/googleCloudStorage');
const postagemController = require("./postagemController");
const tokenUtil = require('../util/token');
const storage = new Storage();
const bucketName = "reppsi"; 

const createPostJson = (username, profilePicture="", title, content, imageURL = '', videoURL = '', tags = []) => {
  const post = {
    username: username, // Nome do usuário
    profilePicture: profilePicture, // URL da imagem de perfil
    post: {
      title: title, // Título da postagem
      content: content, // Conteúdo da postagem
      imageURL: imageURL, // URL da imagem
      videoURL: videoURL, // URL do vídeo
      tags: tags // Tags da postagem
    },
    }
    return post;
  };

const upload = async (req, res) => {
  try {
    const { token } = req.params;
    const file = req.file;
    const title = req.body.title;
    const content = req.body.content;
    const username = req.body.username
    const userId = tokenUtil.returnIdUser(token)
    
  
    console.log("file:",file);
    console.log("title:",title)
    console.log("context:",content)
    console.log("username:",username)

    if (!file) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
    }

    // Faz o upload do arquivo
    const fileData = await uploadFile(token, file.path, file.originalname);
    const destination = `${userId}/${file.originalname}`;
    let posts = createPostJson(username,'',title,content,destination,"",);
    //criar postagem
    await postagemController.criarPost(token,posts)

    res.status(200).json({ message: 'Upload realizado com sucesso!', file: fileData });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ message: 'Erro ao fazer upload', error });
  }
};

const listFile = async (req, res) => {
  try {
    const { token } = req.params;

    // Busca os arquivos do usuário e gera URLs assinadas
    const files = await listUserFiles(token,false);
    

    res.status(200).json(files);
  } catch (error) {
    console.error('Erro ao listar arquivos:', error);
    res.status(500).json({ message: 'Erro ao listar arquivos', error });
  }
};
const listFileProfile = async (req, res) => {
  try {
    const { token} = req.params;

    // Busca os arquivos do usuário e gera URLs assinadas
    const files = await listUserPicture(token);
    

    res.status(200).json(files);
  } catch (error) {
    console.error('Erro ao listar arquivos:', error);
    res.status(500).json({ message: 'Erro ao listar arquivos', error });
  }
};

const deleteFile = async (req, res) => {
  const { filename, postId } = req.query;

  try {
    // Apaga o arquivo do bucket
    await storage.bucket(bucketName).file(filename).delete();
    console.log(`Arquivo ${filename} foi apagado do bucket ${bucketName}.`);

    await postagemController.apagarPost(postId)

    // Envia a resposta ao cliente
    res.status(200).json({
      success: true,
      message: `Postagem foi apagado.`
    });
  } catch (error) {
    console.error(`Erro ao apagar postagem`, error.message);

    // Envia o erro ao cliente
    res.status(500).json({
      success: false,
      message: `Erro ao apagar arquivo ${filename}.`,
      error: error.message,
    });
  }
};
 const updatePictureProfile= async(req,res)=>{
  const { token } = req.params;
  const file = req.file;
  const title = "perfil";
  const content = "perfil";
  const userId = tokenUtil.returnIdUser(token)
  try{
    console.log("filename:",file.originalname)
    console.log("filename:",file.path)
  await googleCloudStorage.uploadPictureProfile(token,file.path,file.originalname)

  res.status(200).json({ message: 'Upload realizado com sucesso!', file: file.path });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ message: 'Erro ao fazer upload', error });
  }

  }

module.exports = {
  upload,
  listFile,
  deleteFile,
  listFileProfile,
  updatePictureProfile
};
