import { SensorDados } from  './DadosArduino.js';
import express from 'express';
import cors from 'cors';
import send from 'send';

const app = express();
app.use(cors());
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
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});