import express from 'express';
import cors from 'cors';
import routerusuario from './usuariosRotas.js';
const app= express();
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

//Configuração do middleware
app.use(cors());
//Configuração das rotas da api

app.use('/api', routerusuario)
//Configuração das rotas do servidor
app.listen(3002, () => {
    console.log('Server is running on port 3002');
});