//#include <Wire.h>
//#include <LiquidCrystal_I2C.h>

// Inicialização I2C LCD (endereço geral 0x27, pode ser 0x3F dependendo do módulo)
//LiquidCrystal_I2C lcd(0x27, 16, 2);

float calibration_value = 21.34 + 1.5;
unsigned long int avgval;
int buffer_arr[10], temp;
float ph_act;

// Define o pino analógico para o sensor de HH
#define PH_SENSOR_PIN 34   // Exemplo com GPIO34, pode ser alterado para outros pinos analógicos

void setup() {
  Serial.begin(115200);   // Taxa de transmissão comum do ESP32
  /*Wire.begin();
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("pH Sensor Ready");
  delay(2000);
  lcd.clear();*/
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
  Serial.println(ph_act);

  // Mostra no LCD
  /*lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("PH:");
  lcd.setCursor(0, 1);
  lcd.print(ph_act, 2);*/    // 2 dígitos após o ponto decimal

  delay(1000); // Atraso de 1 segundo na leitura
}
