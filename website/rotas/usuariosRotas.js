import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { loginUsuario } from '../controllers/usuarioControllers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const routeruser = express.Router();

//rota login e cadastro de usuario
routeruser.post('/login', loginUsuario);

export default routeruser;