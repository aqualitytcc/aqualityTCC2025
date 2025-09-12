#include <WiFi.h>
#include <HTTPClient.h>

// --- CONFIGURAÇÕES ---
const char* ssid = " ";  // Nome do WiFi
const char* password = " ";  // Senha do WiFi
const char* api_url = "http://tcc3eetecgrupo5.tecnologia.ws/dados/receber_dados.php";

// --- IDENTIFICADORES DO DISPOSITIVO ---
// Cada dispositivo/usuário terá um ID. Isso virá da sua tabela 'usuarios'
const int idDoUsuario = 1; 
// Localização deste dispositivo específico
const String localDoDispositivo = " ";  // Local do dispositivo

float calibration_value = 21.34 + 1.5;
unsigned long int avgval;
int buffer_arr[10], temp;
float ph_act;

// Define o pino analógico para o sensor de PH
#define PH_SENSOR_PIN 34  // Exemplo com GPIO34, pode ser alterado para outros pinos analógicos

void setup() {
  Serial.begin(115200); // Taxa de transmissão comum do ESP32
  
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi conectado!");
}

void loop() {
  // Lê os dados analógicos
  for (int i = 0; i < 10; i++) {
    buffer_arr[i] = analogRead(PH_SENSOR_PIN);
    delay(30);
  }

  // Organiza os dados (ordenação por flutuação)
  for (int i = 0; i < 9; i++) {
    for (int j = i + 1; j < 10; j++) {
      if (buffer_arr[i] > buffer_arr[j]) {
        temp = buffer_arr[i];
        buffer_arr[i] = buffer_arr[j];
        buffer_arr[j] = temp;
      }
    }
  }

  // Pega a média dos dados do meio
  avgval = 0;
  for (int i = 2; i < 8; i++)
    avgval += buffer_arr[i];

  // Converte para tensão ESP32
  float ph_volt = (float)avgval * 3.3 / 4095.0 / 6;
  ph_act = -5.70 * ph_volt + calibration_value;

  // Mostra no Serial Monitor
  Serial.print("PH: ");
  Serial.println(ph_act, 2);  // 2 dígitos após o ponto decimal

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(api_url);
    http.addHeader("Content-Type", "application/x-www-form-urlencoded");

    // --- MONTA A STRING DE DADOS ATUALIZADA ---
    String postData = "usuario_id=" + String(idDoUsuario) +
                      "&localizacao=" + localDoDispositivo +
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

  // Espera 5 minutos para a próxima leitura e o próximo envio
  delay(300000); 
}
