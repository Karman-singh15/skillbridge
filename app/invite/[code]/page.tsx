import { prisma } from "@/lib/prisma";
import { InviteClient } from "./invite-client";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function InvitePage({ params }: PageProps) {
  const { code } = await params;

  // 1. Look up token in custom Invite table
  const invite = await prisma.invite.findUnique({
    where: { code },
  });

  // 2. Look up token directly in Batch (default reusable batch invite code)
  const batch = await prisma.batch.findUnique({
    where: { code },
  });

  // If neither exists, the token is invalid
  if (!invite && !batch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-radial from-red-950/20 to-black p-4 relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="relative z-10 max-w-md w-full p-8 rounded-3xl bg-zinc-950/80 border border-red-500/20 backdrop-blur-xl text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-zinc-100 tracking-tight">Invalid Invite Link</h1>
            <p className="text-zinc-400 text-sm">
              This invite link is invalid, has expired, or is no longer active. Please contact your trainer for a new link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If the custom invite exists and is a one-time link that is already used
  if (invite && invite.isOneTime && invite.isUsed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-radial from-amber-950/20 to-black p-4 relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="relative z-10 max-w-md w-full p-8 rounded-3xl bg-zinc-950/80 border border-amber-500/20 backdrop-blur-xl text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto text-amber-500">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-zinc-100 tracking-tight">Invite Link Expired</h1>
            <p className="text-zinc-400 text-sm">
              This single-use invite link has already been redeemed. Please request a new invite link from your trainer.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Token is valid; mount client redirector to store cookie and redirect to dashboard
  return <InviteClient code={code} />;
}
