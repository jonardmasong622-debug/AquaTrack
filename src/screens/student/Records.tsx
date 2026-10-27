import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Screen, Header, Card, ProgressBar, Stat, Empty, SectionTitle, Chip, Loading } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { subscribeStudentAttendance, subscribeStudentEnrollments } from '../../services/db';
import { AttendanceDoc, Enrollment } from '../../types';
import { summarize } from '../../utils';
import { colors } from '../../theme';

export function rateColor(rate: number | null) {
  if (rate === null) return colors.muted;
  return rate >= 85 ? colors.present : rate >= 70 ? colors.late : colors.absent;
}

export default function Records() {
  const { profile, isDemo } = useAuth();
  const nav = useNavigation<any>();
  const [enr, setEnr] = useState<Enrollment[] | null>(null);
  const [att, setAtt] = useState<AttendanceDoc[] | null>(null);

  useEffect(() => {
    if (isDemo) { setEnr([]); setAtt([]); return; }
    if (!profile) return;
    const a = subscribeStudentEnrollments(profile.uid, setEnr);
    const b = subscribeStudentAttendance(profile.uid, setAtt);
    return () => { a(); b(); };
  }, [isDemo, profile]);

  const overall = useMemo(() => summarize(att ?? []), [att]);

  return (
    <Screen header={<Header title="My Records" subtitle="Your attendance, always up to date" />}>
      {!enr || !att ? <Loading /> : (
        <>
          <Card>
            <Text style={{ color: colors.muted, fontWeight: '700', fontSize: 12 }}>OVERALL ATTENDANCE</Text>
            <Text style={{ fontSize: 40, fontWeight: '800', color: rateColor(overall.rate), marginVertical: 4 }}>
              {overall.rate === null ? '—' : `${overall.rate}%`}
            </Text>
            <ProgressBar value={overall.rate ?? 0} color={rateColor(overall.rate)} />
            <View style={{ flexDirection: 'row', marginTop: 14 }}>
              <Stat label="Present" value={overall.present} color={colors.present} />
              <Stat label="Late" value={overall.late} color={colors.late} />
              <Stat label="Absent" value={overall.absent} color={colors.absent} />
              <Stat label="Excused" value={overall.excused} color={colors.excused} />
            </View>
          </Card>

          <SectionTitle>My classes</SectionTitle>
          {enr.length === 0 ? (
            <Empty icon="book-outline" title="No classes yet" text="Open the Classes tab and join a class with the code from your teacher." />
          ) : enr.map((e) => {
            const sum = summarize(att.filter((a) => a.classId === e.classId));
            const warn = sum.absent >= e.absenceLimit;
            return (
              <TouchableOpacity key={e.id} activeOpacity={0.85} onPress={() => nav.navigate('ClassRecord', { enrollment: e })}>
                <Card>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: colors.navy }}>{e.className}</Text>
                      <Text style={{ color: colors.muted, marginTop: 2 }}>{e.section ? `${e.section} • ` : ''}{e.teacherName}</Text>
                    </View>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: rateColor(sum.rate) }}>{sum.rate === null ? '—' : `${sum.rate}%`}</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.muted} style={{ marginLeft: 6 }} />
                  </View>
                  <View style={{ marginTop: 10 }}><ProgressBar value={sum.rate ?? 0} color={rateColor(sum.rate)} /></View>
                  {warn && <View style={{ marginTop: 10 }}><Chip status="absent" small /><Text style={{ color: colors.absent, fontSize: 12, marginTop: 4 }}>Absence limit reached ({sum.absent}/{e.absenceLimit})</Text></View>}
                </Card>
              </TouchableOpacity>
            );
          })}
        </>
      )}
    </Screen>
  );
}
