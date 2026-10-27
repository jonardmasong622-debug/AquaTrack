import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Card, Button, Stat, ProgressBar, Chip, Empty, SectionTitle, Pill, Loading } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { startSession, subscribeClassAttendance, subscribeClassEnrollments, subscribeClassSessions } from '../../services/db';
import { AttendanceDoc, Enrollment, SessionDoc } from '../../types';
import { summarize } from '../../utils';
import { colors } from '../../theme';
import { rateColor } from '../student/Records';

export default function ClassDashboard({ route, navigation }: any) {
  const cls = route.params.cls;
  const { profile } = useAuth();
  const [members, setMembers] = useState<Enrollment[] | null>(null);
  const [att, setAtt] = useState<AttendanceDoc[] | null>(null);
  const [sessions, setSessions] = useState<SessionDoc[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const a = subscribeClassEnrollments(cls.id, setMembers);
    const b = subscribeClassAttendance(cls.id, setAtt);
    const c = subscribeClassSessions(cls.id, setSessions);
    return () => { a(); b(); c(); };
  }, [cls.id]);

  const openSession = sessions.find((s) => s.open);

  const rows = useMemo(() => (members ?? []).map((m) => ({
    m, sum: summarize((att ?? []).filter((a) => a.studentId === m.studentId)),
  })).sort((a, b) => a.m.studentName.localeCompare(b.m.studentName)), [members, att]);

  const rates = rows.map((r) => r.sum.rate).filter((r): r is number => r !== null);
  const avg = rates.length ? Math.round(rates.reduce((x, y) => x + y, 0) / rates.length) : null;
  const atRisk = rows.filter((r) => r.sum.absent >= cls.absenceLimit).length;
  const closed = sessions.filter((s) => !s.open).length;

  const start = async () => {
    if (!profile) return;
    setBusy(true);
    try {
      const { id, token } = await startSession(cls, profile);
      navigation.navigate('LiveSession', { cls, sessionId: id, token });
    } catch (e: any) { Alert.alert('Could not start session', e?.message ?? 'Try again.'); }
    setBusy(false);
  };

  return (
    <Screen header={<Header title={cls.name} subtitle={cls.section || 'Class dashboard'} onBack={() => navigation.goBack()} />}>
      <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>CLASS CODE</Text>
          <Text style={{ fontSize: 28, fontWeight: '800', letterSpacing: 4, color: colors.navy }}>{cls.code}</Text>
        </View>
        <TouchableOpacity onPress={() => Share.share({ message: `Join ${cls.name} on QR Attend with class code ${cls.code}` })}
          style={{ padding: 10, backgroundColor: colors.skySoft, borderRadius: 14 }}>
          <Ionicons name="share-outline" size={22} color={colors.navy} />
        </TouchableOpacity>
      </Card>

      <Button title={openSession ? 'Resume live session' : 'Start class session'} icon={openSession ? 'radio-outline' : 'qr-code-outline'} onPress={start} loading={busy} style={{ marginBottom: 14 }} />

      <Card>
        <View style={{ flexDirection: 'row' }}>
          <Stat label="Students" value={members?.length ?? '–'} icon="people-outline" />
          <Stat label="Sessions" value={closed} icon="calendar-outline" />
          <Stat label="Avg. rate" value={avg === null ? '—' : `${avg}%`} color={rateColor(avg)} icon="stats-chart-outline" />
          <Stat label="At risk" value={atRisk} color={atRisk ? colors.absent : colors.navy} icon="warning-outline" />
        </View>
      </Card>

      <SectionTitle>Students</SectionTitle>
      {!members || !att ? <Loading /> : rows.length === 0 ? (
        <Empty icon="people-outline" title="No students yet" text={`Ask students to join with code ${cls.code}.`} />
      ) : rows.map(({ m, sum }) => (
        <Card key={m.id}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', color: colors.navy, fontSize: 15 }}>{m.studentName}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{m.studentNo}</Text>
            </View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: rateColor(sum.rate) }}>{sum.rate === null ? '—' : `${sum.rate}%`}</Text>
          </View>
          <View style={{ marginVertical: 8 }}><ProgressBar value={sum.rate ?? 0} color={rateColor(sum.rate)} /></View>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <Text style={{ color: colors.present, fontWeight: '700', fontSize: 12 }}>P {sum.present}</Text>
            <Text style={{ color: colors.late, fontWeight: '700', fontSize: 12 }}>L {sum.late}</Text>
            <Text style={{ color: colors.absent, fontWeight: '700', fontSize: 12 }}>A {sum.absent}</Text>
            <Text style={{ color: colors.excused, fontWeight: '700', fontSize: 12 }}>E {sum.excused}</Text>
            {sum.absent >= cls.absenceLimit && <Pill text="Absence limit" color={colors.absent} />}
          </View>
        </Card>
      ))}

      <SectionTitle>Sessions</SectionTitle>
      {sessions.length === 0 ? <Empty icon="calendar-outline" title="No sessions yet" /> : sessions.map((s) => {
        const sa = (att ?? []).filter((a) => a.sessionId === s.id);
        const sum = summarize(sa);
        return (
          <TouchableOpacity key={s.id} activeOpacity={0.85}
            onPress={() => s.open ? start() : navigation.navigate('SessionDetail', { cls, session: s })}>
            <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', color: colors.navy }}>{s.title}</Text>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                  {sum.present + sum.late} attended • {sum.absent} absent • {sum.excused} excused
                </Text>
              </View>
              {s.open ? <Pill text="LIVE" color={colors.absent} /> : <Ionicons name="chevron-forward" size={18} color={colors.muted} />}
            </Card>
          </TouchableOpacity>
        );
      })}
    </Screen>
  );
}
