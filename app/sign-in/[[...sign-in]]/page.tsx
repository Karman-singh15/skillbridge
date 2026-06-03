import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-zinc-900 to-black p-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
            SkillBridge
          </h1>
          <p className="text-sm text-zinc-400 mt-2">
            Skill development and attendance tracking system
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              formButtonPrimary:
                "bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold transition-all duration-200 border-none shadow-md",
              card: "bg-zinc-950/70 border border-zinc-800 backdrop-blur-xl shadow-2xl rounded-2xl",
              headerTitle: "text-zinc-50 font-bold",
              headerSubtitle: "text-zinc-400",
              socialButtonsBlockButton:
                "border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/80 text-zinc-200 transition-all",
              socialButtonsBlockButtonText: "text-zinc-200 font-medium",
              dividerLine: "bg-zinc-800",
              dividerText: "text-zinc-500",
              formFieldLabel: "text-zinc-300 font-medium",
              formFieldInput:
                "bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all",
              footerActionText: "text-zinc-400",
              footerActionLink: "text-teal-400 hover:text-teal-300 transition-all",
            },
          }}
        />
      </div>
    </div>
  );
}
