const tokenUtil = require('../util/token');  // Certifique-se de que isso esteja correto
const usuarioModel = require('../model/usuarioModal');
const md5 = require('md5');

exports.get = async()=>{
  return await usuarioModel.buscarPsicologos();
}
exports.filtrar = async (filtros) =>{

    try {
        return await usuarioModel.buscarPsicologosComFiltro(filtros);
    } catch (error) {
        console.error(error)
    }
}

exports.usuarioAutenticado = async()=> {
  return localStorage.getItem("token") != undefined ? true : false
  // return typeof localStorage.getItem("token")
};
exports.usuario = async(dados)=>{
  console.log("token controller:",dados.token)
  console.log("token controller:",dados.role)
  const iduser = tokenUtil.returnIdUser(dados.token);
  const user = await usuarioModel.buscarUsuarioComRole(iduser,dados.role);
  return user;
}
exports.registrarUsuario = async (req, res) => {
  const { nome,email, senha, papel,crp, perfil = {} } = req.body;
  var resp = await usuarioModel.buscarUsuarioPorEmail(email);
  console.log("tem ja esse email?:", resp);

  if (resp) {
    return res.status(400).send({ message: 'Email já cadastrado' });
  } else {
    // Definindo `usuarioPadrao` completo com base no `papel`
    const usuarioPadrao = papel === "psicologo"
      ? {
          nome: nome,
          email: email,
          senha: md5(senha),
          papel: papel,
          crp: crp ,
          perfil: {
            especialidades: perfil.especialidades || ["Terapia Cognitivo-Comportamental"],
            valorConsulta: perfil.valorConsulta || 120,
            metodologia: perfil.metodologia || "online",
            datasDisponiveis: perfil.datasDisponiveis || ["2024-11-16", "2024-11-20", "2024-11-22"],
            descricao: perfil.descricao || "Psicólogo especializado em TCC",
            idade:perfil.idade || "",
            localizacao: perfil.localizacao || "",
            foto: perfil.foto || ""
          },
          horariosDisponiveis: perfil.horariosDisponiveis || [
            {
              data: "2024-11-16",
              horas: [
                { hora: "09:00", disponivel: true },
                { hora: "10:00", disponivel: true },
                { hora: "11:00", disponivel: true },
                { hora: "14:00", disponivel: true },
                { hora: "15:00", disponivel: true },
                { hora: "16:00", disponivel: true },
                { hora: "17:00", disponivel: true }
              ]
            },
            {
              data: "2024-11-17",
              horas: [
                { hora: "09:00", disponivel: true },
                { hora: "10:00", disponivel: true },
                { hora: "11:00", disponivel: true },
                { hora: "14:00", disponivel: true },
                { hora: "15:00", disponivel: true },
                { hora: "16:00", disponivel: true },
                { hora: "17:00", disponivel: true }
              ]
            }
          ],
          avaliacoes: perfil.avaliacoes || {
            avaliacaoMedia: 5,
            avaliacoes: []
          },
          informacoesContato: {
            telefone: perfil.informacoesContato?.telefone || "(11) 1234-5678",
            email: perfil.informacoesContato?.email || "tatiane1313@gmail.com",
            endereco: perfil.informacoesContato?.endereco || "Rua Exemplo, 123, São Paulo - SP"
          },
          criadoEm: { "$date": new Date().toISOString() },
          atualizadoEm: { "$date": new Date().toISOString() }
        }
      : {
          nome: nome,
          email: email,
          senha: md5(senha),
          papel: "paciente",
          perfil: {
            bio: perfil.bio || "os erros te ensinam a como seguir",
            preferencias: {
              interessesEspecialidade: perfil.preferencias?.interessesEspecialidade || ["Terapia Cognitivo-Comportamental"],
              metodologiaConsulta: perfil.preferencias?.metodologiaConsulta || "online",
              faixaPreco: {
                minimo: perfil.preferencias?.faixaPreco?.minimo || 50,
                maximo: perfil.preferencias?.faixaPreco?.maximo || 150
              },
              datasPreferidas: perfil.preferencias?.datasPreferidas || []
            },
            idade: perfil.idade || "",
            localizacao: perfil.localizacao || "",
            foto: perfil.foto || ""
          },
          informacoesContato: {
            telefone: perfil.informacoesContato?.telefone || "",
            email: perfil.informacoesContato?.email || "",
            endereco: perfil.informacoesContato?.endereco || ""
          },
          criadoEm: { "$date": new Date().toISOString() },
          atualizadoEm: { "$date": new Date().toISOString() }
        };

    try {
      // Registra o usuário no banco de dados com os dados completos

      let resp = await usuarioModel.registrarUsuario(usuarioPadrao);

      console.log("registrar usuario:", resp);
      return res.status(201).json({
        success: true,
        message: "Usuário registrado com sucesso",
      });
      
    }  catch (erro) {
      console.error("Detalhes do erro:", erro);
      return res.status(500).send({ mensagem: 'Erro no servidor', erro: erro.message || erro });
    }
  }
};




