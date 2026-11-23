import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { checkIsAdmin, ensureUserAccount } from './services/marketplaceService';
import type { BookingMode, ServiceCategory, UserAccount, WorkerProfile } from './types/marketplace';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ServicesShowcase } from './components/ServicesShowcase';
import { HowItWorks } from './components/HowItWorks';
import { LiveMarketplace } from './components/LiveMarketplace';
import { ContactFooter } from './components/ContactFooter';
import { PostJobModal } from './components/PostJobModal';
import { WorkerProfileModal } from './components/WorkerProfileModal';
import { CustomerProfileModal } from './components/CustomerProfileModal';
import { AppInstallModal } from './components/AppInstallModal';
import { OfflineIndicator } from './components/OfflineIndicator';

function MarketplaceApp() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
  const [authError, setAuthError] = useState('');

  const [postModalOpen, setPostModalOpen] = useState(false);
  const [postInitialCategory, setPostInitialCategory] =
    useState<ServiceCategory>('hospital_guide');
  const [postInitialMode, setPostInitialMode] = useState<BookingMode>('bidding');
  const [postInitialCharge, setPostInitialCharge] = useState<number | undefined>(undefined);

  const [workerModalOpen, setWorkerModalOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [installModalTab, setInstallModalTab] = useState<'apk' | 'pwa'>('apk');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        try {
          const [account, adminFlag] = await Promise.all([
            ensureUserAccount(currentUser),
            checkIsAdmin(currentUser),
          ]);
          setUserAccount(account);
          setIsAdmin(adminFlag);
        } catch (err) {
          console.error('Account sync error:', err);
        }
      } else {
        setUserAccount(null);
        setWorkerProfile(null);
        setIsAdmin(false);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const workerPath = `workers/${user.uid}`;
    const unsubWorker = onSnapshot(
      doc(db, 'workers', user.uid),
      (snap) => {
        setWorkerProfile(snap.exists() ? (snap.data() as WorkerProfile) : null);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, workerPath);
      }
    );

    const userPath = `users/${user.uid}`;
    const unsubUser = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        if (snap.exists()) {
          setUserAccount(snap.data() as UserAccount);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, userPath);
      }
    );

    return () => {
      unsubWorker();
      unsubUser();
    };
  }, [user]);

  const handleSignIn = async () => {
    setAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError('লগইন সম্পন্ন হয়নি। অনুগ্রহ করে পপ-আপ অনুমতি দিয়ে পুনরায় চেষ্টা করুন।');
      console.error('Sign in failed:', err);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setSelectedJobId(null);
  };

  const requireAuthThen = async (callback: () => void) => {
    if (user) {
      callback();
      return;
    }
    setAuthError('');
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user) {
        callback();
      }
    } catch (err) {
      setAuthError('এগিয়ে যেতে অনুগ্রহ করে গুগল দিয়ে লগইন করুন।');
      console.error('Sign in prompt failed:', err);
    }
  };

  const openPostModalWithOptions = (
    category: ServiceCategory = 'hospital_guide',
    mode: BookingMode = 'bidding',
    fixedCharge?: number
  ) => {
    setPostInitialCategory(category);
    setPostInitialMode(mode);
    setPostInitialCharge(fixedCharge);
    void requireAuthThen(() => setPostModalOpen(true));
  };

  const handlePrimaryHeaderAction = () => {
    if (user) {
      openPostModalWithOptions('hospital_guide', 'bidding');
    } else {
      void handleSignIn();
    }
  };

  const openInstallModal = (tab: 'apk' | 'pwa' = 'apk') => {
    setInstallModalTab(tab);
    setInstallModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        isSignedIn={Boolean(user)}
        onPrimaryAction={handlePrimaryHeaderAction}
        onOpenInstallModal={openInstallModal}
      />

      {authError && (
        <div
          role="alert"
          className="bg-red-50 border-b border-red-200 px-4 py-2.5 text-center text-xs sm:text-sm text-red-700"
        >
          {authError}
        </div>
      )}

      <main className="flex-1">
        <HeroSection
          onPostJob={() => openPostModalWithOptions('hospital_guide', 'bidding')}
          onBecomeWorker={() => void requireAuthThen(() => setWorkerModalOpen(true))}
          onOpenInstallModal={() => setInstallModalOpen(true)}
        />

        <ServicesShowcase
          onSelectCategoryToPost={(cat, mode) =>
            openPostModalWithOptions(cat, mode || 'bidding')
          }
        />

        <HowItWorks />

        <LiveMarketplace
          user={user}
          authLoading={authLoading}
          isAdmin={isAdmin}
          workerProfile={workerProfile}
          selectedJobId={selectedJobId}
          onSelectJobId={setSelectedJobId}
          onSignIn={() => void handleSignIn()}
          onSignOut={() => void handleSignOut()}
          onOpenPostJob={(cat, fixedCharge) =>
            openPostModalWithOptions(
              cat || 'hospital_guide',
              fixedCharge ? 'fixed' : 'bidding',
              fixedCharge
            )
          }
          onOpenWorkerModal={() => setWorkerModalOpen(true)}
          onOpenCustomerModal={() => setCustomerModalOpen(true)}
          onOpenInstallModal={() => setInstallModalOpen(true)}
        />
      </main>

      <ContactFooter onOpenInstallModal={() => setInstallModalOpen(true)} />

      <OfflineIndicator />

      <AppInstallModal
        isOpen={installModalOpen}
        initialTab={installModalTab}
        onClose={() => setInstallModalOpen(false)}
      />

      {user && (
        <>
          <PostJobModal
            isOpen={postModalOpen}
            onClose={() => setPostModalOpen(false)}
            userId={user.uid}
            userName={userAccount?.displayName || user.displayName || 'সেবাগ্রহীতা'}
            defaultPhone={userAccount?.phone || ''}
            defaultArea={userAccount?.area}
            initialCategory={postInitialCategory}
            initialMode={postInitialMode}
            initialCharge={postInitialCharge}
            onCreated={(jobId) => {
              setSelectedJobId(jobId);
              document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          <WorkerProfileModal
            isOpen={workerModalOpen}
            onClose={() => setWorkerModalOpen(false)}
            userId={user.uid}
            defaultName={userAccount?.displayName || user.displayName || ''}
            defaultPhone={userAccount?.phone || ''}
            existingWorker={workerProfile}
            onSaved={() => {
              document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          <CustomerProfileModal
            isOpen={customerModalOpen}
            onClose={() => setCustomerModalOpen(false)}
            userId={user.uid}
            userAccount={userAccount}
            fallbackName={user.displayName || 'ব্যবহারকারী'}
            onSaved={() => {}}
          />
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MarketplaceApp />
    </ErrorBoundary>
  );
}
