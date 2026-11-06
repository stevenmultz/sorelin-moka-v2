'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * Manual on-demand refresh control.
 * Background polling is completely eliminated (0 background Vercel Fast Origin Transfer).
 * Cashiers can click this button at any time to sync the latest orders and data.
 */
export default function AutoRefresh({ seconds }: { seconds?: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleManualRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="flex justify-end mb-1">
      <button
        type="button"
        onClick={handleManualRefresh}
        disabled={isPending}
        title="Sync latest orders and stock from database"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#6B4227] bg-[#FFFDF8] hover:bg-[#FAF0DA] border border-[#E5D5BC] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
        <span>{isPending ? 'Updating...' : 'Refresh Data'}</span>
      </button>
    </div>
  );
}
