import React from 'react';
import { Text, View } from 'react-native';
import { Screen, Header, Card, Pill, SectionTitle } from '../../components/ui';
import { colors } from '../../theme';

const GAPS = [
  { n: 1, gap: 'Check-in not always faster than manual', feature: 'One-Scan QR Check-In',
    how: 'Stay logged in, open the Scan tab (it opens first) and scan once. No typing, no searching for a name — the whole class can scan at the same time.' },
  { n: 2, gap: 'Proxy attendance is still possible', feature: 'Refreshing QR Code with Personal Login',
    how: 'The class code changes every 30 seconds, only works inside a logged-in student account, and the token is never readable by students. Each student can be marked once per class.' },
  { n: 3, gap: 'Only present or absent', feature: 'Attendance Status Options',
    how: 'Present, Late, Absent and Excused. The teacher sets a late cut-off; scans after it are marked Late automatically, and the teacher can mark anyone Excused.' },
  { n: 4, gap: 'Records hard to manage and slow to access', feature: 'Automatic Records with Summary Dashboard',
    how: 'Every scan is saved instantly. Teachers see present / late / absent counts and every student’s percentage; students see their own record in My Records.' },
  { n: 5, gap: 'No absence reporting', feature: 'Absence Alert',
    how: 'When class ends, students with no scan are marked Absent and get an in-app alert. Reaching the class absence limit (default 3) sends a warning.' },
];

const LEFT_OUT = ['Facial recognition with liveness check', 'Offline mode with background sync', 'Online / hybrid class mode', 'School-system integration and analytics'];

export default function Gaps({ navigation }: any) {
  return (
    <Screen header={<Header title="Gaps & Features" subtitle="From the gap analysis" onBack={() => navigation.goBack()} />}>
      {GAPS.map((g) => (
        <Card key={g.n}>
          <Pill text={`Gap ${g.n}`} color={colors.blue} />
          <Text style={{ fontWeight: '800', fontSize: 16, color: colors.navy, marginTop: 8 }}>{g.gap}</Text>
          <View style={{ backgroundColor: colors.ice, borderRadius: 12, padding: 12, marginTop: 10 }}>
            <Text style={{ color: colors.sky, fontWeight: '800', fontSize: 12 }}>FEATURE</Text>
            <Text style={{ color: colors.navy, fontWeight: '800', marginTop: 2 }}>{g.feature}</Text>
            <Text style={{ color: colors.text, marginTop: 6, lineHeight: 20 }}>{g.how}</Text>
          </View>
        </Card>
      ))}
      <SectionTitle>Planned for later versions</SectionTitle>
      <Card>{LEFT_OUT.map((x) => <Text key={x} style={{ color: colors.muted, paddingVertical: 3 }}>• {x}</Text>)}</Card>
    </Screen>
  );
}
