/**
 * Código exemplo para ESP32 A-Quality
 * Este código demonstra como enviar dados dos sensores para o backend
 * 
 * Sensores necessários:
 * - Sensor de pH
 * - Sensor de turbidez 
 * - Sensor de condutividade
 * - Sensor de temperatura (DS18B20 ou similar)
 * 
 * Conexões recomendadas:
 * - pH: Pino analógico A0
 * - Turbidez: Pino analógico A1  
 * - Condutividade: Pino analógico A2
 * - Temperatura: Pino digital D2 (OneWire)
 * - LED status: Pino digital D13
 * - Buzzer alerta: Pino digital D12
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// Configurações de WiFi
const char* ssid = "SUA_REDE_WIFI";  // Substituir pela sua rede WiFi
const char* password = "SUA_SENHA_WIFI";  // Substituir pela senha do WiFi

// Configurações da API - PRODUÇÃO
const char* apiURL = "https://tcc3eetecgrupo5t1.hospedagemdesites.ws/app/api_mobile/sensores/receber_dados.php";
const char* deviceCode = "ESP32_001"; // Código único do seu dispositivo - DEVE SER CADASTRADO PRIMEIRO NO APP

// Configurações dos sensores
#define TEMP_SENSOR_PIN 2
#define PH_SENSOR_PIN A0
#define TURBIDITY_SENSOR_PIN A1
#define CONDUCTIVITY_SENSOR_PIN A2
#define LED_STATUS_PIN 13
#define BUZZER_PIN 12

// Configurações de timing
#define READING_INTERVAL 30000  // 30 segundos entre leituras
#define SEND_INTERVAL 60000     // 1 minuto entre envios para API

// Sensor de temperatura
OneWire oneWire(TEMP_SENSOR_PIN);
DallasTemperature temperatureSensor(&oneWire);

// Variáveis globais
unsigned long lastReading = 0;
unsigned long lastSend = 0;
bool wifiConnected = false;

// Estrutura para armazenar leituras
struct SensorData {
  float ph;
  float turbidity;
  float conductivity;
  float temperature;
  int batteryLevel;
  int signalStrength;
  String timestamp;
};

void setup() {
  Serial.begin(115200);
  
  // Configurar pinos
  pinMode(LED_STATUS_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  // Inicializar sensor de temperatura
  temperatureSensor.begin();
  
  // Conectar WiFi
  connectWiFi();
  
  // Sinal de inicialização
  blinkLED(3);
  
  Serial.println("ESP32 A-Quality iniciado!");
  Serial.println("Código do dispositivo: " + String(deviceCode));
}

void loop() {
  // Verificar conexão WiFi
  if (WiFi.status() != WL_CONNECTED) {
    wifiConnected = false;
    digitalWrite(LED_STATUS_PIN, LOW);
    connectWiFi();
  } else {
    wifiConnected = true;
    digitalWrite(LED_STATUS_PIN, HIGH);
  }
  
  // Fazer leitura dos sensores
  if (millis() - lastReading >= READING_INTERVAL) {
    SensorData data = readSensors();
    
    // Mostrar dados no Serial Monitor
    printSensorData(data);
    
    // Verificar alertas locais
    checkAlerts(data);
    
    lastReading = millis();
    
    // Enviar dados para API
    if (millis() - lastSend >= SEND_INTERVAL && wifiConnected) {
      sendDataToAPI(data);
      lastSend = millis();
    }
  }
  
  delay(1000);
}

void connectWiFi() {
  Serial.println("Conectando ao WiFi...");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("");
    Serial.println("WiFi conectado!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("Força do sinal: ");
    Serial.println(WiFi.RSSI());
    wifiConnected = true;
  } else {
    Serial.println("");
    Serial.println("Falha na conexão WiFi!");
    wifiConnected = false;
  }
}

SensorData readSensors() {
  SensorData data;
  
  // Leitura do pH (calibração necessária)
  int phRaw = analogRead(PH_SENSOR_PIN);
  data.ph = map(phRaw, 0, 4095, 0, 14 * 100) / 100.0; // Conversão aproximada
  
  // Leitura da turbidez (calibração necessária)
  int turbidityRaw = analogRead(TURBIDITY_SENSOR_PIN);
  data.turbidity = map(turbidityRaw, 0, 4095, 0, 1000); // NTU
  
  // Leitura da condutividade (calibração necessária)
  int conductivityRaw = analogRead(CONDUCTIVITY_SENSOR_PIN);
  data.conductivity = map(conductivityRaw, 0, 4095, 0, 500) / 100.0; // mS/cm
  
  // Leitura da temperatura
  temperatureSensor.requestTemperatures();
  data.temperature = temperatureSensor.getTempCByIndex(0);
  
  // Nível da bateria (se usando bateria)
  data.batteryLevel = 85; // Implementar leitura real se necessário
  
  // Força do sinal WiFi
  data.signalStrength = map(WiFi.RSSI(), -100, -50, 0, 100);
  
  // Timestamp
  data.timestamp = getCurrentTimestamp();
  
  return data;
}

void sendDataToAPI(SensorData data) {
  if (!wifiConnected) {
    Serial.println("WiFi não conectado - ignorando envio");
    return;
  }
  
  HTTPClient http;
  http.begin(apiURL);
  http.addHeader("Content-Type", "application/json");
  
  // Criar JSON
  DynamicJsonDocument doc(1024);
  doc["codigo_dispositivo"] = deviceCode;
  doc["ph"] = data.ph;
  doc["turbidez"] = data.turbidity;
  doc["condutividade"] = data.conductivity;
  doc["temperatura"] = data.temperature;
  doc["bateria"] = data.batteryLevel;
  doc["sinal"] = data.signalStrength;
  doc["timestamp"] = data.timestamp;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("Enviando dados para API...");
  Serial.println("JSON: " + jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Resposta da API (" + String(httpResponseCode) + "): " + response);
    
    if (httpResponseCode == 200 || httpResponseCode == 201) {
      Serial.println("✅ Dados enviados com sucesso!");
      blinkLED(1); // Piscar LED para confirmar envio
    } else {
      Serial.println("⚠️ Erro no servidor: " + String(httpResponseCode));
    }
  } else {
    Serial.println("❌ Erro de conexão: " + String(httpResponseCode));
  }
  
  http.end();
}

void printSensorData(SensorData data) {
  Serial.println("\n========== LEITURA DOS SENSORES ==========");
  Serial.println("pH: " + String(data.ph, 2));
  Serial.println("Turbidez: " + String(data.turbidity, 1) + " NTU");
  Serial.println("Condutividade: " + String(data.conductivity, 2) + " mS/cm");
  Serial.println("Temperatura: " + String(data.temperature, 1) + "°C");
  Serial.println("Bateria: " + String(data.batteryLevel) + "%");
  Serial.println("Sinal WiFi: " + String(data.signalStrength) + "%");
  Serial.println("Timestamp: " + data.timestamp);
  Serial.println("==========================================\n");
}

void checkAlerts(SensorData data) {
  bool alert = false;
  String alertMessage = "";
  
  // Verificar pH crítico
  if (data.ph < 6.0 || data.ph > 9.0) {
    alert = true;
    alertMessage += "pH CRÍTICO! ";
  }
  
  // Verificar turbidez alta
  if (data.turbidity > 10) {
    alert = true;
    alertMessage += "TURBIDEZ ALTA! ";
  }
  
  // Verificar condutividade alta
  if (data.conductivity > 2.5) {
    alert = true;
    alertMessage += "CONDUTIVIDADE ALTA! ";
  }
  
  // Verificar temperatura anômala
  if (data.temperature < 10 || data.temperature > 30) {
    alert = true;
    alertMessage += "TEMPERATURA ANÔMALA! ";
  }
  
  if (alert) {
    Serial.println("🚨 ALERTA: " + alertMessage);
    // Ativar buzzer
    for (int i = 0; i < 3; i++) {
      digitalWrite(BUZZER_PIN, HIGH);
      delay(200);
      digitalWrite(BUZZER_PIN, LOW);
      delay(200);
    }
  }
}

void blinkLED(int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_STATUS_PIN, HIGH);
    delay(200);
    digitalWrite(LED_STATUS_PIN, LOW);
    delay(200);
  }
}

String getCurrentTimestamp() {
  // Em produção, usar RTC ou sincronização NTP
  // Por agora, retorna timestamp simples
  return String(millis() / 1000);
}

// Função para calibração manual dos sensores
void calibrateSensors() {
  Serial.println("\n========== CALIBRAÇÃO DOS SENSORES ==========");
  
  // Calibração do pH
  Serial.println("1. Coloque o sensor de pH em solução pH 7.0 e pressione Enter");
  while (!Serial.available()) delay(100);
  Serial.read();
  int ph7Reading = analogRead(PH_SENSOR_PIN);
  Serial.println("Leitura pH 7.0: " + String(ph7Reading));
  
  Serial.println("2. Coloque o sensor de pH em solução pH 4.0 e pressione Enter");
  while (!Serial.available()) delay(100);
  Serial.read();
  int ph4Reading = analogRead(PH_SENSOR_PIN);
  Serial.println("Leitura pH 4.0: " + String(ph4Reading));
  
  // Calcular coeficientes de calibração
  float phSlope = 3.0 / (ph7Reading - ph4Reading);
  float phIntercept = 7.0 - (phSlope * ph7Reading);
  
  Serial.println("Coeficientes de calibração pH:");
  Serial.println("Slope: " + String(phSlope));
  Serial.println("Intercept: " + String(phIntercept));
  
  // Salvar na EEPROM ou usar como constantes no código
  
  Serial.println("==========================================\n");
}