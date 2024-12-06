const jwt = require('jsonwebtoken');
const secretKey = 'Pineaple';

const checkToken = async (token,id)=>{ 
    try{
        let decoded = await jwt.verify(token,secretKey);
        console.log("decoded:"+decoded);
        if(decoded){
            if(decoded.id==id) return true;
        }
        console.log("checkToken não esta passando pelo deecoded")
        return false;
    }catch(e){
        return false;
    }
}

const returnIdUser = (token) => {

    try {
        // Remover o prefixo 'Bearer' se ele estiver presente no token
        const tokenWithoutBearer = token.startsWith('Bearer ') ? token.slice(7) : token;

        // Decodificar o token usando a chave secreta
        const decoded = jwt.verify(tokenWithoutBearer, secretKey);

        // Verificar se o campo `id` está presente no token
        if (decoded && decoded.id) {
            return decoded.id;  // Retorna o ID do usuário
        } else {
            console.log("ID do usuário não encontrado no token");
            return false;
        }
    } catch (error) {
        console.error("Erro ao decodificar o token:", error);
        return false;
    }
};

const setToken = (id) => {
    return jwt.sign({ id: id }, secretKey, { expiresIn: '24h' });
};







module.exports = {
    checkToken,returnIdUser,
    setToken
};
