import { z } from 'zod';

export type DayType = 'working' | 'weekly_off' | 'holiday' | 'vacation';
export type AttendanceStatus = 'not_marked' | 'partial' | 'complete' | 'holiday';

export interface DashboardSummaryResponse {
  date: string;
  isWorkingDay: boolean;
  dayType: DayType;
  isCurrentSession: boolean;
  students: {
    enrolled: number;
    changeThisMonth: number;
  };
  staff: {
    active: number;
    onLeaveToday: number;
  };
  fees: {
    collectedToday: number; // in paise
    collectedThisMonth: number; // in paise
    pendingDues: number; // in paise
    currency: 'INR';
  } | null;
  studentAttendance: {
    present: number;
    absent: number;
    total: number;
    percentage: number | null;
    status: AttendanceStatus;
  };
}

export const staffAttendanceQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format').optional(),
  limit: z.coerce.number().int().min(1).max(100).default(5),
});

export type StaffAttendanceQueryDTO = z.infer<typeof staffAttendanceQuerySchema>;

export interface StaffAttendanceItem {
  staffId: string;
  name: string;
  avatarUrl: string | null;
  department: string | null;
  designation: string | null;
  status: 'present' | 'absent' | 'leave' | 'notMarked';
}

export interface DashboardStaffAttendanceResponse {
  date: string;
  dayType: DayType;
  counts: {
    present: number;
    absent: number;
    leave: number;
    notMarked: number;
  };
  items: StaffAttendanceItem[];
}

export interface CommunicationBalanceChannel {
  type: 'sms' | 'whatsapp' | 'email';
  remaining: number;
  total: number;
  lowBalance: boolean;
}

export interface DashboardCommunicationBalanceResponse {
  channels: CommunicationBalanceChannel[];
}

export interface DashboardPendingActionsResponse {
  attendanceNotMarked: {
    students: number;
    staff: number;
    classes: Array<{ classId: string; name: string }>;
  };
  approvals: {
    leave: number;
    feeConcession: number;
    other: number;
  };
}

export const feeTrendQuerySchema = z.object({
  days: z.coerce.number().int().refine((val) => val === 7 || val === 30, {
    message: 'days must be either 7 or 30',
  }).default(7),
});

export type FeeTrendQueryDTO = z.infer<typeof feeTrendQuerySchema>;

export interface FeeTrendPoint {
  date: string;
  collected: number; // in paise
}

export interface DashboardFeeTrendResponse {
  points: FeeTrendPoint[];
  total: number; // in paise
  previousPeriodTotal: number; // in paise
}

export const calendarEventsQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'from must be in YYYY-MM-DD format'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'to must be in YYYY-MM-DD format'),
}).refine((data) => {
  const fromDate = new Date(data.from);
  const toDate = new Date(data.to);
  if (toDate < fromDate) return false;
  const diffDays = Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 62;
}, {
  message: 'Invalid range: "to" must be >= "from" and maximum range allowed is 62 days',
  path: ['to'],
});

export type CalendarEventsQueryDTO = z.infer<typeof calendarEventsQuerySchema>;

export const upcomingEventsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
  limit: z.coerce.number().int().min(1).max(50).default(5),
});

export type UpcomingEventsQueryDTO = z.infer<typeof upcomingEventsQuerySchema>;

export const calendarEventCreateSchema = z.object({
  title: z.string().min(1, 'title is required').max(255),
  type: z.enum(['event', 'holiday', 'exam', 'fee_due', 'vacation']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be in YYYY-MM-DD format').optional(),
  description: z.string().optional(),
  notifyUsers: z.boolean().optional().default(false),
}).refine((data) => {
  if (data.endDate) {
    return new Date(data.endDate) >= new Date(data.date);
  }
  return true;
}, {
  message: 'endDate must be on or after date',
  path: ['endDate'],
});

export type CalendarEventCreateDTO = z.infer<typeof calendarEventCreateSchema>;

export interface CalendarEventItem {
  id: string;
  title: string;
  type: 'event' | 'holiday' | 'exam' | 'fee_due' | 'vacation';
  date: string;
  endDate: string | null;
  allDay: boolean;
}
