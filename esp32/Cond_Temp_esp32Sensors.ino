#include <OneWire.h>
#include <DallasTemperature.h>
#include <Wire.h>
#include <WiFi.h>
#include <WiFiManager.h>
#include <HTTPClient.h>

// --- CONFIGURAÇÕES ---
const char* api_url = "http://tcc3eetecgrupo5.tecnologia.ws/api/receber_dados.php";

// --- IDENTIFICADOR ÚNICO DO DISPOSITIVO ---
// Este código deve ser único para cada dispositivo.
// Você irá inseri-lo manualmente na tabela `dispositivos` do seu banco de dados.
const String codigoVerificacao = "ESP-AQUALITY-01";

// -------------------- Sensor de Temperatura DS18B20 --------------------
// Pino do DS18B20 (ajuste conforme ligação)
#define ONE_WIRE_BUS 23

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

// -------------------- Sensor de Condutividade (TDS) --------------------
const int TDS_PIN = 12;          // Pino analógico para leitura do TDS
float calibrationConstant = 0.5; // Ajuste conforme seu sensor
float supplyVoltage = 3.3;       // Tensão de alimentação usada

// -----------------------------------------------------------------------
void setup() {
  Serial.begin(115200);

  // Inicializa sensor de temperatura
  sensors.begin();
  Serial.println("Sensores Inicializados!");

    // --- Início da Mágica do WiFiManager ---
    WiFiManager wm;

    // Descomente a linha abaixo para limpar as credenciais salvas para teste
    // wm.resetSettings();

    // Tenta se conectar ao WiFi. Se não conseguir, ele inicia o portal de configuração.
    // O "true" no final significa que a conexão será bloqueada até ser bem-sucedida.
    if (!wm.autoConnect("A-Quality-Setup-1.2")) {
        Serial.println("Falha ao conectar e o tempo limite expirou.");
        // Você pode decidir reiniciar o ESP ou tentar novamente.
        ESP.restart();
    }
    
    // Se chegou até aqui, o ESP32 está conectado ao WiFi do cliente!
    Serial.println("");
    Serial.println("WiFi conectado!");
    Serial.print("Endereço IP: ");
    Serial.println(WiFi.localIP());
    // --- Fim da Mágica do WiFiManager ---
}

void loop() {
  // -------------------- Leitura da Temperatura --------------------
  sensors.requestTemperatures(); 
  float temperatureC = sensors.getTempCByIndex(0);

  // -------------------- Leitura do TDS --------------------
  int analogValue = analogRead(TDS_PIN);
  float voltage = analogValue * (supplyVoltage / 4095.0); 
  float tdsValue = (voltage / calibrationConstant) * 1000; 

  // -------------------- Impressão Serial --------------------
  Serial.print("Temperatura: ");
  Serial.print(temperatureC);
  Serial.println(" °C");

  Serial.print("TDS: ");
  Serial.print(tdsValue, 1);
  Serial.println(" ppm");

  Serial.println("--------------------------");

    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(api_url);
        http.addHeader("Content-Type", "application/x-www-form-urlencoded");

        // --- MONTA A STRING DE DADOS ATUALIZADA ---
        // Agora envia apenas o código de verificação
        String postData = "codigo_verificacao=" + codigoVerificacao +
                          "&temperatura=" + String(temperatureC, 2) +
                          "&condutividade=" + String(tdsValue, 2);

    Serial.println("Enviando dados: " + postData);

    int httpResponseCode = http.POST(postData);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Código de resposta: " + String(httpResponseCode));
      Serial.println("Resposta: " + response);
    } else {
      Serial.println("Erro no envio. Código: " + String(httpResponseCode));
    }
    http.end();
  } else {
    Serial.println("WiFi desconectado.");
  }

  // Espera 5 minutos para a próxima leitura e o próximo envio
  delay(300000);
}
