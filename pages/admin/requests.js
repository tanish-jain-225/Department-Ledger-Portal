import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  deleteDoc,
  orderBy,
  where,
  serverTimestamp,
} from "firebase/firestore";
import Layout, { ACCESS } from "@/components/Layout";
import { getDb } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { logAudit } from "@/lib/audit";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";

export default function AdminRequestsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  async function load() {
    const db = getDb();
    if (!db) return;
    
    // Fetch all users list natively
    const qUsers = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const snapUsers = await getDocs(qUsers);
    
    // Cross-Fetch active roleRequests that trigger the Alerts Bell
    const qReqs = query(collection(db, "roleRequests"), where("status", "==", "pending"));
    const snapReqs = await getDocs(qReqs);
    
    // Map requests explicitly to their corresponding user IDs
    const reqMap = {};
    const reqDocIds = {};
    snapReqs.forEach((d) => {
      const data = d.data();
      if (data.uid) {
        reqMap[data.uid] = data.requestedRole;
        reqDocIds[data.uid] = d.id;
      }
    });

    setRows(snapUsers.docs.map((d) => ({ 
      id: d.id, 
      ...d.data(),
      pendingRoleReq: reqMap[d.id] || null,
      roleReqDocId: reqDocIds[d.id] || null
    })));
  }

  useEffect(() => {
    load();
  }, []);

  async function decide(uid, action, reqDocId) {
    const db = getDb();
    if (!db) return;
    
    if (action === "delete") {
      const isConfirmed = window.confirm(
        "CRITICAL ACTION: This will permanently delete this user and all their associated records (Academics, Activities, Achievements, Placements, and Certificates).\n\nThis cannot be undone. Are you absolutely sure?"
      );
      if (!isConfirmed) return;

      const subCollections = [
        "academicRecords",
        "activities",
        "achievements",
        "placements",
        "certificates",
      ];

      // 1. Cascading deletion of all student records
      for (const colName of subCollections) {
        try {
          const q = query(collection(db, colName), where("studentUid", "==", uid));
          const snap = await getDocs(q);
          const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
          await Promise.all(deletePromises);
        } catch (e) {
          console.error(`Failed to clean up collection: ${colName}`, e);
        }
      }

      // 2. Delete the user profile
      await deleteDoc(doc(db, "users", uid));
    } else {
      await updateDoc(doc(db, "users", uid), {
        role: action,
        facultyVerification: action === "faculty" ? "approved" : "pending",
        updatedAt: serverTimestamp(),
      });
    }
    
    // Automatically scrub the role request alert document since we addressed it
    if (reqDocId) {
       try {
         await deleteDoc(doc(db, "roleRequests", reqDocId));
       } catch (e) {
         console.warn("Role request already handled or deleted", e);
       }
    }
    
    const targetUser = rows.find((r) => r.id === uid);
    const targetEmail = targetUser?.email || uid;
    
    await logAudit({
      action: action === "delete" ? "user_deleted" : "user_role_assigned",
      actorUid: user.uid,
      targetUid: uid,
      description: action === "delete" 
        ? `${user.email} deleted user ${targetEmail}`
        : `${user.email} assigned role ${action} to ${targetEmail}`,
      details: { role: action },
    });
    
    await load();
  }

  return (
    <Layout title="Requests & Management" access={ACCESS.ADMIN}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Setup & Requests</h1>
          <p className="text-slate-600 text-sm">Assign roles natively, approve explicit requests, or remove users entirely.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input
              type="text"
              placeholder="Search name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Role Filter */}
          <div className="relative w-full sm:w-40">
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admins</option>
              <option value="none">No Role</option>
            </Select>
          </div>
        </div>
      </div>

      <ul className="mt-8 space-y-4">
        {rows.length === 0 && (
          <li>
            <EmptyState>No users generated natively.</EmptyState>
          </li>
        )}
        {rows
          .filter(r => {
            const matchesSearch = 
              r.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
              r.name?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesRole = 
              roleFilter === "all" || 
              (roleFilter === "none" ? !r.role : r.role === roleFilter);
              
            return matchesSearch && matchesRole;
          })
          .map((r) => {
          const isStudent = r.role === "student";
          const isFaculty = r.role === "faculty";
          const isAdmin = r.role === "admin";
          const hasPending = !!r.pendingRoleReq;
          
          return (
            <li
              key={r.id}
              className={`flex flex-col xl:flex-row xl:items-center justify-between gap-4 rounded-xl border p-5 shadow-sm transition-all ${hasPending ? "border-amber-300 bg-amber-50 shadow-amber-100" : "border-slate-200 bg-white"}`}
            >
              <div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-slate-900 text-lg">{r.email}</p>
                  {hasPending && (
                    <Badge variant="warning" className="animate-pulse">
                      Request {r.pendingRoleReq.toUpperCase()}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  Name: <strong className="text-slate-800">{r.name || "Unknown"}</strong> <span className="mx-2">•</span> 
                  Active Role: <strong className={`capitalize ${isStudent ? 'text-brand-600' : isFaculty ? 'text-violet-600' : isAdmin ? 'text-slate-800' : 'text-slate-500'}`}>{r.role || "None"}</strong>
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2 xl:justify-end">
                {r.id !== user?.uid ? (
                  <>
                    <Button
                      type="button"
                      onClick={() => decide(r.id, "student", r.roleReqDocId)}
                      variant={isStudent ? "primary" : "soft"}
                    >
                      Student
                    </Button>
                    <Button
                      type="button"
                      onClick={() => decide(r.id, "faculty", r.roleReqDocId)}
                      className={isFaculty ? "bg-violet-800 hover:bg-violet-900 shadow-lg shadow-violet-800/15" : "bg-violet-100 text-violet-800 border border-violet-300 hover:bg-violet-200"}
                    >
                      Faculty
                    </Button>
                    <Button
                      type="button"
                      onClick={() => decide(r.id, "admin", r.roleReqDocId)}
                      className={isAdmin ? "bg-slate-800 hover:bg-slate-900" : ""}
                      variant={isAdmin ? "primary" : "secondary"}
                    >
                      Admin
                    </Button>
                    <Button
                      type="button"
                      onClick={() => decide(r.id, "delete", r.roleReqDocId)}
                      variant="secondary"
                      className="border-red-200 text-red-700 hover:bg-red-50 ml-auto xl:ml-2"
                    >
                      None (Delete)
                    </Button>
                  </>
                ) : (
                  <span className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500 italic">
                    Current Account
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Layout>
  );
}
