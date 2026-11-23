import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-medium text-white shadow-lg border border-amber-700"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>অফলাইন মোড — সংরক্ষিত ক্যাশ ডেটা দেখানো হচ্ছে</span>
    </div>
  );
}
