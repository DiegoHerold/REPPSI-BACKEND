const { ObjectId } = require('mongodb');
const consultasModel = require('../model/consultasModel'); // Certifique-se de que o modelo de consultas está configurado corretamente
const tokenUtil = require('../util/token');


exports.get = async (token) => {
  console.log("token:", token);
    return await consultasModel.buscarConsultaPorToken(token);
}



exports.criarConsulta = async (req, res) => {
    try {
      console.log("Corpo da requisição (req.body):", req.body);
  
      // Desestruturação do corpo da requisição
      const { token, psychologistId,namePsychologist, duration, appointmentType,status, price,date, paymentMethod,paymentStatus, notes } = req.body;
      let userId = tokenUtil.returnIdUser(token);
  
      // Verifica se os dados obrigatórios estão presentes
      if (!userId|| !psychologistId  || !duration || !appointmentType) {
        return res.status(400).send({ message: 'Campos obrigatórios ausentes' });
      }
  
      const newConsulta = {
        userId: new ObjectId(userId),
        psychologistId:new ObjectId(psychologistId),
        namePsychologist,
        duration,
        appointmentType,
        status: status || "agendada", // Define o status inicial como "agendado"
        price,
        date,
        paymentMethod,
        paymentStatus: paymentStatus || "pendente", // Define o status de pagamento inicial como "pendente"
        notes: notes || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
  
      console.log("Consulta a ser criada:", newConsulta);
  
      // Inserção da nova consulta
      const consulta = await consultasModel.criarConsulta(newConsulta);
      console.log("Resultado da criação da consulta:", consulta);
  
      // Verifica se a consulta foi criada com sucesso
      if (consulta && consulta.insertedId) {
        return res.status(201).send({
          success: true,
          message: 'Consulta criada com sucesso',
          consulta,
        });
      } else {
        return res.status(400).send({ message: 'Erro ao criar consulta' });
      }
    } catch (error) {
      console.error("Erro ao criar consulta:", error);
      return res.status(500).send({ message: 'Erro no servidor', error });
    }
  };
  

// Atualizar uma consulta
exports.updateConsulta = async (idConsulta, updates) => {
    console.log("idConsulta:", idConsulta);
    console.log("Atualizações:", updates.status);
    idConsulta = new ObjectId(idConsulta);
    // Buscar a consulta pelo id
    let consulta = await consultasModel.buscarConsulta(idConsulta);
    console.log("Consulta encontrada:", consulta);
  
    if (!consulta) {
      return { msg: "Consulta não encontrada", timestamp: Date.now() };
    }
    // if(updates=="cancelada"){
    //   updates= {status:"cancelada"}
    // }
  
    // Atualizar os campos da consulta
    consulta = { ...consulta, ...updates , updatedAt: new Date() };
  
    console.log("Consulta mudada:", consulta);
    const result = await consultasModel.atualizarConsulta(idConsulta,consulta);
  
    if (result && result.modifiedCount > 0) {
      return { msg: "Consulta atualizada com sucesso", consulta, timestamp: Date.now() };
    } else {
      return { msg: "Erro ao atualizar consulta", consulta: updates };
    }
  };
  
  
//   exports.atualizarConsulta = async (consultaId,status) => {
//     console.log("consultaid:"+consultaId)
//   try {
//     const deletedConsulta = await consultasModel.atualizarConsulta(consultaId,status);
//     if (deletedConsulta.deletedCount) 
//         return true;
//     else
//         return false
//   } catch (error) {
//     return res.status(500).send({ message: 'Erro no servidor', error });
//   }
// };

// Apagar uma consulta
exports.deleteConsulta = async (consultaId) => {
    console.log("consultaid:"+consultaId)
  try {
    const deletedConsulta = await consultasModel.apagarConsulta(consultaId);
    if (deletedConsulta.deletedCount) 
        return true;
    else
        return false
  } catch (error) {
    return res.status(500).send({ message: 'Erro no servidor', error });
  }
};

exports.deleteTodasConsultas = async (consultaId,consultas) => {
    console.log("Consulta ID para exclusão:", consultaId);
    console.log("tipo de consulta para exclusão:", consultas);
    try {
      const deletedConsulta = await consultasModel.apagarConsultas(consultaId,consultas);
      if (deletedConsulta && deletedConsulta.deletedCount > 0) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.log("Erro ao deletar consultas:", error);
      return false;
    }
  };
  
exports.buscarHistorico = async (token) => {
    try {
        const userId = tokenUtil.returnIdUser(token);
        if (!userId) {
            throw new Error('Usuário não identificado');
        }

        console.log("Buscando histórico para userId:", userId);
        return await consultasModel.buscarConsultasPorUsuario(userId);
    } catch (error) {
        console.error("Erro ao buscar histórico:", error);
        throw error;
    }
};
  
