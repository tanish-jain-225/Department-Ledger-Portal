import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";

export default function FacultyInfoPopup({ uid, onClose }) {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 sm:p-6 backdrop-blur-sm">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-violet-50/90 backdrop-blur-md px-4 py-4 sm:px-6">
          <h2 className="text-xl font-bold text-violet-900">Faculty Details</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-violet-400 hover:bg-violet-100 hover:text-violet-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && <p className="text-slate-500 animate-pulse text-center py-8">Loading profile...</p>}
          {err && <p className="text-red-500 text-center py-8">{err}</p>}
          
          {!loading && data && (
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mr-2">{data.name || "Unnamed Faculty"}</h1>
                <p className="text-slate-600 break-all mt-1">{data.email}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-500">
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 capitalize">{data.gender || "—"}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-xs font-medium text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 uppercase text-[9px] font-black tracking-widest">Phone:</span>
                    <span>{data.phone || "—"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${data.facultyVerification === 'approved' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {data.facultyVerification || "Pending"}
                    </span>
                  </div>
                </div>

                {data.bio && (
                  <div className="mt-6 p-4 rounded-xl bg-violet-50/50 border border-violet-100/50 italic leading-relaxed text-sm text-slate-700">
                    &quot;{data.bio}&quot;
                  </div>
                )}

                <div className="mt-6 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Residential Address</span>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">{data.address || "No address provided —"}</p>
                </div>

                <div className="mt-6 flex gap-3 text-sm">
                  {data.linkedin && (
                    <a
                      href={data.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 hover:text-brand-800 font-medium"
                    >
                      LinkedIn ↗
                    </a>
                  )}
                  {data.github && (
                    <a
                      href={data.github}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-600 hover:text-slate-800 font-medium"
                    >
                      GitHub ↗
                    </a>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-8 border-t border-slate-100 text-center">
                 <p className="text-xs text-slate-400">Account Created: {data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : "Unknown"}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
