/*********
  Rui Santos
  Complete project details at https://randomnerdtutorials.com  
*********/

// Import required libraries
#include "WiFi.h"
#include "ESPAsyncWebServer.h"
#include <Adafruit_Sensor.h>

// Replace with your network credentials
const char* ssid = "FVM";
const char* password = "41214804";

// Create AsyncWebServer object on port 80
AsyncWebServer server(80);

// --- Protótipo das Funções ---
double calc_NTU(double volt);

// --- Variáveis Globais ---
double NTU = 0.0;
double ph = 0.0;

//Lê turbidez do TS-300B
String readTurbidity(){
int sensorValue = analogRead(36); 
//float voltage = sensorValue * (3.3 / 4096.0);  
float voltage = -(sensorValue * (3.3 / 4096.0))+3.3;
  NTU = calc_NTU(voltage);

  Serial.println(NTU);
  return String(NTU);
  }

String readPh(){

  float ph_Value = analogRead(34);
  float voltage = ph_Value * (3.3 / 4096.0);

  ph = 3.3 * voltage;
  Serial.println(ph);
  return String(ph);

  }

//Variável index_html[]
//he PROGMEM keyword is a variable modifier, it should be used only with the datatypes defined in pgmspace.h. 
//It tells the compiler "keep this information in flash memory only", instead of copying it to SRAM at start up, like it would normally do.
const char index_html[] PROGMEM = R"rawliteral(
<!DOCTYPE HTML><html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.2/css/all.css" integrity="sha384-fnmOCqbTlWIlj8LyTjo7mOUStjsKC4pOpQbqyi7RrhN7udi9RwhKkMHpvLbHG9Sr" crossorigin="anonymous">
  <style>
    html {
     font-family: Arial;
     display: inline-block;
     margin: 0px auto;
     text-align: center;
    }
    h2 { font-size: 3.0rem; }
    p { font-size: 3.0rem; }
    .units { font-size: 1.2rem; }
    .dht-labels{
      font-size: 1.5rem;
      vertical-align:middle;
      padding-bottom: 15px;
    }
  </style>
</head>
<body>
  <h2>ESP32 ETEC</h2>
  <p>
    <i class="fas fa-thermometer-half" style="color:#059e8a;"></i> 
    <span class="dht-labels">Temperature</span> 
    <span id="temperature">%TEMPERATURE%</span>
    <sup class="units">&deg;C</sup>
  </p>
  <p>
    <i class="fas fa-tint" style="color:#00add6;"></i> 
    <span class="dht-labels">PH</span>
    <span id="PH">%PH%</span>
    <sup class="units">&percnt;</sup>
  </p>
   <p>
    <i class="fas fa-tint" style="color:#00add6;"></i> 
    <span class="dht-labels">Turbidity</span>
    <span id="turbidity">%TURBIDITY%</span>
    <sup class="units">NTU</sup>
  </p>
</body>
<script>
setInterval(function ( ) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      document.getElementById("temperature").innerHTML = this.responseText;
    }
  };
  xhttp.open("GET", "/temperature", true);
  xhttp.send();
}, 10000 ) ;

setInterval(function ( ) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      document.getElementById("PH").innerHTML = this.responseText;
    }
  };
  xhttp.open("GET", "/PH", true);
  xhttp.send();
}, 10000 ) ;
</script>
</html>)rawliteral";

// Substitui o espaço reservado por valores DHT e do TS-300B
//Chamado na linha 190 >>> request->send_P(200, "text/html", index_html, processor);
String processor(const String& var){
  //Serial.println(var);
  if(var == "TEMPERATURE"){
 //   return readTemperature();
  }
  if(var == "PH"){
    return readPh();
  }
  if(var == "TURBIDITY"){
    return readTurbidity();
  }
  return String();
}

//Função para conversão de tensão para Turbidez em NTU
// Equação que relaciona tensão com NTU: NTU = -1120,4*volt*volt + 5742,3*volt - 4352,9

double calc_NTU(double volt)
{
  double NTU_val;
  NTU_val = -(1120.4*volt*volt)+(5742.3*volt)-4352.9;
  return NTU_val;
}

void setup(){
// Serial port for debugging purposes
  Serial.begin(115200);

   // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi..");
  }

  // Print ESP32 Local IP Address
  Serial.println(WiFi.localIP());

  // Route for root / web page
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send_P(200, "text/html", index_html, processor);
  });
  //c_str() >>> Converte o conteúdo de um objeto String para uma string estilo C, terminada em null '\0';
  //Caractere nulo para marcar o fim da string
  //server.on() registra um callback para tratar requisições web específicas.
  //server.on("/sensor/data", HTTP_GET, callbackFunction);
  //callbackFunction será chamado sempre que alguém solicitar /sensor/data usando o método GET.
  server.on("/temperature", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send_P(200, "text/plain", "TEMPERATURA");
  });
  server.on("/PH", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send_P(200, "text/plain", readPh().c_str());
  });
  server.on("/turbidity", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send_P(200, "text/plain", readTurbidity().c_str());
  });

 // Start server
  server.begin();
}
 
void loop(){
  
}

