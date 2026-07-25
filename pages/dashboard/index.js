import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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
      const rows = rawDataBatch.map(({ user, lists, report }) =>
        buildStudentExportRow(user, lists, report, slots)
      );

      downloadFacultyStudentRecordsCsv(
        rows,
        `Student_Registry_Summary_${new Date().toISOString().split('T')[0]}.csv`,
        { fields }
      );
      addToast("Exhaustive student records exported successfully.", "success");
    } catch (err) {
      console.error("Export failed:", err);
      addToast(err?.message || "Failed to prepare export. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Layout title="Student Records" access={ACCESS.STAFF}>
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {selectedStudentUid && (
          <StudentInfoPopup uid={selectedStudentUid} onClose={() => setSelectedStudentUid(null)} />
        )}

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

        {accessError ? (
          <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
            <p className="font-semibold">Access restricted</p>
            <p className="mt-1">{accessError}</p>
          </div>
        ) : null}

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-xl">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student name or email..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="mb-6 flex flex-wrap gap-2">
          {["", "CSE", "ECE", "ME", "CE", "EEE"].map((b) => (
            <button
              key={b}
              onClick={() => setBranch(b)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${branch === b ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {b || "All Branches"}
            </button>
          ))}
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {["", "1", "2", "3", "4"].map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${year === y ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {y ? `Year ${y}` : "All Years"}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="mt-4 h-6 w-3/4" />
                <Skeleton className="mt-2 h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="text-base font-semibold text-slate-700">No student records found</p>
            <p className="mt-1 text-sm text-slate-400">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((st) => (
              <div key={st.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-700 font-bold text-white">
                    {st.name ? st.name[0].toUpperCase() : "S"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-slate-900">{st.name || "Unnamed Student"}</p>
                    <p className="truncate text-xs text-slate-500">{st.email || "No email"}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  {st.branch && <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{st.branch}</span>}
                  {st.year && <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">Year {st.year}</span>}
                  {st.gpa && <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">GPA {st.gpa}</span>}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <Link
                    href={`/student/${st.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
                  >
                    View Details &rarr;
                  </Link>
                  <Button
                    variant="soft"
                    size="sm"
                    onClick={() => setSelectedStudentUid(st.id)}
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
      </div>
    </Layout>
  );
}
