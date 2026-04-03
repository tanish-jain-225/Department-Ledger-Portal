import { useEffect, useRef, useState } from "react";
import Layout, { ACCESS } from "@/components/Layout";
import { useAuth } from "@/lib/auth-context";
import { listStudentsForDashboard } from "@/lib/data";
import { downloadStudentsCsv } from "@/lib/csv-download";
import StudentInfoPopup from "@/components/StudentInfoPopup";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { PAGE_SIZE } from "@/lib/constants";

const PAGE = PAGE_SIZE.DASHBOARD; // 50

export default function DashboardPage() {
  const { loading } = useAuth();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [selectedStudentUid, setSelectedStudentUid] = useState(null);
  // Firestore cursor for the next page
  const lastDocRef = useRef(null);

  // Debounce - only fire query 350ms after user stops typing
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Fresh fetch whenever search term changes
  useEffect(() => {
    let cancelled = false;
    lastDocRef.current = null;

    async function run() {
      setBusy(true);
      try {
        const { rows: data, lastDoc: cursor } = await listStudentsForDashboard({
          search: debouncedSearch,
          pageSize: PAGE,
        });
        if (!cancelled) {
          setRows(data);
          setHasMore(data.length === PAGE);
          lastDocRef.current = cursor;
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [debouncedSearch]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const { rows: data, lastDoc: cursor } = await listStudentsForDashboard({
        search: debouncedSearch,
        pageSize: PAGE,
        lastDoc: lastDocRef.current,
      });
      setRows(prev => {
        const ids = new Set(prev.map(r => r.id));
        return [...prev, ...data.filter(r => !ids.has(r.id))];
      });
      setHasMore(data.length === PAGE);
      lastDocRef.current = cursor;
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <Layout title="Instructional Intelligence" access={ACCESS.STAFF}>
      {selectedStudentUid && (
        <StudentInfoPopup uid={selectedStudentUid} onClose={() => setSelectedStudentUid(null)} />
      )}

      {/* Header */}
      <div className="mb-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between animate-slide-up">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Student Records</h1>
          <p className="text-base text-slate-400 mt-2 font-medium">
            Professional directory and academic oversight for the department.
          </p>
        </div>
        <Button
          onClick={() => downloadStudentsCsv(rows, "ledger-export.csv", { maskSensitive: true })}
          className="lg:w-auto w-full group"
        >
          <svg className="h-4 w-4 mr-2 group-hover:-translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Ledger (CSV)
        </Button>
      </div>

      {/* Search */}
      <div className="mb-12 animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <div className="relative max-w-2xl">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="search"
            placeholder="Filter records by name, email, or identity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-[2rem] border-2 border-slate-100 bg-white pl-14 pr-6 py-5 text-sm font-black text-slate-900 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-300 shadow-xl shadow-slate-200/20"
          />
        </div>
      </div>

      {loading && (
        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-300 animate-pulse">
          Synchronizing Records...
        </p>
      )}

      {!busy && rows.length === 0 && !loading && (
        <EmptyState
          title={search ? `No records found for "${search}"` : "No student records found"}
          message="Adjust your query to find the desired records in the departmental ledger."
        />
      )}

      {/* Grid */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 animate-slide-up" style={{ animationDelay: "0.2s" }}>
        {rows.map((s) => (
          <div key={s.id} className="group premium-card p-8 transition-all hover:translate-y-[-8px] hover:shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="h-12 w-12 rounded-[1.25rem] bg-brand-50 flex items-center justify-center font-black text-brand-600 border border-brand-100 group-hover:scale-110 transition-transform">
                {s.name?.charAt(0) || "U"}
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.role || "Unauthorized"}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mt-0.5">Active Status</span>
              </div>
            </div>

            <h2 className="font-black text-slate-900 text-xl line-clamp-1 mb-1 tracking-tight">{s.name || "Anonymous Record"}</h2>
            <p className="text-sm font-medium text-slate-400 truncate mb-6">{s.email}</p>

            <div className="flex flex-wrap gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-10 pt-6 border-t border-slate-50">
              <div className="flex flex-col gap-1">
                <span className="text-slate-300">Phone</span>
                <span>{s.phone || "-"}</span>
              </div>
              <div className="flex flex-col gap-1 pl-4 border-l border-slate-100">
                <span className="text-slate-300">Year</span>
                <span>{s.year || "-"}</span>
              </div>
            </div>

            <div className="grid gap-3">
              <Button
                variant="soft"
                onClick={() => setSelectedStudentUid(s.id)}
                className="w-full text-[10px] uppercase tracking-[0.2em]"
              >
                Access Profile
              </Button>
              <button
                onClick={() => downloadStudentsCsv([s], `record-${s.name || s.id}.csv`, { maskSensitive: true })}
                className="w-full h-10 flex items-center justify-center gap-2 rounded-2xl bg-slate-50 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-900 hover:text-white transition-all active:scale-95"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Extract Record
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && !busy && (
        <div className="mt-12 flex flex-col items-center gap-3">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Showing {rows.length} records
          </p>
          <Button
            variant="secondary"
            onClick={loadMore}
            disabled={loadingMore}
            className="px-10"
          >
            {loadingMore ? (
              <>
                <div className="h-4 w-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              "Load More Records"
            )}
          </Button>
        </div>
      )}
    </Layout>
  );
}
