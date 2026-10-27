import React, { useState } from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AuthShell from './AuthShell';
import { Button, Input } from '../../components/ui';
import GoogleSignInButton from './GoogleSignInButton';
import { useAuth } from '../../context/AuthContext';
import { friendlyAuthError, getAuthErrorCode, getAuthErrorMessage, isValidEmail } from '../../utils';
import { colors, radius } from '../../theme';
import { Role } from '../../types';

export default function Register({ navigation }: any) {
  const { register, loginWithGoogle } = useAuth();
  const [role, setRole] = useState<Role>('student');
  const [name, setName] = useState('');
  const [studentNo, setStudentNo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!isValidEmail(email)) { setError('Enter a valid email address.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (role === 'student' && !/^\d{5}$/.test(studentNo)) { setError('Student number must be exactly 5 digits.'); return; }
    setBusy(true); setError('');
    try {
      await register({ name, email, password, role, studentNo });
    } catch (e: unknown) {
      setError(friendlyAuthError(getAuthErrorCode(e), getAuthErrorMessage(e)));
    } finally {
      setBusy(false);
    }
  };

  const signUpWithGoogle = async (idToken: string | null) => {
    if (role === 'student' && !/^\d{5}$/.test(studentNo)) {
      setError('Enter exactly 5 digits for your student number before continuing with Google.');
      return;
    }
    setError('');
    await loginWithGoogle(idToken, role, studentNo, true);
  };

  const Role_ = ({ value, icon, label }: { value: Role; icon: keyof typeof Ionicons.glyphMap; label: string }) => (
    <TouchableOpacity onPress={() => setRole(value)} activeOpacity={0.85}
      style={[s.role, role === value && { backgroundColor: colors.navy, borderColor: colors.navy }]}>
      <Ionicons name={icon} size={22} color={role === value ? colors.white : colors.blue} />
      <Text style={[s.roleText, role === value && { color: colors.white }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <AuthShell title="Create account" subtitle="Pick your role, then fill in your details.">
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 18 }}>
        <Role_ value="student" icon="school-outline" label="Student" />
        <Role_ value="teacher" icon="easel-outline" label="Teacher" />
      </View>
      <Input label="Full name" value={name} onChangeText={setName} autoCapitalize="words" placeholder="Juan Dela Cruz" />
      {role === 'student' && (
        <Input
          label="Student number (5 digits)"
          value={studentNo}
          onChangeText={(value) => setStudentNo(value.replace(/\D/g, '').slice(0, 5))}
          keyboardType="number-pad"
          maxLength={5}
          placeholder="12345"
        />
      )}
      <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="you@school.edu" autoComplete="email" textContentType="emailAddress" />
      <Input label="Password (min. 6 characters)" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" autoComplete="new-password" textContentType="newPassword" />
      <Input label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="••••••••" autoComplete="new-password" textContentType="newPassword" onSubmitEditing={submit} />
      {!!error && <Text style={{ color: colors.absent, marginBottom: 12, fontWeight: '600' }}>{error}</Text>}
      <Button title="Sign up" icon="person-add-outline" onPress={submit} loading={busy} />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 8 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        <Text style={{ color: colors.muted, marginHorizontal: 12 }}>or</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </View>
      <GoogleSignInButton
        onSignIn={signUpWithGoogle}
        onError={(e) => setError(friendlyAuthError(getAuthErrorCode(e), getAuthErrorMessage(e)))}
        disabled={busy}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
        <Text style={{ color: colors.muted }}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ color: colors.blue, fontWeight: '800' }}>Log in</Text></TouchableOpacity>
      </View>
    </AuthShell>
  );
}

const s = StyleSheet.create({
  role: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 14, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white },
  roleText: { fontWeight: '800', color: colors.navy },
});
