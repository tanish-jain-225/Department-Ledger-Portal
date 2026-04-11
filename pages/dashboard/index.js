import { useEffect, useRef, useState } from "react";
import Layout, { ACCESS } from "@/components/Layout";
import { useAuth } from "@/lib/auth-context";
import { listStudentsForDashboard, listByStudent, listStudentDocuments } from "@/lib/data";
import {
  downloadFacultyStudentRecordsCsv,
  buildStudentExportRow,
  STUDENT_RECORD_FIELDS
} from "@/lib/csv-download";
import { computeReport } from "@/lib/student-analytics";
import { getDb } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import StudentInfoPopup from "@/components/StudentInfoPopup";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui";
import { PAGE_SIZE } from "@/lib/constants";

const PAGE = PAGE_SIZE.DASHBOARD;

export default function DashboardPage() {
  const { loading } = useAuth();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [selectedStudentUid, setSelectedStudentUid] = useState(null);
  const lastDocRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

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

  async function handleExport() {
    setExporting(true);
    try {
      const db = getDb();
      if (!db) return;
      const q = query(collection(db, "users"), where("role", "==", "student"));
      const snap = await getDocs(q);
      const allStudents = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const total = allStudents.length;

      const rawDataBatch = [];
      const batchSize = 10;

      for (let i = 0; i < total; i += batchSize) {
        const chunk = allStudents.slice(i, i + batchSize);
        const resolved = await Promise.all(chunk.map(async (u) => {
          const lists = await fetchExhaustiveStudentData(u.id);
          const report = computeReport(u, lists);
          return { user: u, lists, report };
        }));
        rawDataBatch.push(...resolved);
      }

      // 1. Calculate dynamic slots
      const slots = calculateDynamicSlots(rawDataBatch);
      
      // 2. Generate fields
      const fields = getDynamicStudentFields(slots);
      
      // 3. Map into final rows
      const rows = rawDataBatch.map(({ user, lists, report }) => 
        buildStudentExportRow(user, lists, report, slots)
      );

      downloadFacultyStudentRecordsCsv(rows, `department-ledger-staff-${new Date().toISOString().split('T')[0]}.csv`, { fields });
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to prepare export. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Layout title="Student Records" access={ACCESS.STAFF}>
      {selectedStudentUid && (
        <StudentInfoPopup uid={selectedStudentUid} onClose={() => setSelectedStudentUid(null)} />
      )}

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Student Records</h1>
          <p className="text-sm text-slate-500 mt-1">Academic oversight and directory for the department.</p>
        </div>
        <Button
          variant="secondary"
          onClick={handleExport}
          disabled={exporting}
          loading={exporting}
          className="sm:w-auto w-full font-black"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </Button>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative max-w-xl">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Clear search"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {rows.length > 0 && !busy && (
          <p className="text-xs text-slate-500 mt-2 pl-1">{rows.length} record{rows.length !== 1 ? "s" : ""} found</p>
        )}
      </div>

      {/* Skeleton loaders */}
      {(busy || loading) && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="premium-card p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-8 w-full rounded-xl mt-4" />
            </div>
          ))}
        </div>
      )}

      {!busy && !loading && rows.length === 0 && (
        <EmptyState
          title={search ? `No results for "${search}"` : "No student records found"}
          message="Try a different search term or check back later."
        />
      )}

      {/* Grid */}
      {!busy && !loading && rows.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((s) => (
            <div key={s.id} className="premium-card p-6 hover:border-brand-200 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-brand-700 flex items-center justify-center font-black text-white shadow-lg shadow-brand-900/10 text-sm shrink-0">
                    {s.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold text-slate-900 text-sm truncate">{s.name || "Anonymous"}</h2>
                    <p className="text-xs text-slate-600 truncate">{s.email}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 pt-3 border-t border-slate-100">
                <span><span className="text-slate-400">Year:</span> {s.year || "—"}</span>
                <span><span className="text-slate-400">Branch:</span> {s.branch || "—"}</span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setSelectedStudentUid(s.id)}
                  className="flex-1"
                >
                  View Profile
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && !busy && !loading && (
        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-xs text-slate-500">Showing {rows.length} records</p>
          <Button variant="secondary" onClick={loadMore} loading={loadingMore} className="px-8">
            Load More
          </Button>
        </div>
      )}
    </Layout>
  );
}
