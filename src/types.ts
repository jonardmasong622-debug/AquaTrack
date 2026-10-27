export type Role = 'student' | 'teacher';
export type Status = 'present' | 'late' | 'absent' | 'excused';
export const STATUSES: Status[] = ['present', 'late', 'absent', 'excused'];

export interface Profile { uid: string; name: string; email: string; role: Role; studentNo: string }

export interface ClassDoc {
  id: string; name: string; section: string; code: string;
  teacherId: string; teacherName: string; lateMinutes: number; absenceLimit: number;
}

export interface Enrollment {
  id: string; classId: string; studentId: string; studentName: string; studentNo: string;
  className: string; section: string; teacherName: string; absenceLimit: number;
}

export interface SessionDoc {
  id: string; classId: string; className: string; teacherId: string; title: string;
  open: boolean; startedAt: number; lateAt: number; closedAt: number;
}

export interface AttendanceDoc {
  id: string; sessionId: string; classId: string; studentId: string; studentName: string;
  studentNo: string; status: Status; source: 'scan' | 'teacher' | 'auto'; token: string; markedAt: number;
}

export interface NotificationDoc {
  id: string; userId: string; type: 'absence' | 'warning'; title: string; body: string;
  classId: string; read: boolean; createdAt: number;
}
