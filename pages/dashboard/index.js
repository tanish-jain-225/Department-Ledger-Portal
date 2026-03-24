import { useEffect, useState } from "react";
import Link from "next/link";
import Layout, { ACCESS } from "@/components/Layout";
import { useAuth } from "@/lib/auth-context";
import { listStudentsForDashboard } from "@/lib/data";
import { downloadStudentsCsv } from "@/lib/csv-download";
import StudentInfoPopup from "@/components/StudentInfoPopup";

export default function DashboardPage() {
  const { profile, loading } = useAuth();
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [selectedStudentUid, setSelectedStudentUid] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setBusy(true);
      try {
        const data = await listStudentsForDashboard({
          search,
          pageSize: 50,
        });
        if (!cancelled) setRows(data);
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [search]);

  return (
    <Layout title="Faculty dashboard" access={ACCESS.STAFF}>
      {selectedStudentUid && <StudentInfoPopup uid={selectedStudentUid} onClose={() => setSelectedStudentUid(null)} />}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Records</h1>
          <p className="text-slate-600">
            Professional directory and academic oversight.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            downloadStudentsCsv(rows, "students-export.csv", { maskSensitive: true })
          }
          className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all active:scale-95"
        >
          Download CSV (masked)
        </button>
      </div>

      <div className="mb-8 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none transition-all shadow-sm"
            aria-label="Search students"
          />
        </div>
      </div>

      {loading && <p className="text-slate-500 animate-pulse">Loading secure session…</p>}
      {!busy && rows.length === 0 && !loading && (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
           <p className="text-slate-400 font-medium italic text-lg px-10 text-center">No students matching &quot;{search}&quot; found in the directory.</p>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((s) => (
          <div key={s.id} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-brand-300 hover:shadow-xl hover:shadow-brand-500/5">
            <h2 className="font-black text-brand-800 text-lg line-clamp-1 mb-1">{s.name || "Unnamed Student"}</h2>
            <p className="text-sm font-medium text-slate-500 truncate mb-3">{s.email}</p>
            
            <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">
              <span>{s.gender || "—"}</span>
              <span className="opacity-30">|</span>
              <span>{s.phone || "No phone —"}</span>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => setSelectedStudentUid(s.id)}
                className="w-full rounded-xl bg-brand-50 px-4 py-2.5 text-center text-xs font-black uppercase tracking-widest text-brand-700 hover:bg-brand-100 transition-all border border-brand-100/50"
              >
                View Full Profile
              </button>
              <button
                onClick={() => downloadStudentsCsv([s], `student-${s.name || s.id}.csv`, { maskSensitive: true })}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-brand-600 transition-all active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Record CSV
              </button>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
