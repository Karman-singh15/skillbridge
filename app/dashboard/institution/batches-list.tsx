"use client";

import { useState } from "react";

interface Attendance {
  id: string;
  sessionId: string;
  studentId: string;
  status: "PRESENT" | "ABSENT" | "LATE";
  markedAt: string;
}

interface Session {
  id: string;
  batchId: string;
  trainerId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  isStrict?: boolean;
  createdAt: string;
  attendance: Attendance[];
}

interface Student {
  id: string;
  batchId: string;
  studentId: string;
}

interface Batch {
  id: string;
  name: string;
  code: string;
  maxStudents: number | null;
  institutionId: string;
  createdAt: string;
  students: Student[];
  sessions: Session[];
}

interface BatchesListProps {
  batches: Batch[];
}

function formatTo12Hour(time24: string): string {
  const [hoursStr, minutesStr] = time24.split(":");
  const hours = parseInt(hoursStr, 10);
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${minutesStr} ${ampm}`;
}

export function BatchesList({ batches }: BatchesListProps) {
  const [expandedBatchIds, setExpandedBatchIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (batchId: string) => {
    setExpandedBatchIds((prev) => ({
      ...prev,
      [batchId]: !prev[batchId],
    }));
  };

  return (
    <div className="space-y-4">
      {batches.map((batch) => {
        const isExpanded = !!expandedBatchIds[batch.id];
        
        let batchPresent = 0;
        let batchMarked = 0;
        batch.sessions.forEach((s) => {
          s.attendance.forEach((att) => {
            batchMarked++;
            if (att.status === "PRESENT") batchPresent++;
          });
        });
        const batchRate = batchMarked > 0 ? Math.round((batchPresent / batchMarked) * 100) : 0;

        // Sort sessions by title alphabetically to align with other page tasks
        const sortedSessions = [...batch.sessions].sort((a, b) => a.title.localeCompare(b.title));

        return (
          <div
            key={batch.id}
            className="p-5 bg-zinc-950/40 border border-zinc-900 rounded-2xl transition-all duration-300 hover:border-zinc-800"
          >
            {/* Header info */}
            <div 
              onClick={() => toggleExpand(batch.id)}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer select-none"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-zinc-200 text-base">{batch.name}</h3>
                  <span className="text-[10px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-500 font-mono">
                    Code: {batch.code}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-zinc-500 mt-1.5">
                  <span>{batch.students.length} Students</span>
                  <span>{batch.sessions.length} Sessions</span>
                </div>
              </div>
              
              <div className="flex items-center gap-6 self-stretch sm:self-auto justify-between">
                <div className="text-right">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Attendance Rate</p>
                  <p className="text-sm font-black text-blue-400 mt-0.5">{batchRate}%</p>
                </div>
                
                <button 
                  type="button"
                  className={`w-8 h-8 rounded-full bg-zinc-900/50 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-all duration-200 ${
                    isExpanded ? "rotate-180 bg-zinc-800/80 text-white" : ""
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Sessions Summary Expansion */}
            {isExpanded && (
              <div className="mt-5 pt-5 border-t border-zinc-900/60 animate-fadeIn space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <span className="w-1 h-3 rounded-full bg-blue-500" />
                    Sessions Summary
                  </h4>
                  <span className="text-[10px] text-zinc-500 font-medium bg-zinc-900/55 px-2 py-0.5 rounded-md border border-zinc-850">
                    Sorted by name
                  </span>
                </div>
                
                {sortedSessions.length === 0 ? (
                  <p className="text-xs text-zinc-600 italic py-4 text-center bg-zinc-950/20 rounded-xl border border-dashed border-zinc-900">
                    No sessions scheduled for this batch yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-zinc-900/60 bg-zinc-950/20">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-zinc-950/80 text-zinc-500 font-bold border-b border-zinc-900">
                          <th className="p-3">Session Title</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Time</th>
                          <th className="p-3 text-right">Attendance Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900/40 text-zinc-400">
                        {sortedSessions.map((session) => {
                          let sPresent = 0;
                          let sMarked = 0;
                          session.attendance.forEach((att) => {
                            sMarked++;
                            if (att.status === "PRESENT") sPresent++;
                          });
                          const sRate = sMarked > 0 ? Math.round((sPresent / sMarked) * 100) : 0;
                          
                          return (
                            <tr key={session.id} className="hover:bg-zinc-900/10 transition-colors">
                              <td className="p-3 font-bold text-zinc-200">
                                <span className="flex items-center gap-1.5">
                                  {session.title}
                                  {session.isStrict && (
                                    <span className="text-[8px] bg-red-500/10 border border-red-500/20 text-red-400 px-1 py-0.2 rounded font-extrabold uppercase tracking-wide select-none">
                                      Strict
                                    </span>
                                  )}
                                </span>
                              </td>
                              <td className="p-3">{session.date.split("T")[0]}</td>
                              <td className="p-3 font-medium">{formatTo12Hour(session.startTime)} - {formatTo12Hour(session.endTime)}</td>
                              <td className="p-3 text-right font-black text-blue-400">
                                {sMarked > 0 ? (
                                  <span className="flex items-center justify-end gap-1.5">
                                    <span>{sRate}%</span>
                                    <span className="text-[10px] text-zinc-500 font-normal">({sPresent}/{sMarked})</span>
                                  </span>
                                ) : (
                                  <span className="text-zinc-600 font-normal italic">No attendance</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
