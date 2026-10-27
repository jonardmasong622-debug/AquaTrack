import React, { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Button, Chip } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { ScanResult, submitScan } from '../../services/db';
import { colors, radius } from '../../theme';

type State =
  | { kind: 'idle' }
  | { kind: 'busy' }
  | { kind: 'ok'; result: ScanResult }
  | { kind: 'error'; message: string };

export default function Scan() {
  const { profile, isDemo } = useAuth();
  const focused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<State>({ kind: 'idle' });
  const lock = useRef(false);

  const onScan = useCallback(async ({ data }: { data: string }) => {
    if (lock.current || !profile) return;
    lock.current = true;
    setState({ kind: 'busy' });
    try {
      const result = await submitScan(profile, data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setState({ kind: 'ok', result });
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setState({ kind: 'error', message: e?.message ?? 'Could not record attendance.' });
    }
  }, [profile]);

  const reset = () => { lock.current = false; setState({ kind: 'idle' }); };

  if (isDemo) {
    return (
      <SafeAreaView style={[s.root, s.center]}>
        <Ionicons name="qr-code-outline" size={56} color={colors.sky} />
        <Text style={s.big}>Student demo</Text>
        <Text style={s.small}>Sign in to scan a class QR code and record attendance.</Text>
      </SafeAreaView>
    );
  }

  if (!permission) return <View style={s.root} />;
  if (!permission.granted) {
    return (
      <SafeAreaView style={[s.root, s.center]}>
        <Ionicons name="camera-outline" size={56} color={colors.sky} />
        <Text style={s.big}>Camera access needed</Text>
        <Text style={s.small}>Allow the camera so you can scan the class QR code.</Text>
        <Button title="Allow camera" onPress={requestPermission} style={{ marginTop: 18, alignSelf: 'stretch', backgroundColor: colors.sky }} />
      </SafeAreaView>
    );
  }

  return (
    <View style={s.root}>
      {focused && state.kind === 'idle' && (
        <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={onScan} />
      )}
      <SafeAreaView style={s.overlay} pointerEvents="box-none">
        <View style={s.top}>
          <Text style={s.title}>Scan class QR</Text>
          <Text style={s.hint}>Point at the code on your teacher’s screen</Text>
        </View>

        {state.kind === 'idle' && <View style={s.frame}><View style={[s.corner, s.tl]} /><View style={[s.corner, s.tr]} /><View style={[s.corner, s.bl]} /><View style={[s.corner, s.br]} /></View>}

        {state.kind === 'busy' && <View style={s.panel}><ActivityIndicator size="large" color={colors.sky} /><Text style={s.panelText}>Checking in…</Text></View>}

        {state.kind === 'ok' && (
          <View style={s.panel}>
            <Ionicons name="checkmark-circle" size={64} color={state.result.status === 'late' ? colors.late : colors.present} />
            <Text style={s.panelTitle}>You’re checked in!</Text>
            <Chip status={state.result.status} />
            <Text style={s.panelText}>{state.result.className}{'\n'}{state.result.title}</Text>
            <Button title="Done" variant="secondary" onPress={reset} style={{ alignSelf: 'stretch', marginTop: 8 }} />
          </View>
        )}

        {state.kind === 'error' && (
          <View style={s.panel}>
            <Ionicons name="alert-circle" size={64} color={colors.absent} />
            <Text style={s.panelTitle}>Couldn’t check in</Text>
            <Text style={s.panelText}>{state.message}</Text>
            <Button title="Scan again" icon="scan-outline" onPress={reset} style={{ alignSelf: 'stretch', marginTop: 8 }} />
          </View>
        )}
        <View style={{ height: 10 }} />
      </SafeAreaView>
    </View>
  );
}

const C = 34;
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navyDeep },
  center: { alignItems: 'center', justifyContent: 'center', padding: 30 },
  big: { color: colors.white, fontSize: 20, fontWeight: '800', marginTop: 14 },
  small: { color: colors.skySoft, textAlign: 'center', marginTop: 6 },
  overlay: { flex: 1, justifyContent: 'space-between', alignItems: 'center' },
  top: { alignItems: 'center', paddingTop: 14, paddingHorizontal: 20, paddingBottom: 14, backgroundColor: 'rgba(7,31,64,0.6)', alignSelf: 'stretch' },
  title: { color: colors.white, fontSize: 22, fontWeight: '800' },
  hint: { color: colors.skySoft, marginTop: 4 },
  frame: { width: 250, height: 250 },
  corner: { position: 'absolute', width: C, height: C, borderColor: colors.sky, borderWidth: 5 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 14 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 14 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 14 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 14 },
  panel: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 24, alignItems: 'center', gap: 10, width: '86%', marginBottom: 40 },
  panelTitle: { fontSize: 20, fontWeight: '800', color: colors.navy },
  panelText: { color: colors.muted, textAlign: 'center', lineHeight: 20 },
});
