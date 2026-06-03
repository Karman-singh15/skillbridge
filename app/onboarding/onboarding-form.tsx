"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@/lib/generated/prisma/enums";
import { submitOnboarding } from "./actions";

interface InstitutionSelectOption {
  id: string;
  name: string;
}

interface OnboardingFormProps {
  institutions: InstitutionSelectOption[];
  defaultEmail: string;
  defaultName: string;
}

export function OnboardingForm({
  institutions,
  defaultEmail,
  defaultName,
}: OnboardingFormProps) {
  const router = useRouter();
  const [role, setRole] = useState<Role | "">("");
  const [name, setName] = useState(defaultName);
  const [institutionId, setInstitutionId] = useState("");
  const [region, setRegion] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const roles = [
    {
      value: Role.STUDENT,
      label: "Student",
      desc: "Self-mark attendance and track your learning sessions.",
    },
    {
      value: Role.TRAINER,
      label: "Trainer",
      desc: "Create sessions, manage student batches, and invite students.",
    },
    {
      value: Role.INSTITUTION,
      label: "Institution Partner",
      desc: "Register your institution, manage trainers, and view analytics.",
    },
    {
      value: Role.PROGRAMME_MANAGER,
      label: "Programme Manager",
      desc: "Oversee multiple institutions and track regional skilling progress.",
    },
    {
      value: Role.MONITORING_OFFICER,
      label: "Monitoring Officer",
      desc: "Read-only access to oversee all sessions and attendance records.",
    },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    let payload: any = { role, name };

    if (role === Role.TRAINER) {
      payload.institutionId = institutionId;
    } else if (role === Role.PROGRAMME_MANAGER) {
      payload.region = region;
    }

    const res = await submitOnboarding(payload);
    setLoading(false);

    if (res?.error) {
      setErrors(res.error);
    } else {
      router.refresh();
      router.push("/dashboard");
    }
  }

  return (
    <div className="bg-zinc-950/40 border border-zinc-800/80 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl transition-all duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-zinc-50 tracking-tight">
          Complete Your Profile
        </h1>
        <p className="text-zinc-400 mt-2">
          Tell us about your role in the SkillBridge Programme to customize your dashboard.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Global Errors */}
        {errors.global && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
            {errors.global.map((err) => (
              <p key={err}>{err}</p>
            ))}
          </div>
        )}

        {/* Name Input */}
        <div className="space-y-2">
          <label htmlFor="name-input" className="block text-sm font-semibold text-zinc-300">
            {role === Role.INSTITUTION ? "Institution Name" : "Full Name"}
          </label>
          <input
            id="name-input"
            type="text"
            required
            placeholder={role === Role.INSTITUTION ? "e.g. Skill Development Center" : "e.g. Jane Doe"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 placeholder-zinc-600 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
          />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name[0]}</p>}
        </div>

        {/* Role Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-zinc-300">Select Your Role</label>
          <div className="grid grid-cols-1 gap-3">
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`flex flex-col text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  role === r.value
                    ? "bg-teal-950/20 border-teal-500 shadow-[0_0_15px_-3px_rgba(20,184,166,0.2)]"
                    : "bg-zinc-900/20 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <span className="font-bold text-zinc-100">{r.label}</span>
                <span className="text-xs text-zinc-400 mt-1">{r.desc}</span>
              </button>
            ))}
          </div>
          {errors.role && <p className="text-red-400 text-xs mt-1">{errors.role[0]}</p>}
        </div>

        {/* Trainer Specific - Select Institution */}
        {role === Role.TRAINER && (
          <div className="space-y-2 animate-fade-in">
            <label htmlFor="institution-select" className="block text-sm font-semibold text-zinc-300">
              Select Your Institution
            </label>
            <select
              id="institution-select"
              required
              value={institutionId}
              onChange={(e) => setInstitutionId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
            >
              <option value="">-- Choose an Institution --</option>
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
            {errors.institutionId && (
              <p className="text-red-400 text-xs mt-1">{errors.institutionId[0]}</p>
            )}
            <p className="text-xs text-zinc-500">
              If your Institution is not listed, please have them register first.
            </p>
          </div>
        )}

        {/* Programme Manager Specific - Region input */}
        {role === Role.PROGRAMME_MANAGER && (
          <div className="space-y-2 animate-fade-in">
            <label htmlFor="region-input" className="block text-sm font-semibold text-zinc-300">
              Assigned Region
            </label>
            <input
              id="region-input"
              type="text"
              required
              placeholder="e.g. Northern Region, Sector 4"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 placeholder-zinc-600 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
            />
            {errors.region && <p className="text-red-400 text-xs mt-1">{errors.region[0]}</p>}
          </div>
        )}

        {/* Action Button */}
        <button
          type="submit"
          disabled={!role || loading}
          className="w-full py-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold rounded-xl transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
              Saving Profile...
            </>
          ) : (
            "Complete Onboarding"
          )}
        </button>
      </form>
    </div>
  );
}
