import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where,
  onSnapshot, serverTimestamp, Timestamp, writeBatch, Unsubscribe, DocumentData, Query,
} from 'firebase/firestore';
import { randomUUID } from 'expo-crypto';
import { db } from '../firebase';
import {
  AttendanceDoc, ClassDoc, Enrollment, NotificationDoc, Profile, SessionDoc, Status,
} from '../types';
import { fmtDateTime } from '../utils';

export const TOKEN_SECONDS = 30;
const QR_PREFIX = 'QRATT';

const ms = (v: any): number => (v && typeof v.toMillis === 'function' ? v.toMillis() : typeof v === 'number' ? v : 0);

const mapClass = (id: string, d: DocumentData): ClassDoc => ({
  id, name: d.name, section: d.section ?? '', code: d.code, teacherId: d.teacherId,
  teacherName: d.teacherName ?? '', lateMinutes: d.lateMinutes ?? 15, absenceLimit: d.absenceLimit ?? 3,
});
const mapEnrollment = (id: string, d: DocumentData): Enrollment => ({
  id, classId: d.classId, studentId: d.studentId, studentName: d.studentName, studentNo: d.studentNo ?? '',
  className: d.className ?? '', section: d.section ?? '', teacherName: d.teacherName ?? '', absenceLimit: d.absenceLimit ?? 3,
});
const mapSession = (id: string, d: DocumentData): SessionDoc => ({
  id, classId: d.classId, className: d.className ?? '', teacherId: d.teacherId, title: d.title ?? '',
  open: !!d.open, startedAt: ms(d.startedAt), lateAt: ms(d.lateAt), closedAt: ms(d.closedAt),
});
const mapAttendance = (id: string, d: DocumentData): AttendanceDoc => ({
  id, sessionId: d.sessionId, classId: d.classId, studentId: d.studentId, studentName: d.studentName ?? '',
  studentNo: d.studentNo ?? '', status: d.status, source: d.source, token: d.token ?? '', markedAt: ms(d.markedAt),
});
const mapNotification = (id: string, d: DocumentData): NotificationDoc => ({
  id, userId: d.userId, type: d.type, title: d.title, body: d.body, classId: d.classId ?? '',
  read: !!d.read, createdAt: ms(d.createdAt),
});

function listen<T>(q: Query, map: (id: string, d: DocumentData) => T, cb: (items: T[]) => void): Unsubscribe {
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((x) => map(x.id, x.data()))),
    (err) => { console.warn('Firestore listen error:', err.code, err.message); cb([]); },
  );
}

// ───────────────────────── Classes ─────────────────────────
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const genCode = () => Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');

export async function createClass(
  teacher: Profile,
  data: { name: string; section: string; lateMinutes: number; absenceLimit: number },
): Promise<string> {
  let code = genCode();
  for (let i = 0; i < 5; i++) {
    const dup = await getDocs(query(collection(db, 'classes'), where('code', '==', code)));
    if (dup.empty) break;
    code = genCode();
  }
  const ref = await addDoc(collection(db, 'classes'), {
    ...data, code, teacherId: teacher.uid, teacherName: teacher.name, createdAt: serverTimestamp(),
  });
  return ref.id;
}

export const subscribeTeacherClasses = (uid: string, cb: (c: ClassDoc[]) => void) =>
  listen(query(collection(db, 'classes'), where('teacherId', '==', uid)), mapClass, cb);

export async function joinClass(student: Profile, rawCode: string): Promise<string> {
  const code = rawCode.trim().toUpperCase();
  if (code.length < 4) throw new Error('Enter the class code given by your teacher.');
  const found = await getDocs(query(collection(db, 'classes'), where('code', '==', code)));
  if (found.empty) throw new Error('No class found with that code.');
  const cls = mapClass(found.docs[0].id, found.docs[0].data());
  const id = `${cls.id}_${student.uid}`;
  const existing = await getDoc(doc(db, 'enrollments', id));
  if (existing.exists()) throw new Error(`You already joined ${cls.name}.`);
  await setDoc(doc(db, 'enrollments', id), {
    classId: cls.id, studentId: student.uid, studentName: student.name, studentNo: student.studentNo,
    className: cls.name, section: cls.section, teacherName: cls.teacherName, absenceLimit: cls.absenceLimit,
    joinedAt: serverTimestamp(),
  });
  return cls.name;
}

export const leaveClass = (enrollmentId: string) => deleteDoc(doc(db, 'enrollments', enrollmentId));

export const subscribeStudentEnrollments = (uid: string, cb: (e: Enrollment[]) => void) =>
  listen(query(collection(db, 'enrollments'), where('studentId', '==', uid)), mapEnrollment, cb);

