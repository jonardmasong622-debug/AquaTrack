import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithCredential, GoogleAuthProvider, sendPasswordResetEmail,
  signOut, updateProfile, User,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Profile, Role } from '../types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isDemo: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (p: { name: string; email: string; password: string; role: Role; studentNo: string }) => Promise<void>;
  loginWithGoogle: (idToken: string | null, role: Role, studentNo: string, allowRegistration: boolean) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthState>(null as unknown as AuthState);
export const useAuth = () => useContext(Ctx);

const demoProfile: Profile = {
  uid: 'demo-student',
  name: 'Demo Student',
  email: 'student@example.com',
  role: 'student',
  studentNo: '',
};

export function AuthProvider({ children, demoMode = false }: { children: React.ReactNode; demoMode?: boolean }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(demoMode ? demoProfile : null);
  const [loading, setLoading] = useState(!demoMode);

  useEffect(() => {
    if (demoMode) return;
    return onAuthStateChanged(auth, (u) => {
    setUser(u);
    if (!u) { setProfile(null); setLoading(false); }
    });
  }, [demoMode]);

  useEffect(() => {
    if (demoMode) return;
    if (!user) return;
    setLoading(true);
    return onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setProfile({ uid: user.uid, name: d.name, email: d.email, role: d.role, studentNo: d.studentNo ?? '' });
          setLoading(false);
        } // else: profile is being created during registration – keep waiting
      },
      () => setLoading(false),
    );
  }, [demoMode, user]);

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  }, []);

  const register = useCallback(async (p: { name: string; email: string; password: string; role: Role; studentNo: string }) => {
    const cred = await createUserWithEmailAndPassword(auth, p.email.trim().toLowerCase(), p.password);
    await updateProfile(cred.user, { displayName: p.name.trim() });
    await setDoc(doc(db, 'users', cred.user.uid), {
      name: p.name.trim(), email: cred.user.email, role: p.role,
      studentNo: p.role === 'student' ? p.studentNo.trim() : '', createdAt: serverTimestamp(),
    });
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string | null, role: Role, studentNo: string, allowRegistration: boolean) => {
    const credential = idToken
      ? await signInWithCredential(auth, GoogleAuthProvider.credential(idToken))
      : null;
    if (!credential) {
      const error = new Error('Google sign-in did not return an ID token.') as Error & { code: string };
      error.code = 'auth/missing-google-id-token';
      throw error;
    }

    try {
      const profileRef = doc(db, 'users', credential.user.uid);
      const existingProfile = await getDoc(profileRef);
      if (!existingProfile.exists()) {
        if (!allowRegistration) {
          const error = new Error('Register with Google from the create-account screen first.') as Error & { code: string };
          error.code = 'auth/google-account-not-registered';
          throw error;
        }
        await setDoc(profileRef, {
          name: credential.user.displayName || credential.user.email?.split('@')[0] || 'Student',
          email: credential.user.email ?? '',
          role,
          studentNo: role === 'student' ? studentNo.trim() : '',
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      await signOut(auth);
      throw error;
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
  }, []);

  const logout = useCallback(async () => {
    if (!demoMode) await signOut(auth);
  }, [demoMode]);

  return <Ctx.Provider value={{ user, profile, loading, isDemo: demoMode, login, register, loginWithGoogle, resetPassword, logout }}>{children}</Ctx.Provider>;
}
