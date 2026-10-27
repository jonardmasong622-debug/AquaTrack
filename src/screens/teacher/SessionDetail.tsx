import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Screen, Header, Card, Chip, Stat, Button, SectionTitle } from '../../components/ui';
import StatusSheet from '../../components/StatusSheet';
import { finalizeAbsences, setStatus, subscribeClassEnrollments, subscribeSessionAttendance } from '../../services/db';
import { AttendanceDoc, Enrollment, Status } from '../../types';
import { fmtTime, summarize } from '../../utils';
import { colors } from '../../theme';

export default function SessionDetail({ route, navigation }: any) {
  const { cls, session } = route.params;
  const [members, setMembers] = useState<Enrollment[]>([]);
  const [att, setAtt] = useState<AttendanceDoc[]>([]);
  const [pick, setPick] = useState<Enrollment | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const a = subscribeClassEnrollments(cls.id, setMembers);
    const b = subscribeSessionAttendance(cls.id, session.id, setAtt);
    return () => { a(); b(); };
  }, [cls.id, session.id]);

  const sum = useMemo(() => summarize(att), [att]);
  const missing = members.filter((m) => !att.some((a) => a.studentId === m.studentId));

  const choose = async (status: Status) => {
    if (!pick) return;
    const m = pick; setPick(null);
    try { await setStatus(session, m, status); } catch { Alert.alert('Error', 'Could not update the status.'); }
  };

  const fill = async () => {
    setBusy(true);
    try { await finalizeAbsences(session, cls, members); } catch (e: any) { Alert.alert('Error', e?.message ?? 'Try again.'); }
    setBusy(false);
  };

  return (
    <Screen header={<Header title="Session record" subtitle={session.title} onBack={() => navigation.goBack()} />}>
      <Card>
        <View style={{ flexDirection: 'row' }}>
          <Stat label="Present" value={sum.present} color={colors.present} />
          <Stat label="Late" value={sum.late} color={colors.late} />
          <Stat label="Absent" value={sum.absent} color={colors.absent} />
          <Stat label="Excused" value={sum.excused} color={colors.excused} />
        </View>
      </Card>
      {missing.length > 0 && (
        <Button title={`Mark ${missing.length} unrecorded as absent`} variant="secondary" icon="person-remove-outline" onPress={fill} loading={busy} style={{ marginBottom: 12 }} />
      )}
      <SectionTitle>Tap a student to change status</SectionTitle>
      {members.map((m) => {
        const a = att.find((x) => x.studentId === m.studentId);
        return (
          <TouchableOpacity key={m.id} activeOpacity={0.85} onPress={() => setPick(m)}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: colors.navy }}>{m.studentName}</Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>
                  {a ? (a.source === 'scan' ? `Scanned ${fmtTime(a.markedAt)}` : a.source === 'auto' ? 'Auto-recorded' : 'Set by teacher') : m.studentNo}
                </Text>
              </View>
              {a ? <Chip status={a.status} /> : <Text style={{ color: colors.muted }}>No record</Text>}
            </Card>
          </TouchableOpacity>
        );
      })}
      <StatusSheet name={pick?.studentName ?? null} current={att.find((a) => a.studentId === pick?.studentId)?.status} onPick={choose} onClose={() => setPick(null)} />
    </Screen>
  );
}
