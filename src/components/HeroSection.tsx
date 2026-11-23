import { useState } from 'react';
import { PhoneCall, MessageCircle, ArrowRight, ShieldCheck, Download } from 'lucide-react';
import { OFFICE_INFO } from '../types/marketplace';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeroSectionProps {
  onPostJob: () => void;
  onBecomeWorker: () => void;
  onOpenInstallModal: () => void;
}

export function HeroSection({ onPostJob, onBecomeWorker, onOpenInstallModal }: HeroSectionProps) {
  const [imgError, setImgError] = useState(false);
  const { isInstalled } = usePWAInstall();

  return (
    <section id="top" className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 lg:pt-14 lg:pb-16">
        {/* Two-column equal-height hero split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-xs sm:text-sm font-semibold text-green-700 mb-3">
              ঢাকা ও নারায়ণগঞ্জ · ২৪ ঘণ্টা জরুরি সহায়তা ও বিডিং প্ল্যাটফর্ম
            </p>
            <h1 className="text-[clamp(2rem,3.6vw,3.15rem)] font-bold text-slate-900 leading-[1.2] tracking-tight text-balance mb-5">
              জরুরি প্রয়োজনে বিশ্বস্ত মানুষ, বিড বা ফিক্সড রেটে তাৎক্ষণিক সেবা
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-7 max-w-xl">
              পরিবারের সদস্যকে হাসপাতালে ডাক্তার দেখিয়ে বাসায় আনা, জরুরি সময়ে বাচ্চাকে স্কুল থেকে
              পৌঁছে দেওয়া, বডিগার্ড-বাউন্সার কিংবা যেকোনো মিস্ত্রি—আপনার কাজের বিবরণ দিন, ঢাকা ও
              নারায়ণগঞ্জের নিবন্ধিত কর্মীরা বিড বা ফিক্সড রেটে দ্রুত সেবা দেবেন।
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-7">
              <button
                type="button"
                onClick={onPostJob}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm sm:text-base font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
              >
                <span>জরুরি কাজ পোস্ট করুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onBecomeWorker}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm sm:text-base font-medium text-green-900 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>কর্মী হিসেবে বিড করুন</span>
              </button>

              {!isInstalled && (
                <button
                  type="button"
                  onClick={onOpenInstallModal}
                  className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-green-700" />
                  <span>অ্যাপ ইনস্টল / ডাউনলোড</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600 pt-5 border-t border-slate-100">
              <a
                href={OFFICE_INFO.telUrl}
                className="inline-flex items-center gap-2 font-medium text-slate-800 hover:text-green-700 transition-colors"
              >
                <PhoneCall className="w-4 h-4 text-green-700" />
                <span>জরুরি কল:</span>
                <span className="font-mono tabular-nums">{OFFICE_INFO.phoneDisplay}</span>
              </a>
              <a
                href={OFFICE_INFO.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-medium text-slate-800 hover:text-green-700 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-green-700" />
                <span>হোয়াটসঅ্যাপ ও বিকাশ/নগদ: {OFFICE_INFO.phoneDisplay}</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative h-72 sm:h-96 lg:h-full min-h-[340px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              {!imgError ? (
                <img
                  src="/src/assets/images/hero_dhaka_service_1795442538569.jpg"
                  alt="ঢাকায় বয়স্ক নাগরিককে ক্লিনিকে পৌঁছে দিতে সহায়তা করছেন Sheba24-এর একজন কর্মী"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-900 to-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
                  <ShieldCheck className="w-10 h-10 text-green-300 mb-3" />
                  <p className="text-lg font-semibold">নিরাপদ ও যাচাইকৃত জরুরি সেবা</p>
                  <p className="text-sm text-slate-300 mt-1">{OFFICE_INFO.addressBn}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full-width 4-column operational & office info strip */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-slate-200 rounded-xl bg-green-50/40 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          <div className="p-4 sm:p-5">
            <p className="text-xs font-medium text-slate-500 mb-1">প্রধান অফিস ঠিকানা</p>
            <p className="text-sm font-semibold text-slate-900">{OFFICE_INFO.addressBn}</p>
          </div>
          <div className="p-4 sm:p-5">
            <p className="text-xs font-medium text-slate-500 mb-1">সেবা চালু এলাকা</p>
            <p className="text-sm font-semibold text-slate-900">
              ঢাকা জেলা ও নারায়ণগঞ্জ জেলা (সকল থানা)
            </p>
          </div>
          <div className="p-4 sm:p-5">
            <p className="text-xs font-medium text-slate-500 mb-1">বুকিং ও পেমেন্ট</p>
            <p className="text-sm font-semibold text-slate-900">
              লাইভ বিডিং বা ফিক্সড রেট · বিকাশ / নগদ / ক্যাশ
            </p>
          </div>
          <div className="p-4 sm:p-5">
            <p className="text-xs font-medium text-slate-500 mb-1">মোবাইল ও হোয়াটসঅ্যাপ</p>
            <p className="text-sm font-semibold text-slate-900 font-mono tabular-nums">
              {OFFICE_INFO.phoneDisplay} ({OFFICE_INFO.phoneRaw})
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
