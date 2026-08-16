import { useEffect, useState, useRef } from "react";
import { collection, query, where, getDocs, limit, doc, updateDoc, orderBy, startAfter } from "firebase/firestore";
import Layout, { ACCESS } from "@/components/Layout";
import { FacultyInfoPopup } from "@/components";
import { Button, EmptyState, Badge, Skeleton, ConfirmDialog, RoleButton } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { getDb } from "@/lib/firebase";
import { downloadAdminFacultyRecordsCsv, buildFacultyExportRow } from "@/lib/csv-download";
import { useToast } from "@/lib/toast-context";
import { logAudit } from "@/lib/audit";
import { createNotification, syncAdminNotifications, purgeNotifications } from "@/lib/notifications";
import { purgeUser } from "@/lib/data";
import { PAGE_SIZE } from "@/lib/constants";

export default function AdminFacultyDashboard() {
  const { user, loading } = useAuth();
  const { addToast } = useToast();
  const [faculty, setFaculty] = useState([]);
  const [busy, setBusy] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedFacultyUid, setSelectedFacultyUid] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [roleChangeTarget, setRoleChangeTarget] = useState(null);
  const [pendingDeletions, setPendingDeletions] = useState({ flags: {}, docIds: {} });

  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const lastDocRef = useRef(null);

  // Debounce - 350ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    async function load() {
      setBusy(true);
      try {
        const db = getDb();
        if (!db) return;
        const term = debouncedSearch.trim();
        let constraints = [where("role", "==", "faculty")];
        if (term) {
          const end = term + "\uf8ff";
          constraints = [
            ...constraints,
            orderBy("name"),
            where("name", ">=", term),
            where("name", "<=", end),
          ];
        }
        constraints.push(limit(PAGE_SIZE.ADMIN_DIRECTORY));
        const q = query(collection(db, "users"), ...constraints);

        const [snap, delSnap] = await Promise.all([
          getDocs(q),
          getDocs(query(collection(db, "deletionRequests"), where("status", "==", "pending")))
        ]);

        const flags = {};
        const docIds = {};
        delSnap.forEach((d) => {
          const data = d.data();
          if (data.uid) {
            flags[data.uid] = true;
            docIds[data.uid] = d.id;
          }
        });

        setPendingDeletions({ flags, docIds });

        setFaculty(snap.docs.map(d => ({
          ...d.data(),
          id: d.id,
          pendingDeletion: flags[d.id] || false,
          delDocId: docIds[d.id] || null,
        })));
        setHasMore(snap.docs.length === PAGE_SIZE.ADMIN_DIRECTORY);
        lastDocRef.current = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
      } catch (err) {
        addToast(err?.message || "Failed to load faculty records", "error");
      } finally {
        setBusy(false);
      }
    }
    load();
  }, [debouncedSearch, addToast]);

  async function loadMore() {
    if (!lastDocRef.current || loadingMore) return;
    setLoadingMore(true);
    const db = getDb();
    if (!db) return;
    try {
      const term = debouncedSearch.trim();
      let constraints = [where("role", "==", "faculty")];
      if (term) {
        const end = term + "\uf8ff";
        constraints = [
          ...constraints,
          orderBy("name"),
          where("name", ">=", term),
          where("name", "<=", end),
        ];
      }
      constraints.push(startAfter(lastDocRef.current));
      constraints.push(limit(PAGE_SIZE.ADMIN_DIRECTORY));
      
      const q = query(collection(db, "users"), ...constraints);
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({
        ...d.data(),
        id: d.id,
        pendingDeletion: pendingDeletions.flags[d.id] || false,
        delDocId: pendingDeletions.docIds[d.id] || null,
      }));
      setFaculty(prev => {
        const ids = new Set(prev.map(r => r.id));
        return [...prev, ...data.filter(r => !ids.has(r.id))];
      });
      setHasMore(data.length === PAGE_SIZE.ADMIN_DIRECTORY);
      lastDocRef.current = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    } catch (err) {
      addToast(err?.message || "Failed to load more faculty records", "error");
    } finally {
      setLoadingMore(false);
    }
  }

  async function decide(uid, action, reqDocId = null, assignedRole = null) {
    const db = getDb();
    if (!db || !uid) return;
    try {
      if (action === "delete") { setDeleteTarget({ uid, reqDocId }); return; }
      if (action === "approve") {
        const roleToAssign = assignedRole || "faculty";
        await updateDoc(doc(db, "users", uid), {
          role: roleToAssign,
          facultyVerification: roleToAssign === "faculty" ? "approved" : "none",
        });
        await logAudit({
          action: "user_role_assigned", actorUid: user.uid, targetUid: uid,
          description: `Directory: Set role to ${roleToAssign}`
        });
        await createNotification(uid, {
          title: "Access Level Updated",
          message: `Your account role has been updated to ${roleToAssign.toUpperCase()}`, type: "info"
        }).catch(() => {
          addToast("Role updated, notification could not be delivered.", "info");
        });
        addToast(`Role set to ${roleToAssign}`, "success");
        if (roleToAssign !== "faculty") setFaculty(prev => prev.filter(f => f.id !== uid));
        else setFaculty(prev => prev.map(f => f.id === uid ? { ...f, role: roleToAssign } : f));
      } else if (action === "reject_deletion") {
        if (reqDocId) {
          await updateDoc(doc(db, "deletionRequests", reqDocId), { status: "rejected" });
          await purgeNotifications(`del_${reqDocId}`);
          setPendingDeletions((prev) => {
            const flags = { ...prev.flags };
            const docIds = { ...prev.docIds };
            delete flags[uid];
            delete docIds[uid];
            return { flags, docIds };
          });
          addToast("Deletion request dismissed.", "info");
        }
      }
      await syncAdminNotifications(user.uid);
    } catch (e) { addToast(e.message, "error"); }
  }

  function askRoleChange(uid, role) {
    setRoleChangeTarget({ uid, role });
  }

  return (
    <Layout title="Faculty Directory" access={ACCESS.ADMIN}>
      <ConfirmDialog
        open={!!roleChangeTarget}
        title="Confirm Role Change"
        message={`Are you sure you want to update this staff member's role to ${roleChangeTarget?.role?.toUpperCase()}?`}
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
        title="Delete Faculty Account"
        message="Are you sure you want to permanently remove this faculty member from the ledger? This action cannot be undone."
        onConfirm={async () => {
          const { uid, reqDocId } = deleteTarget;
          setDeleteTarget(null);
          setBusy(true);
          try {
            await purgeUser(uid, user.uid, `Admin Deleted faculty entity ${uid}`);
            if (reqDocId) {
              try {
                await updateDoc(doc(getDb(), "deletionRequests", reqDocId), { status: "processed_manual" });
                await purgeNotifications(`del_${reqDocId}`);
              } catch {
                // Ignore
              }
            }
            addToast("Faculty account deleted successfully.", "success");
            setFaculty(prev => prev.filter(f => f.id !== uid));
            await syncAdminNotifications(user.uid);
          } catch (e) { addToast(e.message, "error"); }
          finally { setBusy(false); }
        }}
        onCancel={() => setDeleteTarget(null)}
        variant="danger"
      />
      {selectedFacultyUid && <FacultyInfoPopup uid={selectedFacultyUid} onClose={() => setSelectedFacultyUid(null)} />}

      <div className="flex-1 w-full max-w-7xl mx-auto px-3 min-[360px]:px-6 py-4 min-[360px]:py-8 space-y-6 min-[360px]:space-y-8 animate-slide-up">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl min-[340px]:text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Faculty Directory</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Directory of instructional staff and department administrators.</p>
          </div>
          <Button onClick={() => {
            const mapped = faculty.map(f => buildFacultyExportRow(f));
            downloadAdminFacultyRecordsCsv(
              mapped,
              `Faculty_Registry_Full_${new Date().toISOString().split('T')[0]}.csv`
            );
            addToast("Faculty directory exported successfully.", "success");
          }}
            variant="secondary"
            className="w-full sm:w-auto text-xs font-bold py-2.5">
            <svg className="h-4 w-4 mr-1.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Faculty CSV
          </Button>
        </div>

        {/* Search Toolbar */}
        <div className="premium-card p-3 min-[360px]:p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 min-w-0">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                placeholder="Search faculty by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all"
              />
            </div>
            <div className="px-2 text-xs font-bold text-slate-500 shrink-0">
              {faculty.length} staff
            </div>
          </div>
        </div>

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
        ) : faculty.length === 0 ? (
          <EmptyState title="No Faculty Records Found" message="No active faculty records match your search." />
        ) : (
          <>
            <div className="grid gap-3 min-[360px]:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-slide-up">
            {faculty.map(f => (
              <div key={f.id} className="group premium-card p-3.5 min-[360px]:p-5 transition-all hover:shadow-md hover:border-indigo-200 border border-slate-200 flex flex-col justify-between min-w-0">
                <div>
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center font-bold text-indigo-700 border border-indigo-100 shadow-sm shrink-0">
                      {f.name?.charAt(0) || "F"}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="brand">{f.role?.toUpperCase() || "STAFF"}</Badge>
                      {f.pendingDeletion && (
                        <Badge variant="danger">Deletion Requested</Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{f.name || "Anonymous Member"}</h3>
                    <p className="text-xs text-slate-500 truncate">{f.email}</p>
                  </div>

                  <div className="py-2.5 my-3 border-y border-slate-100 flex flex-col gap-0.5 text-xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Designation</span>
                    <span className="font-semibold text-slate-800 truncate">{f.designation || "Department Staff"}</span>
                  </div>

                  {f.id !== user?.uid && (
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 space-y-1.5 my-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block text-center">Set Role</span>
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                        {f.pendingDeletion ? (
                          <>
                            <Button onClick={() => decide(f.id, "delete", f.delDocId)} variant="danger" size="sm" className="text-xs py-1">Accept Purge</Button>
                            <Button onClick={() => decide(f.id, "reject_deletion", f.delDocId)} variant="secondary" size="sm" className="text-xs py-1">Dismiss</Button>
                          </>
                        ) : (
                          <>
                            <RoleButton label="Student" role="student" currentRole={f.role} onClick={() => askRoleChange(f.id, "student")} />
                            <RoleButton label="Faculty" role="faculty" currentRole={f.role} onClick={() => askRoleChange(f.id, "faculty")} />
                            <RoleButton label="Admin" role="admin" currentRole={f.role} onClick={() => askRoleChange(f.id, "admin")} />
                            <button
                              onClick={() => decide(f.id, "delete")}
                              className="p-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                              title="Delete user"
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
                  <Button onClick={() => setSelectedFacultyUid(f.id)} variant="secondary" size="sm" className="w-full text-xs py-1.5">
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
                Load More Faculty
              </Button>
            </div>
          )}
          </>
        )}
      </div>
    </Layout>
  );
}
