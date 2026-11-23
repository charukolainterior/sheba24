import type { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  DHAKA_AREAS,
  VALIDATION_LIMITS,
  inferCityFromArea,
  type BookingMode,
  type EmergencyJob,
  type JobBid,
  type JobPrivateContact,
  type JobStatus,
  type PaymentMethod,
  type PaymentStatus,
  type ServiceCategory,
  type UrgencyLevel,
  type UserAccount,
  type WorkerProfile,
} from '../types/marketplace';

function clampString(val: string, max: number): string {
  return val.trim().slice(0, max);
}

export async function checkIsAdmin(user: User): Promise<boolean> {
  if (user.emailVerified && user.email === 'charukolainterior@gmail.com') {
    return true;
  }
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function ensureUserAccount(user: User): Promise<UserAccount | null> {
  const path = `users/${user.uid}`;
  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserAccount;
    }

    const displayName =
      clampString(user.displayName || 'ব্যবহারকারী', VALIDATION_LIMITS.nameMax) || 'ব্যবহারকারী';
    const email = clampString(user.email || 'user@example.com', 120);
    const payload = {
      uid: user.uid,
      displayName,
      email,
      phone: '',
      area: DHAKA_AREAS[0],
      isWorker: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(userRef, payload);
    const createdSnap = await getDoc(userRef);
    return createdSnap.exists() ? (createdSnap.data() as UserAccount) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateCustomerProfile(
  uid: string,
  input: { displayName: string; phone: string; area: string }
): Promise<void> {
  const displayName = clampString(input.displayName, VALIDATION_LIMITS.nameMax);
  const phone = clampString(input.phone, 20);
  const area = clampString(input.area, VALIDATION_LIMITS.areaMax);

  if (displayName.length < 1) {
    throw new Error('আপনার নাম লিখুন।');
  }
  if (phone && !VALIDATION_LIMITS.phoneRegex.test(phone)) {
    throw new Error('সঠিক মোবাইল নম্বর লিখুন (যেমন: 017XXXXXXXX)।');
  }

  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      displayName,
      phone,
      area,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export interface SaveWorkerInput {
  name: string;
  area: string;
  categories: ServiceCategory[];
  baseCharge: number;
  experienceYears: number;
  bio: string;
  isActive: boolean;
  phone?: string;
}

export async function saveWorkerProfile(
  uid: string,
  hasExistingWorker: boolean,
  input: SaveWorkerInput
): Promise<void> {
  const name = clampString(input.name, VALIDATION_LIMITS.nameMax);
  const area = clampString(input.area, VALIDATION_LIMITS.areaMax);
  const bio = clampString(input.bio, VALIDATION_LIMITS.bioMax);
  const categories = Array.from(new Set(input.categories)).slice(0, 5);
  const baseCharge = Math.min(
    VALIDATION_LIMITS.maxWorkerCharge,
    Math.max(VALIDATION_LIMITS.minCharge, Math.round(input.baseCharge))
  );
  const experienceYears = Math.min(60, Math.max(0, Math.round(input.experienceYears)));

  if (name.length < VALIDATION_LIMITS.nameMin) {
    throw new Error('নাম কমপক্ষে ২ অক্ষরের হতে হবে।');
  }
  if (area.length < VALIDATION_LIMITS.areaMin) {
    throw new Error('এলাকার নাম লিখুন।');
  }
  if (categories.length < 1) {
    throw new Error('কমপক্ষে একটি সেবার ধরন নির্বাচন করুন।');
  }
  if (bio.length < VALIDATION_LIMITS.bioMin) {
    throw new Error('আপনার অভিজ্ঞতা সম্পর্কে কমপক্ষে ৫ অক্ষরের বিবরণ দিন।');
  }

  const workerRef = doc(db, 'workers', uid);
  const userRef = doc(db, 'users', uid);
  const batch = writeBatch(db);

  try {
    if (hasExistingWorker) {
      batch.update(workerRef, {
        name,
        area,
        categories,
        baseCharge,
        experienceYears,
        bio,
        isActive: input.isActive,
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.set(workerRef, {
        uid,
        name,
        area,
        categories,
        baseCharge,
        experienceYears,
        bio,
        isActive: input.isActive,
        isVerified: false,
        completedJobs: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const userUpdate: Record<string, unknown> = {
      isWorker: true,
      area,
      displayName: name,
      updatedAt: serverTimestamp(),
    };
    if (input.phone && VALIDATION_LIMITS.phoneRegex.test(input.phone.trim())) {
      userUpdate.phone = clampString(input.phone, 20);
    }
    batch.update(userRef, userUpdate);

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `workers/${uid}`);
  }
}

export interface CreateJobInput {
  category: ServiceCategory;
  bookingMode: BookingMode;
  title: string;
  description: string;
  area: string;
  urgency: UrgencyLevel;
  suggestedCharge: number;
  contactPhone: string;
  exactAddress: string;
}

export async function createEmergencyJob(
  uid: string,
  clientName: string,
  input: CreateJobInput
): Promise<string> {
  const safeClientName = clampString(clientName, VALIDATION_LIMITS.nameMax) || 'সেবাগ্রহীতা';
  const title = clampString(input.title, VALIDATION_LIMITS.titleMax);
  const description = clampString(input.description, VALIDATION_LIMITS.descMax);
  const area = clampString(input.area, VALIDATION_LIMITS.areaMax);
  const contactPhone = clampString(input.contactPhone, 20);
  const exactAddress = clampString(input.exactAddress, VALIDATION_LIMITS.addressMax);
  const suggestedCharge = Math.min(
    VALIDATION_LIMITS.maxCharge,
    Math.max(VALIDATION_LIMITS.minCharge, Math.round(input.suggestedCharge))
  );

  if (title.length < VALIDATION_LIMITS.titleMin) {
    throw new Error('কাজের শিরোনাম কমপক্ষে ৫ অক্ষরের হতে হবে।');
  }
  if (description.length < VALIDATION_LIMITS.descMin) {
    throw new Error('কাজের বিস্তারিত কমপক্ষে ১০ অক্ষরের লিখুন।');
  }
  if (area.length < VALIDATION_LIMITS.areaMin) {
    throw new Error('এলাকা নির্বাচন করুন।');
  }
  if (!VALIDATION_LIMITS.phoneRegex.test(contactPhone)) {
    throw new Error('সঠিক মোবাইল নম্বর লিখুন (যেমন: 017XXXXXXXX)।');
  }
  if (exactAddress.length < VALIDATION_LIMITS.addressMin) {
    throw new Error('সঠিক বাসা বা গন্তব্যের ঠিকানা লিখুন।');
  }

  const jobRef = doc(collection(db, 'jobs'));
  const contactRef = doc(db, 'jobs', jobRef.id, 'private', 'contact');
  const batch = writeBatch(db);

  batch.set(jobRef, {
    clientId: uid,
    clientName: safeClientName.length >= 2 ? safeClientName : 'সেবাগ্রহীতা',
    category: input.category,
    bookingMode: input.bookingMode,
    city: inferCityFromArea(area),
    title,
    description,
    area,
    urgency: input.urgency,
    suggestedCharge,
    status: 'open',
    assignedWorkerId: '',
    assignedWorkerName: '',
    acceptedCharge: 0,
    paymentMethod: 'unselected',
    paymentStatus: 'unpaid',
    paymentTrxId: '',
    paidAmount: 0,
    bidCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(contactRef, {
    clientId: uid,
    contactPhone,
    exactAddress,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    return jobRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `jobs/${jobRef.id}`);
  }
}

export interface SubmitBidInput {
  chargeAmount: number;
  estimatedArrival: string;
  note: string;
}

export async function submitOrUpdateBid(
  job: EmergencyJob,
  worker: WorkerProfile,
  existingBid: JobBid | null,
  input: SubmitBidInput
): Promise<void> {
  const chargeAmount = Math.min(
    VALIDATION_LIMITS.maxCharge,
    Math.max(VALIDATION_LIMITS.minCharge, Math.round(input.chargeAmount))
  );
  const estimatedArrival = clampString(input.estimatedArrival, VALIDATION_LIMITS.arrivalMax);
  const note = clampString(input.note, VALIDATION_LIMITS.noteMax);

  if (estimatedArrival.length < VALIDATION_LIMITS.arrivalMin) {
    throw new Error('পৌঁছানোর আনুমানিক সময় লিখুন।');
  }

  const bidRef = doc(db, 'jobs', job.id, 'bids', worker.uid);
  const jobRef = doc(db, 'jobs', job.id);

  try {
    if (existingBid) {
      await updateDoc(bidRef, {
        chargeAmount,
        estimatedArrival,
        note,
        updatedAt: serverTimestamp(),
      });
    } else {
      const batch = writeBatch(db);
      batch.set(bidRef, {
        jobId: job.id,
        jobClientId: job.clientId,
        workerId: worker.uid,
        workerName: clampString(worker.name, VALIDATION_LIMITS.nameMax),
        workerArea: clampString(worker.area, VALIDATION_LIMITS.areaMax),
        chargeAmount,
        estimatedArrival,
        note,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.update(jobRef, {
        bidCount: increment(1),
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `jobs/${job.id}/bids/${worker.uid}`);
  }
}

export async function claimFixedRateJob(
  job: EmergencyJob,
  worker: WorkerProfile
): Promise<void> {
  const path = `jobs/${job.id}`;
  try {
    await updateDoc(doc(db, 'jobs', job.id), {
      status: 'assigned',
      assignedWorkerId: worker.uid,
      assignedWorkerName: clampString(worker.name, VALIDATION_LIMITS.nameMax),
      acceptedCharge: job.suggestedCharge,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function acceptJobBid(
  job: EmergencyJob,
  chosenBid: JobBid,
  allBids: JobBid[]
): Promise<void> {
  const batch = writeBatch(db);
  const jobRef = doc(db, 'jobs', job.id);

  batch.update(jobRef, {
    status: 'assigned',
    assignedWorkerId: chosenBid.workerId,
    assignedWorkerName: clampString(chosenBid.workerName, VALIDATION_LIMITS.nameMax),
    acceptedCharge: chosenBid.chargeAmount,
    updatedAt: serverTimestamp(),
  });

  const chosenBidRef = doc(db, 'jobs', job.id, 'bids', chosenBid.workerId);
  batch.update(chosenBidRef, {
    status: 'accepted',
    updatedAt: serverTimestamp(),
  });

  for (const bid of allBids) {
    if (bid.workerId !== chosenBid.workerId && bid.status === 'pending') {
      const otherRef = doc(db, 'jobs', job.id, 'bids', bid.workerId);
      batch.update(otherRef, {
        status: 'rejected',
        updatedAt: serverTimestamp(),
      });
    }
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `jobs/${job.id}`);
  }
}

export async function updateJobStatus(
  jobId: string,
  status: 'completed' | 'cancelled'
): Promise<void> {
  const path = `jobs/${jobId}`;
  try {
    await updateDoc(doc(db, 'jobs', jobId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function submitJobPayment(
  job: EmergencyJob,
  method: PaymentMethod,
  trxId: string
): Promise<void> {
  const cleanTrx = clampString(trxId, VALIDATION_LIMITS.trxMax);
  if ((method === 'bkash' || method === 'nagad' || method === 'bank') && cleanTrx.length < 4) {
    throw new Error('ডিজিটাল পেমেন্টের Transaction ID (TrxID) লিখুন।');
  }

  const nextPaymentStatus: PaymentStatus = 'pending_verification';
  const path = `jobs/${job.id}`;
  try {
    await updateDoc(doc(db, 'jobs', job.id), {
      paymentMethod: method,
      paymentStatus: nextPaymentStatus,
      paymentTrxId: method === 'cash' ? 'হাতে নগদ' : cleanTrx,
      paidAmount: job.acceptedCharge,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function confirmJobPaymentReceived(job: EmergencyJob): Promise<void> {
  const path = `jobs/${job.id}`;
  try {
    await updateDoc(doc(db, 'jobs', job.id), {
      paymentStatus: 'paid',
      paidAmount: job.acceptedCharge,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function adminUpdateWorkerStatus(
  workerId: string,
  updates: { isVerified: boolean; isActive: boolean }
): Promise<void> {
  const path = `workers/${workerId}`;
  try {
    await updateDoc(doc(db, 'workers', workerId), {
      isVerified: updates.isVerified,
      isActive: updates.isActive,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function adminModerateJob(
  jobId: string,
  updates: { status?: JobStatus; paymentStatus?: PaymentStatus; paidAmount?: number }
): Promise<void> {
  const path = `jobs/${jobId}`;
  try {
    await updateDoc(doc(db, 'jobs', jobId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fetchJobPrivateContact(jobId: string): Promise<JobPrivateContact | null> {
  const path = `jobs/${jobId}/private/contact`;
  try {
    const snap = await getDoc(doc(db, 'jobs', jobId, 'private', 'contact'));
    return snap.exists() ? (snap.data() as JobPrivateContact) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}
