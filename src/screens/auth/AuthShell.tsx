import React from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.navy }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={s.top}>
              <View style={s.logo}><Ionicons name="qr-code" size={34} color={colors.navy} /></View>
              <Text style={s.brand}>QR Attend</Text>
              <Text style={s.tag}>Scan once. You’re in.</Text>
            </View>
            <View style={s.sheet}>
              <Text style={s.title}>{title}</Text>
              <Text style={s.sub}>{subtitle}</Text>
              {children}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  top: { alignItems: 'center', paddingTop: 30, paddingBottom: 34 },
  logo: { width: 68, height: 68, borderRadius: 22, backgroundColor: colors.skySoft, alignItems: 'center', justifyContent: 'center' },
  brand: { color: colors.white, fontSize: 28, fontWeight: '800', marginTop: 12 },
  tag: { color: colors.sky, fontSize: 14, fontWeight: '600', marginTop: 4 },
  sheet: { flex: 1, backgroundColor: colors.ice, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingTop: 28, minHeight: 420 },
  title: { fontSize: 24, fontWeight: '800', color: colors.navy },
  sub: { fontSize: 14, color: colors.muted, marginTop: 4, marginBottom: 22 },
});
