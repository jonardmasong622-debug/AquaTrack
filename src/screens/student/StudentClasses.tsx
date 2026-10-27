import React, { useEffect, useState } from 'react';
import { View, Text, Alert, TouchableOpacity } from 'react-native';
import { Screen, Header, Card, Input, Button, Empty, SectionTitle, Loading } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { joinClass, leaveClass, subscribeStudentEnrollments } from '../../services/db';
import { Enrollment } from '../../types';
import { colors } from '../../theme';

export default function StudentClasses() {
  const { profile, isDemo } = useAuth();
  const [list, setList] = useState<Enrollment[] | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (isDemo) { setList([]); return; }
    return profile ? subscribeStudentEnrollments(profile.uid, setList) : undefined;
  }, [isDemo, profile]);

  const join = async () => {
    if (isDemo) {
      setMsg({ ok: false, text: 'Sign in to join a class.' });
      return;
    }
    if (!profile) return;
    setBusy(true); setMsg(null);
    try {
      const name = await joinClass(profile, code);
      setMsg({ ok: true, text: `Joined ${name}.` }); setCode('');
    } catch (e: any) { setMsg({ ok: false, text: e?.message ?? 'Could not join the class.' }); }
    setBusy(false);
  };

  const leave = (e: Enrollment) =>
    Alert.alert('Leave class?', `Remove yourself from ${e.className}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => leaveClass(e.id).catch(() => Alert.alert('Error', 'Could not leave the class.')) },
    ]);

  return (
    <Screen header={<Header title="Classes" subtitle="Join with your teacher’s code" />}>
      <Card>
        <Input label="Class code" value={code} onChangeText={(t) => setCode(t.toUpperCase())} autoCapitalize="characters" placeholder="e.g. K7M2QX" maxLength={8} />
        {!!msg && <Text style={{ color: msg.ok ? colors.present : colors.absent, fontWeight: '600', marginBottom: 10 }}>{msg.text}</Text>}
        <Button title="Join class" icon="add-circle-outline" onPress={join} loading={busy} />
      </Card>
      <SectionTitle>Joined classes</SectionTitle>
      {!list ? <Loading /> : list.length === 0 ? <Empty icon="book-outline" title="Nothing joined yet" text="Ask your teacher for the 6-character class code." /> :
        list.map((e) => (
          <Card key={e.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', fontSize: 16, color: colors.navy }}>{e.className}</Text>
              <Text style={{ color: colors.muted, marginTop: 2 }}>{e.section ? `${e.section} • ` : ''}{e.teacherName}</Text>
            </View>
            <TouchableOpacity onPress={() => leave(e)}><Text style={{ color: colors.absent, fontWeight: '700' }}>Leave</Text></TouchableOpacity>
          </Card>
        ))}
    </Screen>
  );
}
