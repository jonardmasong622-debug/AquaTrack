import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import AuthShell from './AuthShell';
import { Button, Input } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import GoogleSignInButton from './GoogleSignInButton';
import { friendlyAuthError, getAuthErrorCode, getAuthErrorMessage, isValidEmail } from '../../utils';
import { colors } from '../../theme';

export default function Login({ navigation }: any) {
  const { login, loginWithGoogle, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const submit = async () => {
    if (!email.trim() || !password) { setError('Enter your email and password.'); setNotice(''); return; }
    if (!isValidEmail(email)) { setError('Enter a valid email address.'); setNotice(''); return; }
    setBusy(true); setError('');
    setNotice('');
    try {
      await login(email, password);
    } catch (e: unknown) {
      setError(friendlyAuthError(getAuthErrorCode(e), getAuthErrorMessage(e)));
    } finally {
      setBusy(false);
    }
  };

  const sendResetEmail = async () => {
    if (!email.trim()) { setError('Enter your email address first.'); setNotice(''); return; }
    if (!isValidEmail(email)) { setError('Enter a valid email address.'); setNotice(''); return; }
    setResetBusy(true); setError(''); setNotice('');
    try {
      await resetPassword(email);
      setNotice('If an account exists for this email, a password reset link has been sent.');
    } catch (e: unknown) {
      const code = getAuthErrorCode(e);
      setError(code === 'auth/user-not-found'
        ? 'If an account exists for this email, a password reset link has been sent.'
        : friendlyAuthError(code, getAuthErrorMessage(e)));
    } finally {
      setResetBusy(false);
    }
  };

  const signInWithGoogle = async (idToken: string | null) => {
    setError(''); setNotice('');
    await loginWithGoogle(idToken, 'student', '', false);
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in once — you’ll stay signed in for quick check-ins.">
      <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="you@school.edu" autoComplete="email" textContentType="emailAddress" />
      <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" onSubmitEditing={submit} autoComplete="current-password" textContentType="password" />
      <View style={{ alignItems: 'flex-end', marginTop: -6, marginBottom: 14 }}>
        <TouchableOpacity onPress={sendResetEmail} disabled={busy || resetBusy}>
          <Text style={{ color: colors.blue, fontWeight: '800' }}>{resetBusy ? 'Sending reset link…' : 'Forgot password?'}</Text>
        </TouchableOpacity>
      </View>
      {!!error && <Text style={{ color: colors.absent, marginBottom: 12, fontWeight: '600' }}>{error}</Text>}
      {!!notice && <Text accessibilityRole="alert" style={{ color: colors.present, marginBottom: 12, fontWeight: '600' }}>{notice}</Text>}
      <Button title="Log in" icon="log-in-outline" onPress={submit} loading={busy} disabled={resetBusy} />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 8 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        <Text style={{ color: colors.muted, marginHorizontal: 12 }}>or</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </View>
      <GoogleSignInButton onSignIn={signInWithGoogle} onError={(e) => setError(friendlyAuthError(getAuthErrorCode(e), getAuthErrorMessage(e)))} disabled={busy || resetBusy} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
        <Text style={{ color: colors.muted }}>New here? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={{ color: colors.blue, fontWeight: '800' }}>Create an account</Text>
        </TouchableOpacity>
      </View>
    </AuthShell>
  );
}
