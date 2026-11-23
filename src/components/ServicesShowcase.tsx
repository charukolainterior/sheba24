import { useState } from 'react';
import { ArrowUpRight, Shield } from 'lucide-react';
import { SERVICE_CATALOG, type BookingMode, type ServiceCategory } from '../types/marketplace';

interface ServicesShowcaseProps {
  onSelectCategoryToPost: (category: ServiceCategory, mode?: BookingMode) => void;
}

function ServiceImage({ src, alt, title }: { src: string; alt: string; title: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-800 to-green-900 flex flex-col items-center justify-center p-4 text-center text-white">
        <Shield className="w-7 h-7 text-green-300 mb-2" />
        <span className="text-sm font-medium">{title}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
    />
  );
}

export function ServicesShowcase({ onSelectCategoryToPost }: ServicesShowcaseProps) {
  return (
    <section id="services" className="py-14 lg:py-20 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
              আমাদের জরুরি সেবাসমূহ, ফিক্সড রেট ও বিডিং
            </h2>
            <p className="text-slate-600 mt-2 text-sm sm:text-base leading-relaxed">
              আপনি চাইলে কর্মীদের কাছ থেকে বিড নিতে পারেন অথবা নির্ধারিত ফিক্সড রেটে সরাসরি বুকিং
              দিতে পারেন।
            </p>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 tabular-nums shrink-0">
            মোট ৫টি বিশেষায়িত সেবা · ঢাকা ও নারায়ণগঞ্জ
          </p>
        </div>

        {/* Asymmetric Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
          {SERVICE_CATALOG.map((service, idx) => {
            const colSpanClass = idx < 2 ? 'md:col-span-3' : 'md:col-span-2';
            return (
              <article
                key={service.id}
                className={`${colSpanClass} group bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col`}
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 border-b border-slate-100">
                  <ServiceImage src={service.image} alt={service.title} title={service.title} />
                </div>

                <div className="p-5 sm:p-6 flex flex-col flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 mb-2">
                    <span className="font-semibold text-green-700">{service.index}. জরুরি সেবা</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums font-medium text-slate-700">
                      বিড রেঞ্জ: {service.typicalCharge}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 leading-snug">
                    {service.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed mb-3 flex-1">
                    {service.summary}
                  </p>

                  <p className="text-xs font-semibold text-green-800 font-mono tabular-nums mb-3">
                    {service.fixedRateLabel}
                  </p>

                  <ul className="text-xs text-slate-500 space-y-1 mb-5 pt-3 border-t border-slate-100">
                    {service.highlights.map((h) => (
                      <li key={h}>• {h}</li>
                    ))}
                  </ul>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectCategoryToPost(service.id, 'bidding')}
                      className="inline-flex items-center justify-center gap-1 px-3 py-2.5 text-xs sm:text-sm font-medium text-green-800 bg-green-50 border border-green-200 rounded-lg hover:bg-green-700 hover:text-white hover:border-green-700 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <span>বিড আহ্বান করুন</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectCategoryToPost(service.id, 'fixed')}
                      className="inline-flex items-center justify-center gap-1 px-3 py-2.5 text-xs sm:text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <span>ফিক্সড রেট বুকিং</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
