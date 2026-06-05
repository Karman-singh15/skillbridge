"use client";

import { useState, useEffect } from "react";
import { createBatch, createSession } from "./actions";
import { TimePickerScroll } from "./time-picker-scroll";


import { LoadingOverlay } from "@/components/loading-overlay";


interface BatchData {
  id: string;
  name: string;
  code: string;
  maxStudents: number | null;
  studentCount: number;
}

interface StudentAttendance {
  id: string;
  name: string;
  email: string;
  status: string; // "PRESENT" | "LATE" | "UNMARKED"
  markedAt: string | null;
}

interface SessionData {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  batchName: string;
  attendanceCount: number;
  students: StudentAttendance[];
  isStrict: boolean;
}

interface TrainerClientProps {
  initialBatches: BatchData[];
  initialSessions: SessionData[];
  error?: string;
}

export function TrainerClient({ initialBatches, initialSessions, error }: TrainerClientProps) {
  const [batches, setBatches] = useState<BatchData[]>(initialBatches);
  const [sessions, setSessions] = useState<SessionData[]>(initialSessions);
  const [copiedBatchId, setCopiedBatchId] = useState<string | null>(null);

  // Forms state
  const [batchName, setBatchName] = useState("");
  const [maxStudents, setMaxStudents] = useState("");
  const [batchLoading, setBatchLoading] = useState(false);

  const handleCopyLink = (batchId: string, code: string) => {
    const link = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(link);
    setCopiedBatchId(batchId);
    setTimeout(() => setCopiedBatchId(null), 2000);
  };

  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionStart, setSessionStart] = useState("09:00");
  const [sessionEnd, setSessionEnd] = useState("10:00");
  const [sessionBatchId, setSessionBatchId] = useState("");
  const [isStrict, setIsStrict] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!showStartPicker && !showEndPicker) return;
    const handleOutsideClick = () => {
      setShowStartPicker(false);
      setShowEndPicker(false);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [showStartPicker, showEndPicker]);

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


  async function handleCreateBatch(e: React.FormEvent) {
    e.preventDefault();
    setBatchLoading(true);
    setErrors({});

    const parsedLimit = maxStudents ? parseInt(maxStudents, 10) : null;

    const res = await createBatch({ name: batchName, maxStudents: parsedLimit });
    setBatchLoading(false);

    if (res?.error) {
      setErrors({ batch: res.error });
    } else if (res?.batch) {
      setBatches([
        {
          id: res.batch.id,
          name: res.batch.name,
          code: res.batch.code,
          maxStudents: res.batch.maxStudents,
          studentCount: 0,
        },
        ...batches,
      ]);
      setBatchName("");
      setMaxStudents("");
    }
  }

  async function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    setSessionLoading(true);
    setErrors({});

    const payload = {
      title: sessionTitle,
      date: sessionDate,
      startTime: sessionStart,
      endTime: sessionEnd,
      batchId: sessionBatchId,
      isStrict,
    };

    const res = await createSession(payload);
    setSessionLoading(false);

    if (res?.error) {
      setErrors({ session: res.error });
    } else if (res?.session) {
      const selectedBatchName = batches.find((b) => b.id === sessionBatchId)?.name || "";
      const newSession: SessionData = {
        id: res.session.id,
        title: res.session.title,
        date: res.session.date.toISOString().split("T")[0],
        startTime: res.session.startTime,
        endTime: res.session.endTime,
        batchName: selectedBatchName,
        attendanceCount: 0,
        students: [],
        isStrict: res.session.isStrict,
      };
      setSessions([newSession, ...sessions]);
      // Clear session form
      setSessionTitle("");
      setSessionDate("");
      setSessionStart("09:00");
      setSessionEnd("10:00");
      setSessionBatchId("");
      setIsStrict(false);
    }
  }

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);



  return (
    <div className="space-y-6 w-full">
      <LoadingOverlay visible={batchLoading || sessionLoading} />
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center gap-3 animate-fadeIn">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Column 1: Batch management */}
      <div className="space-y-8 lg:col-span-1">
        {/* Create Batch */}
        <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-xl space-y-4">
          <h2 className="text-xl font-bold text-zinc-100">Create New Batch</h2>
          <form onSubmit={handleCreateBatch} className="space-y-4">
            <div>
              <label htmlFor="batch-name-input" className="block text-xs font-semibold text-zinc-400 mb-2">
                Batch Name
              </label>
              <input
                id="batch-name-input"
                type="text"
                required
                placeholder="e.g. Batch A (Morning)"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 placeholder-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-sm transition-all"
              />
              {errors.batch?.name && (
                <p className="text-red-400 text-xs mt-1">{errors.batch.name[0]}</p>
              )}
            </div>
            <div>
              <label htmlFor="batch-limit-input" className="block text-xs font-semibold text-zinc-400 mb-2">
                Student Capacity Limit (Optional)
              </label>
              <input
                id="batch-limit-input"
                type="number"
                placeholder="e.g. 30"
                min="1"
                value={maxStudents}
                onChange={(e) => setMaxStudents(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 placeholder-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-sm transition-all"
              />
              {errors.batch?.maxStudents && (
                <p className="text-red-400 text-xs mt-1">{errors.batch.maxStudents[0]}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={batchLoading}
              className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm transition-all cursor-pointer"
            >
              {batchLoading ? "Creating..." : "Create Batch"}
            </button>
          </form>
        </div>

        {/* Batch List */}
        <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-xl space-y-4">
          <h2 className="text-xl font-bold text-zinc-100">Your Batches</h2>
          {batches.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-6">No batches created yet.</p>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {batches.map((batch) => (
                <div key={batch.id} className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl space-y-3">
                  <div className="flex flex-col space-y-2">
                    <h3 className="font-bold text-zinc-100 text-sm">{batch.name}</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                      <button
                        onClick={() => handleCopyLink(batch.id, batch.code)}
                        className="px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 text-[11px] font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 self-start"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {copiedBatchId === batch.id ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          )}
                        </svg>
                        <span>{copiedBatchId === batch.id ? "Copied Link!" : "Copy Invite Link"}</span>
                      </button>
                      <span className="text-[11px] text-zinc-500 sm:ml-auto">
                        {batch.studentCount} / {batch.maxStudents || "∞"} Students
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Column 2 & 3: Sessions and schedule */}
      <div className="lg:col-span-2 space-y-8">
        {/* Create Session */}
        <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-xl">
          <h2 className="text-xl font-bold text-zinc-100 mb-4">Schedule Training Session</h2>
          {batches.length === 0 ? (
            <p className="text-sm text-zinc-500 py-4">
              Please create a batch first before scheduling sessions.
            </p>
          ) : (
            <form
              onSubmit={handleCreateSession}
              className={`space-y-4 transition-all duration-300 ${
                showStartPicker || showEndPicker ? "pb-44" : "pb-0"
              }`}
            >
              {errors.session?.global && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                  {errors.session.global[0]}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="session-title-input" className="block text-xs font-semibold text-zinc-400 mb-2">
                    Session Title
                  </label>
                  <input
                    id="session-title-input"
                    type="text"
                    required
                    placeholder="e.g. Intro to Databases"
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 placeholder-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-sm transition-all"
                  />
                  {errors.session?.title && (
                    <p className="text-red-400 text-xs mt-1">{errors.session.title[0]}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="session-batch-select" className="block text-xs font-semibold text-zinc-400 mb-2">
                    Target Batch
                  </label>
                  <select
                    id="session-batch-select"
                    required
                    value={sessionBatchId}
                    onChange={(e) => setSessionBatchId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-sm transition-all"
                  >
                    <option value="">-- Select Batch --</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  {errors.session?.batchId && (
                    <p className="text-red-400 text-xs mt-1">{errors.session.batchId[0]}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="session-date-input" className="block text-xs font-semibold text-zinc-400 mb-2">
                    Date
                  </label>
                  <input
                    id="session-date-input"
                    type="date"
                    required
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-sm transition-all"
                  />
                  {errors.session?.date && (
                    <p className="text-red-400 text-xs mt-1">{errors.session.date[0]}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-xs font-semibold text-zinc-400 mb-2">
                      Start Time
                    </label>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowStartPicker(!showStartPicker);
                        setShowEndPicker(false);
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-left text-zinc-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-sm transition-all flex justify-between items-center cursor-pointer"
                    >
                      <span>{formatTo12Hour(sessionStart) || "09:00 AM"}</span>
                      <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showStartPicker && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute left-0 mt-2 z-50 flex justify-center min-w-[240px] md:min-w-[260px]"
                      >
                        <TimePickerScroll
                          value={sessionStart}
                          onChange={(val) => setSessionStart(val)}
                        />
                      </div>
                    )}
                    {errors.session?.startTime && (
                      <p className="text-red-400 text-xs mt-1">{errors.session.startTime[0]}</p>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-semibold text-zinc-400 mb-2">
                      End Time
                    </label>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowEndPicker(!showEndPicker);
                        setShowStartPicker(false);
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-left text-zinc-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-sm transition-all flex justify-between items-center cursor-pointer"
                    >
                      <span>{formatTo12Hour(sessionEnd) || "10:00 AM"}</span>
                      <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showEndPicker && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 mt-2 z-50 flex justify-center min-w-[240px] md:min-w-[260px]"
                      >
                        <TimePickerScroll
                          value={sessionEnd}
                          onChange={(val) => setSessionEnd(val)}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Strict Checkbox */}
                <div className="flex items-center gap-2.5 bg-zinc-950/40 border border-zinc-900 px-4 py-3 rounded-2xl">
                  <input
                    id="strict-session-checkbox"
                    type="checkbox"
                    checked={isStrict}
                    onChange={(e) => setIsStrict(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-800 text-orange-600 focus:ring-orange-600 bg-zinc-950 cursor-pointer"
                  />
                  <label htmlFor="strict-session-checkbox" className="text-xs text-zinc-300 font-semibold cursor-pointer select-none">
                    Strict Mode (Enforce deadline, prevent late self-marking)
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={sessionLoading}
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm transition-all cursor-pointer"
              >
                {sessionLoading ? "Scheduling..." : "Schedule Session"}
              </button>
            </form>
          )}
        </div>

        {/* Session List */}
        <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-xl">
          <h2 className="text-xl font-bold text-zinc-100 mb-4">Scheduled Sessions</h2>
          {sessions.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-12">No sessions scheduled yet.</p>
          ) : (
            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setSelectedSessionId(session.id)}
                  className="p-4 bg-zinc-950/40 border border-zinc-900 hover:border-orange-500/30 hover:bg-zinc-950/80 rounded-2xl flex justify-between items-center cursor-pointer transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-zinc-200 text-sm">{session.title}</h3>
                      {session.isStrict && (
                        <span className="text-[8px] bg-red-500/10 border border-red-500/25 text-red-400 px-1.5 py-0.2 rounded font-black uppercase tracking-wider select-none">
                          Strict
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 text-xs text-zinc-500 mt-1">
                      <span>Batch: <strong className="text-zinc-400">{session.batchName}</strong></span>
                      <span>Date: {session.date}</span>
                      <span>{formatTo12Hour(session.startTime)} - {formatTo12Hour(session.endTime)}</span>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-850">
                    {session.attendanceCount} Marked
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Attendance Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-850 rounded-3xl p-6 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl space-y-6">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-zinc-900 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-zinc-100">{selectedSession.title}</h3>
                  {selectedSession.isStrict && (
                    <span className="text-[10px] bg-red-500/10 border border-red-500/25 text-red-400 px-2 py-0.5 rounded font-black uppercase tracking-wider select-none">
                      Strict
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Batch: <strong className="text-orange-400">{selectedSession.batchName}</strong> • Date: {selectedSession.date} • {formatTo12Hour(selectedSession.startTime)} - {formatTo12Hour(selectedSession.endTime)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSessionId(null)}
                className="text-zinc-500 hover:text-zinc-300 p-1.5 hover:bg-zinc-900 rounded-xl transition-all cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Attendance Summaries */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-zinc-900/40 border border-zinc-900 p-3 rounded-2xl text-center">
                <span className="text-[10px] text-zinc-500 uppercase font-extrabold tracking-wider">On Time</span>
                <p className="text-xl font-bold text-emerald-400 mt-1">
                  {selectedSession.students.filter(s => s.status === "PRESENT").length}
                </p>
              </div>
              <div className="bg-zinc-900/40 border border-zinc-900 p-3 rounded-2xl text-center">
                <span className="text-[10px] text-zinc-500 uppercase font-extrabold tracking-wider">Late</span>
                <p className="text-xl font-bold text-amber-400 mt-1">
                  {selectedSession.students.filter(s => s.status === "LATE").length}
                </p>
              </div>
              <div className="bg-zinc-900/40 border border-zinc-900 p-3 rounded-2xl text-center">
                <span className="text-[10px] text-zinc-500 uppercase font-extrabold tracking-wider">Unmarked</span>
                <p className="text-xl font-bold text-zinc-400 mt-1">
                  {selectedSession.students.filter(s => s.status === "UNMARKED").length}
                </p>
              </div>
            </div>

            {/* Student Table/List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-none">
              {selectedSession.students.length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-10">No students enrolled in this batch.</p>
              ) : (
                selectedSession.students.map((student) => (
                  <div
                    key={student.id}
                    className="p-3 bg-zinc-950/80 border border-zinc-900 hover:border-zinc-800 rounded-2xl flex items-center justify-between transition-all"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-zinc-200">{student.name}</h4>
                      <p className="text-xs text-zinc-500 mt-0.5">{student.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {student.markedAt && (
                        <span className="text-[10px] text-zinc-500 font-medium hidden sm:inline">
                          At {new Date(student.markedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide border ${
                          student.status === "PRESENT"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                            : student.status === "LATE"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/25"
                            : "bg-zinc-900 text-zinc-500 border-zinc-850"
                        }`}
                      >
                        {student.status === "PRESENT"
                          ? "ON TIME"
                          : student.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2 border-t border-zinc-900">
              <button
                type="button"
                onClick={() => setSelectedSessionId(null)}
                className="px-5 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-200 hover:text-zinc-100 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
      </div>
    </div>
  );
}
