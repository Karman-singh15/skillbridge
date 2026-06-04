"use client";

import { useState } from "react";
import { switchRole } from "./actions";
import { useRouter } from "next/navigation";
import { Role } from "@/lib/generated/prisma/enums";
import { LoadingOverlay } from "@/components/loading-overlay";

interface RoleSwitcherProps {
  currentRole: Role;
}

export function RoleSwitcher({ currentRole }: RoleSwitcherProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const roles = [
    { value: Role.STUDENT, label: "Student" },
    { value: Role.TRAINER, label: "Trainer" },
    { value: Role.INSTITUTION, label: "Institution" },
    { value: Role.PROGRAMME_MANAGER, label: "Programme Manager" },
    { value: Role.MONITORING_OFFICER, label: "Monitoring Officer" },
  ];

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as Role;
    if (val === currentRole) return;

    setLoading(true);
    try {
      await switchRole(val);
      // Force refresh and route navigation to correctly load dashboard page
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to switch role");
      setLoading(false);
    }
  };

  return (
    <>
      <LoadingOverlay visible={loading} />
      <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl px-3 py-1.5 backdrop-blur-md shadow-inner transition-all">
      <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
        Tester:
      </span>
      <select
        value={currentRole}
        disabled={loading}
        onChange={handleChange}
        className="bg-transparent border-none text-xs font-bold text-teal-400 focus:text-teal-300 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-wait pr-2"
      >
        {roles.map((r) => (
          <option key={r.value} value={r.value} className="bg-zinc-950 text-zinc-300 font-semibold">
            {r.label}
          </option>
        ))}
      </select>
    </div>
    </>
  );
}
