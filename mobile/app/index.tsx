import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';

const FRONTEND_URL = process.env.EXPO_PUBLIC_FRONTEND_URL;

export default function WebShellScreen() {
  const [lastError, setLastError] = useState<string | null>(null);

  if (!FRONTEND_URL) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={styles.title}>Missing frontend URL</Text>
        <Text style={styles.message}>Set EXPO_PUBLIC_FRONTEND_URL in your .env file.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ uri: FRONTEND_URL }}
        style={styles.webview}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" />
          </View>
        )}
        onError={({ nativeEvent }) => setLastError(nativeEvent.description)}
        originWhitelist={['*']}
        mixedContentMode="always"
      />
      {lastError && (
        <View style={styles.errorBanner}>
          <Text style={styles.title}>Unable to load site</Text>
          <Text style={styles.message}>{lastError}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  errorBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#ddd',
  },
});
