import { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Download, LogOut, Plus, Search, ShieldAlert, UserCheck, UserCog } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  BOOKING_MODE_LABELS,
  CITY_LABELS,
  PAYMENT_STATUS_LABELS,
  SERVICE_CATALOG,
  STATUS_LABELS,
  URGENCY_LABELS,
  formatBDT,
  formatTimestampBn,
  getCategoryItem,
  inferCityFromArea,
  toBanglaDigits,
  type EmergencyJob,
  type ServiceCategory,
  type ServiceCity,
  type WorkerProfile,
} from '../types/marketplace';
import { JobDetailPanel } from './JobDetailPanel';
import { AdminPanel } from './AdminPanel';

type WorkspaceTab = 'open' | 'my_posts' | 'my_assigned' | 'workers' | 'admin';

interface LiveMarketplaceProps {
  user: User | null;
  authLoading: boolean;
  isAdmin: boolean;
  workerProfile: WorkerProfile | null;
  selectedJobId: string | null;
  onSelectJobId: (id: string | null) => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenPostJob: (category?: ServiceCategory, fixedCharge?: number) => void;
  onOpenWorkerModal: () => void;
  onOpenCustomerModal: () => void;
  onOpenInstallModal: () => void;
}

export function LiveMarketplace({
  user,
  authLoading,
  isAdmin,
  workerProfile,
  selectedJobId,
  onSelectJobId,
  onSignIn,
  onSignOut,
  onOpenPostJob,
  onOpenWorkerModal,
  onOpenCustomerModal,
  onOpenInstallModal,
}: LiveMarketplaceProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('open');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ServiceCategory>('all');
  const [cityFilter, setCityFilter] = useState<'all' | ServiceCity>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [openJobs, setOpenJobs] = useState<EmergencyJob[]>([]);
  const [myPostedJobs, setMyPostedJobs] = useState<EmergencyJob[]>([]);
  const [myAssignedJobs, setMyAssignedJobs] = useState<EmergencyJob[]>([]);
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  useEffect(() => {
    if (!user) {
      setOpenJobs([]);
      setMyPostedJobs([]);
      setMyAssignedJobs([]);
      setWorkers([]);
      return;
    }

    setLoadingJobs(true);

    const openQuery = query(collection(db, 'jobs'), where('status', '==', 'open'));
    const unsubOpen = onSnapshot(
      openQuery,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<EmergencyJob, 'id'>),
        }));
        list.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
        setOpenJobs(list);
        setLoadingJobs(false);
      },
      (err) => {
        setLoadingJobs(false);
        handleFirestoreError(err, OperationType.LIST, 'jobs');
      }
    );

    const myPostsQuery = query(collection(db, 'jobs'), where('clientId', '==', user.uid));
    const unsubMyPosts = onSnapshot(
      myPostsQuery,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<EmergencyJob, 'id'>),
        }));
        list.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
        setMyPostedJobs(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'jobs');
      }
    );

    const myAssignedQuery = query(
      collection(db, 'jobs'),
      where('assignedWorkerId', '==', user.uid)
    );
    const unsubMyAssigned = onSnapshot(
      myAssignedQuery,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<EmergencyJob, 'id'>),
        }));
        list.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
        setMyAssignedJobs(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'jobs');
      }
    );

    const workersQuery = query(collection(db, 'workers'), where('isActive', '==', true));
    const unsubWorkers = onSnapshot(
      workersQuery,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as WorkerProfile);
        setWorkers(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'workers');
      }
    );

    return () => {
      unsubOpen();
      unsubMyPosts();
      unsubMyAssigned();
      unsubWorkers();
    };
  }, [user]);

  const currentJobList = useMemo(() => {
    const source =
      activeTab === 'open'
        ? openJobs
        : activeTab === 'my_posts'
        ? myPostedJobs
        : activeTab === 'my_assigned'
        ? myAssignedJobs
        : [];

    const needle = searchTerm.trim().toLowerCase();
    return source.filter((job) => {
      if (categoryFilter !== 'all' && job.category !== categoryFilter) return false;
      const jobCity = job.city || inferCityFromArea(job.area);
      if (cityFilter !== 'all' && jobCity !== cityFilter) return false;
      if (!needle) return true;
      return (
        job.title.toLowerCase().includes(needle) ||
        job.area.toLowerCase().includes(needle) ||
        job.description.toLowerCase().includes(needle)
      );
    });
  }, [activeTab, openJobs, myPostedJobs, myAssignedJobs, categoryFilter, cityFilter, searchTerm]);

  const filteredWorkers = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    return workers.filter((w) => {
      if (categoryFilter !== 'all' && !w.categories.includes(categoryFilter)) return false;
      const wCity = inferCityFromArea(w.area);
      if (cityFilter !== 'all' && wCity !== cityFilter) return false;
      if (!needle) return true;
      return (
        w.name.toLowerCase().includes(needle) ||
        w.area.toLowerCase().includes(needle) ||
        w.bio.toLowerCase().includes(needle)
      );
    });
  }, [workers, categoryFilter, cityFilter, searchTerm]);

  const allKnownJobs = useMemo(() => {
    const map = new Map<string, EmergencyJob>();
    for (const j of [...openJobs, ...myPostedJobs, ...myAssignedJobs]) {
      map.set(j.id, j);
    }
    return map;
  }, [openJobs, myPostedJobs, myAssignedJobs]);

  const selectedJob = useMemo(() => {
    if (selectedJobId && allKnownJobs.has(selectedJobId)) {
      return allKnownJobs.get(selectedJobId) ?? null;
    }
    return currentJobList[0] ?? null;
  }, [selectedJobId, allKnownJobs, currentJobList]);

  return (
    <section id="marketplace" className="py-14 lg:py-20 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
              লাইভ কাজের বোর্ড, বুকিং ও বিডিং কেন্দ্র
            </h2>
            <p className="text-slate-600 mt-1.5 text-sm sm:text-base">
              ঢাকা ও নারায়ণগঞ্জের জরুরি কাজের অনুরোধ দেখুন, ফিক্সড রেট বা বিডিংয়ে কাজ নিন এবং
              পেমেন্ট পরিচালনা করুন।
            </p>
          </div>

          {user && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onOpenCustomerModal}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
              >
                <UserCheck className="w-4 h-4 text-green-700" />
                <span>গ্রাহক প্রোফাইল</span>
              </button>

              <button
                type="button"
                onClick={onOpenWorkerModal}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
              >
                <UserCog className="w-4 h-4 text-green-700" />
                <span>{workerProfile ? 'কর্মী প্রোফাইল' : 'কর্মী অ্যাকাউন্ট খুলুন'}</span>
              </button>

              <button
                type="button"
                onClick={onOpenInstallModal}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-green-900 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4 text-green-700" />
                <span>অ্যাপ ইনস্টল</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenPostJob()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন কাজ পোস্ট</span>
              </button>

              <button
                type="button"
                onClick={onSignOut}
                title="লগআউট করুন"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:text-red-700 hover:border-red-200 transition-colors cursor-pointer whitespace-nowrap"
              >
                <LogOut className="w-4 h-4" />
                <span>লগআউট</span>
              </button>
            </div>
          )}
        </div>

        {/* Auth Gate */}
        {authLoading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
            অ্যাকাউন্ট তথ্য যাচাই করা হচ্ছে...
          </div>
        ) : !user ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12 text-center max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              কাজ পোস্ট, বুকিং বা বিড করতে লগইন করুন
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              পরিবারের সদস্য, শিশু ও ব্যক্তিগত নিরাপত্তার কথা বিবেচনা করে কেবল যাচাইকৃত অ্যাকাউন্টের
              মাধ্যমেই লাইভ কাজের তালিকা দেখা, বুকিং ও বিড করা যায়।
            </p>
            <button
              type="button"
              onClick={onSignIn}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors cursor-pointer"
            >
              <span>গুগল অ্যাকাউন্ট দিয়ে প্রবেশ করুন</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Workspace Control Strip */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              {/* View Segmented Tabs */}
              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {(
                  [
                    { id: 'open', label: `খোলা কাজ (${toBanglaDigits(openJobs.length)})` },
                    { id: 'my_posts', label: `আমার পোস্ট (${toBanglaDigits(myPostedJobs.length)})` },
                    {
                      id: 'my_assigned',
                      label: `আমার গৃহীত কাজ (${toBanglaDigits(myAssignedJobs.length)})`,
                    },
                    { id: 'workers', label: `কর্মী তালিকা (${toBanglaDigits(workers.length)})` },
                    ...(isAdmin
                      ? [{ id: 'admin' as const, label: 'অ্যাডমিন প্যানেল' }]
                      : []),
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5 ${
                      activeTab === tab.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.id === 'admin' && <ShieldAlert className="w-3.5 h-3.5 text-green-700" />}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Search, City & Category Filters */}
              {activeTab !== 'admin' && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="এলাকা বা কাজ খুঁজুন..."
                      className="w-full sm:w-44 pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-green-700"
                    />
                  </div>

                  <select
                    aria-label="জেলা ফিল্টার"
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value as 'all' | ServiceCity)}
                    className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-green-700"
                  >
                    {Object.entries(CITY_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="সেবার ধরন ফিল্টার"
                    value={categoryFilter}
                    onChange={(e) =>
                      setCategoryFilter(e.target.value as 'all' | ServiceCategory)
                    }
                    className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-green-700"
                  >
                    <option value="all">সকল সেবার ধরন</option>
                    {SERVICE_CATALOG.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.shortTitle}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {activeTab === 'admin' && isAdmin ? (
              <AdminPanel />
            ) : activeTab === 'workers' ? (
              filteredWorkers.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
                  <p className="text-base font-semibold text-slate-800 mb-1">
                    এই মুহূর্তে কোনো সক্রিয় কর্মী পাওয়া যায়নি
                  </p>
                  <p className="text-sm text-slate-500 mb-5">
                    আপনি নিজেই কর্মী অ্যাকাউন্ট চালু করে আশেপাশের কাজে বিড করতে পারেন।
                  </p>
                  <button
                    type="button"
                    onClick={onOpenWorkerModal}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors cursor-pointer"
                  >
                    কর্মী হিসেবে নিবন্ধন করুন
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredWorkers.map((w) => (
                    <div
                      key={w.uid}
                      className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <h3 className="text-base font-bold text-slate-900">
                              {w.name}
                              {w.isVerified && (
                                <span className="ml-1.5 text-xs font-medium text-green-700">
                                  · যাচাইকৃত
                                </span>
                              )}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {w.area} · অভিজ্ঞতা {toBanglaDigits(w.experienceYears)} বছর
                            </p>
                          </div>
                          <span className="text-sm font-bold font-mono tabular-nums text-green-800 shrink-0">
                            {formatBDT(w.baseCharge)}+
                          </span>
                        </div>
                        <p className="text-xs font-medium text-green-700 mb-2">
                          {w.categories.map((c) => getCategoryItem(c).shortTitle).join(' · ')}
                        </p>
                        <p className="text-sm text-slate-600 leading-relaxed">{w.bio}</p>
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-500">
                        <span className="font-mono tabular-nums">
                          সম্পন্ন কাজ: {toBanglaDigits(w.completedJobs)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenPostJob(w.categories[0], w.baseCharge)}
                          className="px-3 py-1.5 text-xs font-medium text-green-800 bg-green-50 border border-green-200 rounded-lg hover:bg-green-700 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                        >
                          ফিক্সড রেটে বুক করুন
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* Jobs Master-Detail Split */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5 space-y-3">
                  {loadingJobs ? (
                    <div className="space-y-3">
                      <div className="h-28 bg-white border border-slate-200 rounded-xl animate-pulse" />
                      <div className="h-28 bg-white border border-slate-200 rounded-xl animate-pulse" />
                    </div>
                  ) : currentJobList.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                      <p className="text-base font-semibold text-slate-800 mb-1">
                        কোনো কাজ পাওয়া যায়নি
                      </p>
                      <p className="text-sm text-slate-500 mb-5">
                        {activeTab === 'open'
                          ? 'এখনো কোনো খোলা কাজ নেই। প্রয়োজন হলে নতুন জরুরি কাজ পোস্ট করুন।'
                          : 'এই তালিকায় এখনো কোনো কাজ যুক্ত হয়নি।'}
                      </p>
                      <button
                        type="button"
                        onClick={() => onOpenPostJob()}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors cursor-pointer"
                      >
                        জরুরি কাজ পোস্ট করুন
                      </button>
                    </div>
                  ) : (
                    currentJobList.map((job) => {
                      const isSelected = selectedJob?.id === job.id;
                      const cat = getCategoryItem(job.category);
                      const mode = job.bookingMode || 'bidding';
                      const pStatus = job.paymentStatus || 'unpaid';
                      return (
                        <button
                          key={job.id}
                          type="button"
                          onClick={() => onSelectJobId(job.id)}
                          className={`w-full text-left p-4 sm:p-5 rounded-xl border transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-white border-green-700 ring-1 ring-green-700'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1.5">
                            <span className="font-medium text-green-700 truncate">
                              {cat.shortTitle} · {BOOKING_MODE_LABELS[mode]} · {job.area}
                            </span>
                            <span className="shrink-0">{formatTimestampBn(job.createdAt)}</span>
                          </div>

                          <h3 className="text-base font-bold text-slate-900 leading-snug mb-2">
                            {job.title}
                          </h3>

                          <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                            <span
                              className={
                                job.urgency === 'immediate' && job.status === 'open'
                                  ? 'font-semibold text-red-700'
                                  : 'text-slate-600'
                              }
                            >
                              {job.status === 'open'
                                ? URGENCY_LABELS[job.urgency]
                                : `${STATUS_LABELS[job.status]} · ${PAYMENT_STATUS_LABELS[pStatus]}`}
                            </span>

                            <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums">
                              {mode === 'bidding' && (
                                <span className="text-slate-500">
                                  {toBanglaDigits(job.bidCount)} বিড
                                </span>
                              )}
                              <span className="font-bold text-slate-900 text-sm">
                                {formatBDT(
                                  job.acceptedCharge > 0 ? job.acceptedCharge : job.suggestedCharge
                                )}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="lg:col-span-7 lg:sticky lg:top-20">
                  <JobDetailPanel
                    job={selectedJob}
                    currentUserId={user.uid}
                    workerProfile={workerProfile}
                    onOpenWorkerSetup={onOpenWorkerModal}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
