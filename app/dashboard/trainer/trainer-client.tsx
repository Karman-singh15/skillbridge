"use client";

import { useState } from "react";
import { createBatch, createSession } from "./actions";

interface BatchData {
  id: string;
  name: string;
  code: string;
  maxStudents: number | null;
  studentCount: number;
}

interface SessionData {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  batchName: string;
  attendanceCount: number;
}

interface TrainerClientProps {
  initialBatches: BatchData[];
  initialSessions: SessionData[];
}

export function TrainerClient({ initialBatches, initialSessions }: TrainerClientProps) {
  const [batches, setBatches] = useState<BatchData[]>(initialBatches);
  const [sessions, setSessions] = useState<SessionData[]>(initialSessions);

  // Forms state
  const [batchName, setBatchName] = useState("");
  const [maxStudents, setMaxStudents] = useState("");
  const [batchLoading, setBatchLoading] = useState(false);

  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionStart, setSessionStart] = useState("");
  const [sessionEnd, setSessionEnd] = useState("");
  const [sessionBatchId, setSessionBatchId] = useState("");
  const [sessionLoading, setSessionLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, any>>({});

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
      };
      setSessions([newSession, ...sessions]);
      // Clear session form
      setSessionTitle("");
      setSessionDate("");
      setSessionStart("");
      setSessionEnd("");
      setSessionBatchId("");
    }
  }



  return (
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
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 placeholder-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm transition-all"
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
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 placeholder-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm transition-all"
              />
              {errors.batch?.maxStudents && (
                <p className="text-red-400 text-xs mt-1">{errors.batch.maxStudents[0]}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={batchLoading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all cursor-pointer"
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
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-zinc-100 text-sm">{batch.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold tracking-wider">
                          CODE: {batch.code}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {batch.studentCount} / {batch.maxStudents || "∞"} Students
                        </span>
                      </div>
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
            <form onSubmit={handleCreateSession} className="space-y-4">
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
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 placeholder-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm transition-all"
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
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm transition-all"
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
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm transition-all"
                  />
                  {errors.session?.date && (
                    <p className="text-red-400 text-xs mt-1">{errors.session.date[0]}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="session-start-input" className="block text-xs font-semibold text-zinc-400 mb-2">
                      Start (HH:MM)
                    </label>
                    <input
                      id="session-start-input"
                      type="text"
                      required
                      placeholder="09:00"
                      value={sessionStart}
                      onChange={(e) => setSessionStart(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 placeholder-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm transition-all"
                    />
                    {errors.session?.startTime && (
                      <p className="text-red-400 text-xs mt-1">{errors.session.startTime[0]}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="session-end-input" className="block text-xs font-semibold text-zinc-400 mb-2">
                      End (HH:MM)
                    </label>
                    <input
                      id="session-end-input"
                      type="text"
                      required
                      placeholder="11:30"
                      value={sessionEnd}
                      onChange={(e) => setSessionEnd(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 placeholder-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm transition-all"
                    />
                    {errors.session?.endTime && (
                      <p className="text-red-400 text-xs mt-1">{errors.session.endTime[0]}</p>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={sessionLoading}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all cursor-pointer"
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
                  className="p-4 bg-zinc-950/40 border border-zinc-900 hover:border-zinc-850 rounded-2xl flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-bold text-zinc-200 text-sm">{session.title}</h3>
                    <div className="flex gap-4 text-xs text-zinc-500 mt-1">
                      <span>Batch: <strong className="text-zinc-400">{session.batchName}</strong></span>
                      <span>Date: {session.date}</span>
                      <span>{session.startTime} - {session.endTime}</span>
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
    </div>
  );
}
