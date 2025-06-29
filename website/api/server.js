import express from 'express';
import cors from 'cors';
import routerdispositivos from './rotas/dispositivosRotas.js';
import routeruser from './rotas/usuariosRotas.js';
import { autenticar } from './midlewares.js';
import {engine} from 'express-handlebars';
import { fileURLToPath } from 'url';
import path from 'path';
import session  from 'express-session';
import { obterDispositivos } from './controllers/dispositivosControllers.js';


//Configuração do caminho para o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app= express();
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(session({
    secret: 'qwerty',
    resave: false,
    saveUninitialized: false,
    cookie:{
        maxAge: 60 * 60 * 1000
    }
}))
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
//Configuração das rotas da api

app.use('/api', routeruser, routerdispositivos);

//Dashboard
app.get('/dashboard', autenticar, async(req, res) => {
    const dispositivos=await obterDispositivos();
    res.render('dashboard',{layout:'main',usuario: req.session.usuario, quantDispositivos: dispositivos.length});
});
//Configuração das rotas do servidor
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});