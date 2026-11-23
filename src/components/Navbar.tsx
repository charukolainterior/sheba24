import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Download, Menu, Smartphone, FileDown, X } from 'lucide-react';

interface NavbarProps {
  isSignedIn: boolean;
  onPrimaryAction: () => void;
  onOpenInstallModal: (tab?: 'apk' | 'pwa') => void;
}

export function Navbar({ isSignedIn, onPrimaryAction, onOpenInstallModal }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [appSubMenuOpen, setAppSubMenuOpen] = useState(false);
  const [mobileAppSubMenuOpen, setMobileAppSubMenuOpen] = useState(true);
  const subMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (subMenuRef.current && !subMenuRef.current.contains(event.target as Node)) {
        setAppSubMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAppSubMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelectAppOption = (tab: 'apk' | 'pwa') => {
    setAppSubMenuOpen(false);
    setMobileOpen(false);
    onOpenInstallModal(tab);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand logo & single-line wordmark */}
        <a
          href="#top"
          className="inline-flex items-center gap-2.5 text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-green-700 transition-colors"
        >
          <img
            src="/assets/aistudio/file_000000003f9081fa9b7c37f33a542d62_2dac09c1.png"
            alt="Sheba24 লোগো"
            referrerPolicy="no-referrer"
            className="h-10 w-10 rounded-full object-contain bg-white border border-green-200 shrink-0"
          />
          <span>Sheba24</span>
        </a>

        {/* Zone 2: Concise navigation links + App & APK Submenu */}
        <nav
          aria-label="প্রধান নেভিগেশন"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <a
            href="#services"
            className="hover:text-green-800 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            সেবাসমূহ
          </a>
          <a
            href="#marketplace"
            className="hover:text-green-800 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            লাইভ কাজ ও বিড
          </a>
          <a
            href="#how-it-works"
            className="hover:text-green-800 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            কাজের নিয়ম
          </a>
          <a
            href="#contact"
            className="hover:text-green-800 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            যোগাযোগ
          </a>

          {/* Submenu for APK Download & Mobile Install */}
          <div className="relative shrink-0" ref={subMenuRef}>
            <button
              type="button"
              onClick={() => setAppSubMenuOpen((prev) => !prev)}
              aria-expanded={appSubMenuOpen}
              aria-haspopup="menu"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-green-800 bg-green-50 border border-green-200 hover:bg-green-100 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-green-700" />
              <span>অ্যাপ ও APK</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-green-700 transition-transform ${
                  appSubMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {appSubMenuOpen && (
              <div
                role="menu"
                aria-label="অ্যাপ ও APK সাব-মেনু"
                className="absolute right-0 mt-2 w-72 rounded-xl bg-white border border-slate-200 shadow-lg py-2 z-50"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleSelectAppOption('apk')}
                  className="w-full px-4 py-2.5 text-left hover:bg-green-50 transition-colors flex items-start gap-3 cursor-pointer"
                >
                  <FileDown className="w-4 h-4 text-green-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Android APK ডাউনলোড / তৈরি</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      মোবাইলের APK ও Play Store (.aab) প্যাকেজ
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleSelectAppOption('pwa')}
                  className="w-full px-4 py-2.5 text-left hover:bg-green-50 transition-colors flex items-start gap-3 cursor-pointer border-t border-slate-100"
                >
                  <Smartphone className="w-4 h-4 text-green-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">সরাসরি অ্যাপ ইনস্টল (PWA)</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Android ও iPhone হোমস্ক্রিনে ১-ক্লিক ইনস্টল
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Zone 3: Single primary CTA + mobile drawer button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onPrimaryAction}
            className="px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
          >
            {isSignedIn ? 'জরুরি কাজ পোস্ট করুন' : 'লগইন করুন'}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'}
            className="md:hidden p-2 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          aria-label="মোবাইল নেভিগেশন"
          className="md:hidden border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-1.5 text-sm font-medium text-slate-700"
        >
          <a
            href="#services"
            onClick={() => setMobileOpen(false)}
            className="py-2 px-2 rounded-md hover:bg-green-50"
          >
            সেবাসমূহ
          </a>
          <a
            href="#marketplace"
            onClick={() => setMobileOpen(false)}
            className="py-2 px-2 rounded-md hover:bg-green-50"
          >
            লাইভ কাজ ও বিড
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileOpen(false)}
            className="py-2 px-2 rounded-md hover:bg-green-50"
          >
            কাজের নিয়ম
          </a>
          <a
            href="#contact"
            onClick={() => setMobileOpen(false)}
            className="py-2 px-2 rounded-md hover:bg-green-50"
          >
            যোগাযোগ
          </a>

          {/* Mobile App & APK Submenu */}
          <div className="mt-1 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setMobileAppSubMenuOpen((prev) => !prev)}
              aria-expanded={mobileAppSubMenuOpen}
              className="w-full py-2 px-2 rounded-md bg-green-50 text-green-900 flex items-center justify-between font-semibold cursor-pointer"
            >
              <span className="inline-flex items-center gap-2">
                <Download className="w-4 h-4 text-green-700" />
                <span>অ্যাপ ও APK ডাউনলোড</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-green-700 transition-transform ${
                  mobileAppSubMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {mobileAppSubMenuOpen && (
              <div className="mt-1.5 pl-4 flex flex-col gap-1 border-l-2 border-green-200 ml-2">
                <button
                  type="button"
                  onClick={() => handleSelectAppOption('apk')}
                  className="py-2 px-2.5 text-left rounded-md hover:bg-green-50 text-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  <FileDown className="w-4 h-4 text-green-700 shrink-0" />
                  <span>Android APK ডাউনলোড / তৈরি (.apk & .aab)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAppOption('pwa')}
                  className="py-2 px-2.5 text-left rounded-md hover:bg-green-50 text-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-green-700 shrink-0" />
                  <span>সরাসরি মোবাইল ইনস্টল (PWA / iPhone)</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
