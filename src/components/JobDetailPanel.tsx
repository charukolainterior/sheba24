import { useEffect, useState, type FormEvent } from 'react';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Lock,
  MapPin,
  MessageCircle,
  PhoneCall,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  BID_STATUS_LABELS,
  BOOKING_MODE_LABELS,
  OFFICE_INFO,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  STATUS_LABELS,
  URGENCY_LABELS,
  VALIDATION_LIMITS,
  formatBDT,
  formatTimestampBn,
  getCategoryItem,
  toBanglaDigits,
  type EmergencyJob,
  type JobBid,
  type JobPrivateContact,
  type PaymentMethod,
  type WorkerProfile,
} from '../types/marketplace';
import {
  acceptJobBid,
  claimFixedRateJob,
  confirmJobPaymentReceived,
  fetchJobPrivateContact,
  submitJobPayment,
  submitOrUpdateBid,
  updateJobStatus,
} from '../services/marketplaceService';

interface JobDetailPanelProps {
  job: EmergencyJob | null;
  currentUserId: string;
  workerProfile: WorkerProfile | null;
  onOpenWorkerSetup: () => void;
}

export function JobDetailPanel({
  job,
  currentUserId,
  workerProfile,
  onOpenWorkerSetup,
}: JobDetailPanelProps) {
  const [bids, setBids] = useState<JobBid[]>([]);
  const [myBid, setMyBid] = useState<JobBid | null>(null);
  const [privateContact, setPrivateContact] = useState<JobPrivateContact | null>(null);
  const [loadingBids, setLoadingBids] = useState(false);

  const [chargeInput, setChargeInput] = useState('');
  const [arrivalInput, setArrivalInput] = useState('২০–৩০ মিনিটের মধ্যে');
  const [noteInput, setNoteInput] = useState('');

  const [payMethod, setPayMethod] = useState<PaymentMethod>('bkash');
  const [trxIdInput, setTrxIdInput] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const isOwner = job ? job.clientId === currentUserId : false;
  const isAssignedWorker = job ? job.assignedWorkerId === currentUserId : false;

  useEffect(() => {
    setActionError('');
    setActionSuccess('');
    setPrivateContact(null);

    if (!job) {
      setBids([]);
      setMyBid(null);
      return;
    }

    setChargeInput(String(job.suggestedCharge));
    if (job.paymentMethod && job.paymentMethod !== 'unselected') {
      setPayMethod(job.paymentMethod);
    }
    setTrxIdInput(job.paymentTrxId || '');

    if (job.bookingMode === 'fixed') {
      setBids([]);
      setMyBid(null);
      setLoadingBids(false);
      return;
    }

    setLoadingBids(true);

    if (job.clientId === currentUserId) {
      const bidsPath = `jobs/${job.id}/bids`;
      const q = query(collection(db, bidsPath), where('jobClientId', '==', currentUserId));
      const unsub = onSnapshot(
        q,
        (snap) => {
          const list: JobBid[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<JobBid, 'id'>),
          }));
          list.sort((a, b) => a.chargeAmount - b.chargeAmount);
          setBids(list);
          setMyBid(null);
          setLoadingBids(false);
        },
        (err) => {
          setLoadingBids(false);
          handleFirestoreError(err, OperationType.LIST, bidsPath);
        }
      );
      return () => unsub();
    } else {
      const bidDocPath = `jobs/${job.id}/bids/${currentUserId}`;
      const unsub = onSnapshot(
        doc(db, 'jobs', job.id, 'bids', currentUserId),
        (snap) => {
          if (snap.exists()) {
            const bidData: JobBid = {
              id: snap.id,
              ...(snap.data() as Omit<JobBid, 'id'>),
            };
            setMyBid(bidData);
            setChargeInput(String(bidData.chargeAmount));
            setArrivalInput(bidData.estimatedArrival);
            setNoteInput(bidData.note);
          } else {
            setMyBid(null);
            setNoteInput('');
          }
          setBids([]);
          setLoadingBids(false);
        },
        (err) => {
          setLoadingBids(false);
          handleFirestoreError(err, OperationType.GET, bidDocPath);
        }
      );
      return () => unsub();
    }
  }, [job, currentUserId]);

  useEffect(() => {
    if (!job) return;
    if (isOwner || isAssignedWorker) {
      void fetchJobPrivateContact(job.id).then((contact) => {
        setPrivateContact(contact);
      });
    }
  }, [job, isOwner, isAssignedWorker]);

  if (!job) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[380px]">
        <p className="text-base font-semibold text-slate-800 mb-1">
          যেকোনো একটি কাজ নির্বাচন করুন
        </p>
        <p className="text-sm text-slate-500 max-w-sm">
          বাম দিকের তালিকা থেকে কাজের ওপর ক্লিক করলে বিস্তারিত বিবরণ, ফিক্সড-রেট বুকিং বা বিডের
          চার্জ এবং পেমেন্ট তথ্য দেখতে পাবেন।
        </p>
      </div>
    );
  }

  const categoryInfo = getCategoryItem(job.category);
  const bookingMode = job.bookingMode || 'bidding';
  const paymentStatus = job.paymentStatus || 'unpaid';
  const paymentMethod = job.paymentMethod || 'unselected';

  const handleSubmitBid = async (e: FormEvent) => {
    e.preventDefault();
    if (!workerProfile) return;
    setActionError('');
    setActionSuccess('');

    const chargeNum = Number(chargeInput);
    if (!Number.isFinite(chargeNum) || chargeNum < VALIDATION_LIMITS.minCharge) {
      setActionError(`চার্জ কমপক্ষে ${formatBDT(VALIDATION_LIMITS.minCharge)} হতে হবে।`);
      return;
    }

    setActionLoading(true);
    try {
      await submitOrUpdateBid(job, workerProfile, myBid, {
        chargeAmount: chargeNum,
        estimatedArrival: arrivalInput,
        note: noteInput,
      });
      setActionSuccess(
        myBid ? 'আপনার বিডের চার্জ সফলভাবে হালনাগাদ হয়েছে।' : 'আপনার বিড সফলভাবে জমা হয়েছে।'
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'বিড জমা দেওয়া যায়নি।');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClaimFixedJob = async () => {
    if (!workerProfile) return;
    setActionError('');
    setActionSuccess('');
    setActionLoading(true);
    try {
      await claimFixedRateJob(job, workerProfile);
      setActionSuccess(
        `আপনি ${formatBDT(job.suggestedCharge)} ফিক্সড রেটে কাজটি সফলভাবে বুকিং নিয়েছেন।`
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'বুকিং নেওয়া যায়নি।');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptBid = async (chosenBid: JobBid) => {
    setActionError('');
    setActionSuccess('');
    setActionLoading(true);
    try {
      await acceptJobBid(job, chosenBid, bids);
      setActionSuccess(
        `${chosenBid.workerName}-এর ${formatBDT(chosenBid.chargeAmount)} চার্জের বিডটি গ্রহণ করা হয়েছে।`
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'বিড গ্রহণ করা যায়নি।');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (nextStatus: 'completed' | 'cancelled') => {
    setActionError('');
    setActionSuccess('');
    setActionLoading(true);
    try {
      await updateJobStatus(job.id, nextStatus);
      setActionSuccess(
        nextStatus === 'completed'
          ? 'কাজটি সম্পন্ন হিসেবে চিহ্নিত করা হয়েছে।'
          : 'কাজটি বাতিল করা হয়েছে।'
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'অবস্থা পরিবর্তন করা যায়নি।');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitPayment = async (e: FormEvent) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    setActionLoading(true);
    try {
      await submitJobPayment(job, payMethod, trxIdInput);
      setActionSuccess('পেমেন্ট তথ্য জমা দেওয়া হয়েছে। কর্মী বা অ্যাডমিন যাচাই করে নিশ্চিত করবেন।');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'পেমেন্ট তথ্য জমা দেওয়া যায়নি।');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    setActionError('');
    setActionSuccess('');
    setActionLoading(true);
    try {
      await confirmJobPaymentReceived(job);
      setActionSuccess('পেমেন্ট পরিশোধিত হিসেবে নিশ্চিত করা হয়েছে।');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'পেমেন্ট নিশ্চিত করা যায়নি।');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
          <span className="font-semibold text-green-700">{categoryInfo.title}</span>
          <span aria-hidden="true">·</span>
          <span>{BOOKING_MODE_LABELS[bookingMode]}</span>
          <span aria-hidden="true">·</span>
          <span>{job.area}</span>
          <span aria-hidden="true">·</span>
          <span>{formatTimestampBn(job.createdAt)}</span>
        </div>

        <h3 className="text-xl font-bold text-slate-900 leading-snug mb-3">{job.title}</h3>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <span
            className={`font-medium ${
              job.urgency === 'immediate' ? 'text-red-700' : 'text-slate-700'
            }`}
          >
            সময়: {URGENCY_LABELS[job.urgency]}
          </span>
          <span className="text-slate-400" aria-hidden="true">
            |
          </span>
          <span className="text-slate-700">
            অবস্থা:{' '}
            <strong className="font-semibold text-slate-900">{STATUS_LABELS[job.status]}</strong>
          </span>
          {bookingMode === 'bidding' && (
            <>
              <span className="text-slate-400" aria-hidden="true">
                |
              </span>
              <span className="text-slate-700">
                মোট বিড:{' '}
                <strong className="font-mono tabular-nums text-slate-900">
                  {toBanglaDigits(job.bidCount)}টি
                </strong>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6">
        {/* Charge summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-green-50/40 border border-slate-200">
          <div>
            <p className="text-xs text-slate-500 mb-0.5">
              {bookingMode === 'fixed' ? 'নির্ধারিত ফিক্সড চার্জ' : 'ক্লায়েন্টের প্রস্তাবিত বাজেট'}
            </p>
            <p className="text-xl font-bold font-mono tabular-nums text-slate-900">
              {formatBDT(job.suggestedCharge)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">
              {job.status === 'open' ? 'পোস্টকারী' : 'নির্ধারিত কর্মী ও চূড়ান্ত চার্জ'}
            </p>
            {job.status === 'open' ? (
              <p className="text-sm font-semibold text-slate-800 mt-1">{job.clientName}</p>
            ) : (
              <p className="text-sm font-semibold text-green-800 mt-1">
                {job.assignedWorkerName || '—'}{' '}
                {job.acceptedCharge > 0 && (
                  <span className="font-mono tabular-nums">({formatBDT(job.acceptedCharge)})</span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Full description */}
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-1.5">কাজের বিস্তারিত বিবরণ</h4>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {job.description}
          </p>
        </div>

        {/* Private Contact Box */}
        {(isOwner || isAssignedWorker) && (
          <div className="p-4 rounded-lg bg-green-50/70 border border-green-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-green-900">
              <Lock className="w-3.5 h-3.5 text-green-700" />
              <span>গোপন যোগাযোগ ও ঠিকানা (শুধুমাত্র আপনি ও নির্ধারিত কর্মীর জন্য)</span>
            </div>
            {privateContact ? (
              <div className="text-sm text-slate-800 space-y-1.5 pt-1">
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-green-700 shrink-0 mt-0.5" />
                  <span>{privateContact.exactAddress}</span>
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <a
                    href={`tel:${privateContact.contactPhone}`}
                    className="inline-flex items-center gap-1.5 font-mono tabular-nums text-sm font-semibold text-green-800 hover:underline"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>{privateContact.contactPhone}</span>
                  </a>
                  <a
                    href={`https://wa.me/88${privateContact.contactPhone.replace(/\D/g, '').replace(/^88/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-green-800 hover:underline"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>হোয়াটসঅ্যাপে মেসেজ দিন</span>
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600">যোগাযোগের তথ্য লোড হচ্ছে...</p>
            )}
          </div>
        )}

        {/* Payment Section (Visible to Owner or Assigned Worker once assigned/completed) */}
        {(isOwner || isAssignedWorker) &&
          (job.status === 'assigned' || job.status === 'completed') && (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <CreditCard className="w-4 h-4 text-green-700" />
                  <span>পেমেন্ট ও চার্জ পরিশোধ</span>
                </div>
                <span
                  className={`text-xs font-semibold ${
                    paymentStatus === 'paid'
                      ? 'text-green-700'
                      : paymentStatus === 'pending_verification'
                      ? 'text-amber-700'
                      : 'text-slate-600'
                  }`}
                >
                  অবস্থা: {PAYMENT_STATUS_LABELS[paymentStatus]}
                </span>
              </div>

              {paymentStatus === 'paid' ? (
                <p className="text-sm text-green-800 font-medium">
                  {formatBDT(job.paidAmount || job.acceptedCharge)} সফলভাবে পরিশোধিত (
                  {PAYMENT_METHOD_LABELS[paymentMethod]}
                  {job.paymentTrxId ? ` · ${job.paymentTrxId}` : ''})।
                </p>
              ) : isOwner ? (
                <form onSubmit={handleSubmitPayment} className="space-y-3 pt-1">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    বিকাশ বা নগদ পেমেন্টের জন্য <strong className="font-mono">{OFFICE_INFO.phoneRaw}</strong>{' '}
                    নম্বরে সেন্ড মানি করে Transaction ID লিখুন অথবা কাজের শেষে হাতে নগদ (Cash) নির্বাচন করুন।
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      aria-label="পেমেন্ট মাধ্যম"
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                      className="px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-green-700"
                    >
                      <option value="bkash">বিকাশ (bKash: {OFFICE_INFO.bkashNumber})</option>
                      <option value="nagad">নগদ (Nagad: {OFFICE_INFO.nagadNumber})</option>
                      <option value="cash">কাজের শেষে হাতে নগদ (Cash)</option>
                      <option value="bank">ব্যাংক ট্রান্সফার</option>
                    </select>

                    {payMethod !== 'cash' && (
                      <input
                        type="text"
                        value={trxIdInput}
                        onChange={(e) => setTrxIdInput(e.target.value)}
                        placeholder="Transaction ID (যেমন: BKA9X21...)"
                        maxLength={VALIDATION_LIMITS.trxMax}
                        className="px-3 py-2 text-xs sm:text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-green-700"
                      />
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    {actionLoading ? 'জমা হচ্ছে...' : 'পেমেন্ট তথ্য জমা দিন'}
                  </button>
                </form>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-xs text-slate-600">
                    মাধ্যম: {PAYMENT_METHOD_LABELS[paymentMethod]}
                    {job.paymentTrxId ? ` · তথ্য: ${job.paymentTrxId}` : ''}
                  </p>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => void handleConfirmPayment()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 disabled:opacity-60 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>পেমেন্ট বুঝে পেয়েছি ({formatBDT(job.acceptedCharge)})</span>
                  </button>
                </div>
              )}
            </div>
          )}

        {actionError && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
          >
            {actionError}
          </div>
        )}
        {actionSuccess && (
          <div
            role="status"
            className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800"
          >
            {actionSuccess}
          </div>
        )}

        {/* Owner Management Section */}
        {isOwner && (
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="text-base font-bold text-slate-900">
                {bookingMode === 'fixed'
                  ? 'বুকিং পরিচালনা'
                  : `আগত বিডসমূহ (${toBanglaDigits(bids.length)})`}
              </h4>
              <div className="flex items-center gap-2">
                {job.status === 'open' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleStatusChange('cancelled')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>কাজ বাতিল করুন</span>
                  </button>
                )}
                {job.status === 'assigned' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleStatusChange('completed')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>কাজ সম্পন্ন হয়েছে</span>
                  </button>
                )}
              </div>
            </div>

            {bookingMode === 'fixed' ? (
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700">
                {job.status === 'open'
                  ? 'এটি একটি ফিক্সড-রেট বুকিং। আশেপাশের কোনো নিবন্ধিত কর্মী এটি গ্রহণ করলেই সাথে সাথে আপনার সাথে যোগাযোগ করবেন।'
                  : `নির্ধারিত কর্মী: ${job.assignedWorkerName} (${formatBDT(job.acceptedCharge)})`}
              </div>
            ) : loadingBids ? (
              <div className="space-y-2">
                <div className="h-16 rounded-lg bg-slate-100 animate-pulse" />
                <div className="h-16 rounded-lg bg-slate-100 animate-pulse" />
              </div>
            ) : bids.length === 0 ? (
              <div className="p-5 rounded-lg border border-dashed border-slate-300 text-center text-sm text-slate-500">
                এখনো কোনো কর্মী বিড করেননি। আশেপাশের কর্মীরা দেখলে চার্জসহ বিড জমা দেবেন।
              </div>
            ) : (
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
                {bids.map((bid) => (
                  <div
                    key={bid.id}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      bid.status === 'accepted' ? 'bg-green-50/50' : 'bg-white'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="text-sm font-bold text-slate-900">{bid.workerName}</span>
                        <span aria-hidden="true">·</span>
                        <span>{bid.workerArea}</span>
                        <span aria-hidden="true">·</span>
                        <span>{BID_STATUS_LABELS[bid.status]}</span>
                      </div>
                      <p className="text-xs text-slate-600 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>পৌঁছানোর সময়: {bid.estimatedArrival}</span>
                      </p>
                      {bid.note && <p className="text-sm text-slate-700 pt-1">{bid.note}</p>}
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                      <span className="text-lg font-bold font-mono tabular-nums text-slate-900">
                        {formatBDT(bid.chargeAmount)}
                      </span>
                      {job.status === 'open' && bid.status === 'pending' && (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleAcceptBid(bid)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>বিড গ্রহণ করুন</span>
                        </button>
                      )}
                      {bid.status === 'accepted' && (
                        <span className="text-xs font-semibold text-green-800">গৃহীত কর্মী</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Worker Bidding / Fixed Rate Booking Section */}
        {!isOwner && (
          <div className="pt-4 border-t border-slate-200 space-y-4">
            {job.status !== 'open' ? (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700">
                {isAssignedWorker ? (
                  <p className="font-medium text-green-800">
                    অভিনন্দন! {formatBDT(job.acceptedCharge)} চার্জে কাজটি আপনার জন্য নির্ধারিত হয়েছে।
                    উপরের ঠিকানা ও নম্বরে যোগাযোগ করে সেবা দিন।
                  </p>
                ) : (
                  <p>এই কাজটির জন্য ইতিমধ্যেই কর্মী নির্ধারিত বা কাজটি বন্ধ হয়ে গেছে।</p>
                )}
              </div>
            ) : !workerProfile ? (
              <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    এই কাজে বিড বা বুকিং নিতে কর্মী অ্যাকাউন্ট প্রয়োজন
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    আপনার নাম, এলাকা ও সেবার ধরন যুক্ত করে ১ মিনিটে কর্মী অ্যাকাউন্ট চালু করুন।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenWorkerSetup}
                  className="px-4 py-2.5 text-xs font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  কর্মী অ্যাকাউন্ট চালু করুন
                </button>
              </div>
            ) : bookingMode === 'fixed' ? (
              <div className="p-5 rounded-lg bg-green-50/60 border border-green-200 space-y-3">
                <h4 className="text-base font-bold text-slate-900">
                  ফিক্সড রেট বুকিং ({formatBDT(job.suggestedCharge)})
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  গ্রাহক এই কাজের জন্য নির্ধারিত চার্জ {formatBDT(job.suggestedCharge)} ঠিক করেছেন।
                  আপনি কাজটি করতে প্রস্তুত থাকলে নিচের বাটনে ক্লিক করে সরাসরি বুকিং কনফার্ম করুন।
                </p>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => void handleClaimFixedJob()}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {actionLoading
                    ? 'বুকিং হচ্ছে...'
                    : `নির্ধারিত চার্জে কাজটি নিন (${formatBDT(job.suggestedCharge)})`}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitBid} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-slate-900">
                    {myBid ? 'আপনার জমা দেওয়া বিড হালনাগাদ করুন' : 'আপনার চার্জ উল্লেখ করে বিড করুন'}
                  </h4>
                  {myBid && (
                    <span className="text-xs font-medium text-green-700">
                      বিড জমা হয়েছে ({formatBDT(myBid.chargeAmount)})
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="bid-charge"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      আপনার প্রস্তাবিত চার্জ (৳)
                    </label>
                    <input
                      id="bid-charge"
                      type="number"
                      required
                      min={VALIDATION_LIMITS.minCharge}
                      max={VALIDATION_LIMITS.maxCharge}
                      value={chargeInput}
                      onChange={(e) => setChargeInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-green-700"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="bid-arrival"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      কতক্ষণে পৌঁছাতে পারবেন?
                    </label>
                    <input
                      id="bid-arrival"
                      type="text"
                      required
                      minLength={VALIDATION_LIMITS.arrivalMin}
                      maxLength={VALIDATION_LIMITS.arrivalMax}
                      value={arrivalInput}
                      onChange={(e) => setArrivalInput(e.target.value)}
                      placeholder="যেমন: ২০ মিনিটের মধ্যে"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-green-700"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="bid-note"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    ক্লায়েন্টের উদ্দেশ্যে সংক্ষিপ্ত বার্তা (ঐচ্ছিক)
                  </label>
                  <textarea
                    id="bid-note"
                    rows={2}
                    maxLength={VALIDATION_LIMITS.noteMax}
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="যেমন: আমি হাজারীবাগেই আছি, হাসপাতাল বা গন্তব্য সম্পর্কে ভালো জানাশোনা আছে।"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-green-700"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {actionLoading
                    ? 'জমা হচ্ছে...'
                    : myBid
                    ? 'বিডের চার্জ আপডেট করুন'
                    : 'বিড জমা দিন'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
