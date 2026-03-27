import { useEffect, useState, useRef } from "react";
import { doc, getDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Alert from "@/components/ui/Alert";
import IdentityCardPopup from "./IdentityCardPopup";

export default function FacultyInfoPopup({ uid, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showCardModal, setShowCardModal] = useState(false);

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
      <IdentityCardPopup 
        show={showCardModal} 
        onClose={() => setShowCardModal(false)} 
        role="faculty"
        data={data}
      />
      
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
            <button
              onClick={() => setShowCardModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-black text-white hover:bg-emerald-700 transition-all active:scale-95 shadow-xl shadow-emerald-500/20 w-full sm:w-auto"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
              </svg>
              View Identity Card
            </button>
          </div>

          <div className="grid gap-6">
            <div className="flex flex-wrap gap-2 text-sm text-slate-500">
              <Badge variant="neutral" className="capitalize">{data.gender || "—"}</Badge>
              <Badge variant={data.facultyVerification === "approved" ? "success" : "warning"}>
                {data.facultyVerification || "Pending"}
              </Badge>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
               <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone Number</span>
                  <p className="text-sm text-slate-700 font-medium">{data.phone || "—"}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Account Created</span>
                  <p className="text-sm text-slate-700 font-medium">{data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : "Unknown"}</p>
                </div>
            </div>

            {data.bio && (
              <div className="p-4 rounded-xl bg-violet-50/50 border border-violet-100/50 italic leading-relaxed text-sm text-slate-700">
                &quot;{data.bio}&quot;
              </div>
            )}

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Residential Address</span>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">{data.address || "No address provided —"}</p>
            </div>

            <div className="flex gap-3 text-sm">
              {data.linkedin && (
                <a href={data.linkedin} target="_blank" rel="noreferrer" className="text-brand-600 hover:text-brand-800 font-medium">
                  LinkedIn ↗
                </a>
              )}
              {data.github && (
                <a href={data.github} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-slate-800 font-medium">
                  GitHub / Portfolio ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

