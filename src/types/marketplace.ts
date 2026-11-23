import type { Timestamp } from 'firebase/firestore';

export type ServiceCategory =
  | 'hospital_guide'
  | 'school_escort'
  | 'general_guide'
  | 'bodyguard_bouncer'
  | 'technician_mistri';

export type BookingMode = 'bidding' | 'fixed';
export type ServiceCity = 'dhaka' | 'narayanganj';
export type UrgencyLevel = 'immediate' | 'today' | 'scheduled';
export type JobStatus = 'open' | 'assigned' | 'completed' | 'cancelled';
export type BidStatus = 'pending' | 'accepted' | 'rejected';
export type PaymentMethod = 'unselected' | 'cash' | 'bkash' | 'nagad' | 'bank';
export type PaymentStatus = 'unpaid' | 'pending_verification' | 'paid';

export interface UserAccount {
  uid: string;
  displayName: string;
  email: string;
  phone: string;
  area: string;
  isWorker: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface WorkerProfile {
  uid: string;
  name: string;
  area: string;
  categories: ServiceCategory[];
  baseCharge: number;
  experienceYears: number;
  bio: string;
  isActive: boolean;
  isVerified?: boolean;
  completedJobs: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface EmergencyJob {
  id: string;
  clientId: string;
  clientName: string;
  category: ServiceCategory;
  bookingMode?: BookingMode;
  city?: ServiceCity;
  title: string;
  description: string;
  area: string;
  urgency: UrgencyLevel;
  suggestedCharge: number;
  status: JobStatus;
  assignedWorkerId: string;
  assignedWorkerName: string;
  acceptedCharge: number;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentTrxId?: string;
  paidAmount?: number;
  bidCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface JobPrivateContact {
  clientId: string;
  contactPhone: string;
  exactAddress: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface JobBid {
  id: string;
  jobId: string;
  jobClientId: string;
  workerId: string;
  workerName: string;
  workerArea: string;
  chargeAmount: number;
  estimatedArrival: string;
  note: string;
  status: BidStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ServiceCatalogItem {
  id: ServiceCategory;
  index: string;
  title: string;
  shortTitle: string;
  summary: string;
  typicalCharge: string;
  fixedRateLabel: string;
  defaultCharge: number;
  image: string;
  highlights: string[];
}

export interface AreaOption {
  label: string;
  city: ServiceCity;
}

export const ADMIN_BOOTSTRAP_EMAIL = 'charukolainterior@gmail.com';

export const OFFICE_INFO = {
  brandName: 'Sheba24 (সেবা২৪)',
  shortBrand: 'Sheba24',
  brandBn: 'সেবা২৪',
  addressBn: '১৮০/২ হাজারীবাগ শিল্প এলাকা, ঢাকা-১২০৯',
  addressEn: '180/2 Hazaribagh Industrial Area, Dhaka-1209',
  phoneDisplay: '০১৬৮৩৪২৯১০৯',
  phoneRaw: '01683429109',
  whatsappUrl: 'https://wa.me/8801683429109',
  telUrl: 'tel:01683429109',
  bkashNumber: '01683429109',
  nagadNumber: '01683429109',
};

export const VALIDATION_LIMITS = {
  nameMin: 2,
  nameMax: 80,
  areaMin: 2,
  areaMax: 80,
  titleMin: 5,
  titleMax: 120,
  descMin: 10,
  descMax: 1200,
  addressMin: 5,
  addressMax: 250,
  bioMin: 5,
  bioMax: 400,
  arrivalMin: 2,
  arrivalMax: 60,
  noteMax: 400,
  trxMax: 60,
  minCharge: 100,
  maxCharge: 500000,
  maxWorkerCharge: 100000,
  phoneRegex: /^[0-9+\-\s]{6,20}$/,
};

export const SERVICE_AREAS: AreaOption[] = [
  { label: 'হাজারীবাগ, ঢাকা-১২০৯', city: 'dhaka' },
  { label: 'জিগাতলা ও ধানমন্ডি, ঢাকা', city: 'dhaka' },
  { label: 'লালবাগ ও আজিমপুর, ঢাকা', city: 'dhaka' },
  { label: 'মোহাম্মদপুর ও বসিলা, ঢাকা', city: 'dhaka' },
  { label: 'নিউমার্কেট ও গ্রিন রোড, ঢাকা', city: 'dhaka' },
  { label: 'মিরপুর ও পল্লবী, ঢাকা', city: 'dhaka' },
  { label: 'উত্তরা ও বিমানবন্দর, ঢাকা', city: 'dhaka' },
  { label: 'গুলশান, বনানী ও বাড্ডা, ঢাকা', city: 'dhaka' },
  { label: 'মতিঝিল ও যাত্রাবাড়ী, ঢাকা', city: 'dhaka' },
  { label: 'চাষাঢ়া, নারায়ণগঞ্জ সদর', city: 'narayanganj' },
  { label: 'ফতুল্লা ও পঞ্চবটি, নারায়ণগঞ্জ', city: 'narayanganj' },
  { label: 'সিদ্ধিরগঞ্জ ও সাইনবোর্ড, নারায়ণগঞ্জ', city: 'narayanganj' },
  { label: 'বন্দর ও কাঁচপুর, নারায়ণগঞ্জ', city: 'narayanganj' },
];

export const DHAKA_AREAS = SERVICE_AREAS.map((a) => a.label);

export function inferCityFromArea(area: string): ServiceCity {
  const matched = SERVICE_AREAS.find((a) => a.label === area);
  if (matched) return matched.city;
  return area.includes('নারায়ণগঞ্জ') ? 'narayanganj' : 'dhaka';
}

export const CITY_LABELS: Record<'all' | ServiceCity, string> = {
  all: 'ঢাকা ও নারায়ণগঞ্জ',
  dhaka: 'ঢাকা জেলা',
  narayanganj: 'নারায়ণগঞ্জ জেলা',
};

export const SERVICE_CATALOG: ServiceCatalogItem[] = [
  {
    id: 'hospital_guide',
    index: '০১',
    title: 'হাসপাতাল ও ডাক্তার সহায়তা',
    shortTitle: 'হাসপাতাল গাইড',
    summary:
      'পরিবারের বয়স্ক বা অসুস্থ সদস্যকে বাসা থেকে নিরাপদে হাসপাতালে নিয়ে যাওয়া, সিরিয়াল ও ডাক্তার দেখানো শেষে যত্নসহকারে বাসায় পৌঁছে দেওয়া।',
    typicalCharge: '৳ ৫০০ – ১,৫০০',
    fixedRateLabel: 'ফিক্সড রেট: ৳ ৮০০ (৪ ঘণ্টা)',
    defaultCharge: 800,
    image: '/src/assets/images/service_hospital_guide_1795442538260.jpg',
    highlights: ['হাসপাতাল সিরিয়াল ও কাগজপত্রে সহায়তা', 'রোগীকে নিরাপদে বাসায় পৌঁছে দেওয়া'],
  },
  {
    id: 'school_escort',
    index: '০২',
    title: 'জরুরি স্কুল ও শিশু আনা-নেওয়া',
    shortTitle: 'স্কুল এসকর্ট',
    summary:
      'ব্যস্ততা বা জরুরি পরিস্থিতিতে আপনার সন্তানকে স্কুল থেকে নিরাপদে বাসায় নিয়ে আসা বা স্কুলে পৌঁছে দেওয়ার বিশ্বস্ত অভিভাবক-সহায়তা।',
    typicalCharge: '৳ ৩০০ – ৮০০',
    fixedRateLabel: 'ফিক্সড রেট: ৳ ৫০০ (ট্রিপ প্রতি)',
    defaultCharge: 500,
    image: '/src/assets/images/service_school_escort_1795442537460.jpg',
    highlights: ['অভিভাবকের সাথে লাইভ যোগাযোগ', 'নিরাপদ ও নির্ধারিত সময়ে পৌঁছে দেওয়া'],
  },
  {
    id: 'general_guide',
    index: '০৩',
    title: 'যেকোনো গাইড ও ব্যক্তিগত সহায়তা',
    shortTitle: 'সাধারণ গাইড',
    summary:
      'ব্যাংক, সরকারি অফিস, বিমানবন্দর রিসিভ, জরুরি ডকুমেন্ট বা নতুন এলাকায় যাতায়াতের জন্য নির্ভরযোগ্য গাইড ও সার্বক্ষণিক সহযোগী।',
    typicalCharge: '৳ ৪০০ – ১,২০০',
    fixedRateLabel: 'ফিক্সড রেট: ৳ ৬০০ (৩ ঘণ্টা)',
    defaultCharge: 600,
    image: '/src/assets/images/hero_dhaka_service_1795442538569.jpg',
    highlights: ['অফিস ও ব্যাংকের কাজে সার্বিক সহযোগিতা', 'ঢাকা ও নারায়ণগঞ্জে দ্রুত উপস্থিতি'],
  },
  {
    id: 'bodyguard_bouncer',
    index: '০৪',
    title: 'বডিগার্ড ও বাউন্সার নিরাপত্তা সেবা',
    shortTitle: 'বডিগার্ড ও বাউন্সার',
    summary:
      'ব্যক্তিগত নিরাপত্তা, পারিবারিক অনুষ্ঠান, কর্পোরেট ইভেন্ট, দোকান বা জরুরি প্রটেকশনের জন্য সুঠাম ও প্রশিক্ষিত বডিগার্ড ও বাউন্সার।',
    typicalCharge: '৳ ১,৫০০ – ৪,৫০০',
    fixedRateLabel: 'ফিক্সড রেট: ৳ ২,০০০ (শিফট প্রতি)',
    defaultCharge: 2000,
    image: '/src/assets/images/service_security_bouncer_1795442540540.jpg',
    highlights: ['প্রশিক্ষিত ও শৃঙ্খলাবদ্ধ নিরাপত্তা কর্মী', 'ঘণ্টা বা দিনভিত্তিক স্বচ্ছ চার্জ'],
  },
  {
    id: 'technician_mistri',
    index: '০৫',
    title: 'যেকোনো কাজের দক্ষ মিস্ত্রি',
    shortTitle: 'যেকোনো মিস্ত্রি',
    summary:
      'ইলেকট্রিশিয়ান, প্লাম্বার, এসি/ফ্রিজ টেকনিশিয়ান, তালা-চাবি, কাঠমিস্ত্রি বা রাজমিস্ত্রি — জরুরি যেকোনো মেরামতে কাছাকাছি অভিজ্ঞ মিস্ত্রি।',
    typicalCharge: '৳ ৪০০ – ২,৫০০',
    fixedRateLabel: 'ফিক্সড রেট: ৳ ৭০০ (ভিজিট ও প্রাথমিক মেরামত)',
    defaultCharge: 700,
    image: '/src/assets/images/service_mistri_technician_1795442538395.jpg',
    highlights: ['ইলেকট্রিক, প্লাম্বিং, এসি ও তালা-চাবি', 'বিড অথবা ফিক্সড রেটে বুকিং'],
  },
];

export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  immediate: 'অতি জরুরি (এখনই প্রয়োজন)',
  today: 'আজকের মধ্যেই',
  scheduled: 'নির্ধারিত সময় অনুযায়ী',
};

export const STATUS_LABELS: Record<JobStatus, string> = {
  open: 'বিড / বুকিং চলছে',
  assigned: 'কর্মী নির্ধারিত',
  completed: 'সম্পন্ন হয়েছে',
  cancelled: 'বাতিল হয়েছে',
};

export const BID_STATUS_LABELS: Record<BidStatus, string> = {
  pending: 'বিবেচনাধীন',
  accepted: 'গৃহীত হয়েছে',
  rejected: 'অন্য বিড গৃহীত',
};

export const BOOKING_MODE_LABELS: Record<BookingMode, string> = {
  bidding: 'লাইভ বিডিং',
  fixed: 'ফিক্সড রেট বুকিং',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  unselected: 'নির্বাচিত নয়',
  cash: 'কাজের শেষে নগদ (Cash)',
  bkash: 'বিকাশ (bKash)',
  nagad: 'নগদ (Nagad)',
  bank: 'ব্যাংক ট্রান্সফার',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'অপরিশোধিত',
  pending_verification: 'যাচাইয়ের অপেক্ষায়',
  paid: 'পরিশোধিত',
};

export function getCategoryItem(category: ServiceCategory): ServiceCatalogItem {
  return SERVICE_CATALOG.find((item) => item.id === category) ?? SERVICE_CATALOG[0];
}

export function toBanglaDigits(value: string | number): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(value).replace(/\d/g, (digit) => bnDigits[Number(digit)] ?? digit);
}

export function formatBDT(amount: number): string {
  const formatted = new Intl.NumberFormat('en-IN').format(Math.round(amount));
  return `৳ ${toBanglaDigits(formatted)}`;
}

export function formatTimestampBn(ts?: Timestamp | null): string {
  if (!ts) return 'এইমাত্র';
  const ms = ts.toMillis();
  const diffSec = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (diffSec < 60) return 'এইমাত্র';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${toBanglaDigits(diffMin)} মিনিট আগে`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${toBanglaDigits(diffHours)} ঘণ্টা আগে`;
  const diffDays = Math.floor(diffHours / 24);
  return `${toBanglaDigits(diffDays)} দিন আগে`;
}
