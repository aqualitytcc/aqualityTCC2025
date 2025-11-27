// app.config.js

module.exports = {
  "expo": {
    "name": "Aquality-Mobile",
    "slug": "Aquality-Mobile",
    "version": "1.0.1",
    "orientation": "portrait",
    "icon": "./assets/aquality-logo.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/aquality-logo.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true
    },
    "android": {
      // GARANTA QUE A LINHA "usesCleartextTraffic" FOI REMOVIDA DAQUI
      "adaptiveIcon": {
        "foregroundImage": "./assets/aquality-logo.png",
        "backgroundColor": "#ffffff"
      },
      "edgeToEdgeEnabled": true,
      "package": "com.erickzxx.AqualityMobile"
    },
    "web": {
      "favicon": "./assets/aquality-logo.png"
    },
    "extra": {
      "eas": {
        "projectId": "d8b02c01-e6b5-4fa8-9056-10b00e428e08"
      }
    },
    // ADICIONE ESTA SEÇÃO DE PLUGINS NO FINAL
    "plugins": [
      [
        "@expo/config-plugins/build/android/Manifest",
        (config) => {
          config.modResults.manifest.application[0].$["android:usesCleartextTraffic"] = "true";
          return config;
        }
      ]
    ]
  }
};