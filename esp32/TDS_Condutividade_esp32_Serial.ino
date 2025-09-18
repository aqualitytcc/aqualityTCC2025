#include <Wire.h>

// Define the TDS sensor pin
const int TDS_PIN = 12;

// Define calibration constant (adjust as per your sensor and setup)
float calibrationConstant = 0.5; // Specific to your sensor module

// Supply voltage for the TDS sensor (3.3V in this case)
float supplyVoltage = 3.3;

void setup() {
// Set up serial communication for debugging (optional)
Serial.begin(115200);
}

void loop() {
// Read the analog value from the TDS sensor
int analogValue = analogRead(TDS_PIN);

// Convert the analog value to voltage
float voltage = analogValue * (supplyVoltage / 1023.0);

// Calculate the TDS value in ppm
float tdsValue = (voltage / calibrationConstant) * 1000;

// Print TDS value to Serial Monitor (optional)
Serial.print("TDS Value: ");
Serial.print(tdsValue, 1);
Serial.println(" ppm");

// Add a delay before the next reading
delay(1000); // 1-second delay
}
