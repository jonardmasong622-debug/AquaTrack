import React, { useEffect, useRef, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { useIdTokenAuthRequest } from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { Button } from '../../components/ui';
import { firebaseConfig } from '../../config/firebaseConfig';
import { colors } from '../../theme';

if (Platform.OS === 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

type Props = {
  onSignIn: (idToken: string | null) => Promise<void>;
  onError: (error: unknown) => void;
  disabled?: boolean;
};

export default function GoogleSignInButton(props: Props) {
  if (Platform.OS === 'web') {
    if (!firebaseConfig.googleWebClientId) {
      return <UnconfiguredGoogleSignInButton platform="web" />;
    }
    return <AuthSessionGoogleSignInButton {...props} clientId={firebaseConfig.googleWebClientId} />;
  }

  if (Constants.appOwnership === 'expo') {
    return (
      <View style={{ marginTop: 12 }}>
        <Button title="Google sign-in needs a development build" icon="logo-google" variant="secondary" onPress={() => undefined} disabled />
        <Text style={{ color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 8 }}>
          Google OAuth redirects are not supported by Expo Go. Use email and password here, or open a development build.
        </Text>
      </View>
    );
  }

  if (Platform.OS === 'android') {
    if (!firebaseConfig.googleWebClientId) {
      return <UnconfiguredGoogleSignInButton platform="Android server (web)" />;
    }
    return <AndroidGoogleSignInButton {...props} />;
  }

  const clientId = Platform.OS === 'ios'
    ? firebaseConfig.googleIosClientId
    : '';

  if (!clientId) {
    return <UnconfiguredGoogleSignInButton platform={Platform.OS} />;
  }

  return <AuthSessionGoogleSignInButton {...props} clientId={clientId} />;
}

function UnconfiguredGoogleSignInButton({ platform }: { platform: string }) {
  return (
    <View style={{ marginTop: 12 }}>
      <Button title="Google sign-in not configured" icon="logo-google" variant="secondary" onPress={() => undefined} disabled />
      <Text style={{ color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 8 }}>
        Add the {platform} Google OAuth client ID in src/config/firebaseConfig.ts.
      </Text>
    </View>
  );
}

function AuthSessionGoogleSignInButton({ onSignIn, onError, disabled, clientId }: Props & { clientId: string }) {
  const clientConfig = Platform.OS === 'web'
    ? { webClientId: clientId }
    : { iosClientId: clientId };
  const [request, , promptAsync] = useIdTokenAuthRequest({
    ...clientConfig,
    selectAccount: true,
  }, { native: 'com.qrattend.app:/oauthredirect' });
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    if (!request) return;
    setLoading(true);
    try {
      const result = await promptAsync();
      if (result.type === 'success') {
        const idToken = result.params.id_token || result.authentication?.idToken || null;
        if (!idToken) {
          const error = new Error('Google sign-in did not return an ID token. Check the Google OAuth client configuration.') as Error & { code: string };
          error.code = 'auth/missing-google-id-token';
          onError(error);
          return;
        }
        await onSignIn(idToken);
      } else if (result.type === 'error') {
        onError(result.error);
      }
    } catch (error) {
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ marginTop: 12 }}>
      <Button
        title="Continue with Google"
        icon="logo-google"
        variant="secondary"
        onPress={signIn}
        loading={loading}
        disabled={disabled || !request}
      />
    </View>
  );
}

function AndroidGoogleSignInButton({ onSignIn, onError, disabled }: Props) {
  type GoogleSigninApi = typeof import('@react-native-google-signin/google-signin').GoogleSignin;
  const [googleSignin, setGoogleSignin] = useState<GoogleSigninApi | null>(null);
  const [loading, setLoading] = useState(false);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    try {
      const { GoogleSignin } = require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');
      GoogleSignin.configure({
        webClientId: firebaseConfig.googleWebClientId,
        offlineAccess: true,
      });
      setGoogleSignin(GoogleSignin);
    } catch (error) {
      onErrorRef.current(error);
    }
  }, []);

  const signIn = async () => {
    if (!googleSignin) return;
    setLoading(true);
    try {
      await googleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await googleSignin.signIn();
      if (response.type === 'cancelled') return;

      const idToken = response.data?.idToken;
      if (!idToken) {
        const error = new Error('Google sign-in did not return an ID token. Check the Google OAuth client configuration.') as Error & { code: string };
        error.code = 'auth/missing-google-id-token';
        onError(error);
        return;
      }
      await onSignIn(idToken);
    } catch (error) {
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ marginTop: 12 }}>
      <Button
        title="Continue with Google"
        icon="logo-google"
        variant="secondary"
        onPress={signIn}
        loading={loading}
        disabled={disabled || !googleSignin}
      />
    </View>
  );
}
