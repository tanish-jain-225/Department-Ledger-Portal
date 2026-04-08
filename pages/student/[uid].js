import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { Layout, ACCESS } from "@/components";
import { getDb } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { isStaff } from "@/lib/roles";
import { listByStudent, listStudentDocuments } from "@/lib/data";
import DocumentPreview from "@/components/profile/DocumentPreview";
import { Badge, Skeleton, EmptyState, SectionCard } from "@/components/ui";

function InfoItem({ label, value, wide }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value || "—"}</p>
    </div>
  );
}


export default function StudentDetailPage() {
  const router = useRouter();
  const { uid } = router.query;
  const { user, profile } = useAuth();
  const [data, setData] = useState(null);
  const [lists, setLists] = useState({
    academic: [], activities: [], achievements: [], placements: [], uploadedDocuments: [],
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
        const [academic, activities, achievements, placements, uploadedDocuments] = await Promise.all([
          listByStudent("academicRecords", uid),
          listByStudent("activities", uid),
          listByStudent("achievements", uid),
          listByStudent("placements", uid),
          listStudentDocuments(uid),
        ]);
        setLists({ academic, activities, achievements, placements, uploadedDocuments });
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
        <div className="space-y-8 mt-4 animate-pulse">
          <div className="premium-card p-8 flex items-center gap-6">
            <Skeleton className="h-20 w-20 rounded-4xl" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-12 w-40 rounded-2xl" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="premium-card p-6 border border-slate-100 space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-6 w-10 rounded-full" />
              </div>
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          ))}
        </div>
      )}

      {err && (
        <div className="flex gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 mt-4" role="alert">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5 text-red-500 shrink-0">
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
                <div className="shrink-0 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-700 text-white text-2xl font-extrabold shadow-lg shadow-brand-500/20">
                  {data.name?.[0]?.toUpperCase() || "S"}
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900">{data.name}</h1>
                  <p className="text-slate-500 text-sm">{data.email}</p>
                  {data.alumni && (
                    <Badge variant="brand" className="mt-1">
                      Alumni
                    </Badge>
                  )}
                </div>
              </div>
              <Link
                href={`/student/${uid}/card`}
                className="flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-800 transition-all active:scale-95"
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
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                      LinkedIn
                    </a>
                  )}
                  {data.github && (
                    <a href={data.github} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:underline">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                      GitHub
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Academic */}
          <SectionCard
            title="Academic Records"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            }
            count={lists.academic.length}
          >
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
                      {r.document && (
                        <DocumentPreview document={r.document} triggerLabel="View uploaded file" />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* Activities */}
          <SectionCard
            title="Activities"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9A2.25 2.25 0 015.25 16.5v-9A2.25 2.25 0 017.5 5.25h9A2.25 2.25 0 0118.75 7.5v9A2.25 2.25 0 0116.5 18.75z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9.75h7.5M8.25 12h7.5M8.25 14.25h4.5" />
              </svg>
            }
            count={lists.activities.length}
          >
            {lists.activities.length === 0 ? <EmptyState text="No activities recorded." /> : (
              <ul className="mt-4 space-y-2">
                {lists.activities.map((r) => (
                  <li key={r.id} className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                    <span className="shrink-0 rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-500">{r.type}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900">{r.title}</p>
                      <p className="text-xs text-slate-500">{r.date}{r.description ? ` - ${r.description}` : ""}</p>
                    </div>
                    {r.document && <DocumentPreview document={r.document} triggerLabel="View uploaded file" />}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* Achievements */}
          <SectionCard
            title="Achievements"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v.75A3.75 3.75 0 0112 9.75 3.75 3.75 0 018.25 6v-.75M6 5.25h12v3A6 6 0 0112 14.25 6 6 0 016 8.25v-3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25v2.25a3 3 0 006 0v-2.25" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 19.5h7.5" />
              </svg>
            }
            count={lists.achievements.length}
          >
            {lists.achievements.length === 0 ? <EmptyState text="No achievements recorded." /> : (
              <ul className="mt-4 space-y-2">
                {lists.achievements.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                    <span className="shrink-0 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">{r.level}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{r.title}</p>
                      <p className="text-xs text-slate-500">{r.date}</p>
                    </div>
                    {r.document && <DocumentPreview document={r.document} triggerLabel="View uploaded file" />}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* Placements */}
          <SectionCard
            title="Placements & Internships"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V6a3 3 0 013-3h0a3 3 0 013 3v.75m-9 0h12A2.25 2.25 0 0120.25 9v9.75A2.25 2.25 0 0118 21H6A2.25 2.25 0 013.75 18.75V9A2.25 2.25 0 016 6.75z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5" />
              </svg>
            }
            count={lists.placements.length}
          >
            {lists.placements.length === 0 ? <EmptyState text="No placement records." /> : (
              <ul className="mt-4 space-y-2">
                {lists.placements.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900">{r.company}</p>
                      <p className="text-xs text-slate-500">{r.role} · <span className="capitalize">{r.status}</span> {r.package ? `· ${r.package}` : ""}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {r.link && (
                        <a href={r.link} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-brand-600 hover:underline">View ↗</a>
                      )}
                      {r.document && <DocumentPreview document={r.document} triggerLabel="View uploaded file" />}
                    </div>
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
