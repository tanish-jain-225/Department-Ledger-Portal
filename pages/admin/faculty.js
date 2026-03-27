import { useEffect, useState } from "react";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  limit, 
  doc, 
  updateDoc, 
  deleteDoc 
} from "firebase/firestore";
import Layout, { ACCESS } from "@/components/Layout";
import { FacultyInfoPopup } from "@/components";
import { Button, EmptyState, Badge, Skeleton, ConfirmDialog } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { getDb } from "@/lib/firebase";
import { downloadStudentsCsv } from "@/lib/csv-download";
import { useToast } from "@/lib/toast-context";
import { logAudit } from "@/lib/audit";
import { createNotification, syncAdminNotifications, purgeNotifications } from "@/lib/notifications";

function RoleButton({ label, role, currentRole, onClick }) {
  const active = currentRole === role;
  const activeStyles = {
    student: "bg-sky-600 text-white border-sky-600 shadow-sky-200",
    faculty: "bg-indigo-700 text-white border-indigo-700 shadow-indigo-200",
    admin: "bg-slate-900 text-white border-slate-900 shadow-slate-200",
  };
  const idleStyles = {
    student: "text-sky-700 bg-sky-50 border-sky-100 hover:bg-sky-100",
    faculty: "text-indigo-700 bg-indigo-50 border-indigo-100 hover:bg-indigo-100",
    admin: "text-slate-700 bg-slate-50 border-slate-100 hover:bg-slate-100",
  };
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all duration-300 shadow-sm
        ${active ? activeStyles[role] : idleStyles[role]}`}
    >
      {label}
    </button>
  );
}

export default function AdminFacultyDashboard() {
  const { user, loading } = useAuth();
  const { addToast } = useToast();
  const [faculty, setFaculty] = useState([]);
  const [busy, setBusy] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFacultyUid, setSelectedFacultyUid] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    async function load() {
      setBusy(true);
      try {
        const db = getDb();
        if (!db) return;
        const q = query(collection(db, "users"), where("role", "==", "faculty"), limit(100));
        const snap = await getDocs(q);
        setFaculty(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      } catch (err) {
        console.error(err);
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
        const roleToAssign = assignedRole || "faculty";
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
        
        // Optimistic Update: If role changed from faculty, remove from this list
        if (roleToAssign !== 'faculty') {
            setFaculty(prev => prev.filter(f => f.id !== uid));
        } else {
            setFaculty(prev => prev.map(f => f.id === uid ? { ...f, role: roleToAssign } : f));
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

  const filtered = faculty.filter(f => 
    f.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Faculty Directory" access={ACCESS.ADMIN}>
      <ConfirmDialog
        open={!!deleteTarget}
        title="Protocol: Permanent Purge"
        message="CRITICAL: You are about to permanently erase this faculty member from the global ledger. This action is irreversible."
        onConfirm={async () => {
          const uid = deleteTarget;
          setDeleteTarget(null);
          setBusy(true);
          try {
            const db = getDb();
            const subCollections = ["academicRecords", "activities", "achievements", "placements", "aiReports"];
            for (const collName of subCollections) {
               const q = query(collection(db, collName), where("studentUid", "==", uid));
               const snap = await getDocs(q);
               for (const d of snap.docs) await deleteDoc(doc(db, collName, d.id));
            }
            await deleteDoc(doc(db, "users", uid));
            
            await logAudit({
              action: "user_deleted",
              actorUid: user.uid,
              targetUid: uid,
              description: `Manual Purge: Deleted faculty entity ${uid}`
            });

            addToast("Faculty member purged from ledger.", "success");
            setFaculty(prev => prev.filter(f => f.id !== uid));
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
      {selectedFacultyUid && <FacultyInfoPopup uid={selectedFacultyUid} onClose={() => setSelectedFacultyUid(null)} />}
      
      <div className="space-y-10 animate-slide-up">
        {/* Header */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Faculty Ledger</h1>
            <p className="text-base text-slate-400 mt-2 font-medium">Registry of verified instructional staff and departmental leads.</p>
          </div>
          <Button
            onClick={() => downloadStudentsCsv(faculty, "faculty-directory.csv", { maskSensitive: false })}
            className="lg:w-auto w-full group shadow-xl shadow-brand-500/10"
          >
            <svg className="h-4 w-4 mr-2 group-hover:-translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Staff Ledger (CSV)
          </Button>
        </div>

        {/* Filter Island */}
        <div className="premium-card p-2 rounded-[3rem] bg-white/70 backdrop-blur-2xl border-slate-200/50 shadow-2xl shadow-slate-200/40 relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent pointer-events-none" />
           <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
              <div className="relative flex-1 group">
                <svg className="absolute left-7 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-all duration-300 transform group-focus-within:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="search"
                  placeholder="Identify instructional staff in the ledger..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-[2.5rem] border-none bg-transparent pl-16 pr-8 py-5 text-sm font-black text-slate-900 focus:ring-0 outline-none placeholder:text-slate-300 transition-all"
                />
              </div>
              <div className="hidden lg:block w-px h-10 bg-slate-100" />
              <div className="px-8 pb-4 lg:pb-0 lg:pr-8 flex items-center justify-between lg:justify-end gap-3 min-w-[140px]">
                 <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em]">Council</span>
                    <span className="text-[10px] font-black text-indigo-600">
                       {filtered.length} / {faculty.length} STAFF
                    </span>
                 </div>
                 <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                 </div>
              </div>
           </div>
        </div>

        {/* Content */}
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
                 <div className="py-4 border-y border-slate-50 mb-6 flex flex-col gap-1">
                    <Skeleton className="h-2 w-10" />
                    <Skeleton className="h-4 w-full" />
                 </div>
                 <Skeleton className="h-10 w-full rounded-2xl" />
               </div>
             ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="Staff Registry Empty" message="No active faculty records discovered." />
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(f => (
              <div key={f.id} className="group premium-card p-8 transition-all hover:translate-y-[-8px] hover:shadow-2xl border border-slate-100 flex flex-col h-full">
                <div className="mb-6 flex items-center justify-between">
                   <div className="h-14 w-14 rounded-3xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-lg shadow-indigo-500/10">
                      {f.name?.charAt(0) || "F"}
                   </div>
                   <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clearance</span>
                      <Badge variant="brand" className="mt-1">{f.role?.toUpperCase() || "STAFF"}</Badge>
                   </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none truncate">{f.name || "Anonymous Member"}</h3>
                    <p className="text-xs font-medium text-slate-400 mt-1 truncate">{f.email}</p>
                  </div>
                  
                  <div className="py-4 border-y border-slate-50 flex flex-col gap-1">
                      <span className="text-[8px] font-black uppercase text-slate-300">Designation</span>
                      <span className="text-xs font-bold text-slate-900 truncate">{f.designation || "Department Staff"}</span>
                  </div>

                  {/* Manual Oversight Control Bar */}
                  {f.id !== user?.uid && (
                    <div className="bg-indigo-50/30 rounded-2xl p-3 border border-indigo-100/50 space-y-3">
                      <span className="text-[8px] font-black uppercase text-indigo-400 tracking-widest block text-center">Protocol Oversight</span>
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                          <RoleButton label="S" role="student" currentRole={f.role} onClick={() => decide(f.id, "approve", "student")} />
                          <RoleButton label="F" role="faculty" currentRole={f.role} onClick={() => decide(f.id, "approve", "faculty")} />
                          <RoleButton label="A" role="admin" currentRole={f.role} onClick={() => decide(f.id, "approve", "admin")} />
                          <button 
                            onClick={() => decide(f.id, "delete")}
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
                     onClick={() => setSelectedFacultyUid(f.id)}
                     variant="secondary"
                     className="flex-1 text-[10px] font-black uppercase"
                   >
                     Inspect Dossier
                   </Button>
                   <Button
                     onClick={() => downloadStudentsCsv([f], `faculty-${f.name}.csv`)}
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
