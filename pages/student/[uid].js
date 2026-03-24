import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import Layout, { ACCESS } from "@/components/Layout";
import { getDb } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { isStaff } from "@/lib/roles";
import { listByStudent } from "@/lib/data";

function InfoItem({ label, value, wide }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-slate-800">{value || "—"}</p>
    </div>
  );
}

function SectionCard({ title, icon, count, children }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <h2 className="font-bold text-slate-900">{title}</h2>
          {count !== undefined && (
            <span className="rounded-full bg-brand-100 text-brand-700 text-[10px] font-black uppercase tracking-widest px-2 py-0.5">
              {count}
            </span>
          )}
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="px-6 pb-5 border-t border-slate-100">
          {children}
        </div>
      )}
    </section>
  );
}

function EmptyState({ text }) {
  return (
    <p className="py-4 text-sm text-slate-400 italic">{text}</p>
  );
}

export default function StudentDetailPage() {
  const router = useRouter();
  const { uid } = router.query;
  const { user, profile } = useAuth();
  const [data, setData] = useState(null);
  const [lists, setLists] = useState({
    academic: [], activities: [], achievements: [], placements: [], certificates: [],
  });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const role = profile?.role;
  const allowed = user && role && isStaff(role);

  useEffect(() => {
    if (!uid || typeof uid !== "string" || !allowed) return;
    async function load() {
      const db = getDb();
      if (!db) return;
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (!snap.exists()) { setErr("Student not found"); return; }
        const userData = { id: snap.id, ...snap.data() };
        if (userData.role !== "student") { setErr("This user is not a student"); return; }
        setData(userData);
        const [academic, activities, achievements, placements, certificates] = await Promise.all([
          listByStudent("academicRecords", uid),
          listByStudent("activities", uid),
          listByStudent("achievements", uid),
          listByStudent("placements", uid),
          listByStudent("certificates", uid),
        ]);
        setLists({ academic, activities, achievements, placements, certificates });
      } catch (e) {
        setErr(e?.message || "Load failed");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [uid, allowed]);

  return (
    <Layout title={data?.name || "Student Detail"} access={ACCESS.STAFF}>
      {/* Loading skeleton */}
      {loading && !err && (
        <div className="space-y-4 mt-4">
          <div className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
          {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      )}

      {err && (
        <div className="flex gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 mt-4" role="alert">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5 text-red-500 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-red-700">{err}</p>
        </div>
      )}

      {data && (
        <div className="space-y-6 mt-2">
          {/* Profile header */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-white text-2xl font-extrabold shadow-lg shadow-brand-500/20">
                  {data.name?.[0]?.toUpperCase() || "S"}
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900">{data.name}</h1>
                  <p className="text-slate-500 text-sm">{data.email}</p>
                  {data.alumni && (
                    <span className="mt-1 inline-flex rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-2 py-0.5">
                      Alumni
                    </span>
                  )}
                </div>
              </div>
              <Link
                href={`/student/${uid}/card`}
                className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                </svg>
                View Student Card
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-4 pt-5 border-t border-slate-100">
              <InfoItem label="Gender" value={data.gender} />
              <InfoItem label="Date of Birth" value={data.dob} />
              <InfoItem label="Phone" value={data.phone} />
              <InfoItem label="Address" value={data.address} wide />
              {(data.linkedin || data.github) && (
                <div className="sm:col-span-2 flex gap-4">
                  {data.linkedin && (
                    <a href={data.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                      LinkedIn
                    </a>
                  )}
                  {data.github && (
                    <a href={data.github} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:underline">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                      GitHub
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Academic */}
          <SectionCard title="Academic Records" icon="📚" count={lists.academic.length}>
            {lists.academic.length === 0 ? <EmptyState text="No academic records added yet." /> : (
              <ul className="mt-4 space-y-3">
                {lists.academic.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">Year {r.year} · Semester {r.semester}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{r.subjects || "No subjects listed"} {r.rollNumber && `· Roll: ${r.rollNumber}`} {r.branch && `· ${r.branch}`}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-brand-100 text-brand-700 text-xs font-black px-2.5 py-1">GPA {r.gpa}</span>
                      {r.resultLink && (
                        <a href={r.resultLink} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-brand-600 hover:bg-brand-50 transition-colors">
                          Result ↗
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* Activities */}
          <SectionCard title="Activities" icon="🏆" count={lists.activities.length}>
            {lists.activities.length === 0 ? <EmptyState text="No activities recorded." /> : (
              <ul className="mt-4 space-y-2">
                {lists.activities.map((r) => (
                  <li key={r.id} className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                    <span className="flex-shrink-0 rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-500 capitalize">{r.type}</span>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{r.title}</p>
                      <p className="text-xs text-slate-500">{r.date}{r.description ? ` — ${r.description}` : ""}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* Achievements */}
          <SectionCard title="Achievements" icon="🥇" count={lists.achievements.length}>
            {lists.achievements.length === 0 ? <EmptyState text="No achievements recorded." /> : (
              <ul className="mt-4 space-y-2">
                {lists.achievements.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                    <span className="flex-shrink-0 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest capitalize">{r.level}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{r.title}</p>
                      <p className="text-xs text-slate-500">{r.date}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* Placements */}
          <SectionCard title="Placements & Internships" icon="💼" count={lists.placements.length}>
            {lists.placements.length === 0 ? <EmptyState text="No placement records." /> : (
              <ul className="mt-4 space-y-2">
                {lists.placements.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900">{r.company}</p>
                      <p className="text-xs text-slate-500">{r.role} · <span className="capitalize">{r.status}</span> {r.package ? `· ${r.package}` : ""}</p>
                    </div>
                    {r.link && (
                      <a href={r.link} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-brand-600 hover:underline">View ↗</a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* Certificates */}
          <SectionCard title="Certificates" icon="📄" count={lists.certificates.length}>
            {lists.certificates.length === 0 ? <EmptyState text="No certificates uploaded." /> : (
              <ul className="mt-4 space-y-2">
                {lists.certificates.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-slate-400 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <a href={c.fileUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-brand-600 hover:underline truncate block">
                        {c.title || "Certificate"}
                      </a>
                      {c.date && <p className="text-xs text-slate-400">{c.date}</p>}
                    </div>
                    <a href={c.fileUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors flex-shrink-0">
                      Open ↗
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      )}
    </Layout>
  );
}
