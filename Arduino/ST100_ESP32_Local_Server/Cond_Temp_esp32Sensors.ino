#include <OneWire.h>
#include <DallasTemperature.h>
#include <Wire.h>

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
}

void loop() {
  // -------------------- Leitura da Temperatura --------------------
  sensors.requestTemperatures(); 
  float temperatureC = sensors.getTempCByIndex(0);

  // -------------------- Leitura do TDS --------------------
  int analogValue = analogRead(TDS_PIN);
  float voltage = analogValue * (supplyVoltage / 1023.0); 
  float tdsValue = (voltage / calibrationConstant) * 1000; 

  // -------------------- Impressão Serial --------------------
  Serial.print("Temperatura: ");
  Serial.print(temperatureC);
  Serial.println(" °C");

  Serial.print("TDS: ");
  Serial.print(tdsValue, 1);
  Serial.println(" ppm");

  Serial.println("--------------------------");

  delay(1000); // Espera entre leituras
}
