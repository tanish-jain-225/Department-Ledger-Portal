import { useEffect, useState } from "react";
import { collection, query, where, getDocs, limit, doc, updateDoc } from "firebase/firestore";
import Layout, { ACCESS } from "@/components/Layout";
import { StudentInfoPopup } from "@/components";
import { Button, EmptyState, Badge, Skeleton, ConfirmDialog, RoleButton } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { getDb } from "@/lib/firebase";
import { downloadStudentsCsv } from "@/lib/csv-download";
import { useToast } from "@/lib/toast-context";
import { logAudit } from "@/lib/audit";
import { createNotification, syncAdminNotifications, purgeNotifications } from "@/lib/notifications";
import { purgeUser } from "@/lib/data";
import { PAGE_SIZE } from "@/lib/constants";

export default function AdminStudentsDashboard() {
  const { user, loading } = useAuth();
  const { addToast } = useToast();
  const [students, setStudents] = useState([]);
  const [busy, setBusy] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudentUid, setSelectedStudentUid] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    async function load() {
      setBusy(true);
      try {
        const db = getDb();
        if (!db) return;
        const q = query(collection(db, "users"), where("role", "==", "student"), limit(PAGE_SIZE.ADMIN_DIRECTORY));
        const snap = await getDocs(q);
        setStudents(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      } catch (err) {
        addToast(err?.message || "Failed to load student records", "error");
      } finally {
        setBusy(false);
      }
    }
    load();
  }, []);

  async function decide(uid, action, assignedRole = null) {
    const db = getDb();
    if (!db || !uid) return;
    
    try {
      if (action === "delete") {
        setDeleteTarget(uid);
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
        });

        addToast(`Clearance set to ${roleToAssign}`, "success");
        
        // Optimistic Update: If role changed from student, remove from this list
        if (roleToAssign !== 'student') {
            setStudents(prev => prev.filter(s => s.id !== uid));
        } else {
            setStudents(prev => prev.map(s => s.id === uid ? { ...s, role: roleToAssign } : s));
        }
      }

      await syncAdminNotifications(user.uid);
      
      // Cleanup any pending requests for this user specifically
      const qR = query(collection(db, "roleRequests"), where("uid", "==", uid), where("status", "==", "pending"));
      const qD = query(collection(db, "deletionRequests"), where("uid", "==", uid), where("status", "==", "pending"));
      const [sR, sD] = await Promise.all([getDocs(qR), getDocs(qD)]);
      
      for (const d of sR.docs) {
        await updateDoc(d.ref, { status: "processed_manual" });
        await purgeNotifications(`role_${d.id}`);
      }
      for (const d of sD.docs) {
        await updateDoc(d.ref, { status: "processed_manual" });
        await purgeNotifications(`del_${d.id}`);
      }
    } catch (e) {
      addToast(e.message, "error");
    }
  }

  const filtered = students.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Student Directory" access={ACCESS.ADMIN}>
      <ConfirmDialog
        open={!!deleteTarget}
        title="Protocol: Permanent Purge"
        message="CRITICAL: You are about to permanently erase this scholar from the global ledger. This includes all academic records, activities, and professional achievements. This action is irreversible."
        onConfirm={async () => {
          const uid = deleteTarget;
          setDeleteTarget(null);
          setBusy(true);
          try {
            await purgeUser(uid, user.uid, `Manual Purge: Deleted student entity ${uid}`);
            addToast("Scholar purged from ledger.", "success");
            setStudents(prev => prev.filter(s => s.id !== uid));
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
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Student Registry</h1>
            <p className="text-base text-slate-400 mt-2 font-medium">Comprehensive registry of all scholars currently in the ledger.</p>
          </div>
          <Button
            onClick={() => downloadStudentsCsv(students, "student-directory.csv", { maskSensitive: false })}
            className="lg:w-auto w-full group shadow-xl shadow-brand-500/10"
          >
            <svg className="h-4 w-4 mr-2 group-hover:-translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Global Registry (CSV)
          </Button>
        </div>

        {/* Filter Island */}
        <div className="premium-card p-2 rounded-[3rem] bg-white/70 backdrop-blur-2xl border-slate-200/50 shadow-2xl shadow-slate-200/40 relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 to-transparent pointer-events-none" />
           <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
              <div className="relative flex-1 group">
                <svg className="absolute left-7 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-brand-500 transition-all duration-300 transform group-focus-within:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="search"
                  placeholder="Identify scholars in the global registry..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-[2.5rem] border-none bg-transparent pl-16 pr-8 py-5 text-sm font-black text-slate-900 focus:ring-0 outline-none placeholder:text-slate-300 transition-all"
                />
              </div>
              <div className="hidden lg:block w-px h-10 bg-slate-100" />
              <div className="px-8 pb-4 lg:pb-0 lg:pr-8 flex items-center justify-between lg:justify-end gap-3 min-w-[140px]">
                 <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em]">Registry</span>
                    <span className="text-[10px] font-black text-brand-600">
                       {filtered.length} / {students.length} ACTIVE
                    </span>
                 </div>
                 <div className="h-8 w-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                 </div>
              </div>
           </div>
        </div>

        {/* List */}
        {loading || busy ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
             {[1,2,3,4,5,6].map(i => (
               <div key={i} className="premium-card p-8 animate-pulse">
                 <div className="flex justify-between items-center mb-6">
                    <Skeleton className="h-14 w-14 rounded-3xl" />
                    <Skeleton className="h-6 w-20 rounded-xl" />
                 </div>
                 <Skeleton className="h-6 w-3/4 mb-2" />
                 <Skeleton className="h-4 w-1/2 mb-8" />
                 <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50 mb-6">
                    <div className="space-y-1">
                      <Skeleton className="h-2 w-10" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-2 w-10" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                 </div>
                 <Skeleton className="h-10 w-full rounded-2xl" />
               </div>
             ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="Registry Empty" message="No active student records discovered." />
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(s => (
              <div key={s.id} className="group premium-card p-8 transition-all hover:translate-y-[-8px] hover:shadow-2xl border border-slate-100 flex flex-col h-full">
                <div className="mb-6 flex items-center justify-between">
                   <div className="h-14 w-14 rounded-3xl bg-brand-50 flex items-center justify-center font-black text-brand-600 border border-brand-100 group-hover:bg-brand-600 group-hover:text-white transition-all shadow-lg shadow-brand-500/10">
                      {s.name?.charAt(0) || "U"}
                   </div>
                   <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sector</span>
                      <Badge variant="gray" className="mt-1">{s.department || "GEN"}</Badge>
                   </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none truncate">{s.name || "Anonymous"}</h3>
                    <p className="text-xs font-medium text-slate-400 mt-1 truncate">{s.email}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                    <div className="flex flex-col">
                       <span className="text-[8px] font-black uppercase text-slate-300">Year</span>
                       <span className="text-xs font-bold text-slate-900 mt-0.5">{s.year ? `${s.year} Year` : "N/A"}</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[8px] font-black uppercase text-slate-300">Section</span>
                       <span className="text-xs font-bold text-slate-900 mt-0.5">{s.section || "—"}</span>
                    </div>
                  </div>

                  {/* Manual Oversight Control Bar */}
                  {s.id !== user?.uid && (
                    <div className="bg-slate-50/50 rounded-2xl p-3 border border-slate-100 space-y-3">
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block text-center">Manual Oversight Protocol</span>
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                          <RoleButton label="S" role="student" currentRole={s.role} onClick={() => decide(s.id, "approve", "student")} />
                          <RoleButton label="F" role="faculty" currentRole={s.role} onClick={() => decide(s.id, "approve", "faculty")} />
                          <RoleButton label="A" role="admin" currentRole={s.role} onClick={() => decide(s.id, "approve", "admin")} />
                          <button 
                            onClick={() => decide(s.id, "delete")}
                            className="ml-1 p-2 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all border border-rose-100 shadow-sm"
                            title="Purge Legacy Data"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex gap-3 pt-4">
                   <Button
                     onClick={() => setSelectedStudentUid(s.id)}
                     variant="secondary"
                     className="flex-1 text-[10px] font-black uppercase"
                   >
                     Inspect Profile
                   </Button>
                   <Button
                     onClick={() => downloadStudentsCsv([s], `student-${s.name}.csv`)}
                     variant="ghost"
                     className="px-4 border border-slate-100"
                   >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
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
