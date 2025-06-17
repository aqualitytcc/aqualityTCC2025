import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import router from './rotas.js';
import {engine} from 'express-handlebars';
import { fileURLToPath } from 'url';
import path from 'path';
//Configuração do caminho para o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app= express();
//Configuração do diretório de arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'index.html'));
});

//Configuração do Handlebars
app.engine('handlebars', engine({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

//Configuração do middleware
app.use(cors());
app.use(bodyParser.json());
//Configuração das rotas da api

app.use('/api', router);


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});