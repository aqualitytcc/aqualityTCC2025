#include <OneWire.h>
#include <DallasTemperature.h>
#include <Wire.h>
#include <WiFi.h>
#include <WiFiManager.h>
#include <HTTPClient.h>

// --- CONFIGURAÇÕES ---
const char* api_url = "http://tcc3eetecgrupo5.tecnologia.ws/api/receber_dados.php";

// --- IDENTIFICADOR ÚNICO DO DISPOSITIVO ---
const String codigoVerificacao = "ESP-AQUALITY-01";

// --- CONFIGURAÇÃO DO DEEP SLEEP ---
// Tempo em microssegundos. 1 minuto = 60 segundos = 60e6 microssegundos.
const uint64_t TEMPO_DE_SONO_US = 60e6;

// -------------------- Sensor de Temperatura DS18B20 --------------------
#define ONE_WIRE_BUS 23
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

// -------------------- Sensor de Condutividade (TDS) --------------------
#define TDS_PIN 34
const float supplyVoltage = 3.3; // Tensão de alimentação do ESP32
// SUGESTÃO: A calibração pode variar. Comece com 0.5 e ajuste se necessário.
const float tdsCalibrationConstant = 0.5;

// -----------------------------------------------------------------------
void setup() {
  Serial.begin(115200);

  // Inicializa sensor de temperatura
  sensors.begin();
  Serial.println("Sensores Inicializados!");

  // --- Início do WiFiManager ---
  WiFiManager wm;
  if (!wm.autoConnect("A-Quality Setup 1.2")) {
    Serial.println("Falha ao conectar e o tempo limite expirou. Reiniciando...");
    ESP.restart();
  }
  
  Serial.println("\nWiFi conectado!");
  Serial.print("Endereço IP: ");
  Serial.println(WiFi.localIP());
  // --- Fim do WiFiManager ---
}

void loop() {
  // A função loop() será executada apenas uma vez por ciclo de despertar.

  // 1. Leitura dos sensores
  sensors.requestTemperatures(); 
  float temperatureC = sensors.getTempCByIndex(0);

  // Tratamento para caso o sensor de temperatura falhe na leitura (-127)
  if (temperatureC == DEVICE_DISCONNECTED_C) {
    Serial.println("Erro ao ler a temperatura!");
    // Aqui você pode decidir o que fazer: pular o envio ou enviar um valor nulo/padrão.
    temperatureC = 0.0; // Define um valor padrão para não quebrar o envio
  }

  int analogValue = analogRead(TDS_PIN);
  float voltage = analogValue * (supplyVoltage / 4095.0); 
  // Fórmula ajustada para TDS, a sua estava correta, esta é apenas uma forma alternativa.
  float tdsValue = (133.42 * voltage * voltage * voltage - 255.86 * voltage * voltage + 857.39 * voltage) * tdsCalibrationConstant;

  // 2. Impressão dos dados no Serial Monitor
  Serial.print("Temperatura: ");
  Serial.print(temperatureC, 2);
  Serial.println("°C");

  Serial.print("TDS (Condutividade): ");
  Serial.print(tdsValue, 2);
  Serial.println("ppm");

  // 3. Envio dos dados para a API
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(api_url);
    http.addHeader("Content-Type", "application/x-www-form-urlencoded");

    // Monta a string de dados com os valores lidos
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

  // 4. Entra em modo de sono profundo
  //Serial.println("\nEntrando em Deep Sleep por 1 minuto...");
  //ESP.deepSleep(TEMPO_DE_SONO_US);
  delay(60000);
}
