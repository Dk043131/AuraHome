/*
  ========================================================================
  🌿 AuraHome ESP32 Smart Home Node Firmware
  ========================================================================
  Connects physical Fan, Light, Relays & Sensors to the AuraHome Platform.
  
  Sensors Supported:
  - DHT11 / DHT22 (Temperature & Relative Humidity) -> Thermal Comfort Index
  - LDR Photocell (Analog Lux Reading) -> Daylight Harvesting Auto-Dimming
  - ACS712 or CT Clamp (Current Sensor) -> Real-time Wattage & Power Analytics
  
  Actuators:
  - Fan Power Relay & Speed PWM / Multi-Tap (Levels 1-5)
  - Light Power Relay & PWM Brightness Dimming (0-100%)
  
  Libraries Required (install via Arduino IDE Library Manager):
  1. "ArduinoJson" by Benoit Blanchon (version 6.x or 7.x)
  2. "DHT sensor library" by Adafruit
  3. "Adafruit Unified Sensor" by Adafruit
  ========================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ======================== 1. USER CONFIGURATION ========================
// Replace with your local Wi-Fi credentials:
const char* WIFI_SSID     = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// AuraHome Backend URL (Uses your Mac's local network IP):
const char* SERVER_URL    = "http://10.232.190.165:8000/api/hardware/bridge";

// ======================== 2. PIN ASSIGNMENTS ========================
#define PIN_FAN_RELAY      18  // Main Fan On/Off Relay
#define PIN_FAN_PWM        19  // Fan Speed PWM Pin (0-255)
#define PIN_LIGHT_RELAY    22  // Main Light On/Off Relay
#define PIN_LIGHT_PWM      23  // Light Brightness PWM Pin (0-255)
#define PIN_DHT            4   // DHT11 or DHT22 Data Pin
#define PIN_LDR_LUX        34  // Analog LDR Photocell (ADC1_CH6)
#define PIN_CURRENT_SENSOR 35  // Analog ACS712 / CT Clamp (ADC1_CH7)

#define DHTTYPE            DHT22 // Set to DHT11 if using blue DHT11 sensor

DHT dht(PIN_DHT, DHTTYPE);

// Telemetry transmit timer (sends telemetry every 2 seconds)
unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL = 2000;

// PWM Channels for ESP32 LEDC
const int PWM_FREQ = 5000;
const int PWM_RES  = 8; // 8-bit resolution (0-255)
const int FAN_PWM_CHANNEL   = 0;
const int LIGHT_PWM_CHANNEL = 1;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n==============================================");
  Serial.println("🌿 Booting AuraHome ESP32 Hardware Node...");
  Serial.println("==============================================");

  // Setup Relay Outputs
  pinMode(PIN_FAN_RELAY, OUTPUT);
  pinMode(PIN_LIGHT_RELAY, OUTPUT);
  digitalWrite(PIN_FAN_RELAY, LOW);
  digitalWrite(PIN_LIGHT_RELAY, LOW);

  // Setup PWM Channels (ESP32 hardware PWM)
  ledcAttachChannel(PIN_FAN_PWM, PWM_FREQ, PWM_RES, FAN_PWM_CHANNEL);
  ledcAttachChannel(PIN_LIGHT_PWM, PWM_FREQ, PWM_RES, LIGHT_PWM_CHANNEL);
  ledcWrite(PIN_FAN_PWM, 0);
  ledcWrite(PIN_LIGHT_PWM, 0);

  // Initialize DHT Sensor
  dht.begin();

  // Connect to Wi-Fi
  Serial.printf("[WIFI] Connecting to '%s'", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int retry = 0;
  while (WiFi.status() != WL_CONNECTED && retry < 30) {
    delay(500);
    Serial.print(".");
    retry++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Connected successfully!");
    Serial.printf("[WIFI] ESP32 IP: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("[HUB]  Target Hub: %s\n", SERVER_URL);
  } else {
    Serial.println("\n[WIFI] Failed to connect! Check SSID & Password.");
  }
}

void loop() {
  // Transmit telemetry periodically
  if (millis() - lastSendTime >= SEND_INTERVAL) {
    lastSendTime = millis();
    sendTelemetryAndSync();
  }
}

void sendTelemetryAndSync() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WIFI] Wi-Fi lost. Attempting reconnect...");
    WiFi.reconnect();
    return;
  }

  // 1. Read Sensors
  float temperature = dht.readTemperature();
  float humidity    = dht.readHumidity();
  
  // Fallbacks if DHT sensor is not yet wired
  if (isnan(temperature)) temperature = 28.5;
  if (isnan(humidity))    humidity = 60.0;

  // Read LDR (0-4095 ADC) mapped to estimated Lux (10 - 1000)
  int rawLdr = analogRead(PIN_LDR_LUX);
  float estimatedLux = map(rawLdr, 0, 4095, 20, 1000);

  // Read ACS712 Current Sensor (2.5V center for 0A on 5V supply, scaled to 3.3V)
  int rawCurrent = analogRead(PIN_CURRENT_SENSOR);
  float currentAmps = abs((rawCurrent - 2048) * (3.3 / 4095.0) / 0.185);
  float gridVoltage = 230.0;
  float watts = gridVoltage * currentAmps;
  if (watts < 2.0) watts = 0.0; // Noise filter

  // 2. Build JSON Telemetry Payload
  StaticJsonDocument<350> txDoc;
  txDoc["device_id"]        = "esp32-node-01";
  txDoc["device_type"]      = "fan";
  txDoc["ambient_temp"]     = temperature;
  txDoc["ambient_humidity"] = humidity;
  txDoc["ambient_lux"]      = estimatedLux;
  txDoc["voltage"]          = gridVoltage;
  txDoc["watts"]            = watts;
  txDoc["vibration"]        = 0.85;

  String jsonString;
  serializeJson(txDoc, jsonString);

  // 3. Send HTTP POST to AuraHome Hub
  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");

  int httpCode = http.POST(jsonString);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.printf("[HTTP %d] Hub response: %s\n", httpCode, response.c_str());

    // 4. Parse Server Control Commands & Switch Relays / PWM
    StaticJsonDocument<300> rxDoc;
    DeserializationError err = deserializeJson(rxDoc, response);
    if (!err) {
      bool fanState         = rxDoc["fan_state"];
      int  fanSpeed         = rxDoc["fan_speed"];        // 0 to 5
      bool lightState       = rxDoc["light_state"];
      int  lightBrightness  = rxDoc["light_brightness"]; // 0 to 100

      // Actuate Physical Fan
      digitalWrite(PIN_FAN_RELAY, fanState ? HIGH : LOW);
      if (fanState) {
        // Map speed 1-5 to PWM duty cycle (0-255)
        int fanPwmDuty = map(fanSpeed, 1, 5, 80, 255);
        ledcWrite(PIN_FAN_PWM, fanPwmDuty);
      } else {
        ledcWrite(PIN_FAN_PWM, 0);
      }

      // Actuate Physical Light
      digitalWrite(PIN_LIGHT_RELAY, lightState ? HIGH : LOW);
      if (lightState) {
        int lightPwmDuty = map(lightBrightness, 0, 100, 0, 255);
        ledcWrite(PIN_LIGHT_PWM, lightPwmDuty);
      } else {
        ledcWrite(PIN_LIGHT_PWM, 0);
      }

      Serial.printf("[ACTUATE] Fan: %s (Lvl %d) | Light: %s (%d%%)\n",
        fanState ? "ON" : "OFF", fanSpeed,
        lightState ? "ON" : "OFF", lightBrightness
      );
    }
  } else {
    Serial.printf("[HTTP ERROR] Failed to reach AuraHome Hub: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
}
