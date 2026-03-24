import { useEffect, useState, useRef } from "react";
import { doc, getDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Alert from "@/components/ui/Alert";
import FacultyCard from "./FacultyCard";

export default function FacultyInfoPopup({ uid, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const cardRef = useRef(null);

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

  const handleDownload = () => {
    const element = cardRef.current;
    if (!element) return;
    
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    script.onload = () => {
      const opt = {
        margin: [10, 10],
        filename: `Faculty_Profile_${data.name || "ID"}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          scrollY: 0,
          windowHeight: element.scrollHeight + 500
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      // Ensure the hidden capture element is not clipped
      const parent = element.parentElement;
      const originalPosition = parent.style.position;
      const originalVisibility = parent.style.visibility;
      
      parent.style.position = 'static';
      parent.style.visibility = 'visible';

      window.html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(() => {
          parent.style.position = originalPosition;
          parent.style.visibility = originalVisibility;
        });
    };
    document.body.appendChild(script);
  };

  return (
    <Modal title="Faculty Details" open={!!uid} onClose={onClose} maxWidth="max-w-2xl">
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
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900 mr-2">{data.name || "Unnamed Faculty"}</h1>
              <p className="text-slate-600 break-all mt-1">{data.email}</p>
            </div>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-all active:scale-95 shadow-md shadow-emerald-500/20"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              View / Download (PDF)
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

          {/* Hidden FacultyCard for PDF export */}
          <div style={{ position: 'absolute', left: '-9999px', top: '0', width: '800px' }}>
             <div ref={cardRef}>
                <FacultyCard data={data} />
             </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

