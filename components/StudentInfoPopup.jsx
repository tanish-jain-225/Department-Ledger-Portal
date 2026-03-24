import { useEffect, useState, useRef } from "react";
import { doc, getDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { listByStudent } from "@/lib/data";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Alert from "@/components/ui/Alert";
import StudentCard from "./StudentCard";

export default function StudentInfoPopup({ uid, onClose }) {
  const [data, setData] = useState(null);
  const [lists, setLists] = useState({
    academic: [],
    activities: [],
    achievements: [],
    placements: [],
    certificates: [],
  });
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
          setErr("Student not found");
          return;
        }
        setData({ id: snap.id, ...snap.data() });
        const [academic, activities, achievements, placements, certificates] =
          await Promise.all([
            listByStudent("academicRecords", uid),
            listByStudent("activities", uid),
            listByStudent("achievements", uid),
            listByStudent("placements", uid),
            listByStudent("certificates", uid),
          ]);
        setLists({
          academic,
          activities,
          achievements,
          placements,
          certificates,
        });
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
        filename: `Student_Card_${data.rollNumber || "ID"}.pdf`,
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
    <Modal title="Student Profile" open={!!uid} onClose={onClose} maxWidth="max-w-2xl">
      {loading && (
        <p className="text-slate-500 animate-pulse text-center py-8">
          Loading detailed records...
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
              <h1 className="text-2xl font-bold text-slate-900 mr-2">{data.name || "Unnamed"}</h1>
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

          <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-500">
            <Badge variant="neutral" className="capitalize">{data.gender || "—"}</Badge>
            <Badge variant="brand">{data.branch || "—"}</Badge>
            <Badge variant="brand">Year {data.year || "—"}</Badge>
          </div>
          
          <div className="mt-3 flex flex-wrap gap-4 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 uppercase text-[9px] font-black tracking-widest">DOB:</span>
              <span>{data.dob || "—"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 uppercase text-[9px] font-black tracking-widest">Phone:</span>
              <span>{data.phone || "—"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant={data.alumni ? "success" : "neutral"}>
                {data.alumni ? "Alumni" : "Regular"}
              </Badge>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Residential Address</span>
            <p className="text-sm text-slate-700 leading-relaxed font-medium">{data.address || "No address provided —"}</p>
          </div>

          <div className="mt-4 flex gap-3 text-sm">
            {data.linkedin && (
              <a href={data.linkedin} target="_blank" rel="noreferrer" className="text-brand-600 hover:text-brand-800 font-medium">
                LinkedIn ↗
              </a>
            )}
            {data.github && (
              <a href={data.github} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-slate-800 font-medium">
                GitHub ↗
              </a>
            )}
          </div>

          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-3 border-b border-brand-100 pb-2">Academic</h3>
            {lists.academic.length === 0 && <p className="text-sm text-slate-500">No entries.</p>}
            <div className="space-y-3 mt-3">
              {lists.academic.map((r) => (
                <div key={r.id} className="text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-slate-800">Year {r.year} · Sem {r.semester}</p>
                    <span className="text-[10px] font-black text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">GPA {r.gpa}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">
                    <span>Roll: {r.rollNumber || "—"}</span>
                    <span className="opacity-30">|</span>
                    <span>Branch: {r.branch || "—"}</span>
                  </div>
                  <p className="text-slate-600 mt-1">{r.subjects}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-3 border-b border-brand-100 pb-2">Activities</h3>
            {lists.activities.length === 0 && <p className="text-sm text-slate-500">No entries.</p>}
            <ul className="space-y-2">
              {lists.activities.map((r) => (
                <li key={r.id} className="text-sm text-slate-700 list-disc ml-5">
                  <strong>{r.title}</strong> <span className="text-slate-500">({r.type})</span> — {r.date}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-3 border-b border-brand-100 pb-2">Achievements</h3>
            {lists.achievements.length === 0 && <p className="text-sm text-slate-500">No entries.</p>}
            <ul className="space-y-2">
              {lists.achievements.map((r) => (
                <li key={r.id} className="text-sm text-slate-700 list-disc ml-5">
                  {r.title} <span className="text-slate-500">({r.level})</span> — {r.date}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-3 border-b border-brand-100 pb-2">Placements</h3>
            {lists.placements.length === 0 && <p className="text-sm text-slate-500">No entries.</p>}
            <ul className="space-y-2">
              {lists.placements.map((r) => (
                <li key={r.id} className="text-sm text-slate-700 list-disc ml-5">
                  <strong>{r.company}</strong> — {r.role} <span className="text-slate-500">({r.status})</span> {r.package ? `· ${r.package}` : ""}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-3 border-b border-brand-100 pb-2">Certificates</h3>
            {lists.certificates.length === 0 && <p className="text-sm text-slate-500">No entries.</p>}
            <ul className="space-y-2">
              {lists.certificates.map((c) => (
                <li key={c.id} className="text-sm">
                  <a
                    href={c.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-brand-600 hover:text-brand-800 hover:underline"
                  >
                    {c.title || "Open certificate"}
                  </a>{" "}
                  <span className="text-slate-500">— {c.date}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Hidden StudentCard for PDF export */}
          {!loading && data && (
            <div style={{ position: 'absolute', left: '-9999px', top: '0', width: '800px' }}>
              <div ref={cardRef}>
                <StudentCard 
                  data={data} 
                  academic={lists.academic} 
                  activities={lists.activities}
                  achievements={lists.achievements}
                  placements={lists.placements} 
                  certificates={lists.certificates}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
