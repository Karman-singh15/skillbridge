"use client";

import { useState } from "react";

interface DetailedBatch {
  id: string;
  name: string;
  code: string;
  maxStudents: number | null;
  studentCount: number;
  attendanceRate: number;
}

interface InstitutionAnalytics {
  id: string;
  name: string;
  email: string;
  batchesCount: number;
  studentsCount: number;
  uniqueStudentsCount: number;
  attendanceRate: number;
  batches: DetailedBatch[];
}

interface InstitutionsListProps {
  institutions: InstitutionAnalytics[];
}

export function InstitutionsList({ institutions }: InstitutionsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider font-bold">
            <th className="py-4">Institution Name</th>
            <th className="py-4">Batches</th>
            <th className="py-4">Total Enrollments</th>
            <th className="py-4">Students Enrolled</th>
            <th className="py-4 text-right">Attendance Rate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-900 text-sm">
          {institutions.map((inst) => {
            const isExpanded = expandedId === inst.id;
            return (
              <>
                <tr
                  key={inst.id}
                  onClick={() => toggleExpand(inst.id)}
                  className="hover:bg-zinc-900/40 transition-all cursor-pointer select-none border-b border-zinc-900/60"
                >
                  <td className="py-4 font-bold text-zinc-200 flex items-center gap-2">
                    <svg
                      className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${
                        isExpanded ? "rotate-90 text-purple-400" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {inst.name}
                  </td>
                  <td className="py-4 text-zinc-400">{inst.batchesCount}</td>
                  <td className="py-4 text-zinc-400">{inst.studentsCount}</td>
                  <td className="py-4 text-zinc-400">{inst.uniqueStudentsCount}</td>
                  <td className="py-4 text-right font-extrabold text-purple-400">
                    {inst.attendanceRate}%
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan={5} className="bg-zinc-950/40 p-4 border-b border-zinc-900/80">
                      {inst.batches.length === 0 ? (
                        <p className="text-xs text-zinc-500 text-center py-4">
                          No batches created for this institution yet.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                          {inst.batches.map((batch) => (
                            <div
                              key={batch.id}
                              className="p-4 bg-zinc-900/20 border border-zinc-850 hover:border-zinc-800 rounded-2xl flex justify-between items-center transition-all"
                            >
                              <div className="space-y-1">
                                <h4 className="font-bold text-zinc-200 text-sm">{batch.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] font-mono font-bold tracking-wider uppercase">
                                    Code: {batch.code}
                                  </span>
                                  <span className="text-[11px] text-zinc-500">
                                    {batch.studentCount} / {batch.maxStudents || "∞"} Students
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-zinc-505 font-extrabold uppercase tracking-wider block">
                                  Avg Attendance
                                </span>
                                <span className="text-sm font-extrabold text-purple-400 block mt-0.5">
                                  {batch.attendanceRate}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
