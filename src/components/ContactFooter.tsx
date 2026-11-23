import { Download, MapPin, MessageCircle, PhoneCall } from 'lucide-react';
import { OFFICE_INFO } from '../types/marketplace';

interface ContactFooterProps {
  onOpenInstallModal: () => void;
}

export function ContactFooter({ onOpenInstallModal }: ContactFooterProps) {
  return (
    <>
      <section id="contact" className="py-14 lg:py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
                সরাসরি যোগাযোগ ও সহায়তা কেন্দ্র
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                ঢাকা ও নারায়ণগঞ্জের যেকোনো জরুরি পরিস্থিতিতে সরাসরি ফোনে বা হোয়াটসঅ্যাপে যোগাযোগ
                করুন অথবা আমাদের হাজারীবাগ অফিসে আসুন।
              </p>

              <div className="pt-3 space-y-2.5 text-sm text-slate-800">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-green-700 shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-slate-900">{OFFICE_INFO.addressBn}</p>
                    <p className="text-xs text-slate-500 font-mono">{OFFICE_INFO.addressEn}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <PhoneCall className="w-4 h-4 text-green-700 shrink-0" />
                  <span className="font-semibold text-slate-900 font-mono tabular-nums">
                    মোবাইল, হোয়াটসঅ্যাপ, বিকাশ ও নগদ: {OFFICE_INFO.phoneDisplay} (
                    {OFFICE_INFO.phoneRaw})
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-3.5">
              <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-green-50/40">
                <img
                  src="/assets/aistudio/file_000000003f9081fa9b7c37f33a542d62_2dac09c1.png"
                  alt="Sheba24 (সেবা২৪) লোগো"
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 object-contain rounded-full bg-white border border-green-200 shrink-0"
                />
                <div>
                  <p className="text-base font-bold text-slate-900">{OFFICE_INFO.brandName}</p>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    জরুরী ও দৈনন্দিন সকল সেবায় আপনার পাশে, সবসময়।
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a
                  href={OFFICE_INFO.telUrl}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>কল: {OFFICE_INFO.phoneDisplay}</span>
                </a>
                <a
                  href={OFFICE_INFO.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-green-900 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-green-700" />
                  <span>হোয়াটসঅ্যাপ</span>
                </a>
              </div>

              <button
                type="button"
                onClick={onOpenInstallModal}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>অ্যাপ ইনস্টল / APK-AAB-iOS ডাউনলোড গাইড</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/aistudio/file_000000003f9081fa9b7c37f33a542d62_2dac09c1.png"
              alt="Sheba24"
              referrerPolicy="no-referrer"
              className="w-6 h-6 rounded-full object-contain bg-white border border-green-200 shrink-0"
            />
            <span className="font-bold text-slate-800">{OFFICE_INFO.brandName}</span>
            <span aria-hidden="true">·</span>
            <span>{OFFICE_INFO.addressBn}</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#services" className="hover:text-slate-800">
              সেবাসমূহ
            </a>
            <a href="#marketplace" className="hover:text-slate-800">
              লাইভ কাজ
            </a>
            <a href="#contact" className="hover:text-slate-800">
              যোগাযোগ
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
