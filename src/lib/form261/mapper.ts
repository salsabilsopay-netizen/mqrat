import { StaffApplication } from '@/types';

export interface Form261Data {
  applicationId: string;
  applicantRole: StaffApplication['role'];
  applicationStatus: StaffApplication['status'];
  // 1. المعلومات الشخصية
  fullName: string;
  // 2. بيانات الهوية
  idNumber: string;
  idType: string;
  idExpiryDate: string;
  nationality: string;
  gender: string;
  birthPlace: string;
  birthDateHijri: string;
  birthPlaceAndDateHijri: string;
  // 3. المؤهلات العلمية
  qualification: string;
  major: string;
  workplace: string;
  jobTitle: string;
  // 4. العنوان
  landlinePhone: string;
  mobilePhone: string;
  city: string;
  region: string;
  district: string;
  street: string;
  buildingNumber: string;
  apartmentNumber: string;
  // 5. عناوين مواقع التواصل الاجتماعي
  xAccount: string;
  facebookAccount: string;
  email: string;
  // Metadata about intentionally blank uncollected ministerial fields
  uncollectedFields: string[];
}

function cleanValue(val?: string | null): string {
  if (typeof val !== 'string') return '';
  return val.trim();
}

/**
 * Maps a `staff_applications` row into Ministry of Islamic Affairs Form (261) structure.
 * Uncollected fields (landline phone, Facebook) remain intentionally empty and are never
 * fabricated or filled with fallback/duplicate values (e.g. mobile is never copied to landline).
 * Signature uploads are intentionally NOT placed on the pen-signature line without explicit admin approval.
 */
export function mapStaffToForm261(staff: StaffApplication): Form261Data {
  const birthPlace = cleanValue(staff.birth_place);
  const birthDateHijri = cleanValue(staff.birth_date_hijri);

  let birthPlaceAndDateHijri = '';
  if (birthPlace && birthDateHijri) {
    birthPlaceAndDateHijri = `${birthPlace}  -  ${birthDateHijri}`;
  } else {
    birthPlaceAndDateHijri = birthPlace || birthDateHijri;
  }

  const xAccount = cleanValue(staff.x_account);
  const landlinePhone = '';
  const facebookAccount = '';

  const uncollectedFields: string[] = ['رقم الهاتف (الثابت)', 'حساب فيسبوك'];
  if (!xAccount) {
    uncollectedFields.push('حساب تويتر (اختياري ولم يُدخل)');
  }

  return {
    applicationId: staff.id,
    applicantRole: staff.role,
    applicationStatus: staff.status,
    fullName: cleanValue(staff.full_name),
    idNumber: cleanValue(staff.id_number),
    idType: cleanValue(staff.id_type),
    idExpiryDate: cleanValue(staff.id_expiry_date),
    nationality: cleanValue(staff.nationality),
    gender: cleanValue(staff.gender),
    birthPlace,
    birthDateHijri,
    birthPlaceAndDateHijri,
    qualification: cleanValue(staff.qualification),
    major: cleanValue(staff.major),
    workplace: cleanValue(staff.workplace),
    jobTitle: cleanValue(staff.job_title),
    landlinePhone,
    mobilePhone: cleanValue(staff.phone),
    city: cleanValue(staff.city),
    region: cleanValue(staff.region),
    district: cleanValue(staff.district),
    street: cleanValue(staff.street),
    buildingNumber: cleanValue(staff.building_number),
    apartmentNumber: cleanValue(staff.apartment_number),
    xAccount,
    facebookAccount,
    email: cleanValue(staff.email),
    uncollectedFields,
  };
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
