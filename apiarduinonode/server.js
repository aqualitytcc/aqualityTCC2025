import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import router from './rotas.js';

const app= express();
app.use(cors());
<<<<<<< HEAD
app.use(bodyParser.json());
app.use('/api', router);

=======
app.use(express.json());
const SD = new SensorDados();
app.get('/', (req, res) => {
  res.send('<h1>Hello World!</h1>');
});
app.post('/dados',(req,res)=>{
    const { temperatura, umidade, turbidez, ph } = req.body;
    SD.atualizarDados({ temperatura, umidade, turbidez, ph });
    res.status(200).send(`<h1>Dados atualizados com sucesso</h1>
    <h2>Dados: </h2><br>
    <p>Temperatura: ${temperatura}</h2><br>
    <p>Umidade: ${umidade}</p><br>
    <p>Turbidez: ${turbidez}</p><br>
    <p>Ph: ${ph}</p>`);
});
app.get("/dados",(req,res)=>{
  const { temperatura, umidade,turbidez, ph } = SD.obterDados();
  res.status(200).send(`<h1>Dados atualizados com sucesso</h1>
    <h2>Dados: </h2><br>
    <p>Temperatura: ${temperatura}</h2><br>
    <p>Umidade: ${umidade}</p><br>
    <p>Turbidez: ${turbidez}</p><br>
    <p>Ph: ${ph}</p>`);
})
>>>>>>> 7c7fc48be3da4d00e530aac4ba9154603cde6244
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});