import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Modal,
  KeyboardAvoidingView, Platform, ViewStyle, TextInputProps, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, statusColor } from '../theme';
import { Status } from '../types';
import { statusLabel } from '../utils';

export function Screen({ children, header, scroll = true, padded = true, onRefresh, refreshing }: {
  children: React.ReactNode; header?: React.ReactNode; scroll?: boolean; padded?: boolean; onRefresh?: () => void; refreshing?: boolean;
}) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[padded && { padding: 18 }, { paddingBottom: 40 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.sky} /> : undefined}
    >{children}</ScrollView>
  ) : <View style={[{ flex: 1 }, padded && { padding: 18 }]}>{children}</View>;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.navy }} edges={['top']}>
      <View style={s.screen}>
        {header}
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>{body}</KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

export function Header({ title, subtitle, right, onBack }: {
  title: string; subtitle?: string; right?: React.ReactNode; onBack?: () => void;
}) {
  return (
    <View style={s.header}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={s.backBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={colors.white} />
        </TouchableOpacity>
      )}
      <View style={{ flex: 1 }}>
        <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>
        {!!subtitle && <Text style={s.headerSub} numberOfLines={1}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

export const Card = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) =>
  <View style={[s.card, style]}>{children}</View>;

export function Button({ title, onPress, variant = 'primary', icon, loading, disabled, style }: {
  title: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap; loading?: boolean; disabled?: boolean; style?: ViewStyle;
}) {
  const bg = variant === 'primary' ? colors.navy : variant === 'secondary' ? colors.skySoft : variant === 'danger' ? colors.absent : 'transparent';
  const fg = variant === 'secondary' ? colors.navy : variant === 'ghost' ? colors.blue : colors.white;
  return (
    <TouchableOpacity
      onPress={onPress} disabled={disabled || loading} activeOpacity={0.8}
      style={[s.btn, { backgroundColor: bg, opacity: disabled ? 0.5 : 1 }, style]}
    >
      {loading ? <ActivityIndicator color={fg} /> : (
        <>
          {icon && <Ionicons name={icon} size={18} color={fg} style={{ marginRight: 8 }} />}
          <Text style={[s.btnText, { color: fg }]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export function Input({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput placeholderTextColor="#93AFCB" style={s.input} autoCapitalize="none" {...props} />
    </View>
  );
}

export function Chip({ status, small }: { status: Status; small?: boolean }) {
  const c = statusColor[status];
  return (
    <View style={[s.chip, { backgroundColor: c + '22' }, small && { paddingVertical: 2, paddingHorizontal: 8 }]}>
      <View style={[s.dot, { backgroundColor: c }]} />
      <Text style={[s.chipText, { color: c }, small && { fontSize: 11 }]}>{statusLabel[status]}</Text>
    </View>
  );
}

export function Pill({ text, color = colors.blue }: { text: string; color?: string }) {
  return <View style={[s.chip, { backgroundColor: color + '1F' }]}><Text style={[s.chipText, { color }]}>{text}</Text></View>;
}

export function ProgressBar({ value, color = colors.sky }: { value: number; color?: string }) {
  return (
    <View style={s.track}>
      <View style={[s.fill, { width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }]} />
    </View>
  );
}

export function Stat({ label, value, color = colors.navy, icon }: {
  label: string; value: string | number; color?: string; icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={s.stat}>
      {icon && <Ionicons name={icon} size={18} color={color} />}
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

export function Empty({ icon, title, text }: { icon: keyof typeof Ionicons.glyphMap; title: string; text?: string }) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}><Ionicons name={icon} size={30} color={colors.sky} /></View>
      <Text style={s.emptyTitle}>{title}</Text>
      {!!text && <Text style={s.emptyText}>{text}</Text>}
    </View>
  );
}

export const Loading = () => <View style={{ padding: 40 }}><ActivityIndicator size="large" color={colors.sky} /></View>;

export const SectionTitle = ({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) => (
  <View style={s.sectionRow}><Text style={s.section}>{children}</Text>{right}</View>
);

export function Sheet({ visible, onClose, title, children }: {
  visible: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.sheet}>
          <View style={s.grabber} />
          <Text style={s.sheetTitle}>{title}</Text>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ice },
  header: { backgroundColor: colors.navy, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  headerTitle: { color: colors.white, fontSize: 22, fontWeight: '800' },
  headerSub: { color: colors.skySoft, fontSize: 13, marginTop: 2 },
  card: { backgroundColor: colors.white, borderRadius: radius.md, padding: 16, marginBottom: 12, ...shadow },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 18, borderRadius: radius.md, minHeight: 48 },
  btnText: { fontSize: 15, fontWeight: '700' },
  label: { color: colors.muted, fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: colors.text },
  chip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  chipText: { fontSize: 12, fontWeight: '700' },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  track: { height: 8, backgroundColor: colors.skySoft + '88', borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  statValue: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  statLabel: { fontSize: 11, color: colors.muted, fontWeight: '600', marginTop: 2 },
  empty: { alignItems: 'center', padding: 30 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.skySoft + '66', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  emptyText: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 6, lineHeight: 19 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 10 },
  section: { fontSize: 14, fontWeight: '800', color: colors.navy, textTransform: 'uppercase', letterSpacing: 0.6 },
  backdrop: { flex: 1, backgroundColor: 'rgba(7,31,64,0.45)' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 34 },
  grabber: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: 14 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 14 },
});
