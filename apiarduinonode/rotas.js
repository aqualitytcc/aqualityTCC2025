import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { obterDispositivos, adicionarDispositivo, atualizarDispositivo, removerDispositivo } from './controllers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
//rotas api
const router = express.Router();
router.use(cors());
router.use(bodyParser.json());
router.get('/dispositivos', obterDispositivos);
router.post('/dispositivos', adicionarDispositivo);
router.put('/dispositivos/:id', atualizarDispositivo);
router.delete('/dispositivos/:id', removerDispositivo);
export default router;
