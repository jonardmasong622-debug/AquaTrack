import React, { useEffect, useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { Screen, Header, Card, ProgressBar, Stat, Chip, Empty, SectionTitle, Loading } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { subscribeClassSessions, subscribeStudentAttendance } from '../../services/db';
import { AttendanceDoc, SessionDoc } from '../../types';
import { fmtTime, summarize } from '../../utils';
import { colors } from '../../theme';
import { rateColor } from './Records';

export default function ClassRecord({ route, navigation }: any) {
  const e = route.params.enrollment;
  const { profile } = useAuth();
  const [att, setAtt] = useState<AttendanceDoc[] | null>(null);
  const [sessions, setSessions] = useState<SessionDoc[]>([]);

  useEffect(() => {
    if (!profile) return;
    const a = subscribeStudentAttendance(profile.uid, setAtt);
    const b = subscribeClassSessions(e.classId, setSessions);
    return () => { a(); b(); };
  }, [profile, e.classId]);

  const mine = useMemo(() => (att ?? []).filter((a) => a.classId === e.classId), [att, e.classId]);
  const sum = summarize(mine);
  const rows = sessions.filter((s) => mine.some((a) => a.sessionId === s.id));

  return (
    <Screen header={<Header title={e.className} subtitle={e.teacherName} onBack={() => navigation.goBack()} />}>
      {!att ? <Loading /> : (
        <>
          <Card>
            <Text style={{ color: colors.muted, fontWeight: '700', fontSize: 12 }}>ATTENDANCE RATE</Text>
            <Text style={{ fontSize: 38, fontWeight: '800', color: rateColor(sum.rate) }}>{sum.rate === null ? '—' : `${sum.rate}%`}</Text>
            <ProgressBar value={sum.rate ?? 0} color={rateColor(sum.rate)} />
            <View style={{ flexDirection: 'row', marginTop: 14 }}>
              <Stat label="Present" value={sum.present} color={colors.present} />
              <Stat label="Late" value={sum.late} color={colors.late} />
              <Stat label="Absent" value={`${sum.absent}/${e.absenceLimit}`} color={colors.absent} />
              <Stat label="Excused" value={sum.excused} color={colors.excused} />
            </View>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>Excused absences are not counted against your rate.</Text>
          </Card>
          <SectionTitle>Class by class</SectionTitle>
          {rows.length === 0 ? <Empty icon="calendar-outline" title="No records yet" text="Your check-ins will appear here instantly." /> :
            rows.map((s) => {
              const a = mine.find((x) => x.sessionId === s.id)!;
              return (
                <Card key={s.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ fontWeight: '700', color: colors.navy }}>{s.title}</Text>
                    <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                      {a.source === 'scan' ? `Scanned at ${fmtTime(a.markedAt)}` : a.source === 'auto' ? 'Auto-recorded when class ended' : 'Set by teacher'}
                    </Text>
                  </View>
                  <Chip status={a.status} />
                </Card>
              );
            })}
        </>
      )}
    </Screen>
  );
}
