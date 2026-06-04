"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter as useAppRouter } from "next/navigation";
import { joinBatch } from "./actions";

interface JoinBatchFormProps {
  showCancel?: boolean;
  cancelHref?: string;
}

export function JoinBatchForm({ showCancel, cancelHref }: JoinBatchFormProps) {
  const router = useAppRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await joinBatch({ code });
    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="max-w-md mx-auto p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-xl space-y-6 shadow-xl">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-extrabold text-zinc-100 tracking-tight">Join Your Batch</h2>
        <p className="text-sm text-zinc-400">
          Enter the invite token or click the invite link shared by your trainer to onboard to your class.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl text-center">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="code-input" className="block text-xs font-semibold text-zinc-400 text-center uppercase tracking-wider">
            Invite Token
          </label>
          <input
            id="code-input"
            type="text"
            required
            placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.trim());
            }}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-center text-sm font-bold font-mono text-white placeholder-zinc-800 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 outline-none transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={code.length < 4 || loading}
          className="w-full py-3.5 bg-white hover:bg-zinc-200 text-black font-bold rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
        >
          {loading ? "Joining Batch..." : "Join Batch"}
        </button>

        {showCancel && cancelHref && (
          <Link
            href={cancelHref}
            className="w-full py-2 bg-transparent text-zinc-500 hover:text-zinc-300 font-semibold text-xs transition-all text-center mt-2 block"
          >
            Cancel
          </Link>
        )}
      </form>
    </div>
  );
}
