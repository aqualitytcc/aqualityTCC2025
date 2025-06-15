import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import router from './rotas.js';

const app= express();
app.use(cors());
app.use(bodyParser.json());
app.use('/api', router);

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});