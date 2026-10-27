import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { NotifProvider } from './src/context/NotifContext';
import Navigation from './src/navigation';
import { isFirebaseConfigured } from './src/config/firebaseConfig';
import { DEMO_MODE } from './src/config/appConfig';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {isFirebaseConfigured ? (
        <AuthProvider demoMode={DEMO_MODE}><NotifProvider><Navigation /></NotifProvider></AuthProvider>
      ) : <Navigation />}
    </SafeAreaProvider>
  );
}
