#include <OneWire.h>
#include <DallasTemperature.h>
#include <Wire.h>
#include <WiFi.h>
#include <WiFiManager.h>
#include <HTTPClient.h>

// --- CONFIGURAÇÕES ---
// ALTERAÇÃO 1: URL da API atualizada
const char* api_url = "http://tcc3eetecgrupo5.tecnologia.ws/api/receber_raw.php";

// ALTERAÇÃO 2: Código de verificação único para este dispositivo
const String codigoVerificacao = "ESP-AQUALITY-01";

// --- CONFIGURAÇÃO DO DEEP SLEEP ---
const uint64_t TEMPO_DE_SONO_US = 60e6;

// -------------------- Sensor de Temperatura DS18B20 --------------------
#define ONE_WIRE_BUS 23
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

// -------------------- Sensor de Condutividade (TDS) --------------------
#define TDS_PIN 34
const float supplyVoltage = 3.3; 
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
}

void loop() {
  // 1. Leitura dos sensores
  sensors.requestTemperatures(); 
  float temperatureC = sensors.getTempCByIndex(0);

  if (temperatureC == DEVICE_DISCONNECTED_C) {
    Serial.println("Erro ao ler a temperatura!");
    temperatureC = 0.0; // Usamos 0.0 como valor de erro
  }

  int analogValue = analogRead(TDS_PIN);
  float voltage = analogValue * (supplyVoltage / 4095.0); 
  float tdsValue = (133.42 * voltage * voltage * voltage - 255.86 * voltage * voltage + 857.39 * voltage) * tdsCalibrationConstant;

  // 2. Impressão dos dados no Serial Monitor
  Serial.print("Temperatura: ");
  Serial.print(temperatureC, 2);
  Serial.println("°C");

  Serial.print("TDS (Condutividade): ");
  Serial.print(tdsValue, 2);
  Serial.println("ppm");

  // ALTERAÇÃO 3: Lógica de envio foi substituída por chamadas à nova função
  // 3. Envio dos dados para a API
  Serial.println("\n--- Iniciando envio dos dados ---");

  // Envia a leitura de temperatura
  enviarDadoSensor("temperatura", temperatureC);
  
  delay(500); // Pequena pausa

  // Envia a leitura de condutividade
  enviarDadoSensor("condutividade", tdsValue);


  // 4. Entra em modo de sono profundo
  Serial.println("\nEntrando em Deep Sleep por 1 minuto...");
  ESP.deepSleep(TEMPO_DE_SONO_US);
}

// ALTERAÇÃO 4: Adicionada a mesma função de envio do outro ESP
void enviarDadoSensor(String tipoSensor, float valor) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(api_url);
    http.addHeader("Content-Type", "application/x-www-form-urlencoded");

    // Monta os dados no novo formato: tipo_sensor e valor
    String postData = "codigo_verificacao=" + codigoVerificacao +
                      "&tipo_sensor=" + tipoSensor +
                      "&valor=" + String(valor, 2); // Enviando com 2 casas decimais

    Serial.println("\nEnviando dados: " + postData);
    int httpResponseCode = http.POST(postData);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Código de resposta: " + String(httpResponseCode));
      Serial.println("Resposta: " + response);
    } else {
      Serial.println("Erro no envio para " + tipoSensor + ". Código: " + String(httpResponseCode));
    }
    http.end();
  } else {
    Serial.println("WiFi desconectado. Não foi possível enviar " + tipoSensor);
  }
}
