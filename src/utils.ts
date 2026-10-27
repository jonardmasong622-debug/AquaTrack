import { AttendanceDoc, Status } from './types';

export interface Summary {
  present: number; late: number; absent: number; excused: number;
  total: number;           // records counted
  rate: number | null;     // attendance %, Excused is not counted against the student
}

export function summarize(list: AttendanceDoc[]): Summary {
  const s = { present: 0, late: 0, absent: 0, excused: 0 };
  list.forEach((a) => { s[a.status] += 1; });
  const counted = s.present + s.late + s.absent;
  const rate = counted === 0 ? null : Math.round(((s.present + s.late) / counted) * 100);
  return { ...s, total: list.length, rate };
}

export const statusLabel: Record<Status, string> = {
  present: 'Present', late: 'Late', absent: 'Absent', excused: 'Excused',
};

export function fmtDateTime(ms: number): string {
  if (!ms) return '';
  const d = new Date(ms);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' • ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function fmtTime(ms: number): string {
  return ms ? new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '';
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function getAuthErrorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }
  return '';
}

export function getAuthErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return '';
}

export function friendlyAuthError(code: string, message = ''): string {
  switch (code) {
    case 'auth/invalid-email': return 'That email address looks incorrect.';
    case 'auth/missing-password': return 'Please enter your password.';
    case 'auth/operation-not-allowed': return 'This sign-in method is not enabled in Firebase Authentication.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Wrong email or password.';
    case 'auth/email-already-in-use': return 'An account with this email already exists.';
    case 'auth/weak-password': return 'Password must be at least 6 characters.';
    case 'auth/network-request-failed': return 'No internet connection. Please try again.';
    case 'auth/too-many-requests': return 'Too many attempts. Please wait a moment.';
    case 'auth/popup-closed-by-user': return 'Google sign-in was cancelled.';
    case 'auth/popup-blocked': return 'Your browser blocked the sign-in window. Allow popups and try again.';
    case 'auth/unauthorized-domain': return 'Add this app domain to Firebase Authentication’s authorized domains.';
    case 'auth/account-exists-with-different-credential': return 'An account with this email already uses a different sign-in method.';
    case 'auth/google-not-configured': return 'Add the Google OAuth client ID for this platform in firebaseConfig.ts.';
    case 'auth/google-account-not-registered': return 'No QR Attend profile is linked to this Google account. Create an account with Google first.';
    case 'auth/missing-google-id-token': return 'Google sign-in did not return an ID token. Check the Google OAuth client configuration.';
    case '10':
    case 'DEVELOPER_ERROR':
    case 'google-sign-in/10':
      return 'Google rejected this Android app configuration (DEVELOPER_ERROR). Check that the OAuth Android client uses package com.qrattend.app and the SHA-1 for this exact development build.';
    case 'PLAY_SERVICES_NOT_AVAILABLE':
      return 'Google Play services are unavailable or need updating on this device.';
    case 'IN_PROGRESS':
      return 'Google sign-in is already in progress. Wait a moment and try again.';
    default:
      return message || 'Something went wrong. Please try again.';
  }
}
