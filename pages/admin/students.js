import { useEffect, useState } from "react";
import { collection, query, where, getDocs, limit, doc, updateDoc } from "firebase/firestore";
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
        const snap = await getDocs(q);
        const delSnap = await getDocs(query(collection(db, "deletionRequests"), where("status", "==", "pending")));
        const delMap = {};
        const delDocIds = {};
        delSnap.forEach((d) => {
          const data = d.data();
          if (data.uid) {
            delMap[data.uid] = true;
            delDocIds[data.uid] = d.id;
          }
        });
        setStudents(snap.docs.map(d => ({
          ...d.data(),
          id: d.id,
          pendingDeletion: delMap[d.id] || false,
          delDocId: delDocIds[d.id] || null,
        })));
      } catch (err) {
        addToast(err?.message || "Failed to load student records", "error");
      } finally {
        setBusy(false);
      }
    }
    load();
  }, [addToast, selectedYear]);

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
      const rows = rawDataBatch.map(({ user, lists, report }) => 
        buildStudentExportRow(user, lists, report, slots)
      );

      downloadAdminStudentsCsv(rows, "global-registry-dynamic.csv", { fields });
      addToast("Exhaustive registry exported.", "success");
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
        addToast(`No student records discovered for Year ${selectedYear}.`, "info");
        setExportPdfProgress(null);
        setPdfBusy(false);
        return;
      }

      // Dynamically load the heavy libraries
      const JSZip = (await import("jszip")).default;
      const { buildStudentPdf } = await import("@/lib/pdf-export");

      const zip = new JSZip();
      const batchSize = 10;

      for (let i = 0; i < total; i += batchSize) {
        const chunk = usersAll.slice(i, i + batchSize);
        await Promise.all(
          chunk.map(async (u) => {
            try {
              const lists = await fetchExhaustiveStudentData(u.id);
              const report = computeReport(u, lists);
              const pdfBytes = await buildStudentPdf(u, lists, report);

              // Standardize name to FirstName_LastName style, stripping spaces and weird characters
              const cleanName = (u.name || "Anonymous")
                .trim()
                .replace(/\s+/g, "_")
                .replace(/[^a-zA-Z0-9_-]/g, "");

              const filename = `${selectedYear}_${cleanName}_Dossier.pdf`;
              zip.file(filename, pdfBytes);
            } catch (err) {
              console.error(`Failed to compile dossier PDF for ${u.name || u.id}:`, err);
            }
          })
        );
        const completed = Math.min(i + batchSize, total);
        setExportPdfProgress({ completed, total, percentage: Math.round((completed / total) * 100) });
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `student-dossiers-year-${selectedYear}.zip`;
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
          message: `Your clearance level has been updated to ${roleToAssign.toUpperCase()}`,
          type: "info"
        }).catch(() => {
          addToast("Role updated, but notification delivery failed.", "info");
        });

        addToast(`Clearance set to ${roleToAssign}`, "success");

        if (roleToAssign !== 'student') {
          setStudents(prev => prev.filter(s => s.id !== uid));
        } else {
          setStudents(prev => prev.map(s => s.id === uid ? { ...s, role: roleToAssign } : s));
        }
      } else if (action === "reject_deletion") {
        if (reqDocId) {
          await updateDoc(doc(db, "deletionRequests", reqDocId), { status: "rejected" });
          await purgeNotifications(`del_${reqDocId}`);
          addToast("Purge request dismissed.", "info");
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
        message={`Confirm update role to ${roleChangeTarget?.role?.toUpperCase()}?`}
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
        title="Protocol: Permanent Purge"
        message="CRITICAL: Permanently erase this scholar from the global ledger?"
        onConfirm={async () => {
          const target = deleteTarget;
          setDeleteTarget(null);
          setBusy(true);
          try {
            await purgeUser(target.uid, user.uid, `Manual Purge: Deleted student entity ${target.uid}`);
            if (target.reqDocId) {
              try {
                await updateDoc(doc(getDb(), "deletionRequests", target.reqDocId), { status: "processed_manual" });
                await purgeNotifications(`del_${target.reqDocId}`);
              } catch {
                // Deletion request already removed or not found.
              }
            }
            addToast("Scholar purged.", "success");
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

      <div className="space-y-10 animate-slide-up">
        {/* Header */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl min-[360px]:text-4xl font-black text-slate-900 tracking-tighter uppercase">Student Registry</h1>
            <p className="text-sm min-[360px]:text-base text-slate-500 mt-2 font-medium">Comprehensive registry of all scholars currently in the ledger.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
              {exportProgress !== null && (
                <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div 
                    className="h-full bg-brand-600 transition-all duration-300" 
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              )}
              <Button
                onClick={exportGlobalRegistry}
                disabled={busy}
                className="lg:w-auto w-full group shadow-xl shadow-brand-500/10"
              >
                <svg className={`h-4 w-4 mr-2 ${busy ? 'animate-spin' : 'group-hover:-translate-y-1 transition-transform'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  {busy ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  )}
                </svg>
                {exportProgress !== null ? `Exporting ${exportProgress}%` : "Export Global Registry (CSV)"}
              </Button>
            </div>

            <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
              {exportPdfProgress !== null && (
                <div className="flex flex-col items-end gap-1.5 w-full sm:w-auto mr-1 animate-slide-up">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                    Dossiers Compiled: {exportPdfProgress.completed} / {exportPdfProgress.total}
                  </span>
                  <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                    <div 
                      className="h-full bg-brand-600 transition-all duration-300" 
                      style={{ width: `${exportPdfProgress.percentage}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="relative group w-full sm:w-auto">
                <Button
                  onClick={exportGlobalRegistryPdf}
                  disabled={!selectedYear || pdfBusy || busy}
                  className="lg:w-auto w-full group shadow-xl shadow-brand-500/10"
                  variant={selectedYear ? "primary" : "secondary"}
                >
                  <svg className={`h-4 w-4 mr-2 ${pdfBusy ? 'animate-spin' : 'group-hover:-translate-y-1 transition-transform'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    {pdfBusy ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    )}
                  </svg>
                  {exportPdfProgress !== null ? `Exporting ${exportPdfProgress.percentage}%` : "Export Dossiers (PDF ZIP)"}
                </Button>
                {!selectedYear && (
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3.5 w-52 bg-slate-950 text-white text-[10px] py-2 px-3.5 rounded-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-300 transform scale-95 translate-y-1 group-hover:scale-100 group-hover:translate-y-0 text-center shadow-2xl font-black tracking-wide border border-slate-800 z-50">
                    Select a Year filter to enable PDF export
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-t-[5px] border-t-slate-950 border-x-[5px] border-x-transparent" />
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="premium-card p-responsive mb-12 animate-slide-up no-print">
          <div className="flex flex-col gap-4 min-[360px]:gap-6 mb-8">
            <div>
              <h2 className="text-2xl min-[360px]:text-3xl font-black text-slate-900 tracking-tighter uppercase">Filter Island</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium italic">&ldquo;Query the global registry for specific scholar entities.&rdquo;</p>
            </div>
          </div>

          <div className="premium-card p-2 rounded-[3rem] bg-white border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
              <div className="relative flex-1 group">
                <svg className="absolute left-7 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-brand-500 transition-all duration-300 transform group-focus-within:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="search"
                  placeholder="Identify scholars..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-[2.5rem] border-none bg-slate-50/50 pl-16 pr-8 py-3.5 sm:py-5 text-sm font-bold text-slate-950 focus:ring-0 outline-none placeholder:text-slate-400 transition-all hover:bg-slate-100/50"
                />
              </div>
              <div className="hidden lg:block w-px h-10 bg-slate-100" />
              <div className="px-4 pb-2 lg:pb-0 flex items-center">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-3 text-sm font-bold text-slate-950 outline-none focus:border-brand-500 transition-all cursor-pointer appearance-none pr-10 relative"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 16px center',
                    backgroundSize: '14px'
                  }}
                >
                  <option value="">All Years</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
              <div className="hidden lg:block w-px h-10 bg-slate-100" />
              <div className="px-8 pb-4 lg:pb-0 lg:pr-8 flex items-center justify-between lg:justify-end gap-3 min-w-35">
                <div className="flex flex-col items-end">
                  <span className="text-xs text-slate-500 tracking-[0.2em]">Registry</span>
                  <span className="text-[10px] font-black text-brand-600 uppercase">
                    {filtered.length} / {students.length} ACTIVE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        {loading || busy ? (
          <div className="grid gap-responsive sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="premium-card p-responsive animate-pulse">
                <Skeleton className="h-14 w-14 rounded-3xl mb-6" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-8" />
                <Skeleton className="h-10 w-full rounded-2xl" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-3xl border border-slate-200 shadow-sm animate-fade-in">
            <div className="h-16 w-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-6">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">No Results Discovered</h3>
            <p className="text-sm text-slate-500 font-medium mt-2 text-center max-w-sm">No student records match your active search terms or filtered criteria.</p>
            <Button
              onClick={() => { setSearchTerm(""); setSelectedYear(""); }}
              className="mt-6 px-6 py-2.5"
              size="sm"
              variant="secondary"
            >
              Clear Active Filters
            </Button>
          </div>
        ) : (
          <div className="grid gap-responsive sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-slide-up">
            {filtered.map(s => (
              <div key={s.id} className="group premium-card p-responsive transition-all hover:-translate-y-2 hover:shadow-2xl border border-slate-100 flex flex-col h-full">
                <div className="mb-6 flex items-center justify-between">
                  <div className="h-14 w-14 rounded-3xl bg-brand-700 flex items-center justify-center font-black text-white shadow-lg shadow-brand-900/10">
                    {s.name?.charAt(0) || "U"}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sector</span>
                    <Badge variant="gray" className="mt-1">{s.department || "GEN"}</Badge>
                    {s.pendingDeletion && (
                      <Badge variant="danger" className="mt-2">Purge Request</Badge>
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none truncate">{s.name || "Anonymous"}</h3>
                    <p className="text-xs font-medium text-slate-600 mt-1 truncate">{s.email}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-slate-500">Year</span>
                      {s.year ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-brand-700 bg-brand-50 border border-brand-100 rounded-lg px-2 py-0.5 mt-1 uppercase tracking-wider w-fit">
                          {s.year} Year
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-slate-400 mt-0.5">N/A</span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-slate-500">Branch</span>
                      <span className="text-sm font-semibold text-slate-900 mt-0.5 truncate">{s.branch || "-"}</span>
                    </div>
                  </div>

                  {/* Manual Oversight Control Bar */}
                  {s.id !== user?.uid && (
                    <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-3 shadow-xl">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block text-center">Protocol Elevation</span>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {s.pendingDeletion ? (
                          <>
                            <Button onClick={() => decide(s.id, "delete", s.delDocId)} variant="danger" size="sm">Accept Purge</Button>
                            <Button onClick={() => decide(s.id, "reject_deletion", s.delDocId)} variant="secondary" size="sm">Dismiss</Button>
                          </>
                        ) : (
                          <>
                            <RoleButton label="Student" role="student" currentRole={s.role} onClick={() => askRoleChange(s.id, "student")} />
                            <RoleButton label="Faculty" role="faculty" currentRole={s.role} onClick={() => askRoleChange(s.id, "faculty")} />
                            <RoleButton label="Admin" role="admin" currentRole={s.role} onClick={() => askRoleChange(s.id, "admin")} />
                            <button
                              onClick={() => decide(s.id, "delete")}
                              className="p-1.5 rounded-lg bg-red-700 text-white hover:bg-red-800 transition-colors border border-red-700"
                              title="Delete user"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Button
                    onClick={() => setSelectedStudentUid(s.id)}
                    variant="secondary"
                    className="w-full py-3"
                  >
                    Examine Profile
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
