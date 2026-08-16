import { useEffect, useState, useRef } from "react";
import { collection, query, where, getDocs, limit, doc, updateDoc, startAfter } from "firebase/firestore";
import Layout, { ACCESS } from "@/components/Layout";
import { StudentInfoPopup } from "@/components";
import { Button, EmptyState, Badge, Skeleton, ConfirmDialog, RoleButton } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { getDb } from "@/lib/firebase";
import { downloadAdminStudentsCsv, buildStudentExportRow, calculateDynamicSlots, getDynamicStudentFields } from "@/lib/csv-download";
import { useToast } from "@/lib/toast-context";
import { logAudit } from "@/lib/audit";
import { createNotification, syncAdminNotifications, purgeNotifications } from "@/lib/notifications";
import { purgeUser } from "@/lib/data";
import { computeReport } from "@/lib/student-analytics";
import { PAGE_SIZE } from "@/lib/constants";
import { fetchExhaustiveStudentData } from "@/lib/student-data";

const EXPORT_MAX_STUDENTS = 2000;

export default function AdminStudentsDashboard() {
  const { user, loading } = useAuth();
  const { addToast } = useToast();
  const [students, setStudents] = useState([]);
  const [busy, setBusy] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudentUid, setSelectedStudentUid] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [roleChangeTarget, setRoleChangeTarget] = useState(null);
  const [exportProgress, setExportProgress] = useState(null);
  const [selectedYear, setSelectedYear] = useState("");
  const [exportPdfProgress, setExportPdfProgress] = useState(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const [pendingDeletions, setPendingDeletions] = useState({ flags: {}, docIds: {} });
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const lastDocRef = useRef(null);

  useEffect(() => {
    async function load() {
      setBusy(true);
      try {
        const db = getDb();
        if (!db) return;
        let q;
        if (selectedYear) {
          q = query(
            collection(db, "users"),
            where("role", "==", "student"),
            where("year", "==", selectedYear),
            limit(PAGE_SIZE.ADMIN_DIRECTORY)
          );
        } else {
          q = query(
            collection(db, "users"),
            where("role", "==", "student"),
            limit(PAGE_SIZE.ADMIN_DIRECTORY)
          );
        }

        const [snap, delSnap] = await Promise.all([
          getDocs(q),
          getDocs(query(collection(db, "deletionRequests"), where("status", "==", "pending")))
        ]);

        const delMap = {};
        const delDocIds = {};
        delSnap.forEach((d) => {
          const data = d.data();
          if (data.uid) {
            delMap[data.uid] = true;
            delDocIds[data.uid] = d.id;
          }
        });

        setPendingDeletions({ flags: delMap, docIds: delDocIds });

        setStudents(snap.docs.map(d => ({
          ...d.data(),
          id: d.id,
          pendingDeletion: delMap[d.id] || false,
          delDocId: delDocIds[d.id] || null,
        })));
        setHasMore(snap.docs.length === PAGE_SIZE.ADMIN_DIRECTORY);
        lastDocRef.current = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
      } catch (err) {
        addToast(err?.message || "Failed to load student records", "error");
      } finally {
        setBusy(false);
      }
    }
    load();
  }, [addToast, selectedYear]);

  async function loadMore() {
    if (!lastDocRef.current || loadingMore) return;
    setLoadingMore(true);
    const db = getDb();
    if (!db) return;
    try {
      let q;
      if (selectedYear) {
        q = query(
          collection(db, "users"),
          where("role", "==", "student"),
          where("year", "==", selectedYear),
          startAfter(lastDocRef.current),
          limit(PAGE_SIZE.ADMIN_DIRECTORY)
        );
      } else {
        q = query(
          collection(db, "users"),
          where("role", "==", "student"),
          startAfter(lastDocRef.current),
          limit(PAGE_SIZE.ADMIN_DIRECTORY)
        );
      }
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({
        ...d.data(),
        id: d.id,
        pendingDeletion: pendingDeletions.flags[d.id] || false,
        delDocId: pendingDeletions.docIds[d.id] || null,
      }));
      setStudents(prev => {
        const ids = new Set(prev.map(r => r.id));
        return [...prev, ...data.filter(r => !ids.has(r.id))];
      });
      setHasMore(data.length === PAGE_SIZE.ADMIN_DIRECTORY);
      lastDocRef.current = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    } catch (err) {
      addToast(err?.message || "Failed to load more student records", "error");
    } finally {
      setLoadingMore(false);
    }
  }

  async function exportGlobalRegistry() {
    const db = getDb();
    if (!db) return;
    setBusy(true);
    setExportProgress(0);

    try {
      const q = query(collection(db, "users"), where("role", "==", "student"), limit(EXPORT_MAX_STUDENTS));
      const snap = await getDocs(q);
      const usersAll = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const total = usersAll.length;

      if (total === EXPORT_MAX_STUDENTS) {
        addToast("Export capped at 2000 students for stability.", "info");
      }

      const rawDataBatch = [];
      const batchSize = 10;

      for (let i = 0; i < total; i += batchSize) {
        const chunk = usersAll.slice(i, i + batchSize);
        const resolved = await Promise.all(chunk.map(async (u) => {
          const lists = await fetchExhaustiveStudentData(u.id);
          const report = computeReport(u, lists);
          return { user: u, lists, report };
        }));
        rawDataBatch.push(...resolved);
        setExportProgress(Math.round(((i + chunk.length) / total) * 100));
      }

      const slots = calculateDynamicSlots(rawDataBatch);
      const fields = getDynamicStudentFields(slots);
      const rows = rawDataBatch.map(({ user: u, lists, report }) =>
        buildStudentExportRow(u, lists, report, slots)
      );

      downloadAdminStudentsCsv(
        rows,
        `Student_Registry_Full_${new Date().toISOString().split('T')[0]}.csv`,
        { fields }
      );
      addToast("Student directory exported successfully.", "success");
    } catch (error) {
      addToast(error?.message || "Failed to export", "error");
    } finally {
      setBusy(false);
      setExportProgress(null);
    }
  }

  async function exportGlobalRegistryPdf() {
    if (!selectedYear) {
      addToast("Please select a Year filter first.", "warning");
      return;
    }
    const db = getDb();
    if (!db) return;
    setPdfBusy(true);
    setExportPdfProgress(0);

    try {
      const q = query(
        collection(db, "users"),
        where("role", "==", "student"),
        where("year", "==", selectedYear)
      );
      const snap = await getDocs(q);
      const usersAll = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const total = usersAll.length;

      if (total === 0) {
        addToast(`No student records found for Year ${selectedYear}.`, "info");
        setExportPdfProgress(null);
        setPdfBusy(false);
        return;
      }

      const JSZip = (await import("jszip")).default;
      const { buildStudentPdf } = await import("@/lib/pdf-export");

      const zip = new JSZip();
      const batchSize = 10;

      for (let i = 0; i < total; i += batchSize) {
        const chunk = usersAll.slice(i, i + batchSize);

        const chunkData = await Promise.all(
          chunk.map(async (u) => {
            try {
              const lists = await fetchExhaustiveStudentData(u.id);
              return { u, lists };
            } catch (err) {
              console.error(`Failed to fetch database records for student ${u.name || u.id}:`, err);
              return null;
            }
          })
        );

        for (const item of chunkData) {
          if (!item) continue;
          const { u, lists } = item;
          try {
            const report = computeReport(u, lists);
            const pdfBytes = await buildStudentPdf(u, lists, report);

            const cleanName = (u.name || "Anonymous")
              .trim()
              .replace(/\s+/g, "_")
              .replace(/[^a-zA-Z0-9_-]/g, "");
            const filename = `Student_Dossier_${cleanName}.pdf`;
            zip.file(filename, pdfBytes);
          } catch (err) {
            console.error(`Failed to compile dossier PDF for ${u.name || u.id}:`, err);
          }
        }

        const completed = Math.min(i + batchSize, total);
        setExportPdfProgress({ completed, total, percentage: Math.round((completed / total) * 100) });
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Student_Dossiers_Year_${selectedYear}_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addToast(`Dossiers for Year ${selectedYear} exported.`, "success");
    } catch (error) {
      addToast(error?.message || "Failed to export PDF dossiers.", "error");
    } finally {
      setPdfBusy(false);
      setExportPdfProgress(null);
    }
  }

  function askRoleChange(uid, role) {
    setRoleChangeTarget({ uid, role });
  }

  async function decide(uid, action, reqDocId = null, assignedRole = null) {
    const db = getDb();
    if (!db || !uid) return;

    try {
      if (action === "delete") {
        setDeleteTarget({ uid, reqDocId });
        return;
      }

      if (action === "approve") {
        const roleToAssign = assignedRole || "student";
        await updateDoc(doc(db, "users", uid), {
          role: roleToAssign,
          facultyVerification: roleToAssign === 'faculty' ? "approved" : "none"
        });

        await logAudit({
          action: "user_role_assigned",
          actorUid: user.uid,
          targetUid: uid,
          description: `Directory Oversight: Set role to ${roleToAssign}`
        });

        await createNotification(uid, {
          title: "Access Updated",
          message: `Your account role has been updated to ${roleToAssign.toUpperCase()}`,
          type: "info"
        }).catch(() => {
          addToast("Role updated, but notification delivery failed.", "info");
        });

        addToast(`Role updated to ${roleToAssign}`, "success");

        if (roleToAssign !== 'student') {
          setStudents(prev => prev.filter(s => s.id !== uid));
        } else {
          setStudents(prev => prev.map(s => s.id === uid ? { ...s, role: roleToAssign } : s));
        }
      } else if (action === "reject_deletion") {
        if (reqDocId) {
          await updateDoc(doc(db, "deletionRequests", reqDocId), { status: "rejected" });
          await purgeNotifications(`del_${reqDocId}`);
          addToast("Deletion request dismissed.", "info");
        }
      }

      await syncAdminNotifications(user.uid);
    } catch (e) {
      addToast(e.message, "error");
    }
  }

  const filtered = students.filter(s => {
    const matchesSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = selectedYear ? String(s.year) === selectedYear : true;
    return matchesSearch && matchesYear;
  });

  return (
    <Layout title="Student Directory" access={ACCESS.ADMIN}>
      <ConfirmDialog
        open={!!roleChangeTarget}
        title="Confirm Role Change"
        message={`Are you sure you want to change this user's role to ${roleChangeTarget?.role?.toUpperCase()}?`}
        onConfirm={async () => {
          const target = roleChangeTarget;
          setRoleChangeTarget(null);
          if (target?.uid && target?.role) {
            await decide(target.uid, "approve", null, target.role);
          }
        }}
        onCancel={() => setRoleChangeTarget(null)}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Student Record"
        message="Are you sure you want to permanently delete this student and all associated records from the ledger? This action cannot be undone."
        onConfirm={async () => {
          const target = deleteTarget;
          setDeleteTarget(null);
          setBusy(true);
          try {
            await purgeUser(target.uid, user.uid, `Admin Deleted student ${target.uid}`);
            if (target.reqDocId) {
              try {
                await updateDoc(doc(getDb(), "deletionRequests", target.reqDocId), { status: "processed_manual" });
                await purgeNotifications(`del_${target.reqDocId}`);
              } catch {
                // Ignore cleanup error
              }
            }
            addToast("Student record deleted successfully.", "success");
            setStudents(prev => prev.filter(s => s.id !== target.uid));
            await syncAdminNotifications(user.uid);
          } catch (e) {
            addToast(e.message, "error");
          } finally {
            setBusy(false);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
        variant="danger"
      />
      {selectedStudentUid && <StudentInfoPopup uid={selectedStudentUid} onClose={() => setSelectedStudentUid(null)} />}

      <div className="flex-1 w-full max-w-7xl mx-auto px-3 min-[360px]:px-6 py-4 min-[360px]:py-8 space-y-6 min-[360px]:space-y-8 animate-slide-up">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl min-[340px]:text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Student Directory</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage student records, roles, and export archives.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <Button
              onClick={exportGlobalRegistry}
              disabled={busy}
              variant="secondary"
              className="flex-1 sm:flex-none text-xs font-bold py-2.5"
            >
              <svg className={`h-4 w-4 mr-1.5 shrink-0 ${busy ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {exportProgress !== null ? `Exporting ${exportProgress}%` : "Export CSV"}
            </Button>

            <Button
              onClick={exportGlobalRegistryPdf}
              disabled={!selectedYear || pdfBusy || busy}
              variant={selectedYear ? "primary" : "secondary"}
              className="flex-1 sm:flex-none text-xs font-bold py-2.5"
              title={!selectedYear ? "Filter by year to export PDF dossiers" : "Export PDF Dossiers"}
            >
              <svg className={`h-4 w-4 mr-1.5 shrink-0 ${pdfBusy ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {exportPdfProgress !== null ? `Exporting ${exportPdfProgress.percentage}%` : "Export Dossiers (ZIP)"}
            </Button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="premium-card p-3 min-[360px]:p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1 min-w-0">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                placeholder="Search students by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs font-semibold text-slate-800 focus:border-brand-500 focus:outline-none cursor-pointer"
              >
                <option value="">All Academic Years</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>

              <div className="px-2 text-xs font-bold text-slate-500 shrink-0">
                {filtered.length} shown
              </div>
            </div>
          </div>
        </div>

        {/* Student Cards Grid */}
        {loading || busy ? (
          <div className="grid gap-3 min-[360px]:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="premium-card p-4 sm:p-5 animate-pulse space-y-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
            <div className="h-12 w-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 mb-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900">No students found</h3>
            <p className="text-xs text-slate-500 mt-1 text-center max-w-sm">No student records match your active search terms or selected year.</p>
            <Button
              onClick={() => { setSearchTerm(""); setSelectedYear(""); }}
              className="mt-4 px-4 py-2 text-xs"
              variant="secondary"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-3 min-[360px]:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-slide-up">
              {filtered.map(s => (
                <div key={s.id} className="group premium-card p-3.5 min-[360px]:p-5 transition-all hover:shadow-md hover:border-brand-200 border border-slate-200 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="h-10 w-10 rounded-xl bg-brand-700 flex items-center justify-center font-bold text-white shadow-sm shrink-0">
                        {s.name?.charAt(0) || "U"}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="gray">{s.department || s.branch || "General"}</Badge>
                        {s.pendingDeletion && (
                          <Badge variant="danger">Deletion Requested</Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{s.name || "Anonymous Student"}</h3>
                      <p className="text-xs text-slate-500 truncate">{s.email}</p>
                      {s.rollNumber && (
                        <p className="text-[11px] font-semibold text-slate-600 font-mono">Roll: {s.rollNumber}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 py-2.5 my-3 border-y border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Year</span>
                        <span className="font-semibold text-slate-800">{s.year ? `Year ${s.year}` : "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Branch</span>
                        <span className="font-semibold text-slate-800 truncate block">{s.branch || "-"}</span>
                      </div>
                    </div>

                    {/* Role / Deletion actions */}
                    {s.id !== user?.uid && (
                      <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 space-y-1.5 my-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block text-center">Set Role</span>
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          {s.pendingDeletion ? (
                            <>
                              <Button onClick={() => decide(s.id, "delete", s.delDocId)} variant="danger" size="sm" className="text-xs py-1">Accept Purge</Button>
                              <Button onClick={() => decide(s.id, "reject_deletion", s.delDocId)} variant="secondary" size="sm" className="text-xs py-1">Dismiss</Button>
                            </>
                          ) : (
                            <>
                              <RoleButton label="Student" role="student" currentRole={s.role} onClick={() => askRoleChange(s.id, "student")} />
                              <RoleButton label="Faculty" role="faculty" currentRole={s.role} onClick={() => askRoleChange(s.id, "faculty")} />
                              <RoleButton label="Admin" role="admin" currentRole={s.role} onClick={() => askRoleChange(s.id, "admin")} />
                              <button
                                onClick={() => decide(s.id, "delete")}
                                className="p-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                title="Delete student"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    <Button
                      onClick={() => setSelectedStudentUid(s.id)}
                      variant="secondary"
                      size="sm"
                      className="w-full text-xs py-1.5"
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          
            {hasMore && (
              <div className="flex justify-center mt-6">
                <Button
                  onClick={loadMore}
                  loading={loadingMore}
                  variant="secondary"
                  size="sm"
                  className="px-6"
                >
                  Load More Students
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
