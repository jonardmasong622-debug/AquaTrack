import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card } from '../../components/ui';
import { colors } from '../../theme';

export default function SetupFirebase() {
  return (
    <Screen>
      <View style={{ alignItems: 'center', marginVertical: 24 }}>
        <Ionicons name="flame-outline" size={54} color={colors.sky} />
        <Text style={{ fontSize: 24, fontWeight: '800', color: colors.navy, marginTop: 10 }}>Connect Firebase</Text>
      </View>
      <Card>
        <Text style={{ color: colors.text, lineHeight: 22 }}>
          The app is installed correctly, but your Firebase project is not connected yet.{'\n\n'}
          1. Open <Text style={{ fontWeight: '800' }}>src/config/firebaseConfig.ts</Text>{'\n'}
          2. Paste your Firebase web-app config values{'\n'}
          3. Save the file — the app reloads automatically.{'\n\n'}
          Full steps (Authentication, Firestore, security rules) are in README.md.
        </Text>
      </Card>
    </Screen>
  );
}
