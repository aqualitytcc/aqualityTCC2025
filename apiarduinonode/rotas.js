import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { obterDispositivos} from './controllers.js';

const router = express.Router();
router.use(cors());
router.use(bodyParser.json());

router.get('/dispositivos', obterDispositivos);/*
router.post('/dispositivos', adicionarDispositivo);
router.put('/dispositivos/:id', atualizarDispositivo);
router.delete('/dispositivos/:id', removerDispositivo);*/
export default router;
