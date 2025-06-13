export class SensorDados{
    #dados={
        temperatura: 0,
        umidade: 0,
        turbidez:0,
        ph: 0
    }
    obterDados(){
        return this.#dados;
    }
    atualizarDados({temperatura, umidade, turbidez, ph}) {
        this.#dados={temperatura, umidade, turbidez, ph};
        console.log("Dados atualizados:", this.#dados);
    }
    resetarDados() {
        this.#dados = {
            temperatura: 0,
            umidade: 0,
            turbidez: 0,
            ph: 0
        };
        console.log("Dados resetados");
    }
}