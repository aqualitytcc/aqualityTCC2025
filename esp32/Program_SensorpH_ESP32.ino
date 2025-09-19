#include <WiFi.h>
#include <WiFiManager.h>
#include <HTTPClient.h>

// --- CONFIGURAÇÕES ---
const char* api_url = "http://tcc3eetecgrupo5.tecnologia.ws/api/receber_dados.php";

// --- IDENTIFICADOR ÚNICO DO DISPOSITIVO ---
// Este código deve ser único para cada dispositivo.
// Você irá inseri-lo manualmente na tabela `dispositivos` do seu banco de dados.
const String codigoVerificacao = "ESP-AQUALITY-01";

float calibration_value = 21.34 + 1.5;
unsigned long int avgval;
int buffer_arr[10], temp;
float ph_act;

// Define o pino analógico para o sensor de PH
#define PH_SENSOR_PIN 34  // GPIO34, pode ser alterado para outros pinos analógicos

void setup() {
  Serial.begin(115200); // Taxa de transmissão comum do ESP32
  
  // --- Início da Mágica do WiFiManager ---
    WiFiManager wm;

    // Descomente a linha abaixo para limpar as credenciais salvas para teste
    // wm.resetSettings();

    // Tenta se conectar ao WiFi. Se não conseguir, ele inicia o portal de configuração.
    // O "true" no final significa que a conexão será bloqueada até ser bem-sucedida.
    if (!wm.autoConnect("A-Quality-Setup-1.1")) {
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

  // Espera 5 minutos para a próxima leitura e o próximo envio
  delay(300000); 
}