export const subscribeClassEnrollments = (classId: string, cb: (e: Enrollment[]) => void) =>
  listen(query(collection(db, 'enrollments'), where('classId', '==', classId)), mapEnrollment, cb);

// ───────────────────────── Sessions & rotating QR ─────────────────────────
export const newToken = () => randomUUID().replace(/-/g, '');
export const buildQr = (sessionId: string, token: string) => `${QR_PREFIX}|${sessionId}|${token}`;

export const subscribeClassSessions = (classId: string, cb: (s: SessionDoc[]) => void) =>
  listen(query(collection(db, 'sessions'), where('classId', '==', classId)), mapSession,
    (list) => cb(list.sort((a, b) => b.startedAt - a.startedAt)));

export function subscribeSession(sessionId: string, cb: (s: SessionDoc | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'sessions', sessionId),
    (d) => cb(d.exists() ? mapSession(d.id, d.data()) : null),
    () => cb(null));
}

/** Starts a class session (or returns the one that is already open). */
export async function startSession(cls: ClassDoc, teacher: Profile): Promise<{ id: string; token: string }> {
  const existing = await getDocs(query(collection(db, 'sessions'), where('classId', '==', cls.id)));
  const open = existing.docs.find((d) => d.data().open === true);
  const token = newToken();
  if (open) {
    await setDoc(doc(db, 'sessionTokens', open.id), { teacherId: teacher.uid, token, prevToken: '' });
    return { id: open.id, token };
  }
  const now = Date.now();
  const sessionRef = doc(collection(db, 'sessions'));
  const batch = writeBatch(db);
  batch.set(sessionRef, {
    classId: cls.id, className: cls.name, teacherId: teacher.uid, title: fmtDateTime(now), open: true,
    startedAt: Timestamp.fromMillis(now), lateAt: Timestamp.fromMillis(now + cls.lateMinutes * 60000),
  });
  batch.set(doc(db, 'sessionTokens', sessionRef.id), { teacherId: teacher.uid, token, prevToken: '' });
  await batch.commit();
  return { id: sessionRef.id, token };
}

/** Called by the teacher's device every 30 s. The previous token stays valid for one extra window. */
export async function rotateToken(sessionId: string, current: string): Promise<string> {
  const token = newToken();
  await updateDoc(doc(db, 'sessionTokens', sessionId), { prevToken: current, token });
  return token;
}

// ───────────────────────── Student check-in ─────────────────────────
export interface ScanResult { status: Status; className: string; title: string }

export async function submitScan(student: Profile, raw: string): Promise<ScanResult> {
  const parts = raw.split('|');
  if (parts.length !== 3 || parts[0] !== QR_PREFIX) throw new Error('This is not a QR Attend class code.');
  const [, sessionId, token] = parts;

  const sSnap = await getDoc(doc(db, 'sessions', sessionId));
  if (!sSnap.exists()) throw new Error('This class session no longer exists.');
  const session = mapSession(sSnap.id, sSnap.data());
  if (!session.open) throw new Error('This class session is already closed.');

  const enr = await getDoc(doc(db, 'enrollments', `${session.classId}_${student.uid}`));
  if (!enr.exists()) throw new Error(`You are not enrolled in ${session.className}. Join the class first.`);

  const attRef = doc(db, 'attendance', `${sessionId}_${student.uid}`);
  const prev = await getDoc(attRef);
  if (prev.exists()) {
    throw new Error(`You are already marked ${prev.data().status} for this class.`);
  }

  const base = {
    sessionId, classId: session.classId, studentId: student.uid, studentName: student.name,
    studentNo: student.studentNo, source: 'scan', token, markedAt: serverTimestamp(),
  };
  const guess: Status = Date.now() > session.lateAt ? 'late' : 'present';
  const other: Status = guess === 'late' ? 'present' : 'late';
  try {
    await setDoc(attRef, { ...base, status: guess });
    return { status: guess, className: session.className, title: session.title };
  } catch (e: any) {
    if (e?.code !== 'permission-denied') throw e;
  }
  // Clock skew right at the cut-off: retry with the other status.
  try {
    await setDoc(attRef, { ...base, status: other });
    return { status: other, className: session.className, title: session.title };
  } catch (e: any) {
    if (e?.code === 'permission-denied') {
      throw new Error('This QR code has expired. Scan the code currently shown on the teacher’s screen.');
    }
    throw e;
  }
}

// ───────────────────────── Attendance records ─────────────────────────
export const subscribeSessionAttendance = (classId: string, sessionId: string, cb: (a: AttendanceDoc[]) => void) =>
  listen(query(collection(db, 'attendance'), where('classId', '==', classId), where('sessionId', '==', sessionId)),
    mapAttendance, cb);

