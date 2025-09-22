#include <OneWire.h>
#include <DallasTemperature.h>
#include <Wire.h>
#include <WiFi.h>
#include <WiFiManager.h>
#include <HTTPClient.h>

// --- CONFIGURAÇÕES ---
const char* api_url = "http://tcc3eetecgrupo5.tecnologia.ws/api/receber_dados.php";

// --- IDENTIFICADOR ÚNICO DO DISPOSITIVO ---
// Lembre-se que este código deve ser diferente do seu outro ESP.
// Ex: "ESP-AQUALITY-02"
const String codigoVerificacao = "ESP-AQUALITY-01";

// --- CONFIGURAÇÃO DO DEEP SLEEP ---
// Tempo em microssegundos. 5 minutos = 300 segundos = 300e6 microssegundos.
const uint64_t TEMPO_DE_SONO_US = 300e6;

// -------------------- Sensor de Temperatura DS18B20 --------------------
#define ONE_WIRE_BUS 23
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

// -------------------- Sensor de Condutividade (TDS) --------------------
const int TDS_PIN = 12;
float calibrationConstant = 0.5;
float supplyVoltage = 3.3;

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

  int analogValue = analogRead(TDS_PIN);
  float voltage = analogValue * (supplyVoltage / 4095.0); 
  float tdsValue = (voltage / calibrationConstant) * 1000; 

  // 2. Impressão dos dados no Serial Monitor
  Serial.print("Temperatura: ");
  Serial.print(temperatureC);
  Serial.println(" °C");

  Serial.print("TDS (Condutividade): ");
  Serial.print(tdsValue, 1);
  Serial.println(" ppm");
  Serial.println("--------------------------");

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
  Serial.println("Entrando em Deep Sleep por 5 minutos...");
  ESP.deepSleep(TEMPO_DE_SONO_US);
}
