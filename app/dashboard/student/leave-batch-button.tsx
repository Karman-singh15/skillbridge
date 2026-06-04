"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { leaveBatch } from "./actions";
import { LoadingOverlay } from "@/components/loading-overlay";

interface LeaveBatchButtonProps {
  batchId: string;
  batchName: string;
  nextBatchId?: string;
}

export function LeaveBatchButton({ batchId, batchName, nextBatchId }: LeaveBatchButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleLeave() {
    setLoading(true);
    const res = await leaveBatch(batchId);
    if (res?.error) {
      alert(res.error);
      setLoading(false);
    } else {
      const redirectPath = nextBatchId ? `/dashboard/student?batchId=${nextBatchId}` : "/dashboard";
      router.replace(redirectPath);
      router.refresh();
    }
  }

  return (
    <>
      <LoadingOverlay visible={loading} />
      {confirming ? (
        <div className="flex items-center gap-2 animate-fadeIn bg-zinc-950/40 border border-zinc-800/80 px-3 py-1.5 rounded-2xl">
          <span className="text-[11px] text-red-400 font-bold uppercase tracking-wider">Are you sure?</span>
          <button
            onClick={handleLeave}
            disabled={loading}
            className="px-3 py-1 bg-red-650 hover:bg-red-750 disabled:opacity-50 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer"
          >
            {loading ? "Leaving..." : "Yes, Leave"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={loading}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[11px] font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Leave Batch</span>
        </button>
      )}
    </>
  );
}