export const subscribeClassAttendance = (classId: string, cb: (a: AttendanceDoc[]) => void) =>
  listen(query(collection(db, 'attendance'), where('classId', '==', classId)), mapAttendance, cb);

export const subscribeStudentAttendance = (uid: string, cb: (a: AttendanceDoc[]) => void) =>
  listen(query(collection(db, 'attendance'), where('studentId', '==', uid)), mapAttendance, cb);

/** Teacher sets Present / Late / Absent / Excused for one student in one session. */
export async function setStatus(session: SessionDoc, student: Enrollment, status: Status) {
  await setDoc(doc(db, 'attendance', `${session.id}_${student.studentId}`), {
    sessionId: session.id, classId: session.classId, studentId: student.studentId,
    studentName: student.studentName, studentNo: student.studentNo, status, source: 'teacher',
    token: '', markedAt: serverTimestamp(),
  });
}

// ───────────────────────── Closing a session (auto-absent + alerts) ─────────────────────────
type Op = (b: ReturnType<typeof writeBatch>) => void;

async function commitInChunks(ops: Op[], size = 12) {
  // Security rules allow max 20 access calls per batch, so keep batches small.
  for (let i = 0; i < ops.length; i += size) {
    const b = writeBatch(db);
    ops.slice(i, i + size).forEach((op) => op(b));
    await b.commit();
  }
}

/** Marks every enrolled student with no record as Absent and sends alerts. Safe to run again. */
export async function finalizeAbsences(session: SessionDoc, cls: ClassDoc, members: Enrollment[]) {
  const sessionSnap = await getDocs(query(collection(db, 'attendance'),
    where('classId', '==', cls.id), where('sessionId', '==', session.id)));
  const have = new Set(sessionSnap.docs.map((d) => d.data().studentId as string));
  const missing = members.filter((m) => !have.has(m.studentId));
  if (missing.length === 0) return 0;

  const classSnap = await getDocs(query(collection(db, 'attendance'), where('classId', '==', cls.id)));
  const absentCount: Record<string, number> = {};
  classSnap.docs.forEach((d) => {
    if (d.data().status === 'absent') absentCount[d.data().studentId] = (absentCount[d.data().studentId] ?? 0) + 1;
  });

  const ops: Op[] = [];
  missing.forEach((m) => {
    const total = (absentCount[m.studentId] ?? 0) + 1;
    ops.push((b) => b.set(doc(db, 'attendance', `${session.id}_${m.studentId}`), {
      sessionId: session.id, classId: cls.id, studentId: m.studentId, studentName: m.studentName,
      studentNo: m.studentNo, status: 'absent', source: 'auto', token: '', markedAt: serverTimestamp(),
    }));
    ops.push((b) => b.set(doc(collection(db, 'notifications')), {
      userId: m.studentId, classId: cls.id, type: 'absence', read: false, createdAt: serverTimestamp(),
      title: `Marked absent • ${cls.name}`,
      body: `You were marked absent for the class on ${session.title}. If this is a mistake, please tell your teacher (${cls.teacherName}).`,
    }));
    if (total >= cls.absenceLimit) {
      ops.push((b) => b.set(doc(collection(db, 'notifications')), {
        userId: m.studentId, classId: cls.id, type: 'warning', read: false, createdAt: serverTimestamp(),
        title: `Absence warning • ${cls.name}`,
        body: `You now have ${total} absences in ${cls.name} (limit: ${cls.absenceLimit}). Please speak with your teacher.`,
      }));
    }
  });
  await commitInChunks(ops);
  return missing.length;
}

export async function closeSession(session: SessionDoc, cls: ClassDoc, members: Enrollment[]) {
  // Close first so nobody can scan while absences are being written.
  await updateDoc(doc(db, 'sessions', session.id), { open: false, closedAt: serverTimestamp() });
  await finalizeAbsences({ ...session, open: false }, cls, members);
}

// ───────────────────────── Notifications ─────────────────────────
export const subscribeNotifications = (uid: string, cb: (n: NotificationDoc[]) => void) =>
  listen(query(collection(db, 'notifications'), where('userId', '==', uid)), mapNotification,
    (list) => cb(list.sort((a, b) => b.createdAt - a.createdAt)));

export const markNotificationRead = (id: string) => updateDoc(doc(db, 'notifications', id), { read: true });
export const deleteNotification = (id: string) => deleteDoc(doc(db, 'notifications', id));
export async function markAllRead(list: NotificationDoc[]) {
  const unread = list.filter((n) => !n.read);
  for (let i = 0; i < unread.length; i += 100) {
    const b = writeBatch(db);
    unread.slice(i, i + 100).forEach((n) => b.update(doc(db, 'notifications', n.id), { read: true }));
    await b.commit();
  }
}
