import { useCallback, useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  limit,
} from "firebase/firestore";
import Layout, { ACCESS } from "@/components/Layout";
import { Button, Badge, EmptyState, TableRowSkeleton, ConfirmDialog, RoleButton } from "@/components/ui";
import { getDb } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { logAudit } from "@/lib/audit";
import { createNotification, syncAdminNotifications, purgeNotifications, notifyFaculty } from "@/lib/notifications";
import { purgeUser } from "@/lib/data";
import { useToast } from "@/lib/toast-context";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { PAGE_SIZE } from "@/lib/constants";

export default function AdminRequestsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState(null); // { uid, reqDocId }
  const [dismissTarget, setDismissTarget] = useState(null); // { uid, reqDocId }
  const [roleChangeTarget, setRoleChangeTarget] = useState(null);

  // Debounce search - avoids re-filtering on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const load = useCallback(async () => {
    const db = getDb();
    if (!db) return;
    setLoading(true);
    try {
      // Server-side: if searching by name use prefix range query, otherwise load recent users
      const term = debouncedSearch.trim();
      let usersQuery;
      if (term) {
        const end = term + "\uf8ff";
        usersQuery = query(
          collection(db, "users"),
          orderBy("name"),
          where("name", ">=", term),
          where("name", "<=", end),
          limit(PAGE_SIZE.ADMIN_DIRECTORY)
        );
      } else {
        usersQuery = query(
          collection(db, "users"),
          orderBy("createdAt", "desc"),
          limit(PAGE_SIZE.ADMIN_DIRECTORY)
        );
      }
      const snapUsers = await getDocs(usersQuery);

      const qReqs = query(collection(db, "roleRequests"), where("status", "==", "pending"));
      const snapReqs = await getDocs(qReqs);

      const reqMap = {};
      const reqDocIds = {};
      snapReqs.forEach((d) => {
        const data = d.data();
        if (data.uid) {
          reqMap[data.uid] = data.requestedRole;
          reqDocIds[data.uid] = d.id;
        }
      });

      const delSnap = await getDocs(collection(db, "deletionRequests"));
      const delMap = {};
      const delDocIds = {};
      delSnap.forEach((d) => {
        const data = d.data();
        if (data.status === "pending") {
          delMap[data.uid] = true;
          delDocIds[data.uid] = d.id;
        }
      });

      setRows(snapUsers.docs.map((d) => ({
        ...d.data(),
        id: d.id,
        pendingRoleReq: reqMap[d.id] || null,
        roleReqDocId: reqDocIds[d.id] || null,
        pendingDeletion: delMap[d.id] || false,
        delDocId: delDocIds[d.id] || null
      })));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(uid, action, reqDocId, assignedRole = null) {
    const db = getDb();
    if (!db || !uid) {
      addToast("Protocol Error: Missing User Identifier.", "error");
      return;
    }

    try {
      const roleToAssign = assignedRole || "student";
      if (action === "delete") {
        setDeleteTarget({ uid, reqDocId });
        return;
      }

      if (action === "approve") {

        await updateDoc(doc(db, "users", uid), {
          role: roleToAssign,
          facultyVerification: roleToAssign === 'faculty' ? "approved" : "none"
        });
        if (reqDocId) {
          await deleteDoc(doc(db, "roleRequests", reqDocId));
          await purgeNotifications(`role_${reqDocId}`);
        }

        await logAudit({
          action: "user_role_assigned",
          actorUid: user.uid,
          targetUid: uid,
          description: `Policy Override: User elevated to ${roleToAssign}`,
          details: { role: roleToAssign }
        });

        await createNotification(uid, {
          title: "Access Updated",
          message: `Administrative protocol has updated your access level to: ${roleToAssign.toUpperCase()}`,
          type: "success",
          link: "/profile"
        });

        // Notify all faculty when a new student is approved
        if (roleToAssign === "student") {
          const approvedUser = rows.find(r => r.id === uid);
          const studentName = approvedUser?.name || approvedUser?.email || "A new student";
          await notifyFaculty({
            title: "New Student Added",
            message: `${studentName} has been approved and added to the student registry.`,
            type: "info",
            link: "/dashboard",
            relatedId: `student_${uid}`,
          }).catch(() => { }); // non-blocking - don't fail the approval if this errors
        }

        addToast(`Clearance set to: ${roleToAssign}`, "success");
      } else if (action === "reject") {
        if (reqDocId) {
          await deleteDoc(doc(db, "roleRequests", reqDocId));
          await purgeNotifications(`role_${reqDocId}`);
        }
        addToast("Registration request dismissed.", "info");
      } else if (action === "reject_deletion") {
        await updateDoc(doc(db, "deletionRequests", reqDocId), { status: "rejected" });
        await purgeNotifications(`del_${reqDocId}`);
        addToast("Deletion request rejected.", "info");
      }

      // Optimistic Local State Update
      setRows(prev => {
        if (action === "delete") return prev.filter(r => r.id !== uid);
        return prev.map(r => {
          if (r.id === uid) {
            if (action === "approve") return { ...r, role: roleToAssign, pendingRoleReq: null, roleReqDocId: null };
            if (action === "reject") return { ...r, pendingRoleReq: null, roleReqDocId: null };
            if (action === "reject_deletion") return { ...r, pendingDeletion: false, delDocId: null };
          }
          return r;
        });
      });

      await syncAdminNotifications(user.uid);
      // load(); // Retired: Switching to Optimistic Flow
    } catch (e) {
      addToast(e.message, "error");
    }
  }

  function askRoleChange(uid, role, reqDocId = null) {
    setRoleChangeTarget({ uid, role, reqDocId });
  }

  const filtered = rows.filter((r) => {
    if (roleFilter === "pending") return r.pendingRoleReq || r.pendingDeletion;
    if (roleFilter !== "all") return r.role === roleFilter;
    return true;
  });

  return (
    <Layout title="Governance Requests" access={ACCESS.ADMIN}>
      <ConfirmDialog
        open={!!roleChangeTarget}
        title="Confirm Role Change"
        message={`Confirm update role to ${roleChangeTarget?.role?.toUpperCase()}? This will immediately change their access privileges.`}
        onConfirm={async () => {
          const target = roleChangeTarget;
          setRoleChangeTarget(null);
          if (target?.uid && target?.role) {
            await decide(target.uid, "approve", target.reqDocId, target.role);
            await load();
          }
        }}
        onCancel={() => setRoleChangeTarget(null)}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Protocol: Permanent Purge"
        message="CRITICAL: You are about to permanently erase this entity from the global ledger. This includes all academic records, activities and professional achievements. This action is irreversible."
        onConfirm={async () => {
          const { uid, reqDocId } = deleteTarget;
          setDeleteTarget(null);
          try {
            await purgeUser(uid, user.uid, `Permanently purged user entity and all professional records for ID: ${uid}`);
            // Clean up any associated role/deletion request docs
            if (reqDocId) {
              try { await deleteDoc(doc(getDb(), "deletionRequests", reqDocId)); await purgeNotifications(`del_${reqDocId}`); } catch { /* already gone */ }
              try { await deleteDoc(doc(getDb(), "roleRequests", reqDocId)); await purgeNotifications(`role_${reqDocId}`); } catch { /* already gone */ }
            }
            addToast("User entity and records purged successfully.", "success");
            setRows(prev => prev.filter(r => r.id !== uid));
            await load();
          } catch (e) {
            addToast(e?.message || "Purge failed", "error");
          }
        }}
        onCancel={() => setDeleteTarget(null)}
        variant="danger"
      />
      <ConfirmDialog
        open={!!dismissTarget}
        title="Confirm Dismiss Request"
        message="Dismiss this purge request? This will keep the user active and reject the deletion workflow."
        confirmLabel="Dismiss"
        onConfirm={async () => {
          const target = dismissTarget;
          setDismissTarget(null);
          if (target?.uid && target?.reqDocId) {
            await decide(target.uid, "reject_deletion", target.reqDocId);
            await load();
          }
        }}
        onCancel={() => setDismissTarget(null)}
      />
      <div className="space-y-10 animate-slide-up">
        {/* Header */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Governance Requests</h1>
            <p className="text-base text-slate-400 mt-2 font-medium">Coordinate clearance, policy overrides and data lifecycle protocols.</p>
          </div>
          <div className="flex items-center gap-3 bg-white border border-slate-200 shadow-sm p-1 px-4 rounded-2xl">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Global Activity</span>
            <Badge variant="brand" className="animate-pulse">
              {rows.length} RECORDED
            </Badge>
          </div>
        </div>

        {/* Search & Filter Island */}
        <div className="premium-card p-2 rounded-[3rem] bg-white border-slate-200 shadow-sm relative overflow-hidden">

          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
            {/* Search Core */}
            <div className="relative flex-1 group">
              <svg className="absolute left-7 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-brand-500 transition-all duration-300 transform group-focus-within:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Identify entities in the global registry..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-[2.5rem] border-none bg-transparent pl-16 pr-8 py-5 text-sm font-black text-slate-900 focus:ring-0 outline-none placeholder:text-slate-300 transition-all"
              />
            </div>

            <div className="hidden lg:block w-px h-10 bg-slate-100" />

            {/* Filter Module */}
            <div className="relative min-w-[240px] group px-2">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none transition-all group-hover:translate-x-1">
                <div className="h-2 w-2 rounded-full bg-brand-500" />
                <span className="text-[9px] font-black uppercase text-brand-600 tracking-tighter">Sector</span>
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full rounded-2xl border-none bg-slate-50/50 hover:bg-white pl-20 pr-12 py-4 text-[10px] font-black uppercase tracking-widest text-slate-900 focus:ring-0 outline-none cursor-pointer transition-all appearance-none"
              >
                <option value="all">Global Catalog</option>
                <option value="pending">Pending Protocols</option>
                <option value="student">Student Registry</option>
                <option value="faculty">Faculty Ledger</option>
                <option value="admin">Administrator Pool</option>
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 group-hover:text-brand-500 transition-all duration-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="px-8 pb-4 lg:pb-0 lg:pr-8 flex items-center justify-between lg:justify-end gap-3 min-w-[140px]">
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em]">Stream</span>
                <span className="text-[10px] font-black text-brand-600 transition-all">
                  {filtered.length} / {rows.length}
                </span>
              </div>
              <div className="h-8 w-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <TableRowSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="Registry Clear" message="No active governance requests found in this sector." />
        ) : (
          <div className="space-y-6">
            {filtered.map((r) => {
              const isUnassigned = !r.role;
              return (
                <div key={r.id} className={`group premium-card p-8 border transition-all ${isUnassigned ? 'border-rose-200 bg-rose-50/40 hover:bg-rose-50/60 shadow-[0_10px_30px_-18px_rgba(244,63,94,0.35)]' : r.pendingRoleReq || r.pendingDeletion ? 'border-brand-200 bg-brand-50/5' : 'border-slate-100 hover:bg-slate-50/20'}`}>

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="flex items-start gap-6">
                      <div className={`h-14 w-14 rounded-3xl flex items-center justify-center font-black text-xl shadow-2xl group-hover:scale-110 transition-transform ${isUnassigned ? 'bg-rose-600 text-white' : r.role === 'admin' ? 'bg-slate-900 text-white' : r.role === 'faculty' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-900'}`}>
                        {r.name?.charAt(0) || "?"}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h2 className="text-xl font-black text-slate-900 tracking-tight">{r.name || "Anonymous Entity"}</h2>
                          <Badge variant={isUnassigned ? 'danger' : (r.role === 'admin' ? 'brand' : 'neutral')}>
                            {r.role ? r.role.toUpperCase() : "UNASSIGNED"}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-slate-400">{r.email}</p>
                        <div className="flex gap-4 pt-3">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">Identity UID</span>
                            <span className="text-[10px] font-bold text-slate-500 font-mono italic">{r.id.slice(-12)}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">Auth Method</span>
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Verified</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Terminal */}
                    <div className="flex flex-wrap items-center gap-4 lg:justify-end">
                      {/* Unified Protocol Selector */}
                      {r.id !== user?.uid ? (
                        <div className="flex flex-col gap-4 p-5 rounded-[2rem] bg-slate-50 border border-slate-100 group-hover:bg-white group-hover:shadow-2xl group-hover:border-white transition-all duration-500">
                          <div className="flex items-center justify-between px-2">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${r.pendingDeletion ? 'text-rose-600' : r.pendingRoleReq ? 'text-brand-600' : 'text-slate-400'}`}>
                              {r.pendingDeletion ? `${r.role === 'faculty' ? 'Faculty' : 'Student'} Purge Request` : r.pendingRoleReq ? `${r.role === 'faculty' ? 'Faculty' : 'Student'} Role Request` : 'Protocol: Manual Oversight'}
                            </span>
                            {r.pendingRoleReq && (
                              <button
                                onClick={() => decide(r.id, 'reject', r.roleReqDocId)}
                                className="text-[9px] font-black text-rose-500 hover:text-rose-700 uppercase tracking-widest transition-colors"
                              >
                                Ignore
                              </button>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 items-center">
                            {r.pendingDeletion ? (
                              <>
                                <Button
                                  onClick={() => decide(r.id, "delete", r.delDocId)}
                                  variant="secondary"
                                  className="!py-2 !px-5 text-[9px] font-black uppercase border border-rose-100 hover:bg-rose-500 hover:text-white transition-all"
                                >
                                  Accept Purge
                                </Button>
                                <Button
                                  onClick={() => setDismissTarget({ uid: r.id, reqDocId: r.delDocId })}
                                  variant="ghost"
                                  className="!py-2 !px-5 text-[9px] font-black uppercase text-rose-500 border border-rose-100 hover:bg-rose-50 transition-all"
                                >
                                  Dismiss Request
                                </Button>
                              </>
                            ) : (
                              <>
                                {r.pendingRoleReq && (
                                  <Button
                                    onClick={() => askRoleChange(r.id, r.pendingRoleReq, r.roleReqDocId)}
                                    variant="brand"
                                    className="!py-2 !px-5 text-[9px] font-black uppercase tracking-widest"
                                  >
                                    Accept Request
                                  </Button>
                                )}
                                <RoleButton label="Student" role="student" currentRole={r.role} onClick={() => askRoleChange(r.id, "student")} />
                                <RoleButton label="Faculty" role="faculty" currentRole={r.role} onClick={() => askRoleChange(r.id, "faculty")} />
                                <RoleButton label="Admin" role="admin" currentRole={r.role} onClick={() => askRoleChange(r.id, "admin")} />

                                <div className="w-px h-8 bg-slate-200/60 mx-1 hidden sm:block" />

                                <Button
                                  onClick={() => decide(r.id, "delete", r.delDocId)}
                                  variant="secondary"
                                  className={`!py-2 !px-5 text-[9px] font-black uppercase border border-rose-100 hover:bg-rose-500 hover:text-white transition-all
                                      ${r.pendingDeletion ? '!bg-rose-600 !text-white !border-rose-600 animate-pulse' : '!text-rose-500'}`}
                                >
                                  {r.pendingDeletion ? 'Accept Purge' : 'Manual Purge'}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-5 rounded-[2rem] bg-amber-50 border border-amber-100">
                          <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest flex items-center gap-2">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Self-Account Protected
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
