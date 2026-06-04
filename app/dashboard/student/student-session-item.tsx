"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { markAttendance } from "./actions";
import { LoadingOverlay } from "@/components/loading-overlay";

interface StudentSessionItemProps {
  session: {
    id: string;
    title: string;
    date: Date | string;
    startTime: string;
    endTime: string;
    attendance: {
      id: string;
      status: string; // "PRESENT" | "ABSENT" | "LATE"
    }[];
  };
}

function parseSessionTime(sessionDateStr: Date | string, timeStr: string): Date {
  const d = new Date(sessionDateStr);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const date = d.getUTCDate();

  const [hoursStr, minutesStr] = timeStr.split(":");
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  return new Date(year, month, date, hours, minutes, 0, 0);
}

function formatTo12Hour(time24: string): string {
  if (!time24 || !time24.includes(":")) return "";
  const [hStr, mStr] = time24.split(":");
  let hNum = parseInt(hStr, 10);
  const m = mStr || "00";
  let period = "AM";

  if (hNum >= 12) {
    period = "PM";
    if (hNum > 12) {
      hNum -= 12;
    }
  } else if (hNum === 0) {
    hNum = 12;
  }

  const h = hNum.toString().padStart(2, "0");
  return `${h}:${m} ${period}`;
}

export function StudentSessionItem({ session }: StudentSessionItemProps) {
  const router = useRouter();
  const [now, setNow] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const attendance = session.attendance[0];

  useEffect(() => {
    // Set 'now' only on client-side to prevent Next.js hydration mismatch
    setNow(new Date());

    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Determine button state and details
  const getButtonState = () => {
    if (!now) {
      return { status: "LOADING" as const, buttonText: "Checking window...", canMark: false };
    }

    const startTime = parseSessionTime(session.date, session.startTime);
    const endTime = parseSessionTime(session.date, session.endTime);

    if (now < startTime) {
      const diffMs = startTime.getTime() - now.getTime();
      const isSameDay = startTime.toDateString() === now.toDateString();

      if (isSameDay && diffMs < 24 * 60 * 60 * 1000) {
        const diffSecs = Math.floor(diffMs / 1000);
        const hours = Math.floor(diffSecs / 3600);
        const minutes = Math.floor((diffSecs % 3600) / 60);
        const seconds = diffSecs % 60;

        let countdownText = "";
        if (hours > 0) {
          countdownText = `Starts in ${hours}h ${minutes}m`;
        } else {
          countdownText = `Starts in ${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        }
        return { status: "FUTURE" as const, buttonText: countdownText, canMark: false };
      } else {
        return {
          status: "FUTURE" as const,
          buttonText: `Scheduled: ${startTime.toLocaleDateString()} ${formatTo12Hour(session.startTime)}`,
          canMark: false,
        };
      }
    } else if (now >= startTime && now <= endTime) {
      return { status: "ACTIVE" as const, buttonText: "Self-Mark On Time", canMark: true };
    } else {
      return { status: "ENDED" as const, buttonText: "Mark Late", canMark: true };
    }
  };

  const { status, buttonText, canMark } = getButtonState();

  async function handleMarkAttendance() {
    if (!canMark || loading) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const offset = new Date().getTimezoneOffset();
      const res = await markAttendance(session.id, offset);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  // Formatting date for render
  const sessionDateFormatted = new Date(session.date).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="p-5 rounded-2xl bg-zinc-950/50 border border-zinc-900 hover:border-zinc-800 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <LoadingOverlay visible={loading} />
      <div className="space-y-1">
        <h3 className="font-bold text-zinc-100 text-base">{session.title}</h3>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {sessionDateFormatted}
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatTo12Hour(session.startTime)} - {formatTo12Hour(session.endTime)}
          </span>
        </div>
        {errorMsg && (
          <p className="text-red-400 text-xs font-semibold mt-1 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg inline-block">
            {errorMsg}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
        {attendance ? (
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wide border flex items-center gap-1.5 ${attendance.status === "PRESENT"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                : attendance.status === "LATE"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/25"
                  : "bg-zinc-950 text-zinc-500 border-zinc-900/50"
              }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${attendance.status === "PRESENT" ? "bg-emerald-400 animate-pulse" : attendance.status === "LATE" ? "bg-amber-400" : "bg-zinc-800"
              }`} />
            {attendance.status === "PRESENT" ? "ON TIME" : attendance.status}
          </span>
        ) : (
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs text-zinc-500 font-medium">Unmarked</span>
            <button
              onClick={handleMarkAttendance}
              disabled={!canMark || loading}
              className={`px-4 py-2 font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer select-none ${loading
                  ? "bg-zinc-800 text-zinc-500 cursor-wait"
                  : !canMark
                    ? "bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed opacity-75"
                    : status === "ACTIVE"
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                      : "bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Marking...
                </>
              ) : (
                buttonText
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
