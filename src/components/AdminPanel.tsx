import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  STATUS_LABELS,
  formatBDT,
  formatTimestampBn,
  getCategoryItem,
  toBanglaDigits,
  type EmergencyJob,
  type WorkerProfile,
} from '../types/marketplace';
import { adminModerateJob, adminUpdateWorkerStatus } from '../services/marketplaceService';

type AdminSubTab = 'payments' | 'workers' | 'jobs';

export function AdminPanel() {
  const [subTab, setSubTab] = useState<AdminSubTab>('payments');
  const [allJobs, setAllJobs] = useState<EmergencyJob[]>([]);
  const [allWorkers, setAllWorkers] = useState<WorkerProfile[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const unsubJobs = onSnapshot(
      collection(db, 'jobs'),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<EmergencyJob, 'id'>),
        }));
        list.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
        setAllJobs(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'jobs')
    );

    const unsubWorkers = onSnapshot(
      collection(db, 'workers'),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as WorkerProfile);
        list.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
        setAllWorkers(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'workers')
    );

    return () => {
      unsubJobs();
      unsubWorkers();
    };
  }, []);

  const stats = {
    openCount: allJobs.filter((j) => j.status === 'open').length,
    completedCount: allJobs.filter((j) => j.status === 'completed').length,
    pendingPaymentCount: allJobs.filter((j) => j.paymentStatus === 'pending_verification').length,
    totalPaidVolume: allJobs
      .filter((j) => j.paymentStatus === 'paid')
      .reduce((acc, j) => acc + (j.paidAmount || j.acceptedCharge || 0), 0),
    workerCount: allWorkers.length,
  };

  const pendingPaymentJobs = allJobs.filter(
    (j) => j.status === 'assigned' || j.status === 'completed'
  );

  const handleVerifyPayment = async (job: EmergencyJob, nextStatus: 'paid' | 'unpaid') => {
    setBusyId(job.id);
    setFeedback('');
    try {
      await adminModerateJob(job.id, {
        paymentStatus: nextStatus,
        paidAmount: nextStatus === 'paid' ? job.acceptedCharge : 0,
      });
      setFeedback(
        nextStatus === 'paid'
          ? 'পেমেন্ট যাচাই করে অনুমোদন করা হয়েছে।'
          : 'পেমেন্টটি অপরিশোধিত হিসেবে ফেরত পাঠানো হয়েছে।'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleWorker = async (
    worker: WorkerProfile,
    updates: { isVerified: boolean; isActive: boolean }
  ) => {
    setBusyId(worker.uid);
    setFeedback('');
    try {
      await adminUpdateWorkerStatus(worker.uid, updates);
      setFeedback(`${worker.name}-এর প্রোফাইল অবস্থা আপডেট করা হয়েছে।`);
    } finally {
      setBusyId(null);
    }
  };

  const handleAdminJobStatus = async (job: EmergencyJob, status: EmergencyJob['status']) => {
    setBusyId(job.id);
    setFeedback('');
    try {
      await adminModerateJob(job.id, { status });
      setFeedback(`কাজের অবস্থা "${STATUS_LABELS[status]}" করা হয়েছে।`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Real Firestore KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">খোলা কাজ</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {toBanglaDigits(stats.openCount)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">নিবন্ধিত কর্মী</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {toBanglaDigits(stats.workerCount)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">পেমেন্ট যাচাই বাকি</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-amber-700 mt-1">
            {toBanglaDigits(stats.pendingPaymentCount)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">মোট পরিশোধিত লেনদেন</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-green-700 mt-1">
            {formatBDT(stats.totalPaidVolume)}
          </p>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800"
        >
          {feedback}
        </div>
      )}

      {/* Admin Sub-tabs */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-3 border-b border-slate-200 flex flex-wrap items-center gap-1 bg-slate-50">
          {(
            [
              { id: 'payments', label: `পেমেন্ট যাচাই (${toBanglaDigits(pendingPaymentJobs.length)})` },
              { id: 'workers', label: `কর্মী নিয়ন্ত্রণ (${toBanglaDigits(allWorkers.length)})` },
              { id: 'jobs', label: `সকল কাজ (${toBanglaDigits(allJobs.length)})` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                subTab === t.id
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Payments Verification */}
        {subTab === 'payments' && (
          <div className="divide-y divide-slate-200">
            {pendingPaymentJobs.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                কোনো নির্ধারিত বা সম্পন্ন কাজের পেমেন্ট তথ্য পাওয়া যায়নি।
              </div>
            ) : (
              pendingPaymentJobs.map((job) => {
                const pStatus = job.paymentStatus || 'unpaid';
                const pMethod = job.paymentMethod || 'unselected';
                return (
                  <div
                    key={job.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900">{job.title}</p>
                      <p className="text-xs text-slate-500">
                        গ্রাহক: {job.clientName} · কর্মী: {job.assignedWorkerName || '—'} ·{' '}
                        {PAYMENT_METHOD_LABELS[pMethod]}
                        {job.paymentTrxId ? ` · TrxID: ${job.paymentTrxId}` : ''}
                      </p>
                      <p className="text-xs font-medium text-slate-700">
                        পেমেন্ট অবস্থা: {PAYMENT_STATUS_LABELS[pStatus]}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-base font-bold font-mono tabular-nums text-slate-900">
                        {formatBDT(job.acceptedCharge)}
                      </span>
                      {pStatus !== 'paid' ? (
                        <button
                          type="button"
                          disabled={busyId === job.id}
                          onClick={() => void handleVerifyPayment(job, 'paid')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 disabled:opacity-60 cursor-pointer whitespace-nowrap"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>অনুমোদন করুন</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busyId === job.id}
                          onClick={() => void handleVerifyPayment(job, 'unpaid')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-60 cursor-pointer whitespace-nowrap"
                        >
                          <span>অপরিশোধিত করুন</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Workers Management */}
        {subTab === 'workers' && (
          <div className="divide-y divide-slate-200">
            {allWorkers.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                এখনো কোনো কর্মী নিবন্ধন করেননি।
              </div>
            ) : (
              allWorkers.map((w) => (
                <div
                  key={w.uid}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{w.name}</span>
                      <span aria-hidden="true" className="text-slate-400">
                        ·
                      </span>
                      <span className="text-xs text-slate-600">{w.area}</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {w.categories.map((c) => getCategoryItem(c).shortTitle).join(' · ')} ·{' '}
                      <span className="font-mono tabular-nums">{formatBDT(w.baseCharge)}</span>
                    </p>
                    <p className="text-xs text-slate-600">
                      অবস্থা: {w.isVerified ? 'অ্যাডমিন যাচাইকৃত' : 'অযাচাইকৃত'} ·{' '}
                      {w.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={busyId === w.uid}
                      onClick={() =>
                        void handleToggleWorker(w, {
                          isVerified: !w.isVerified,
                          isActive: w.isActive,
                        })
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        w.isVerified
                          ? 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{w.isVerified ? 'যাচাই বাতিল' : 'কর্মী যাচাই করুন'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={busyId === w.uid}
                      onClick={() =>
                        void handleToggleWorker(w, {
                          isVerified: Boolean(w.isVerified),
                          isActive: !w.isActive,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer"
                    >
                      <span>{w.isActive ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* All Jobs Moderation */}
        {subTab === 'jobs' && (
          <div className="divide-y divide-slate-200">
            {allJobs.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">কোনো কাজ নেই।</div>
            ) : (
              allJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900">{job.title}</p>
                    <p className="text-xs text-slate-500">
                      {getCategoryItem(job.category).shortTitle} · {job.area} ·{' '}
                      {formatTimestampBn(job.createdAt)} · অবস্থা: {STATUS_LABELS[job.status]}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <span className="text-sm font-bold font-mono tabular-nums text-slate-900 mr-2">
                      {formatBDT(job.acceptedCharge > 0 ? job.acceptedCharge : job.suggestedCharge)}
                    </span>
                    {job.status !== 'completed' && (
                      <button
                        type="button"
                        disabled={busyId === job.id}
                        onClick={() => void handleAdminJobStatus(job, 'completed')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-green-800 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>সম্পন্ন</span>
                      </button>
                    )}
                    {job.status !== 'cancelled' && (
                      <button
                        type="button"
                        disabled={busyId === job.id}
                        onClick={() => void handleAdminJobStatus(job, 'cancelled')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>বাতিল</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