//--------------------------------------------------------
//ESTRUTURA PARA MANDAR NO req.body PARA CADASTRAR USUARIO
// Paciente
// {
//   "nome": "Raymundo",
//   "email": "raymundo@gmail.com",
//   "senha": "a9570769439fa309f0f8cce97f2d80ba",
//   "papel": "paciente",
//   "perfil": {
//     "bio": "os erros te ensinam a como seguir",
//     "preferencias": {
//       "interessesEspecialidade": ["Terapia Cognitivo-Comportamental", "Psicologia Infantil"],
//       "metodologiaConsulta": "online",
//       "faixaPreco": {
//         "minimo": 50,
//         "maximo": 150
//       },
//       "datasPreferidas": ["Seg", "Ter"]
//     },
//     "idade": 22,
//     "localizacao": "taquara",
//     "foto": ""
//   }
// }
// Psicologo
// {
//   "nome": "Dr. João Silva",
//   "email": "joao.silva@psicologia.com",
//   "senha": "joaosilvia",
//   "papel": "psicologo",
//   "perfil": {
//     "especialidades": ["Terapia Cognitivo-Comportamental", "Psicologia Infantil"],
//     "valorConsulta": 120,
//     "metodologia": "online",
//     "datasDisponiveis": ["2024-11-16", "2024-11-20", "2024-11-22"],
//     "descricao": "Psicólogo especializado em TCC e Psicologia Infantil, com 10 anos de experiência.",
//     "idade": 26,
//     "localizacao": "taquara",
//     "foto": ""
//   }
// }

// --------------------------------------------------------

// exports.registrarUsuario = async (req, res) => {
//   const { nome, email, senha, role , profile = {} } = req.body;
//   var resp = await usuarioModel.buscarUsuarioPorEmail(email); 
//   console.log("tem ja esse email?:",resp);
//   if(resp){
//     return res.status(400).send({ message: 'Email ja cadastrado' });
//   }
//   else{
    

//   // Definindo `profile` padrão para diferentes `roles`
//   const defaultProfile = role === "psychologist"
//     ? {
//         bio: profile.bio || "",
//         specialties: profile.specialties || [],
//         experience: profile.experience || 0,
//         location: profile.location || "",
//         photo: profile.photo || ""
//       }
//     : {
//         preferencies: profile.preferences || []
//       };

//   try {
//     // Registra o usuário no banco de dados com os dados completos
//     let resp = await usuarioModel.registrarUsuario(
//       nome,
//       email,
//       md5(senha),
//       role,
//       defaultProfile,
//       new Date(),
//       new Date()
//     );

//     console.log("registrar usuario:", resp);

//     if (resp.insertedId) {
//       // Gere o token JWT após o cadastro do usuário
//       const token = tokenUtil.setToken(resp.insertedId);
//       return res.status(201).send({
//         success: true,
//         message: 'Cadastro bem-sucedido',
//         usuario: {
//           nome: nome,
//           email: email,
//           role: role,
//           profile: defaultProfile
//         },
//         token: token
//       });
//     } else {
//       return res.status(400).send({ message: 'Erro ao cadastrar usuário' });
//     }
//   } catch (error) {
//     return res.status(500).send({ message: 'Erro no servidor', error });
//   }
//   }
  
