// =======================================================================
// ===                  CÓDIGO A-QUALITY PARA ESP32                    ===
// =======================================================================

#include <OneWire.h>
#include <DallasTemperature.h>
#include <WiFi.h>
#include <WiFiManager.h>
#include <HTTPClient.h>
#include <math.h>

// --- CONFIGURAÇÕES GERAIS ---
const char* api_url = "http://tcc3eetecgrupo5.tecnologia.ws/api/receber_dados.php";
const String codigoVerificacao = "ESP-AQUALITY-01";
const uint64_t TEMPO_DE_SONO_US = 60e6; // 1 minuto

// --- CONFIGURAÇÃO E PINOS DOS SENSORES ---

// Sensor de Temperatura (DS18B20)
#define ONE_WIRE_BUS 23
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

// Sensor de Condutividade (TDS)
#define TDS_PIN 36 
const float supplyVoltage = 3.3; 
const float tdsCalibrationConstant = 0.5;

// Sensor de Turbidez
#define SensorTurbidez 35
const float VOLTAGEM_AGUA_LIMPA = 1.73;
const float VOLTAGEM_AGUA_TURVA = 0.0;
const int MAXIMO_ESCALA = 100;

// Sensor de pH
#define PH_SENSOR_PIN 34
float calibration_value = 21.34;

// --- VARIÁVEIS GLOBAIS ---
float voltagem_turbidez, turbidez, ph_act, temperatureC, tdsValue;
unsigned long int avgval;
int buffer_arr[10], temp;


void setup() {
  Serial.begin(115200);
  Serial.println("\nDispositivo A-Quality acordou.");
  
  // Inicializa o sensor de temperatura
  sensors.begin();
  
  // Chama a função de conexão WiFi
  conectarWiFi();
}

void conectarWiFi() {
  WiFi.mode(WIFI_STA);
  Serial.println("Iniciando conexão WiFi...");
  WiFi.begin();

  Serial.print("Tentando conexão rápida");
  int timeout_counter = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    if (++timeout_counter >= 30) break; // Timeout de 15 segundos
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nCONEXÃO RÁPIDA BEM-SUCEDIDA!");
  } else {
    Serial.println("\nConexão rápida falhou. Iniciando portal de configuração...");
    WiFiManager wm;
    wm.setConfigPortalTimeout(180);
    if (!wm.autoConnect("A-Quality")) {
      Serial.println("Falha ao conectar. Reiniciando...");
      ESP.restart();
    }
  }
  Serial.print("Endereço IP: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  Serial.println("\n--- Iniciando ciclo de leitura completo ---");

  // --- 1. LEITURA DE TEMPERATURA ---
  sensors.requestTemperatures(); 
  temperatureC = sensors.getTempCByIndex(0);
  if (temperatureC == DEVICE_DISCONNECTED_C) {
    Serial.println("Erro ao ler a temperatura!");
  }

  // --- 2. LEITURA DE CONDUTIVIDADE ---
  int analogValue = analogRead(TDS_PIN);
  float voltage_cond = analogValue * (supplyVoltage / 4095.0);
  //tdsValue = (voltage_cond / tdsCalibrationConstant) * 1000;
  tdsValue = (133.42 * voltage_cond * voltage_cond * voltage_cond - 255.86 * voltage_cond * voltage_cond + 857.39 * voltage_cond) * tdsCalibrationConstant;

  // --- 3. LEITURA DE TURBIDEZ ---
  voltagem_turbidez = 0;
  for (int i = 0; i < 800; i++) {
    voltagem_turbidez += ((float)analogRead(SensorTurbidez) / 4095.0) * 3.3;
    delay(1);
  }
  voltagem_turbidez = voltagem_turbidez / 800.0;
  voltagem_turbidez = ArredondarPara(voltagem_turbidez, 2);

  if (voltagem_turbidez >= VOLTAGEM_AGUA_LIMPA) { turbidez = 0; } 
  else if (voltagem_turbidez <= VOLTAGEM_AGUA_TURVA) { turbidez = MAXIMO_ESCALA; }
  else { turbidez = mapFloat(voltagem_turbidez, VOLTAGEM_AGUA_TURVA, VOLTAGEM_AGUA_LIMPA, MAXIMO_ESCALA, 0); }

  // --- 4. LEITURA DE PH ---
  for (int i = 0; i < 10; i++) {
    buffer_arr[i] = analogRead(PH_SENSOR_PIN);
    delay(30);
  }
  for (int i = 0; i < 9; i++) { for (int j = i + 1; j < 10; j++) { if (buffer_arr[i] > buffer_arr[j]) { temp = buffer_arr[i]; buffer_arr[i] = buffer_arr[j]; buffer_arr[j] = temp; } } }
  avgval = 0;
  for (int i = 2; i < 8; i++) avgval += buffer_arr[i];
  float ph_volt = (float)avgval * 3.3 / 4095.0 / 6;
  ph_act = -5.70 * ph_volt + calibration_value;

  // --- 5. EXIBE LEITURAS NO MONITOR SERIAL ---
  Serial.printf("Leituras: Temp=%.2f C, Cond=%.2f ppm, Turb=%.0f %%, pH=%.2f\n", temperatureC, tdsValue, turbidez, ph_act);

  // --- 6. ENVIA TODOS OS DADOS EM UMA ÚNICA REQUISIÇÃO ---
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(api_url);
    http.addHeader("Content-Type", "application/x-www-form-urlencoded");

    String postData = "codigo_verificacao=" + codigoVerificacao;
    // Adiciona o parâmetro apenas se a leitura for válida
    if (temperatureC != DEVICE_DISCONNECTED_C) {
      postData += "&temperatura=" + String(temperatureC, 2);
    }
    // Para os outros, adicionamos validações simples (ex: pH > 0)
    if (ph_act > 0 && ph_act <= 14) {
       postData += "&ph=" + String(ph_act, 2);
    }
    if (turbidez >= 0) {
      postData += "&turbidez=" + String(turbidez, 0);
    }
    if (tdsValue >= 0) {
      postData += "&condutividade=" + String(tdsValue, 2);
    }

    Serial.println("\nEnviando dados: " + postData);
    int httpResponseCode = http.POST(postData);

    if (httpResponseCode > 0) {
      Serial.println("Código de resposta: " + String(httpResponseCode));
      Serial.println("Resposta: " + http.getString());
    } else {
      Serial.println("Erro no envio. Código: " + String(httpResponseCode));
    }
    http.end();
  } else {
    Serial.println("WiFi desconectado.");
  }

  // --- 7. ENTRA EM MODO DE SONO PROFUNDO ---
  Serial.println("\nEntrando em Deep Sleep por 1 minuto...");
  ESP.deepSleep(TEMPO_DE_SONO_US);
}


// --- FUNÇÕES AUXILIARES ---
float ArredondarPara(float ValorEntrada, int CasaDecimal) {
  float multiplicador = powf(10.0f, CasaDecimal);
  ValorEntrada = roundf(ValorEntrada * multiplicador) / multiplicador;
  return ValorEntrada;
}

float mapFloat(float x, float in_min, float in_max, float out_min, float out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
