import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { loginUsuario, logoutUsuario } from '../controllers/usuarioControllers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const routeruser = express.Router();

//rota login e logou de usuario
routeruser.post('/login', loginUsuario);
routeruser.get('/logout',logoutUsuario)
// Configuração do diretório de arquivos estáticos
export default routeruser;