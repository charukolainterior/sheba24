import { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileDown,
  Share,
  Smartphone,
  X,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AppInstallModalProps {
  isOpen: boolean;
  initialTab?: 'apk' | 'pwa';
  onClose: () => void;
}

export function AppInstallModal({
  isOpen,
  initialTab = 'apk',
  onClose,
}: AppInstallModalProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [installDone, setInstallDone] = useState(false);
  const [activeTab, setActiveTab] = useState<'apk' | 'pwa'>(initialTab);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://sheba24.app';
  const pwabuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(appOrigin)}`;

  const handleInstallClick = async () => {
    const accepted = await install();
    if (accepted) {
      setInstallDone(true);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(appOrigin);
      setCopiedUrl(true);
      window.setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      setCopiedUrl(false);
    }
  };

  const handleDownloadBuildGuide = () => {
    const guideText = `Sheba24 (সেবা২৪) — Android APK, Google Play AAB, iOS & PWA Build Guide
====================================================================

App Name: Sheba24 (সেবা২৪)
App ID: com.sheba24.app
Live Web / PWA URL: ${appOrigin}

1. DIRECT INSTALL ON ANDROID & DESKTOP (PWA)
--------------------------------------------------------------------
- Android Chrome: Open ${appOrigin} -> Tap Menu (⋮) -> "Install app" / "Add to Home screen".
- Desktop Chrome/Edge: Click the Install icon in the address bar.
- Works offline with Service Worker + Firestore local cache.

2. INSTALL ON IPHONE / IPAD (iOS Safari)
--------------------------------------------------------------------
- Open ${appOrigin} in Safari.
- Tap the Share button (box with upward arrow).
- Scroll down and tap "Add to Home Screen".
- Opens full-screen with Sheba24 icon and splash screen.

3. GENERATE FREE ANDROID APK & PLAY STORE AAB (PWABuilder - No Coding Needed)
--------------------------------------------------------------------
1. Deploy or publish this app to get your public HTTPS URL (${appOrigin}).
2. Open https://www.pwabuilder.com in your browser.
3. Paste your live URL (${appOrigin}) and click "Start".
4. Click "Package for Stores" -> Choose "Android" -> "Generate Package".
5. Download the ZIP file containing:
   - signed .apk (for direct installation on Android phones)
   - .aab (Android App Bundle for Google Play Store upload)
   - assetlinks.json (for Trusted Web Activity full-screen verification)

4. AUTO-BUILD SIGNED APK & PLAY STORE AAB VIA GITHUB ACTIONS (Free Cloud Builder)
--------------------------------------------------------------------
This project already includes:
- Complete Capacitor Android Gradle project (/android, API 36 / Android 16 target)
- GitHub Actions workflow (/.github/workflows/build-android.yml)

Steps:
1. Push this project to a GitHub repository (main branch).
2. Open the "Actions" tab in GitHub -> "Build Sheba24 Android APK & Play Store AAB".
3. Download "Sheba24-Android-APK" (.apk) and "Sheba24-PlayStore-AAB" (.aab) from Artifacts.
4. (Optional for Play Store signed release): Add repository secrets
   ANDROID_KEYSTORE_BASE64, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS, ANDROID_KEY_PASSWORD.

5. GENERATE NATIVE ANDROID APK/AAB & IOS APP LOCALLY VIA CAPACITOR
--------------------------------------------------------------------
Prerequisites (on your local Windows/Mac PC):
- Node.js 20+, Android Studio (for Android APK/AAB), Xcode on macOS (for iOS).

Commands inside the project folder:
  npm install
  npm run build
  npx cap sync
  npx cap open android
  -> In Android Studio: Build > Generate Signed Bundle / APK (choose AAB for Play Store or APK for direct install).

Open Xcode on macOS to export iOS IPA / App Store:
  npm install @capacitor/ios
  npx cap add ios
  npx cap sync
  npx cap open ios
  -> In Xcode: Product > Archive > Distribute App.
`;

    const blob = new Blob([guideText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Sheba24-APK-AAB-iOS-Guide.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <img
              src="/pwa-192x192.png"
              alt="Sheba24 লোগো"
              className="w-9 h-9 rounded-lg border border-slate-200 object-contain"
            />
            <div>
              <h2 id="install-modal-title" className="text-lg font-bold text-slate-900">
                Sheba24 অ্যাপ ও APK ডাউনলোড
              </h2>
              <p className="text-xs text-slate-500">Android APK, Play Store (.aab) ও iPhone অ্যাপ</p>
            </div>
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

        {/* Sub-tab switch */}
        <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 text-xs sm:text-sm font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('apk')}
            className={`py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'apk'
                ? 'border-green-700 text-green-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileDown className="w-4 h-4" />
            <span>Android APK ও AAB</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pwa')}
            className={`py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'pwa'
                ? 'border-green-700 text-green-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>সরাসরি ইনস্টল (PWA)</span>
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {activeTab === 'apk' ? (
            <>
              {/* 1. Free Online APK / Play Store AAB Generator */}
              <div className="p-4 rounded-xl border border-green-200 bg-green-50/70 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-green-900">
                    <FileDown className="w-4 h-4 text-green-700 shrink-0" />
                    <span>Android APK ও Google Play AAB ডাউনলোড</span>
                  </div>
                  <span className="text-[11px] font-mono bg-white border border-green-200 text-green-800 px-2 py-0.5 rounded">
                    com.sheba24.app
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  প্রজেক্টটিতে ইতিমধ্যেই <strong>Android (API 36)</strong> প্রজেক্ট এবং ফ্রি{' '}
                  <strong>GitHub Actions অটো-বিল্ড</strong> কনফিগার করা আছে। কোডটি GitHub-এ
                  আপলোড করলেই <strong>Actions</strong> ট্যাব থেকে সরাসরি আসল{' '}
                  <code className="font-mono">.apk</code> ও <code className="font-mono">.aab</code>{' '}
                  ডাউনলোড করতে পারবেন, অথবা পাবলিক URL দিয়ে PWABuilder থেকেও তৈরি করা যাবে:
                </p>

                <div className="flex items-center gap-2 bg-white border border-green-200 rounded-lg p-2">
                  <span className="text-xs font-mono text-slate-700 truncate flex-1">{appOrigin}</span>
                  <button
                    type="button"
                    onClick={() => void handleCopyUrl()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-green-800 bg-green-50 hover:bg-green-100 rounded border border-green-200 shrink-0 cursor-pointer"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? 'কপি হয়েছে' : 'লিংক কপি'}</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <a
                    href={pwabuilderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>PWABuilder দিয়ে APK/AAB</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* 2. Local Android Studio / GitHub Actions Build Guide */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <h3 className="text-sm font-bold text-slate-900">
                  GitHub Actions ও Android Studio দিয়ে APK / AAB বিল্ড
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  সম্পূর্ণ Android Gradle প্রজেক্ট (<code className="font-mono">android/</code>) ও
                  GitHub অটো-বিল্ড (<code className="font-mono">.github/workflows/build-android.yml</code>)
                  প্রস্তুত রয়েছে। আপনার কম্পিউটারে <code className="font-mono">npx cap open android</code>{' '}
                  কিংবা GitHub Actions থেকেই ইনস্টলযোগ্য APK ও Play Store AAB পেতে পারবেন।
                </p>

                <button
                  type="button"
                  onClick={handleDownloadBuildGuide}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-green-800 bg-white border border-green-300 rounded-lg hover:bg-green-50 transition-colors cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>সম্পূর্ণ APK, AAB ও GitHub বিল্ড গাইড (.txt)</span>
                </button>
              </div>
            </>
          ) : (
            /* Direct Browser / PWA Install Tab */
            <div className="p-4 rounded-xl border border-green-200 bg-green-50/70 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-green-900">
                <Smartphone className="w-4 h-4 text-green-700" />
                <span>APK ছাড়াই সরাসরি ফোনে ইনস্টল করুন (PWA)</span>
              </div>

              {isInstalled || installDone ? (
                <p className="text-sm text-green-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0" />
                  <span>অ্যাপটি ইতিমধ্যেই আপনার ডিভাইসে ইনস্টল করা রয়েছে।</span>
                </p>
              ) : isInstallable ? (
                <div className="space-y-2.5">
                  <p className="text-xs text-slate-700 leading-relaxed">
                    নিচের বাটনে ক্লিক করলেই আপনার Android ফোন বা কম্পিউটারে Sheba24 মূল অ্যাপের মতো
                    ফুল-স্ক্রিনে ইনস্টল হয়ে যাবে। অফলাইনেও কাজ করবে।
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleInstallClick()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>এখনই Sheba24 ইনস্টল করুন</span>
                  </button>
                </div>
              ) : isIOS ? (
                <div className="text-xs text-slate-700 space-y-1.5 leading-relaxed">
                  <p className="font-semibold text-slate-900">iPhone / iPad (Safari ব্রাউজার):</p>
                  <p className="flex items-center gap-1.5">
                    <span>১. নিচের Safari টুলবার থেকে</span>
                    <Share className="w-3.5 h-3.5 text-green-700 inline" />
                    <strong>Share</strong> বাটনে ট্যাপ করুন।
                  </p>
                  <p>
                    ২. নিচে স্ক্রল করে <strong>Add to Home Screen</strong> সিলেক্ট করে Add দিন।
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-700 leading-relaxed">
                  আপনার মোবাইল ব্রাউজারের মেনু (⋮) থেকে <strong>Install app</strong> বা{' '}
                  <strong>Add to Home screen</strong> চাপুন—সাথে সাথে ফুল-স্ক্রিন অ্যাপ হিসেবে
                  ইনস্টল হয়ে যাবে।
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
