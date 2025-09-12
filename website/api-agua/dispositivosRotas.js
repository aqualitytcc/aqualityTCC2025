import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { obterDispositivos, adicionarDispositivo, atualizarDispositivo, removerDispositivo} from './dispositivosControllers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
//rotas api
const routerdispositivos = express.Router();
routerdispositivos.use(cors());
routerdispositivos.use(bodyParser.json());
routerdispositivos.get('/dispositivos', obterDispositivos);
routerdispositivos.post('/dispositivos', adicionarDispositivo);
routerdispositivos.put('/dispositivos/:id', atualizarDispositivo);
routerdispositivos.delete('/dispositivos/:id', removerDispositivo);
export default routerdispositivos;