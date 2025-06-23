import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import routerdispositivos from './rotas/dispositivosRotas.js';
import routeruser from './rotas/usuariosRotas.js';
import {engine} from 'express-handlebars';
import { fileURLToPath } from 'url';
import path from 'path';


//Configuração do caminho para o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app= express();
app.use(express.urlencoded({ extended: true }))
//Configuração do diretório de arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'index.html'));
});

//Configuração do Handlebars
app.engine('handlebars', engine({
    layoutsDir: path.join(__dirname, 'views', 'layouts')
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

//Configuração do middleware
app.use(cors());
app.use(bodyParser.json());
//Configuração das rotas da api

app.use('/api', routeruser, routerdispositivos);

//Dashboard
app.get('/dashboard', (req, res) => {
    res.render('dashboard');
});
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});