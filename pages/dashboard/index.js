import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout, { ACCESS } from "@/components/Layout";
import { useAuth } from "@/lib/auth-context";
import { listStudentsForDashboard } from "@/lib/data";
import {
  downloadFacultyStudentRecordsCsv,
  buildStudentExportRow,
  calculateDynamicSlots,
  getDynamicStudentFields,
} from "@/lib/csv-download";
import { computeReport } from "@/lib/student-analytics";
import { fetchExhaustiveStudentData } from "@/lib/student-data";
import { getDb } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import StudentInfoPopup from "@/components/StudentInfoPopup";
import { Button, EmptyState, Skeleton } from "@/components/ui";
import { PAGE_SIZE } from "@/lib/constants";
import { useToast } from "@/lib/toast-context";
import { getAccessDeniedMessage, isPermissionDeniedError } from "@/lib/access-errors";

const PAGE = PAGE_SIZE.DASHBOARD;

export default function DashboardPage() {
  const router = useRouter();
  const { loading } = useAuth();
  const { addToast } = useToast();
  
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [accessError, setAccessError] = useState("");
  const [selectedStudentUid, setSelectedStudentUid] = useState(null);
  const lastDocRef = useRef(null);

  // Sync initial search from router query if present (e.g. from faculty home search)
  useEffect(() => {
    if (router.isReady && router.query.search && typeof router.query.search === "string") {
      setSearch(router.query.search);
      setDebouncedSearch(router.query.search);
    }
  }, [router.isReady, router.query.search]);

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
          branch,
          year,
          search: debouncedSearch,
          pageSize: PAGE,
        });
        if (!cancelled) {
          setRows(data);
          setHasMore(data.length === PAGE);
          setAccessError("");
          lastDocRef.current = cursor;
        }
      } catch (err) {
        if (!cancelled && isPermissionDeniedError(err)) {
          setRows([]);
          setHasMore(false);
          setAccessError(getAccessDeniedMessage(err));
        } else if (!cancelled) {
          setRows([]);
          setHasMore(false);
          setAccessError("Unable to load student records right now.");
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [debouncedSearch, branch, year]);

  async function loadMore() {
    if (loadingMore || !lastDocRef.current) return;
    setLoadingMore(true);
    try {
      const { rows: data, lastDoc: cursor } = await listStudentsForDashboard({
        branch,
        year,
        search: debouncedSearch,
        pageSize: PAGE,
        lastDoc: lastDocRef.current,
      });
      setRows(prev => {
        const ids = new Set(prev.map(r => r.id));
        return [...prev, ...data.filter(r => !ids.has(r.id))];
      });
      setHasMore(data.length === PAGE);
      setAccessError("");
      lastDocRef.current = cursor;
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        setAccessError(getAccessDeniedMessage(err));
      } else {
        setAccessError("Unable to load more student records right now.");
      }
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const db = getDb();
      if (!db) return;

      const EXPORT_MAX_STUDENTS = 2000;
      const q = query(collection(db, "users"), where("role", "==", "student"), limit(EXPORT_MAX_STUDENTS));
      const snap = await getDocs(q);
      const allStudents = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const total = allStudents.length;

      if (total === EXPORT_MAX_STUDENTS) {
        addToast("Export capped at 2000 students for stability.", "info");
      }

      const rawDataBatch = [];
      const batchSize = 10;

      for (let i = 0; i < total; i += batchSize) {
        const chunk = allStudents.slice(i, i + batchSize);
        const resolved = await Promise.all(chunk.map(async (u) => {
          try {
            const lists = await fetchExhaustiveStudentData(u.id);
            const report = computeReport(u, lists);
            return { user: u, lists, report };
          } catch (studentErr) {
            console.error(`Failed to fetch database records for student ${u.name || u.id}:`, studentErr);
            return null;
          }
        }));
        rawDataBatch.push(...resolved.filter(Boolean));
      }

      if (rawDataBatch.length === 0) {
        addToast("No student records available to export.", "info");
        return;
      }

      // 1. Calculate dynamic slots
      const slots = calculateDynamicSlots(rawDataBatch);

      // 2. Generate fields
      const fields = getDynamicStudentFields(slots);

      // 3. Map into final rows
      const exportRows = rawDataBatch.map(({ user: u, lists, report }) =>
        buildStudentExportRow(u, lists, report, slots)
      );

      downloadFacultyStudentRecordsCsv(
        exportRows,
        `Student_Registry_Summary_${new Date().toISOString().split('T')[0]}.csv`,
        { fields }
      );
      addToast("Student records exported successfully.", "success");
    } catch (err) {
      console.error("Export failed:", err);
      addToast(err?.message || "Failed to prepare export. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  }

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setBranch("");
    setYear("");
  };

  const hasActiveFilters = Boolean(search || branch || year);

  return (
    <Layout title="Student Directory" access={ACCESS.STAFF}>
      <div className="flex-1 w-full max-w-7xl mx-auto px-3 min-[360px]:px-6 py-4 min-[360px]:py-8 space-y-6 min-[360px]:space-y-8 animate-fade-in">
        {selectedStudentUid && (
          <StudentInfoPopup uid={selectedStudentUid} onClose={() => setSelectedStudentUid(null)} />
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl min-[340px]:text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Student Directory</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Department student records and academic oversight.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={handleExport}
              disabled={exporting}
              loading={exporting}
              className="w-full sm:w-auto font-bold text-xs"
            >
              <svg className="h-4 w-4 mr-1.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </Button>
          </div>
        </div>

        {accessError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs sm:text-sm text-amber-800">
            <p className="font-semibold">Access Notice</p>
            <p className="mt-0.5">{accessError}</p>
          </div>
        ) : null}

        {/* Filter Controls Toolbar */}
        <div className="premium-card p-3 min-[360px]:p-4 sm:p-5 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student by name, roll number, or email..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label="Clear search"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-col gap-2.5 pt-1">
            {/* Branch Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Branch:</span>
              {["", "CSE", "ECE", "ME", "CE", "EEE"].map((b) => (
                <button
                  key={b}
                  onClick={() => setBranch(b)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    branch === b
                      ? "bg-brand-700 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {b || "All Branches"}
                </button>
              ))}
            </div>

            {/* Year Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Year:</span>
              {["", "1", "2", "3", "4"].map((y) => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    year === y
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {y ? `Year ${y}` : "All Years"}
                </button>
              ))}

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="ml-auto text-xs font-bold text-red-600 hover:text-red-700 hover:underline py-1 px-2"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>{rows.length} {rows.length === 1 ? "student record" : "student records"} shown</span>
          {busy && <span className="text-brand-600 font-medium animate-pulse">Filtering records...</span>}
        </div>

        {/* Grid of Student Cards */}
        {loading || (busy && rows.length === 0) ? (
          <div className="grid gap-3 min-[360px]:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-12 text-center shadow-sm">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-slate-800">No student records found</p>
            <p className="mt-1 text-xs text-slate-500">Try adjusting your branch, year, or search terms.</p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="secondary" size="sm" className="mt-4">
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-3 min-[360px]:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((st) => (
              <div key={st.id} className="premium-card p-3.5 min-[360px]:p-5 flex flex-col justify-between hover:shadow-md hover:border-brand-200 transition-all min-w-0">
                <div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-700 font-bold text-white shadow-sm">
                      {st.name ? st.name[0].toUpperCase() : "S"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{st.name || "Unnamed Student"}</p>
                      <p className="truncate text-xs text-slate-500 mt-0.5">{st.email || "No email"}</p>
                      {st.rollNumber && (
                        <p className="text-[11px] font-semibold text-slate-600 font-mono mt-0.5">Roll: {st.rollNumber}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
                    {st.branch && <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">{st.branch}</span>}
                    {st.year && <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">Year {st.year}</span>}
                    {st.gpa && <span className="rounded-md bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[11px] font-bold">GPA {st.gpa}</span>}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 gap-2">
                  <Link
                    href={`/student/${st.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    View Ledger &rarr;
                  </Link>
                  <Button
                    variant="soft"
                    size="sm"
                    onClick={() => setSelectedStudentUid(st.id)}
                    className="text-xs py-1.5 px-3 shrink-0"
                  >
                    Quick View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && !busy && !loading && (
          <div className="mt-8 flex flex-col items-center gap-2">
            <p className="text-xs text-slate-400">Showing {rows.length} records</p>
            <Button variant="secondary" onClick={loadMore} loading={loadingMore} className="px-6 text-xs">
              Load More Records
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