// };

// Login do Usuário
exports.loginUsuario = async (req, res) => {
  const { email, senha } = req.body;

  // Verifica se o email e a senha estão ok
  if (!email || !senha) {
    return res.status(400).send({ message: 'Email e senha são obrigatórios' });
  }

  try {
    // Busca o usuário pelo email
    const usuario = await usuarioModel.buscarUsuarioPorEmail(email);

    if (!usuario) {
      return res.status(401).send({ message: 'Email não cadastrado' });
    }

    console.log("senha do modal:"+senha);
    console.log("senha do mongodb:"+usuario.senha);
    console.log("role do mongodb:"+usuario.papel);

    console.log("senha do modal:"+md5(senha));
    //verifica a senha 
    if (usuario.senha !== senha ) {
      return res.status(401).send({ message: 'Email ou senha incorretos' });
    }

    // Cria o token do usuário
    console.log("usuario com o id:"+usuario._id)
    const token = tokenUtil.setToken(usuario._id);
    console.log("Login Usuario, token gerado: " + token);
    const role = usuario.papel;
    // Retorna o usuário e o token em um objeto
    return res.status(200).send({
      success: true,
      message: 'Login bem',
      usuario: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
      },
      role: role,
      token: token
    });
    
  } catch (error) {
    console.error("Erro no login:", error);  // Log do erro para diagnóstico
    return res.status(500).send({ message: 'Erro no servidor', error });
  }
};


exports.atualizarUsuario = async (token, perfilAtualizado) => {
  console.log("token:", token);
  console.log("perfilAtualizado:", perfilAtualizado);
  idUser = tokenUtil.returnIdUser(token);
  console.log("idUser:", idUser)
  ;
  let usuario = await usuarioModel.buscarUsuario(idUser);
  console.log("usuario:", JSON.stringify(usuario));

  if (!usuario) {
    return { msg: "Usuário não encontrado", timestamp: Date.now() };
  }

  // Atualizar apenas os campos dentro de perfil
  usuario= { ...usuario, ...perfilAtualizado };
  usuario.atualizadoEm = new Date();

  // Enviar o objeto atualizado ao model para salvar no banco
  if (await usuarioModel.alterarUsuario(idUser, usuario)) {
    return { msg: "OK", timestamp: Date.now() };
  } else {
    return { msg: "Erro ao atualizar usuário", perfil: perfilAtualizado };
  }
};






// Sair do Chat 
exports.apagarConta = async (iduser) => {
  try {
    let user = await usuarioModel.buscarUsuario(iduser);
    if (user) {
      let resp = await usuarioModel.excluirUsuario(user._id);
      if (resp.deletedCount) {
        return { msg: 'Ok, apagou usuario', timestamp: Date.now() };
      }
    }
    return false;
  } catch (error) {
    console.log("Erro ao apagar usuario:", error);
    return false;
  }
};



// import requests
// from bs4 import BeautifulSoup

// def verificar_crp(dados):
//     url = 'https://cadastro.cfp.org.br/'
//     payload = {
//         'nome': dados.get('nome', ''),
//         'crp': dados.get('crp', ''),
//         'estado': dados.get('estado', ''),
//         'submit': 'Buscar'
//     }
//     response = requests.post(url, data=payload)
//     soup = BeautifulSoup(response.text, 'html.parser')
    
//     resultados = soup.find_all('div', class_='resultado')
//     for resultado in resultados:
//         nome = resultado.find('h3').text
//         crp = resultado.find('p', class_='crp').text
//         print(f'Nome: {nome}, CRP: {crp}')

// # Exemplo de uso
// dados = {
//     "nome": "João Silva",
//     "crp": "06/12345-SP",
//     "estado": "SP"
// }
// verificar_crp(dados)
