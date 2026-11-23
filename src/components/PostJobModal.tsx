import { useEffect, useState, type FormEvent } from 'react';
import { Lock, X } from 'lucide-react';
import {
  BOOKING_MODE_LABELS,
  DHAKA_AREAS,
  SERVICE_CATALOG,
  URGENCY_LABELS,
  VALIDATION_LIMITS,
  formatBDT,
  getCategoryItem,
  type BookingMode,
  type ServiceCategory,
  type UrgencyLevel,
} from '../types/marketplace';
import { createEmergencyJob } from '../services/marketplaceService';

interface PostJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  defaultPhone?: string;
  defaultArea?: string;
  initialCategory?: ServiceCategory;
  initialMode?: BookingMode;
  initialCharge?: number;
  onCreated: (jobId: string) => void;
}

export function PostJobModal({
  isOpen,
  onClose,
  userId,
  userName,
  defaultPhone = '',
  defaultArea = DHAKA_AREAS[0],
  initialCategory = 'hospital_guide',
  initialMode = 'bidding',
  initialCharge,
  onCreated,
}: PostJobModalProps) {
  const [category, setCategory] = useState<ServiceCategory>(initialCategory);
  const [bookingMode, setBookingMode] = useState<BookingMode>(initialMode);
  const [title, setTitle] = useState('');
  const [area, setArea] = useState(defaultArea || DHAKA_AREAS[0]);
  const [urgency, setUrgency] = useState<UrgencyLevel>('immediate');
  const [suggestedCharge, setSuggestedCharge] = useState(
    String(initialCharge ?? getCategoryItem(initialCategory).defaultCharge)
  );
  const [contactPhone, setContactPhone] = useState(defaultPhone);
  const [exactAddress, setExactAddress] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCategory(initialCategory);
      setBookingMode(initialMode);
      setSuggestedCharge(
        String(initialCharge ?? getCategoryItem(initialCategory).defaultCharge)
      );
      if (defaultPhone) setContactPhone(defaultPhone);
      if (defaultArea) setArea(defaultArea);
      setErrorMsg('');
    }
  }, [isOpen, initialCategory, initialMode, initialCharge, defaultPhone, defaultArea]);

  if (!isOpen) return null;

  const handleCategoryChange = (nextCat: ServiceCategory) => {
    setCategory(nextCat);
    setSuggestedCharge(String(getCategoryItem(nextCat).defaultCharge));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const chargeNum = Number(suggestedCharge);
    if (!Number.isFinite(chargeNum) || chargeNum < VALIDATION_LIMITS.minCharge) {
      setErrorMsg(`চার্জ কমপক্ষে ${formatBDT(VALIDATION_LIMITS.minCharge)} হতে হবে।`);
      return;
    }

    setSubmitting(true);
    try {
      const jobId = await createEmergencyJob(userId, userName, {
        category,
        bookingMode,
        title,
        description,
        area,
        urgency,
        suggestedCharge: chargeNum,
        contactPhone,
        exactAddress,
      });
      setTitle('');
      setDescription('');
      setExactAddress('');
      onCreated(jobId);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'কাজ পোস্ট করতে সমস্যা হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-job-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl my-8 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 id="post-job-title" className="text-lg font-bold text-slate-900">
              নতুন জরুরি কাজ ও বুকিং পোস্ট করুন
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              লাইভ বিডিং অথবা ফিক্সড রেট বুকিং—যেকোনো একটি বেছে নিন (ঢাকা ও নারায়ণগঞ্জ)।
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {errorMsg && (
            <div
              role="alert"
              className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
            >
              {errorMsg}
            </div>
          )}

          {/* Booking Mode Selector */}
          <div>
            <span className="block text-sm font-medium text-slate-800 mb-2">
              বুকিং ধরন নির্বাচন করুন
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(['bidding', 'fixed'] as const).map((mode) => {
                const active = bookingMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setBookingMode(mode)}
                    className={`text-left px-3.5 py-2.5 rounded-lg border text-sm transition-colors cursor-pointer ${
                      active
                        ? 'border-green-700 bg-green-50 text-green-900 font-medium'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block">{BOOKING_MODE_LABELS[mode]}</span>
                    <span className="block text-xs text-slate-500 mt-0.5">
                      {mode === 'bidding'
                        ? 'কর্মীরা নিজস্ব চার্জ প্রস্তাব করে বিড করবে'
                        : 'আপনার নির্ধারিত ফিক্সড চার্জে সরাসরি বুকিং হবে'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">
              সেবার ধরন নির্বাচন করুন
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SERVICE_CATALOG.map((item) => {
                const active = category === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleCategoryChange(item.id)}
                    className={`text-left px-3.5 py-2.5 rounded-lg border text-sm transition-colors cursor-pointer ${
                      active
                        ? 'border-green-700 bg-green-50 text-green-900 font-medium'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block truncate">{item.title}</span>
                    <span className="block text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                      {bookingMode === 'fixed' ? item.fixedRateLabel : item.typicalCharge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="job-title" className="block text-sm font-medium text-slate-800 mb-1.5">
              কাজের সংক্ষিপ্ত শিরোনাম
            </label>
            <input
              id="job-title"
              type="text"
              required
              minLength={VALIDATION_LIMITS.titleMin}
              maxLength={VALIDATION_LIMITS.titleMax}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: মাকে নিয়ে ধানমন্ডি পপুলারে ডাক্তার দেখিয়ে বাসায় আনা"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-green-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="job-area" className="block text-sm font-medium text-slate-800 mb-1.5">
                এলাকা (ঢাকা ও নারায়ণগঞ্জ)
              </label>
              <select
                id="job-area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-green-700"
              >
                {DHAKA_AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="job-urgency"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                কখন প্রয়োজন
              </label>
              <select
                id="job-urgency"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-green-700"
              >
                {Object.entries(URGENCY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="job-charge"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                {bookingMode === 'fixed' ? 'নির্ধারিত ফিক্সড চার্জ (৳)' : 'সম্ভাব্য বাজেট (৳)'}
              </label>
              <input
                id="job-charge"
                type="number"
                required
                min={VALIDATION_LIMITS.minCharge}
                max={VALIDATION_LIMITS.maxCharge}
                value={suggestedCharge}
                onChange={(e) => setSuggestedCharge(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-green-700"
              />
            </div>
          </div>

          <div>
            <label htmlFor="job-desc" className="block text-sm font-medium text-slate-800 mb-1.5">
              কাজের বিস্তারিত বিবরণ
            </label>
            <textarea
              id="job-desc"
              rows={3}
              required
              minLength={VALIDATION_LIMITS.descMin}
              maxLength={VALIDATION_LIMITS.descMax}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="কাজটি কোথায় শুরু ও শেষ হবে, কতক্ষণ সময় লাগতে পারে বা বিশেষ কোনো নির্দেশনা থাকলে লিখুন..."
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-green-700"
            />
          </div>

          <div className="p-4 rounded-lg bg-green-50/50 border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <Lock className="w-3.5 h-3.5 text-green-700 shrink-0" />
              <span>
                গোপনীয়তা সুরক্ষিত: কর্মী নির্ধারিত হওয়ার আগ পর্যন্ত আপনার ফোন নম্বর ও সঠিক বাসার
                ঠিকানা গোপন থাকবে।
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="job-phone"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  যোগাযোগের মোবাইল / হোয়াটসঅ্যাপ নম্বর
                </label>
                <input
                  id="job-phone"
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full px-3.5 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-green-700"
                />
              </div>

              <div>
                <label
                  htmlFor="job-address"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  বাসা বা উপস্থিত হওয়ার পূর্ণ ঠিকানা
                </label>
                <input
                  id="job-address"
                  type="text"
                  required
                  minLength={VALIDATION_LIMITS.addressMin}
                  maxLength={VALIDATION_LIMITS.addressMax}
                  value={exactAddress}
                  onChange={(e) => setExactAddress(e.target.value)}
                  placeholder="বাসা/রোড নম্বর, ল্যান্ডমার্ক..."
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-green-700"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 disabled:opacity-60 transition-colors cursor-pointer"
            >
              {submitting
                ? 'পোস্ট হচ্ছে...'
                : bookingMode === 'fixed'
                ? 'ফিক্সড রেট বুকিং পোস্ট করুন'
                : 'বিডের জন্য কাজ পোস্ট করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
