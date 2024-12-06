const db = require("./db");
const md5 = require('md5');

//registrar Psicologo e paciente ok
async function registrarUsuario(usuario) {
    console.log("Usuário a ser inserido:", JSON.stringify(usuario, null, 2));

    // Inserindo o documento no banco de dados
    return await db.insertOne("Usuarios", usuario);
}


// buscar um psicologo ok
async function buscarUsuario(User){
    console.log("buscarUsuario:"+ User)
    let user = await db.findOneId("Usuarios", User);
    console.log("user no usuario modal: "+user);
    return user;
}
//busca usuario com iduser e role
async function buscarUsuarioComRole(iduser,role){
    return await db.findOneIdUserAndRole(iduser,role);
}


// buscar um psicologo
async function buscarPsicologo(idUser){
    console.log("buscarPsicologo:"+idUser)
    let user = await db.findOneId("Usuarios", idUser);
    console.log("psicologo no usuario modal: "+user);
    return user;
}
//buscar todos psicologos  ok
async function buscarPsicologos(){
    console.log("entrou em buscarPsicologos ");
        let user = await db.findAllPsychologists("Usuarios");
        console.log("psicologos no usuario modal: ",user);
        return user;
   
}

  

// Busca um usuário por email
async function buscarUsuarioPorEmail(email) {
    console.log("buscarUsuario por email:"+email)
    let user = await db.findOneEmail("Usuarios", email);
    return user;
  }

// Função para hash da senha
function hashSenha(senha) {
    return md5(senha); // Retorna o hash da senha usando md5
  }

async function alterarUsuario(id,user){
    console.log("MODEL ALTERAR USUARIO:"+id)
    return await db.updateOne("Usuarios",user,id);
}

let excluirUsuario = async (idUser)=>{  
    return await db.deleteOne('Usuarios',idUser);   
}

async function buscarPsicologosComFiltro(filtros) {
    const dbConnection = await db.connect();
    const query = { papel: "psicologo" }; // Filtro básico para buscar apenas psicólogos

    // Aplicar filtros condicionalmente
    if (filtros.especializacao) {
        query["perfil.especialidades"] = filtros.especializacao;
    }

    if (filtros.valorMin || filtros.valorMax) {
        query["perfil.valorConsulta"] = {};
        if (filtros.valorMin) query["perfil.valorConsulta"].$gte = filtros.valorMin;
        if (filtros.valorMax) query["perfil.valorConsulta"].$lte = filtros.valorMax;
    }

    if (filtros.metodologia) {
        query["perfil.metodologia"] = filtros.metodologia;
    }

    if (filtros.data) {
        query["horariosDisponiveis"] = {
            $elemMatch: {
                $and: [
                    { data: filtros.data },
                    { horas: { $elemMatch: { disponivel: true } } }
                ]
            }
        };
    }

    // Buscar psicólogos que atendem aos filtros
    try {
        console.log("query:"+JSON.stringify(query))
        const psicologos = await dbConnection.collection('Usuarios').find(query).toArray();
        return psicologos;
    } catch (error) {
        console.error("Erro ao buscar psicólogos com filtro:", error);
        return [];
    }
}


async function atualizarDisponibilidadeSemanal(userId) {
    const dbConnection = await db.connect();
    const usuario = await dbConnection.collection('Usuarios').findOne({ _id: new ObjectId(userId) });

    if (!usuario || !usuario.profile.horariosDisponiveis) {
        console.log("Usuário ou horários não encontrados");
        return;
    }

    // Remove datas passadas
    const hoje = new Date();
    usuario.profile.horariosDisponiveis = usuario.profile.horariosDisponiveis.filter(dia => new Date(dia.data) >= hoje);

    // Adiciona novos dias ao final da semana
    const diasParaAdicionar = 7 - usuario.profile.horariosDisponiveis.length;
    for (let i = 1; i <= diasParaAdicionar; i++) {
        const novaData = new Date(hoje);
        novaData.setDate(hoje.getDate() + i);

        const novoDia = {
            data: novaData.toISOString().split('T')[0], // Formato "YYYY-MM-DD"
            horas: [
                { hora: "09:00", disponivel: true },
                { hora: "10:00", disponivel: true },
                { hora: "11:00", disponivel: true },
                { hora: "14:00", disponivel: true }
            ]
        };
        usuario.profile.horariosDisponiveis.push(novoDia);
    }

    // Atualiza o usuário no banco de dados
    await dbConnection.collection('Usuarios').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { "profile.horariosDisponiveis": usuario.profile.horariosDisponiveis } }
    );

    console.log("Disponibilidade semanal atualizada");
}

async function atualizarSenha(email, novaSenha) {
    try {
        // Busca o usuário primeiro para verificar se existe
        const usuario = await db.findOneEmail("Usuarios", email);
        if (!usuario) {
            throw new Error('Usuário não encontrado');
        }

        // Atualiza a senha do usuário
        const result = await db.updateSenha(
            "Usuarios",
            { email: email },
            { senha: novaSenha }
        );

        if (!result) {
            throw new Error('Falha ao atualizar senha');
        }

        return result;
    } catch (error) {
        console.error('Erro ao atualizar senha:', error);
        throw error;
    }
}

module.exports = {registrarUsuario,buscarUsuario,buscarUsuarioComRole,buscarPsicologo,buscarPsicologos,alterarUsuario, excluirUsuario,buscarUsuarioPorEmail, hashSenha,buscarPsicologosComFiltro, atualizarDisponibilidadeSemanal, atualizarSenha};

// const cron = require('node-cron');
// const { atualizarDisponibilidadeSemanal } = require('./path/to/yourController');

// // Agendar a função para rodar toda segunda-feira à meia-noite
// cron.schedule('0 0 * * 1', async () => {
//     console.log("Atualizando disponibilidade semanal de todos os psicólogos...");

//     // Busque todos os psicólogos
//     const psicologos = await db.collection('Usuarios').find({ role: "psychologist" }).toArray();
//     for (const psicologo of psicologos) {
//         await atualizarDisponibilidadeSemanal(psicologo._id);
//     }
//     console.log("Atualização completa.");
// });