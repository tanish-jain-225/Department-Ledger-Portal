import { useCallback, useEffect, useState, useRef } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  limit,
  startAfter,
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
  const [debouncing, setDebouncing] = useState(false);
  const [roleFilter, setRoleFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [dismissTarget, setDismissTarget] = useState(null);
  const [roleChangeTarget, setRoleChangeTarget] = useState(null);

  const [roleRequests, setRoleRequests] = useState({ map: {}, docIds: {} });
  const [deletionRequests, setDeletionRequests] = useState({ map: {}, docIds: {} });
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const lastDocRef = useRef(null);

  // Debounce search
  useEffect(() => {
    if (searchTerm.trim() !== debouncedSearch.trim()) {
      setDebouncing(true);
    }
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setDebouncing(false);
    }, 350);
    return () => clearTimeout(t);
  }, [searchTerm, debouncedSearch]);

  const load = useCallback(async () => {
    const db = getDb();
    if (!db) return;
    setLoading(true);
    try {
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

      const [snapUsers, snapReqs, delSnap] = await Promise.all([
        getDocs(usersQuery),
        getDocs(query(collection(db, "roleRequests"), where("status", "==", "pending"))),
        getDocs(collection(db, "deletionRequests"))
      ]);

      const reqMap = {};
      const reqDocIds = {};
      snapReqs.forEach((d) => {
        const data = d.data();
        if (data.uid) {
          reqMap[data.uid] = data.requestedRole;
          reqDocIds[data.uid] = d.id;
        }
      });

      const delMap = {};
      const delDocIds = {};
      delSnap.forEach((d) => {
        const data = d.data();
        if (data.status === "pending") {
          delMap[data.uid] = true;
          delDocIds[data.uid] = d.id;
        }
      });

      setRoleRequests({ map: reqMap, docIds: reqDocIds });
      setDeletionRequests({ map: delMap, docIds: delDocIds });

      setRows(snapUsers.docs.map((d) => ({
        ...d.data(),
        id: d.id,
        pendingRoleReq: reqMap[d.id] || null,
        roleReqDocId: reqDocIds[d.id] || null,
        pendingDeletion: delMap[d.id] || false,
        delDocId: delDocIds[d.id] || null
      })));
      setHasMore(snapUsers.docs.length === PAGE_SIZE.ADMIN_DIRECTORY);
      lastDocRef.current = snapUsers.docs.length > 0 ? snapUsers.docs[snapUsers.docs.length - 1] : null;
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  async function loadMore() {
    if (!lastDocRef.current || loadingMore) return;
    setLoadingMore(true);
    const db = getDb();
    if (!db) return;
    try {
      const term = debouncedSearch.trim();
      let usersQuery;
      if (term) {
        const end = term + "\uf8ff";
        usersQuery = query(
          collection(db, "users"),
          orderBy("name"),
          where("name", ">=", term),
          where("name", "<=", end),
          startAfter(lastDocRef.current),
          limit(PAGE_SIZE.ADMIN_DIRECTORY)
        );
      } else {
        usersQuery = query(
          collection(db, "users"),
          orderBy("createdAt", "desc"),
          startAfter(lastDocRef.current),
          limit(PAGE_SIZE.ADMIN_DIRECTORY)
        );
      }
      const snapUsers = await getDocs(usersQuery);
      const data = snapUsers.docs.map((d) => ({
        ...d.data(),
        id: d.id,
        pendingRoleReq: roleRequests.map[d.id] || null,
        roleReqDocId: roleRequests.docIds[d.id] || null,
        pendingDeletion: deletionRequests.map[d.id] || false,
        delDocId: deletionRequests.docIds[d.id] || null
      }));
      setRows(prev => {
        const ids = new Set(prev.map(r => r.id));
        return [...prev, ...data.filter(r => !ids.has(r.id))];
      });
      setHasMore(snapUsers.docs.length === PAGE_SIZE.ADMIN_DIRECTORY);
      lastDocRef.current = snapUsers.docs.length > 0 ? snapUsers.docs[snapUsers.docs.length - 1] : null;
    } catch (err) {
      addToast(err?.message || "Failed to load more records", "error");
    } finally {
      setLoadingMore(false);
    }
  }

  async function decide(uid, action, reqDocId, assignedRole = null) {
    const db = getDb();
    if (!db || !uid) {
      addToast("Missing user ID.", "error");
      return;
    }

    if (uid === user?.uid) {
      addToast("You cannot perform administrative actions on your own account.", "error");
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
          description: `User role updated to ${roleToAssign}`,
          details: { role: roleToAssign }
        });

        await createNotification(uid, {
          title: "Account Role Updated",
          message: `Your account role has been updated to: ${roleToAssign.toUpperCase()}`,
          type: "success",
          link: "/profile"
        }).catch(() => {
          addToast("Role updated, but notification delivery failed.", "info");
        });

        if (roleToAssign === "student") {
          const approvedUser = rows.find(r => r.id === uid);
          const studentName = approvedUser?.name || approvedUser?.email || "A new student";
          await notifyFaculty({
            title: "New Student Added",
            message: `${studentName} has been approved and added to the student registry.`,
            type: "info",
            link: "/dashboard",
            relatedId: `student_${uid}`,
          }).catch(() => {
            // non-blocking
          });
        }

        addToast(`Role assigned: ${roleToAssign}`, "success");
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
    } catch (e) {
      addToast(e.message, "error");
    }
  }

  function askRoleChange(uid, role, reqDocId = null) {
    if (uid === user?.uid) {
      addToast("You cannot modify your own role assignment.", "error");
      return;
    }
    setRoleChangeTarget({ uid, role, reqDocId });
  }

  const filtered = rows.filter((r) => {
    if (roleFilter === "pending") return r.pendingRoleReq || r.pendingDeletion;
    if (roleFilter !== "all") return r.role === roleFilter;
    return true;
  });

  return (
    <Layout title="Role Requests" access={ACCESS.ADMIN}>
      <ConfirmDialog
        open={!!roleChangeTarget}
        title="Confirm Role Change"
        message={`Are you sure you want to update this user's role to ${roleChangeTarget?.role?.toUpperCase()}?`}
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
        title="Delete Account & Records"
        message="Are you sure you want to permanently delete this user and all associated records from the ledger? This action cannot be undone."
        onConfirm={async () => {
          const { uid, reqDocId } = deleteTarget;
          setDeleteTarget(null);
          try {
            await purgeUser(uid, user.uid, `Admin permanently purged user ${uid}`);
            if (reqDocId) {
              try { await deleteDoc(doc(getDb(), "deletionRequests", reqDocId)); await purgeNotifications(`del_${reqDocId}`); } catch { /* ignore */ }
              try { await deleteDoc(doc(getDb(), "roleRequests", reqDocId)); await purgeNotifications(`role_${reqDocId}`); } catch { /* ignore */ }
            }
            addToast("User and records deleted successfully.", "success");
            setRows(prev => prev.filter(r => r.id !== uid));
            await load();
          } catch (e) {
            addToast(e?.message || "Delete failed", "error");
          }
        }}
        onCancel={() => setDeleteTarget(null)}
        variant="danger"
      />
      <ConfirmDialog
        open={!!dismissTarget}
        title="Dismiss Deletion Request"
        message="Dismiss this deletion request? The user account will remain active."
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
      
      <div className="flex-1 w-full max-w-7xl mx-auto px-3 min-[360px]:px-6 py-4 min-[360px]:py-8 space-y-6 min-[360px]:space-y-8 animate-slide-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl min-[340px]:text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Requests & Access</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage role clearance, elevations, and pending deletion requests.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Total Accounts: <strong className="text-slate-900">{rows.length}</strong>
            </span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="premium-card p-3 min-[360px]:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1 min-w-0">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all"
              />
              {(debouncing || loading) && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  <div className="h-3.5 w-3.5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs font-semibold text-slate-800 focus:border-brand-500 focus:outline-none cursor-pointer"
              >
                <option value="all">All Accounts</option>
                <option value="pending">Pending Requests</option>
                <option value="student">Students</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Administrators</option>
              </select>

              <div className="px-2 text-xs font-bold text-slate-500 shrink-0">
                {filtered.length} shown
              </div>
            </div>
          </div>
        </div>

        {/* List of Requests */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <TableRowSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
            <div className="h-12 w-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 mb-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900">No requests found</h3>
            <p className="text-xs text-slate-500 mt-1 text-center max-w-sm">No active clearance or role requests match your filters.</p>
            <Button
              onClick={() => { setSearchTerm(""); setRoleFilter("all"); }}
              className="mt-4 px-4 py-2 text-xs"
              variant="secondary"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3 min-w-0">
              {filtered.map((r) => {
                const isUnassigned = !r.role;
                return (
                  <div
                    key={r.id}
                    className={`premium-card p-3 min-[360px]:p-4 border transition-all min-w-0 ${
                      isUnassigned
                        ? 'border-amber-300 bg-amber-50/30'
                        : r.pendingRoleReq || r.pendingDeletion
                        ? 'border-brand-200 bg-brand-50/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 min-w-0">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${
                          isUnassigned ? 'bg-amber-600 text-white' : r.role === 'admin' ? 'bg-slate-900 text-white' : r.role === 'faculty' ? 'bg-indigo-600 text-white' : 'bg-brand-700 text-white'
                        }`}>
                          {r.name?.charAt(0) || "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-sm font-bold text-slate-900 truncate">{r.name || "Unnamed User"}</h2>
                            <Badge variant={isUnassigned ? 'danger' : (r.role === 'admin' ? 'brand' : 'neutral')}>
                              {r.role ? r.role.toUpperCase() : "UNASSIGNED"}
                            </Badge>
                            {r.pendingRoleReq && (
                              <Badge variant="warning">Requested: {r.pendingRoleReq.toUpperCase()}</Badge>
                            )}
                            {r.pendingDeletion && (
                              <Badge variant="danger">Deletion Requested</Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{r.email}</p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 min-w-0">
                        {r.id !== user?.uid ? (
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {r.pendingDeletion ? (
                              <>
                                <Button
                                  onClick={() => decide(r.id, "delete", r.delDocId)}
                                  variant="danger"
                                  size="sm"
                                  className="text-xs py-1 px-3"
                                >
                                  Accept Deletion
                                </Button>
                                <Button
                                  onClick={() => setDismissTarget({ uid: r.id, reqDocId: r.delDocId })}
                                  variant="secondary"
                                  size="sm"
                                  className="text-xs py-1 px-3"
                                >
                                  Dismiss
                                </Button>
                              </>
                            ) : (
                              <>
                                <RoleButton label="Student" role="student" currentRole={r.role} onClick={() => askRoleChange(r.id, "student", r.roleReqDocId)} />
                                <RoleButton label="Faculty" role="faculty" currentRole={r.role} onClick={() => askRoleChange(r.id, "faculty", r.roleReqDocId)} />
                                <RoleButton label="Admin" role="admin" currentRole={r.role} onClick={() => askRoleChange(r.id, "admin", r.roleReqDocId)} />
                                <button
                                  onClick={() => decide(r.id, "delete", r.delDocId)}
                                  className="p-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors ml-1"
                                  title="Delete user"
                                >
                                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-400 italic">Current User Account</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
                  Load More Requests
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
