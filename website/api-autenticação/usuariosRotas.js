import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { loginUsuario, logoutUsuario } from './usuarioControllers.js';
const routeruser = express.Router();
//rota login e logou de usuario
routeruser.post('/login', loginUsuario);
routeruser.get('/logout',logoutUsuario)
// Configuração do diretório de arquivos estáticos
export default routeruser;