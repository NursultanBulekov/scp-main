# React Native WebView

## Configure the target URL

1. Create a `.env` file in the project root (next to `package.json`).
2. Add the public URL of your hosted frontend using the Expo-supported prefix:

```env
EXPO_PUBLIC_FRONTEND_URL=http://192.168.1.100:3000
```

Expo automatically loads `.env` files and exposes any variables prefixed with `EXPO_PUBLIC_` to the JavaScript runtime. Updating the value and restarting Metro is all you need to retarget the app.

## Run the shell locally

```bash
npm install
npm run android    # Run on Android
```
