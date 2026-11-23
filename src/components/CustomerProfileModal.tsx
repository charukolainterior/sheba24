import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { DHAKA_AREAS, VALIDATION_LIMITS, type UserAccount } from '../types/marketplace';
import { updateCustomerProfile } from '../services/marketplaceService';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userAccount: UserAccount | null;
  fallbackName: string;
  onSaved: () => void;
}

export function CustomerProfileModal({
  isOpen,
  onClose,
  userId,
  userAccount,
  fallbackName,
  onSaved,
}: CustomerProfileModalProps) {
  const [displayName, setDisplayName] = useState(userAccount?.displayName || fallbackName);
  const [phone, setPhone] = useState(userAccount?.phone || '');
  const [area, setArea] = useState(userAccount?.area || DHAKA_AREAS[0]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDisplayName(userAccount?.displayName || fallbackName);
      setPhone(userAccount?.phone || '');
      setArea(userAccount?.area || DHAKA_AREAS[0]);
      setErrorMsg('');
    }
  }, [isOpen, userAccount, fallbackName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSaving(true);
    try {
      await updateCustomerProfile(userId, { displayName, phone, area });
      onSaved();
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'প্রোফাইল সংরক্ষণ করা যায়নি।');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 id="customer-modal-title" className="text-lg font-bold text-slate-900">
              গ্রাহক প্রোফাইল ও রেজিস্ট্রেশন
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              দ্রুত কাজ পোস্ট করার জন্য আপনার নাম, এলাকা ও মোবাইল নম্বর সংরক্ষণ করুন।
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
            >
              {errorMsg}
            </div>
          )}

          <div>
            <label htmlFor="cust-name" className="block text-sm font-medium text-slate-800 mb-1.5">
              আপনার নাম
            </label>
            <input
              id="cust-name"
              type="text"
              required
              minLength={1}
              maxLength={VALIDATION_LIMITS.nameMax}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-green-700"
            />
          </div>

          <div>
            <label htmlFor="cust-phone" className="block text-sm font-medium text-slate-800 mb-1.5">
              মোবাইল / হোয়াটসঅ্যাপ নম্বর
            </label>
            <input
              id="cust-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="017XXXXXXXX"
              className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-green-700"
            />
          </div>

          <div>
            <label htmlFor="cust-area" className="block text-sm font-medium text-slate-800 mb-1.5">
              আপনার এলাকা (ঢাকা ও নারায়ণগঞ্জ)
            </label>
            <select
              id="cust-area"
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
              {saving ? 'সংরক্ষণ হচ্ছে...' : 'তথ্য সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
