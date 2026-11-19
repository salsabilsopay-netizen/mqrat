export type PlatformType = 'Zoom' | 'Google Meet';

export type SessionStatus = 'متاح' | 'غير متاح';

export interface QuranSession {
  id: string;
  name: string;
  teacher_name: string;
  platform: PlatformType;
  days_count: string;
  time_slot: string;
  days_schedule: string;
  status: SessionStatus;
  whatsapp_url?: string;
  max_students?: number | null;
  registered_students_count?: number;
  created_at: string;
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface StudentApplication {
  id: string;
  session_id: string;
  session_name?: string;
  teacher_name?: string;
  full_name: string;
  phone: string;
  email?: string;
  id_type: 'مواطنة' | 'مقيمة' | 'زائرة';
  id_number: string;
  nationality: string;
  gender: 'أنثى';
  residence_country: string;
  residence_city: string;
  birth_date: string;
  is_child: boolean;
  commitment_accepted: boolean;
  status: ApplicationStatus;
  notes?: string;
  created_at: string;
}

export type StaffRole = 'معلمة' | 'مشرفة';

export interface StaffApplication {
  id: string;
  role: StaffRole;
  full_name: string;
  id_type: string;
  id_number: string;
  id_expiry_date: string;
  nationality: string;
  gender: 'أنثى';
  birth_place: string;
  birth_date_hijri: string;
  qualification: string;
  major: string;
  workplace: string;
  job_title: string;
  phone: string;
  region: string;
  city: string;
  district: string;
  street: string;
  building_number: string;
  apartment_number: string;
  email: string;
  x_account?: string;
  signature_url: string;
  certificates_urls: string; // JSON array string
  commitment_accepted: boolean;
  status: ApplicationStatus;
  notes?: string;
  created_at: string;
}

export interface Testimonial {
  id: string;
  student_name: string;
  content: string;
  rating: number;
  session_name?: string;
  is_approved: boolean;
  created_at: string;
}

export interface StatisticsData {
  total_students: number;
  adult_students: number;
  child_students: number;
  total_teachers: number;
  total_supervisors: number;
  countries: { country: string; count: number }[];
  // Admin-only metrics
  total_student_applications?: number;
  pending_student_applications?: number;
  total_staff_applications?: number;
  pending_staff_applications?: number;
  total_sessions?: number;
  active_sessions?: number;
}
