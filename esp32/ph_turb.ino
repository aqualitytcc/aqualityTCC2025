#include <WiFi.h>
#include <WiFiManager.h>
#include <HTTPClient.h>
#include <math.h>

// --- CONFIGURAÇÕES ---
const char* api_url = "http://tcc3eetecgrupo5.tecnologia.ws/api/receber_raw.php";

// --- IDENTIFICADOR ÚNICO DO DISPOSITIVO ---
const String codigoVerificacao = "ESP-AQUALITY-01";

// --- CONFIGURAÇÃO DO DEEP SLEEP ---
const uint64_t TEMPO_DE_SONO_US = 60e6;

// --- PONTOS DE CALIBRAÇÃO DO SENSOR DE TURBIDEZ ---
const float VOLTAGEM_AGUA_LIMPA = 1.73;
const float VOLTAGEM_AGUA_TURVA = 0.0;
const int MAXIMO_ESCALA = 100;

// --- CONFIGURAÇÃO DOS PINOS ---
#define SensorTurbidez 36
#define PH_SENSOR_PIN 34

// --- VARIÁVEIS GLOBAIS ---
// Turbidez
float voltagem;
float turbidez;
// pH
float calibration_value = 21.34;
unsigned long int avgval;
int buffer_arr[10], temp;
float ph_act;

void setup() {
  Serial.begin(115200);
  Serial.println("Monitor de Turbidez e pH Iniciado.");

  WiFiManager wm;
  if (!wm.autoConnect("A-Quality Setup 1.1")) {
    Serial.println("Falha ao conectar, reiniciando...");
    ESP.restart();
  }
  Serial.println("\nWiFi conectado!");
  Serial.print("Endereço IP: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // 1. LÊ OS DADOS DO SENSOR DE TURBIDEZ
  voltagem = 0;
  for (int i = 0; i < 800; i++) {
    voltagem += ((float)analogRead(SensorTurbidez) / 4095.0) * 3.3;
    delay(1);
  }
  voltagem = voltagem / 800.0;
  voltagem = ArredondarPara(voltagem, 2);

  if (voltagem >= VOLTAGEM_AGUA_LIMPA) {
    turbidez = 0;
  } else if (voltagem <= VOLTAGEM_AGUA_TURVA) {
    turbidez = MAXIMO_ESCALA;
  } else {
    turbidez = mapFloat(voltagem, VOLTAGEM_AGUA_TURVA, VOLTAGEM_AGUA_LIMPA, MAXIMO_ESCALA, 0);
  }

  Serial.print("Voltagem Turbidez: ");
  Serial.print(voltagem);
  Serial.print(" V  |  Turbidez: ");
  Serial.print(turbidez, 0);
  Serial.println(" %");

  // 2. LÊ OS DADOS DO SENSOR DE PH
  for (int i = 0; i < 10; i++) {
    buffer_arr[i] = analogRead(PH_SENSOR_PIN);
    delay(30);
  }
  for (int i = 0; i < 9; i++) {
    for (int j = i + 1; j < 10; j++) {
      if (buffer_arr[i] > buffer_arr[j]) {
        temp = buffer_arr[i];
        buffer_arr[i] = buffer_arr[j];
        buffer_arr[j] = temp;
      }
    }
  }
  avgval = 0;
  for (int i = 2; i < 8; i++)
    avgval += buffer_arr[i];

  float ph_volt = (float)avgval * 3.3 / 4095.0 / 6;
  ph_act = -5.70 * ph_volt + calibration_value;

  Serial.print("Voltagem pH: ");
  Serial.print(ph_volt, 2);
  Serial.print(" V  |  pH: ");
  Serial.println(ph_act, 2);

  // 3. ENVIA OS DADOS PARA A API (LÓGICA ATUALIZADA)
  Serial.println("\n--- Iniciando envio dos dados ---");
  
  // Envia a leitura de turbidez
  enviarDadoSensor("turbidez", turbidez);

  // Pequeno delay para não sobrecarregar o servidor com requisições simultâneas
  delay(500); 

  // Envia a leitura de pH
  enviarDadoSensor("ph", ph_act);

  // 4. Entra em modo de sono profundo
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
