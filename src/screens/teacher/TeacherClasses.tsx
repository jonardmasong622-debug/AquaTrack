import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Screen, Header, Card, Button, Input, Sheet, Empty, Pill, Loading } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { createClass, subscribeTeacherClasses } from '../../services/db';
import { ClassDoc } from '../../types';
import { colors } from '../../theme';

export default function TeacherClasses() {
  const { profile } = useAuth();
  const nav = useNavigation<any>();
  const [list, setList] = useState<ClassDoc[] | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [section, setSection] = useState('');
  const [late, setLate] = useState('15');
  const [limit, setLimit] = useState('3');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => (profile ? subscribeTeacherClasses(profile.uid, (l) => setList(l.sort((a, b) => a.name.localeCompare(b.name)))) : undefined), [profile]);

  const create = async () => {
    if (!profile) return;
    const lm = parseInt(late, 10), al = parseInt(limit, 10);
    if (!name.trim()) { setError('Enter a class name.'); return; }
    if (!(lm >= 0 && lm <= 180) || !(al >= 1 && al <= 30)) { setError('Late cut-off must be 0–180 minutes and absence limit 1–30.'); return; }
    setBusy(true); setError('');
    try {
      await createClass(profile, { name: name.trim(), section: section.trim(), lateMinutes: lm, absenceLimit: al });
      setOpen(false); setName(''); setSection('');
    } catch (e: any) { setError(e?.message ?? 'Could not create the class.'); }
    setBusy(false);
  };

  return (
    <Screen header={<Header title="My Classes" subtitle={`Hello, ${profile?.name.split(' ')[0] ?? ''}`}
      right={<TouchableOpacity onPress={() => setOpen(true)} style={{ backgroundColor: colors.sky, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="add" size={26} color={colors.white} /></TouchableOpacity>} />}>
      {!list ? <Loading /> : list.length === 0 ? (
        <>
          <Empty icon="easel-outline" title="Create your first class" text="Students join with a short class code. Then start a session and show the QR." />
          <Button title="New class" icon="add-circle-outline" onPress={() => setOpen(true)} />
        </>
      ) : list.map((c) => (
        <TouchableOpacity key={c.id} activeOpacity={0.85} onPress={() => nav.navigate('ClassDashboard', { cls: c })}>
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: colors.navy }}>{c.name}</Text>
                {!!c.section && <Text style={{ color: colors.muted, marginTop: 2 }}>{c.section}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <Pill text={`Code ${c.code}`} color={colors.navy} />
              <Pill text={`Late after ${c.lateMinutes} min`} color={colors.sky} />
              <Pill text={`Warn at ${c.absenceLimit} absences`} color={colors.late} />
            </View>
          </Card>
        </TouchableOpacity>
      ))}

      <Sheet visible={open} onClose={() => setOpen(false)} title="New class">
        <Input label="Class name" value={name} onChangeText={setName} autoCapitalize="words" placeholder="Mobile App Development" />
        <Input label="Section (optional)" value={section} onChangeText={setSection} autoCapitalize="characters" placeholder="BSIT 3A" />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}><Input label="Late after (min)" value={late} onChangeText={setLate} keyboardType="number-pad" /></View>
          <View style={{ flex: 1 }}><Input label="Absence limit" value={limit} onChangeText={setLimit} keyboardType="number-pad" /></View>
        </View>
        {!!error && <Text style={{ color: colors.absent, marginBottom: 10, fontWeight: '600' }}>{error}</Text>}
        <Button title="Create class" onPress={create} loading={busy} />
      </Sheet>
    </Screen>
  );
}
