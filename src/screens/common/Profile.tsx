import React from 'react';
import { View, Text } from 'react-native';
import { Screen, Header, Card, Button, Pill } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme';

export default function Profile({ navigation }: any) {
  const { profile, logout, isDemo } = useAuth();
  const [loggingOut, setLoggingOut] = React.useState(false);
  const [logoutError, setLogoutError] = React.useState('');
  if (!profile) return null;
  const handleLogout = async () => {
    setLoggingOut(true);
    setLogoutError('');
    try {
      await logout();
    } catch {
      setLogoutError('Could not log out. Please check your connection and try again.');
      setLoggingOut(false);
    }
  };
  const Row = ({ k, v }: { k: string; v: string }) => (
    <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>{k.toUpperCase()}</Text>
      <Text style={{ color: colors.navy, fontSize: 16, fontWeight: '600', marginTop: 2 }}>{v}</Text>
    </View>
  );
  return (
    <Screen header={<Header title="Profile" subtitle={profile.email} />}>
      <Card>
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.white, fontSize: 30, fontWeight: '800' }}>{profile.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.navy, marginTop: 10, marginBottom: 6 }}>{profile.name}</Text>
          <Pill text={profile.role === 'teacher' ? 'Teacher' : 'Student'} color={colors.sky} />
        </View>
        <Row k="Email" v={profile.email} />
        {profile.role === 'student' && <Row k="Student number" v={profile.studentNo || '—'} />}
      </Card>
      <Button title="How this app closes the 5 gaps" variant="secondary" icon="bulb-outline" onPress={() => navigation.navigate('Gaps')} style={{ marginBottom: 12 }} />
      {!!logoutError && <Text accessibilityRole="alert" style={{ color: colors.absent, marginBottom: 12, fontWeight: '600' }}>{logoutError}</Text>}
      {!isDemo && <Button
        title="Log out"
        variant="danger"
        icon="log-out-outline"
        onPress={handleLogout}
        loading={loggingOut}
      />}
    </Screen>
  );
}
