#include <WiFi.h>
#include <WiFiManager.h>
#include <HTTPClient.h>

// --- CONFIGURAÇÕES ---
const char* api_url = "http://tcc3eetecgrupo5.tecnologia.ws/api/receber_dados.php";

// --- IDENTIFICADOR ÚNICO DO DISPOSITIVO ---
const String codigoVerificacao = "ESP-AQUALITY-01";

// --- CONFIGURAÇÃO DO DEEP SLEEP ---
// Tempo em microssegundos. 1 minuto = 60 segundos
// 60 * 1000000 = 60.000.000
// A notação "e6" significa "vezes 10 elevado a 6" (1.000.000)
const uint64_t TEMPO_DE_SONO_US = 60e6; 

// --- Variáveis do Sensor de pH ---
float calibration_value = 21.34;
unsigned long int avgval;
int buffer_arr[10], temp;
float ph_act;

#define PH_SENSOR_PIN 34  // GPIO34

void setup() {
  Serial.begin(115200);
  
  // --- Início do WiFiManager ---
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
  // Toda a lógica que estava no loop() agora será executada apenas UMA VEZ por ciclo de despertar.
  
  // 1. Lê os dados do sensor de pH
  for (int i = 0; i < 10; i++) {
    buffer_arr[i] = analogRead(PH_SENSOR_PIN);
    delay(30);
  }
  for (int i = 0; i < 9; i++) { // Ordena
    for (int j = i + 1; j < 10; j++) {
      if (buffer_arr[i] > buffer_arr[j]) {
        temp = buffer_arr[i];
        buffer_arr[i] = buffer_arr[j];
        buffer_arr[j] = temp;
      }
    }
  }
  avgval = 0;
  for (int i = 2; i < 8; i++) // Pega a média
    avgval += buffer_arr[i];

  float ph_volt = (float)avgval * 3.3 / 4095.0 / 6;
  ph_act = -5.70 * ph_volt + calibration_value;
  Serial.print("PH: ");
  Serial.println(ph_act, 2);

  // 2. Envia os dados para a API
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(api_url);
    http.addHeader("Content-Type", "application/x-www-form-urlencoded");

    String postData = "codigo_verificacao=" + codigoVerificacao +
                      "&ph=" + String(ph_act, 2);
    
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

  // 3. Entra em modo de sono profundo
  Serial.println("Entrando em Deep Sleep por 1 minuto...");
  //ESP.deepSleep(TEMPO_DE_SONO_US);
  delay(60000);
}
