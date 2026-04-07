import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { downloadAdminFacultyRecordsCsv, downloadFacultyFacultyRecordsCsv } from "@/lib/csv-download";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";

export default function FacultyInfoPopup({ uid, onClose }) {
  const { profile } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!uid) return;
    async function load() {
      setLoading(true);
      const db = getDb();
      if (!db) return;
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (!snap.exists()) {
          setErr("Faculty member not found");
          return;
        }
        setData({ id: snap.id, ...snap.data() });
      } catch (e) {
        setErr(e?.message || "Load failed");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [uid]);

  return (
    <Modal title="Faculty Details" open={!!uid} onClose={onClose} fullScreen={true}>
      {loading && (
        <p className="text-slate-500 animate-pulse text-center py-8">
          Loading profile...
        </p>
      )}
      {err && !loading && (
        <Alert variant="danger" className="justify-center">
          {err}
        </Alert>
      )}

      {!loading && data && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight truncate">{data.name || "Unnamed Faculty"}</h1>
              <p className="text-sm font-medium text-slate-400 break-all mt-1">{data.email}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                onClick={() => {
                  const download = profile?.role === "admin" ? downloadAdminFacultyRecordsCsv : downloadFacultyFacultyRecordsCsv;
                  download([data], `faculty-${data.name || uid}.csv`);
                }}
                variant="success"
                className="font-black"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download CSV
              </Button>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="flex flex-wrap gap-2 text-sm text-slate-500">
              <Badge variant="neutral" className="capitalize">{data.gender || "-"}</Badge>
              <Badge variant={data.facultyVerification === "approved" ? "success" : "warning"}>
                {data.facultyVerification || "Pending"}
              </Badge>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-600 mb-4">Faculty Profile</h2>
                <div className="grid gap-4">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 mb-1">UID</p>
                    <p className="text-sm font-medium text-slate-700">{data.id || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 mb-1">Designation</p>
                    <p className="text-sm font-medium text-slate-700">{data.designation || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 mb-1">Department</p>
                    <p className="text-sm font-medium text-slate-700">{data.department || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 mb-1">Role</p>
                    <p className="text-sm font-medium text-slate-700">{data.role || "faculty"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 mb-1">Verification Status</p>
                    <p className="text-sm font-medium text-slate-700">{data.facultyVerification || "pending"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 mb-1">Pending Deletion</p>
                    <p className="text-sm font-medium text-slate-700">{data.pendingDeletion ? "Yes" : "No"}</p>
                  </div>
                  {data.delDocId && (
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 mb-1">Deletion Request ID</p>
                      <p className="text-sm font-medium text-slate-700">{data.delDocId}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-600 mb-4">Contact & Credentials</h2>
                <div className="grid gap-4">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 mb-1">Email</p>
                    <p className="text-sm font-medium text-slate-700">{data.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 mb-1">Phone</p>
                    <p className="text-sm font-medium text-slate-700">{data.phone || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 mb-1">Date of Birth</p>
                    <p className="text-sm font-medium text-slate-700">{data.dob || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 mb-1">Joined</p>
                    <p className="text-sm font-medium text-slate-700">{data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : "Unknown"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-600 mb-4">Biography & Links</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 mb-1">Address</p>
                  <p className="text-sm font-medium text-slate-700">{data.address || "No address provided"}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 mb-1">Linked Accounts</p>
                  <div className="space-y-2 text-sm text-slate-700">
                    <p>{data.linkedin ? <a href={data.linkedin} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">LinkedIn</a> : "LinkedIn not set"}</p>
                    <p>{data.github ? <a href={data.github} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">GitHub / Portfolio</a> : "GitHub not set"}</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 rounded-2xl bg-white p-4 border border-slate-100 text-sm text-slate-700">
                {data.bio || "No biography provided."}
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

