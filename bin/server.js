require("dotenv").config(); 
const app = require("../src/api");
const path = require('path');

// Configura o caminho absoluto do arquivo de credenciais
// process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(__dirname, '../uploads/google-cloud-key.json');


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
const isProduction = process.env.NODE_ENV === "production";
const BASE_URL = isProduction
  ? process.env.BACKEND_URL // URL gerada pelo Render
  : "http://localhost:5000"; // Para desenvolvimento local

console.log(`Backend rodando em: ${BASE_URL}`);


// require("dotenv").config(); 
// const app = require("../src/api");
// const path = require('path');

// // Configura o caminho absoluto do arquivo de credenciais
// process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(__dirname, '../uploads/google-cloud-key.json');

// app.use((req,res,next)=>{
//     next();
// });
// console.log(process.env.API_PORT);
// let port = process.env.API_PORT || 3001;
// app.listen(port);

// console.log(`listening on ${port}`);