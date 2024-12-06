const express = require('express');
const cors = require('cors'); 
const path = require('path');
const app = express();


const router = express.Router();
const multer = require('multer'); // Para lidar com upload de arquivos
const upload = multer({ dest: 'uploads/' }); // Diretório temporário
// Middleware CORS - permite que o frontend acesse a API
// const PORT = process.env.API_PORT || 3000;



app.use(cors({
    origin: [process.env.FRONTEND_URL||'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
app.use(express.urlencoded({extended  : true}));
app.use(express.json());

const usuarioController = require("./controller/usuarioController");
const consultasController = require("./controller/consultasController")
const postagemController = require("./controller/postagemController");
const updateContoller = require("./controller/updateController")
// const videoChamadaController = require('./controller/videoChamadaController');
const passwordResetController = require('./controller/passwordResetController');

// app.use(express.static(path.join(__dirname, '..', '..', 'Frontend', 'build')));


// Rota para upload de arquivos
app.post('/upload/:token', upload.single('file'), updateContoller.upload); // Rota de upload
app.get('/files/:token', updateContoller.listFile); // Rota de listagem
app.delete('/file/delete', updateContoller.deleteFile); // Rota de apagar
//Rota upload foto de perfil
app.post('/upload/profile/picture/:token', upload.single('file'), updateContoller.updatePictureProfile); // Rota de upload
app.get('/files/profile/picture/:token', updateContoller.listFileProfile); // Rota de listagem


//cria sala e retorna os links de acesso
// app.post('/video/create-session', videoChamadaController.gerarTokenVideoChamada);
// app.post('/video/end-session', videoChamadaController.encerrarVideoChamada);
// app.get('/video/check-session/:channelName', videoChamadaController.checkSessionStatus);



// começo de rotas
app.get('/sobre', (req, res) => {
    res.status(200).send({
        nome: "REPPSI",
        descrição: "Rede de Profissionais de Psicologia",
        versão: "1.0",
        autor: "Diego Herold"
    });
});

// Login e Cadastro
app.post('/cadastrar', usuarioController.registrarUsuario);
app.post('/login', usuarioController.loginUsuario);

// Middleware de autenticação para rotas protegidas
// app.use(authMiddleware);

// Rotas do Dashboard
app.get("/dashboard/get", async (req, res) => {
    let resp = await usuarioController.get();
    console.log("mostrando psicologos no home:", resp);
    res.status(200).send(resp);
});
//traz psicologos com filtro
app.post("/usuario/filtrar", async (req, res) => { 
    try {
        const resp = await usuarioController.filtrar(req.body); // Passa `filtros` para a função `filtrar`
        console.log("Resultado da filtragem:", resp);
        res.status(200).send(resp);
    } catch (error) {
        console.error("Erro ao filtrar usuários:", error);
        res.status(500).send({ message: "Erro ao filtrar usuários", error });
    }
});
//
app.post("/usuario", async (req, res) => { 
    try {
        const resp = await usuarioController.usuario(req.body); // Passa `filtros` para a função `filtrar`
        console.log("Resultado da filtragem:", resp);
        res.status(200).send(resp);
    } catch (error) {
        console.error("Erro ao filtrar usuários:", error);
        res.status(500).send({ message: "Erro ao filtrar usuários", error });
    }
});


// Atualizar usuário
app.put("/atualizar", async (req, res) => {
    let resp = await usuarioController.atualizarUsuario(req.query.token, req.body);
    console.log("atualizando :", resp);
    res.status(200).send(resp);
});

// Apagar usuário
app.delete("/usuario/apagar", async (req, res) => {
    let resp = await usuarioController.apagarConta(req.query.idUser);
    console.log("apagando :", resp);
    res.status(200).send(resp);
});

// Rotas de Consultas
// Criar consulta
app.post("/consulta/criar", async (req, res) => {
    console.log("passou rota criar consulta");
    await consultasController.criarConsulta(req, res);  // Passa `req` e `res` para o controlador
});
// Listar consultas de um usuario
app.get("/consultas/get", async (req, res) => {
    let resp = await consultasController.get(req.query.token);
    console.log("mostrando historico de consuta:", resp);
    res.status(200).send(resp);
});
// Atualizar uma consulta do usuario usuário
app.post("/consulta/atualizar", async (req, res) => {
    console.log("idConsulta:",req.query.idConsulta);
    console.log("status:",req.body.status);
    let resp = await consultasController.updateConsulta(req.query.idConsulta,req.body);
    console.log("apagando :", resp);
    res.status(200).send(resp);
});
// Apagar uma consulta do usuario usuário
app.delete("/consulta/apagar", async (req, res) => {
    let resp = await consultasController.deleteConsulta(req.query.idConsulta);
    console.log("apagando :", resp);
    res.status(200).send(resp);
});
//apagarar todas as consultas do usuario
app.delete("/consultas/apagar", async (req, res) => {
    let resp = await consultasController.deleteTodasConsultas(req.query.idUser,req.query.consultas);
    console.log("apagando :", resp);
    res.status(200).send(resp);
});

// Rotas de Postagens
// Criar Postagem
app.post("/postagem/criar", async (req, res) => {
    console.log("passou rota criar postagem");
    let resp = await postagemController.criarPost(req.query.token,req.body); 
    res.status(200).send(resp);
});
// Listar postagens de psicologo
app.get("/postagens/psicologo", async (req, res) => {
    try {
        const token = req.query.token;
        
        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token do usuário não fornecido'
            });
        }
        const postagens = await postagemController.buscarPostagensPorUsuario(token);

        return res.status(200).json({
            success: true,
            data: postagens
        });
    } catch (error) {
        console.error('Erro na rota de postagens:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar postagens',
            error: error.message
        });
    }
});
app.get("/postagens/psicologos", async (req, res) => {
    let resp = await postagemController.buscarPostagens(req.query.key);
    console.log("mostrando:", resp);
    res.status(200).send(resp);
});
// Comentarios nas Postagens
app.post("/postagem/comentario", async (req, res) => {
    console.log("passou rota atualizar consulta");
    await postagemController.adicionarComentario(req.query.idUser, req.body);
});
// Apagar uma consulta do usuario usuário
app.delete("/postagem/apagar", async (req, res) => {
    let resp = await postagemController.apagarPost(req.query.idPostagem);
    console.log("apagando :", resp);
    res.status(200).send(resp);
});

// Add these routes before your protected routes
app.post('/esqueci-senha', passwordResetController.requestPasswordReset);
app.post('/resetar-senha', passwordResetController.verifyCodeAndResetPassword);

// Configuração para servir o index.html do frontend para qualquer rota desconhecida
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'Frontend', 'build', 'index.html'));
});
// Inicializar o servidor
// app.listen(PORT, () => {
//     console.log(`Servidor rodando na porta ${PORT}`);
// });

module.exports=app;