#include <OneWire.h>
#include <DallasTemperature.h>
#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>

// --- CONFIGURAÇÕES ---
const char* ssid = "";  // Nome do WiFi
const char* password = "";  // Senha do WiFi
const char* api_url = "http://tcc3eetecgrupo5.tecnologia.ws/dados/receber_dados.php";

// --- IDENTIFICADORES DO DISPOSITIVO ---
// Cada dispositivo/usuário terá um ID. Isso virá da sua tabela 'usuarios'
const int idDoUsuario = 1; 
// Localização deste dispositivo específico
const String localDoDispositivo = "Casa01";

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

    WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi conectado!");
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
    String postData = "usuario_id=" + String(idDoUsuario) +
                      "&localizacao=" + localDoDispositivo +
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
