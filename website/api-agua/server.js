import express from 'express';
import cors from 'cors';
import routerdispositivos from './dispositivosRotas.js';
const app= express();
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

//Configuração do middleware
app.use(cors());
//Configuração das rotas da api

app.use('/api', routerdispositivos)
//Configuração das rotas do servidor
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});