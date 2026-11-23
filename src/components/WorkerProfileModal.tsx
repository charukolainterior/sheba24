import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import {
  DHAKA_AREAS,
  SERVICE_CATALOG,
  VALIDATION_LIMITS,
  type ServiceCategory,
  type WorkerProfile,
} from '../types/marketplace';
import { saveWorkerProfile } from '../services/marketplaceService';

interface WorkerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  defaultName: string;
  defaultPhone?: string;
  existingWorker: WorkerProfile | null;
  onSaved: () => void;
}

export function WorkerProfileModal({
  isOpen,
  onClose,
  userId,
  defaultName,
  defaultPhone = '',
  existingWorker,
  onSaved,
}: WorkerProfileModalProps) {
  const [name, setName] = useState(existingWorker?.name || defaultName);
  const [area, setArea] = useState(existingWorker?.area || DHAKA_AREAS[0]);
  const [phone, setPhone] = useState(defaultPhone);
  const [categories, setCategories] = useState<ServiceCategory[]>(
    existingWorker?.categories || ['hospital_guide']
  );
  const [baseCharge, setBaseCharge] = useState(String(existingWorker?.baseCharge || 600));
  const [experienceYears, setExperienceYears] = useState(
    String(existingWorker?.experienceYears ?? 1)
  );
  const [bio, setBio] = useState(
    existingWorker?.bio || 'ঢাকা ও নারায়ণগঞ্জ এলাকায় জরুরি সহায়তায় অভিজ্ঞ।'
  );
  const [isActive, setIsActive] = useState(existingWorker?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(existingWorker?.name || defaultName);
      setArea(existingWorker?.area || DHAKA_AREAS[0]);
      setPhone(defaultPhone);
      setCategories(existingWorker?.categories || ['hospital_guide']);
      setBaseCharge(String(existingWorker?.baseCharge || 600));
      setExperienceYears(String(existingWorker?.experienceYears ?? 1));
      setBio(
        existingWorker?.bio || 'ঢাকা ও নারায়ণগঞ্জ এলাকায় বিশ্বস্ত ও সময়মতো সেবা প্রদান করি।'
      );
      setIsActive(existingWorker?.isActive ?? true);
      setErrorMsg('');
    }
  }, [isOpen, existingWorker, defaultName, defaultPhone]);

  if (!isOpen) return null;

  const toggleCategory = (cat: ServiceCategory) => {
    setCategories((prev) => {
      if (prev.includes(cat)) {
        return prev.length > 1 ? prev.filter((c) => c !== cat) : prev;
      }
      return [...prev, cat];
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSaving(true);
    try {
      await saveWorkerProfile(userId, Boolean(existingWorker), {
        name,
        area,
        categories,
        baseCharge: Number(baseCharge) || 500,
        experienceYears: Number(experienceYears) || 0,
        bio,
        isActive,
        phone,
      });
      onSaved();
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'কর্মী অ্যাকাউন্ট সংরক্ষণ করা যায়নি।');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="worker-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-xl my-8 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 id="worker-modal-title" className="text-lg font-bold text-slate-900">
              {existingWorker ? 'কর্মী অ্যাকাউন্ট সম্পাদনা করুন' : 'কর্মী (Service Provider) অ্যাকাউন্ট চালু করুন'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              অ্যাকাউন্ট সক্রিয় থাকলে ঢাকা ও নারায়ণগঞ্জের সব জরুরি কাজে বিড ও ফিক্সড-রেট বুকিং নিতে পারবেন।
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="worker-name" className="block text-sm font-medium text-slate-800 mb-1.5">
                আপনার পূর্ণ নাম
              </label>
              <input
                id="worker-name"
                type="text"
                required
                minLength={VALIDATION_LIMITS.nameMin}
                maxLength={VALIDATION_LIMITS.nameMax}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-green-700"
              />
            </div>

            <div>
              <label htmlFor="worker-area" className="block text-sm font-medium text-slate-800 mb-1.5">
                কর্ম এলাকা (ঢাকা ও নারায়ণগঞ্জ)
              </label>
              <select
                id="worker-area"
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
          </div>

          <div>
            <span className="block text-sm font-medium text-slate-800 mb-2">
              আপনি যেসব সেবা দিতে পারবেন (একাধিক নির্বাচন করা যাবে)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SERVICE_CATALOG.map((service) => {
                const selected = categories.includes(service.id);
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggleCategory(service.id)}
                    className={`text-left px-3 py-2 rounded-lg border text-xs sm:text-sm transition-colors cursor-pointer ${
                      selected
                        ? 'border-green-700 bg-green-50 text-green-900 font-medium'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {service.title}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="worker-charge"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                প্রাথমিক চার্জ (৳)
              </label>
              <input
                id="worker-charge"
                type="number"
                required
                min={VALIDATION_LIMITS.minCharge}
                max={VALIDATION_LIMITS.maxWorkerCharge}
                value={baseCharge}
                onChange={(e) => setBaseCharge(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-green-700"
              />
            </div>

            <div>
              <label htmlFor="worker-exp" className="block text-sm font-medium text-slate-800 mb-1.5">
                অভিজ্ঞতা (বছর)
              </label>
              <input
                id="worker-exp"
                type="number"
                required
                min={0}
                max={60}
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-green-700"
              />
            </div>

            <div>
              <label
                htmlFor="worker-phone"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                মোবাইল নম্বর (গোপন)
              </label>
              <input
                id="worker-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-green-700"
              />
            </div>
          </div>

          <div>
            <label htmlFor="worker-bio" className="block text-sm font-medium text-slate-800 mb-1.5">
              দক্ষতা ও অভিজ্ঞতার বিবরণ
            </label>
            <textarea
              id="worker-bio"
              rows={3}
              required
              minLength={VALIDATION_LIMITS.bioMin}
              maxLength={VALIDATION_LIMITS.bioMax}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-green-700"
            />
          </div>

          <label className="flex items-center gap-2.5 text-sm text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 accent-green-700 rounded"
            />
            <span>এখন কাজ নেওয়ার জন্য প্রস্তুত (কর্মী তালিকায় দৃশ্যমান থাকুন)</span>
          </label>

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
              disabled={saving}
              className="px-5 py-2.5 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 disabled:opacity-60 transition-colors cursor-pointer"
            >
              {saving ? 'সংরক্ষণ হচ্ছে...' : 'প্রোফাইল সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
