"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface InviteClientProps {
  code: string;
}

export function InviteClient({ code }: InviteClientProps) {
  const router = useRouter();

  useEffect(() => {
    // Save invite token in cookie for persistence across auth/onboarding redirects
    document.cookie = `pending_invite_code=${code}; path=/; max-age=86400; SameSite=Lax`;
    
    // Redirect to dashboard to check auth & onboarding state
    router.replace("/dashboard");
  }, [code, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-4">
      <div className="flex flex-col items-center space-y-4 text-center">
        <svg
          className="animate-spin h-8 w-8 text-teal-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <p className="text-zinc-400 text-sm font-semibold tracking-wide">
          Verifying invite link, redirecting...
        </p>
      </div>
    </div>
  );
}
