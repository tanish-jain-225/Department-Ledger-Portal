import { useEffect, useState } from "react";
import Link from "next/link";
import Layout, { ACCESS } from "@/components/Layout";
import { useAuth } from "@/lib/auth-context";
import { getDb } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import FacultyInfoPopup from "@/components/FacultyInfoPopup";
import { downloadStudentsCsv } from "@/lib/csv-download";

export default function AdminFacultyDashboard() {
  const { loading } = useAuth();
  const [faculty, setFaculty] = useState([]);
  const [busy, setBusy] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFacultyUid, setSelectedFacultyUid] = useState(null);

  useEffect(() => {
    async function load() {
      setBusy(true);
      try {
        const db = getDb();
        if (!db) return;
        const q = query(collection(db, "users"), where("role", "==", "faculty"), limit(100));
        const snap = await getDocs(q);
        setFaculty(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setBusy(false);
      }
    }
    load();
  }, []);

  return (
    <Layout title="Faculty Dashboard" access={ACCESS.ADMIN}>
      {selectedFacultyUid && <FacultyInfoPopup uid={selectedFacultyUid} onClose={() => setSelectedFacultyUid(null)} />}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Faculty Dashboard</h1>
          <p className="text-slate-600">Directory of all verified faculty members.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search name or mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all shadow-sm"
            />
          </div>
          <button
            onClick={() => downloadStudentsCsv(faculty, "all-faculty.csv", { maskSensitive: false })}
            className="w-full sm:w-auto rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700 transition active:scale-95"
          >
            Download All (CSV)
          </button>
        </div>
      </div>
      
      {loading || busy ? (
        <p className="text-slate-500">Loading faculty...</p>
      ) : faculty.length === 0 ? (
        <p className="text-slate-500">No faculty members found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {faculty
            .filter(f => 
              f.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
              f.email?.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map(f => (
            <div key={f.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-violet-300 hover:shadow">
              <div className="flex items-center justify-between gap-3 overflow-hidden">
                <h2 className="font-semibold text-violet-800 text-lg truncate flex-1">{f.name || "Unnamed Faculty"}</h2>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${f.facultyVerification === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {f.facultyVerification || "Pending"}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1 truncate">{f.email}</p>
              
              <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{f.gender || "—"}</span>
                <span className="opacity-30">|</span>
                <span>{f.phone || "No phone —"}</span>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setSelectedFacultyUid(f.id)}
                  className="block flex-1 rounded-md bg-violet-50 px-4 py-2 text-center text-sm font-medium text-violet-700 hover:bg-violet-100 transition-colors"
                >
                  View Profile
                </button>
                <button
                  onClick={() => downloadStudentsCsv([f], `faculty-${f.name || f.id}.csv`, { maskSensitive: false })}
                  className="flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-violet-600 transition"
                  title="Download CSV"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
