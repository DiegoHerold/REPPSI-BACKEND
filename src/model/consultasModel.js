const db = require("./db");
const tokenUtil = require('../util/token');

// Criar uma nova consulta
async function criarConsulta(consulta) {
    console.log("passou por criarConsultas no consultaModel ")
    console.log("Criando nova consulta:", consulta);
    return await db.insertOne("Consultas", consulta);
}

// Buscar uma consulta por ID
async function buscarConsultaPorToken(token) {
    const iduser = tokenUtil.returnIdUser(token)
    console.log("Buscando id consulta por token:", iduser);
    
    return await db.findAllWithUserId("Consultas", iduser );
}
async function buscarConsulta(id){
    let user = await db.findOneId("Consultas", id);
    return user;
}
// Buscar todas as consultas
async function buscarConsultas() {
    console.log("Buscando todas as consultas");
    return await db.findAll("Consultas");
}

// Atualizar uma consulta
async function atualizarConsulta(id,consulta){
    return await db.updateOne("Consultas",consulta,id);
}

// Apagar uma consulta
async function apagarConsulta(consultaId) {
    console.log("Apagando consulta por ID:", consultaId);
    return await db.deleteOne("Consultas", consultaId);
}
async function apagarConsultas(consultaId,consultas) {
    console.log("Apagando todas as consultas com userId:", consultaId);
    const status = consultas =="agendada" ? { $in: ["agendada"] } :  { $in: ["concluida", "pendente", "cancelada"] };
    return await db.deleteConsultas("Consultas", consultaId,status);
  }
module.exports = {
    criarConsulta,
    buscarConsultaPorToken,
    buscarConsultas,
    buscarConsulta,
    atualizarConsulta,
    apagarConsulta,
    apagarConsultas
};
