import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useKeepAwake } from 'expo-keep-awake';
import { Screen, Header, Card, Button, ProgressBar, Stat, Chip, Pill, SectionTitle } from '../../components/ui';
import StatusSheet from '../../components/StatusSheet';
import {
  TOKEN_SECONDS, buildQr, closeSession, rotateToken, setStatus, subscribeClassEnrollments,
  subscribeSession, subscribeSessionAttendance,
} from '../../services/db';
import { AttendanceDoc, Enrollment, SessionDoc, Status } from '../../types';
import { fmtTime, summarize } from '../../utils';
import { colors, radius, shadow } from '../../theme';

export default function LiveSession({ route, navigation }: any) {
  const { cls, sessionId, token: initialToken } = route.params;
  useKeepAwake();
  const [token, setToken] = useState<string>(initialToken);
  const tokenRef = useRef<string>(initialToken);
  const [secs, setSecs] = useState(TOKEN_SECONDS);
  const [session, setSession] = useState<SessionDoc | null>(null);
  const [members, setMembers] = useState<Enrollment[]>([]);
  const [att, setAtt] = useState<AttendanceDoc[]>([]);
  const [pick, setPick] = useState<Enrollment | null>(null);
  const [ending, setEnding] = useState(false);
  const [netError, setNetError] = useState(false);

  useEffect(() => {
    const a = subscribeSession(sessionId, setSession);
    const b = subscribeClassEnrollments(cls.id, setMembers);
    const c = subscribeSessionAttendance(cls.id, sessionId, setAtt);
    return () => { a(); b(); c(); };
  }, [cls.id, sessionId]);

  // Refreshing QR: a new token every 30 seconds.
  useEffect(() => {
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += 1;
      setSecs(TOKEN_SECONDS - (elapsed % TOKEN_SECONDS));
      if (elapsed % TOKEN_SECONDS === 0) {
        rotateToken(sessionId, tokenRef.current)
          .then((t) => { tokenRef.current = t; setToken(t); setNetError(false); })
          .catch(() => setNetError(true));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionId]);

  const sum = useMemo(() => summarize(att), [att]);
  const rows = useMemo(() => members.map((m) => ({ m, a: att.find((x) => x.studentId === m.studentId) }))
    .sort((x, y) => (x.a ? 0 : 1) - (y.a ? 0 : 1) || x.m.studentName.localeCompare(y.m.studentName)), [members, att]);
  const waiting = members.length - att.length;

  const end = () => Alert.alert(
    'End class session?',
    `${waiting} student${waiting === 1 ? '' : 's'} with no check-in will be marked Absent and notified.`,
    [
      { text: 'Keep open', style: 'cancel' },
      { text: 'End session', style: 'destructive', onPress: async () => {
        if (!session) return;
        setEnding(true);
        try { await closeSession(session, cls, members); navigation.goBack(); }
        catch (e: any) { setEnding(false); Alert.alert('Could not end session', e?.message ?? 'Try again.'); }
      } },
    ],
  );

  const choose = async (status: Status) => {
    if (!session || !pick) return;
    const m = pick; setPick(null);
    try { await setStatus(session, m, status); } catch { Alert.alert('Error', 'Could not update the status.'); }
  };

  return (
    <Screen header={<Header title="Live session" subtitle={cls.name} onBack={() => navigation.goBack()} right={<Pill text="LIVE" color={colors.absent} />} />}>
      <View style={s.qrCard}>
        <View style={s.qrBox}>
          <QRCode value={buildQr(sessionId, token)} size={230} color={colors.navy} backgroundColor="#FFFFFF" ecl="M" />
        </View>
        <View style={{ alignSelf: 'stretch', marginTop: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={s.refresh}>Code refreshes in {secs}s</Text>
            {netError && <Text style={{ color: colors.absent, fontWeight: '700', fontSize: 12 }}>Reconnecting…</Text>}
          </View>
          <ProgressBar value={(secs / TOKEN_SECONDS) * 100} color={colors.sky} />
        </View>
        {session && <Text style={s.late}>On time until {fmtTime(session.lateAt)} • then marked Late</Text>}
      </View>

      <Card>
        <View style={{ flexDirection: 'row' }}>
          <Stat label="Present" value={sum.present} color={colors.present} />
          <Stat label="Late" value={sum.late} color={colors.late} />
          <Stat label="Excused" value={sum.excused} color={colors.excused} />
          <Stat label="Waiting" value={Math.max(0, waiting)} color={colors.navy} />
        </View>
      </Card>

      <SectionTitle>Students</SectionTitle>
      {rows.map(({ m, a }) => (
        <TouchableOpacity key={m.id} activeOpacity={0.85} onPress={() => setPick(m)}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: colors.navy }}>{m.studentName}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{a ? (a.source === 'scan' ? `Scanned ${fmtTime(a.markedAt)}` : 'Set by you') : m.studentNo}</Text>
            </View>
            {a ? <Chip status={a.status} /> : <Text style={{ color: colors.muted, fontWeight: '600' }}>Not yet</Text>}
          </Card>
        </TouchableOpacity>
      ))}

      <Button title="End session" variant="danger" icon="stop-circle-outline" onPress={end} loading={ending} style={{ marginTop: 10 }} />
      <StatusSheet name={pick?.studentName ?? null} current={att.find((a) => a.studentId === pick?.studentId)?.status} onPick={choose} onClose={() => setPick(null)} />
    </Screen>
  );
}

const s = StyleSheet.create({
  qrCard: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 20, alignItems: 'center', marginBottom: 14, ...shadow },
  qrBox: { padding: 14, borderRadius: 18, borderWidth: 3, borderColor: colors.skySoft, backgroundColor: '#fff' },
  refresh: { color: colors.navy, fontWeight: '800' },
  late: { color: colors.muted, marginTop: 12, fontSize: 13 },
});
