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
          Enter the 4-digit numeric code shared by your trainer to onboard to your class.
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
            4-Digit Batch Code
          </label>
          <input
            id="code-input"
            type="text"
            required
            maxLength={4}
            placeholder="e.g. 5824"
            value={code}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, ""); // Allow only digits
              if (val.length <= 4) setCode(val);
            }}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-center text-3xl font-extrabold font-mono tracking-widest text-teal-400 placeholder-zinc-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={code.length !== 4 || loading}
          className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg hover:shadow-teal-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
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
