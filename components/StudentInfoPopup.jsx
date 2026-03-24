import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { listByStudent } from "@/lib/data";

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

  const latestAcademic = [...lists.academic].sort((a, b) => {
    if (b.year !== a.year) return parseInt(b.year) - parseInt(a.year);
    return parseInt(b.semester) - parseInt(a.semester);
  })[0] || {};

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 sm:p-6 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 backdrop-blur-md px-4 py-4 sm:px-6">
          <h2 className="text-xl font-bold text-slate-900">Student Profile</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && <p className="text-slate-500 animate-pulse text-center py-8">Loading detailed records...</p>}
          {err && <p className="text-red-500 text-center py-8">{err}</p>}
          
          {!loading && data && (
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mr-2">{data.name || "Unnamed"}</h1>
                <p className="text-slate-600 break-all mt-1">{data.email}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-500">
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 capitalize">{data.gender || "—"}</span>
                  <span className="rounded-md bg-brand-50 text-brand-700 px-2.5 py-1 font-bold">{data.branch || "—"}</span>
                  <span className="rounded-md bg-brand-50 text-brand-700 px-2.5 py-1 font-bold">Year {data.year || "—"}</span>
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
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${data.alumni ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                      {data.alumni ? "Alumni" : "Regular"}
                    </span>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Residential Address</span>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">{data.address || "No address provided —"}</p>
                </div>
                <div className="mt-4 flex gap-3 text-sm">
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
                        📄 {c.title || "Download"}
                      </a>{" "}
                      <span className="text-slate-500">— {c.date}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
