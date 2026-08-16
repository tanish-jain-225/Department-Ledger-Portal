import { useEffect, useState } from "react";
import Link from "next/link";
import { Layout, ACCESS, IdentityCardPopup } from "@/components";
import { useAuth } from "@/lib/auth-context";
import { listByStudent } from "@/lib/data";
import { Button, Badge, Skeleton } from "@/components/ui";

export default function StudentHubPage() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({
    academicCount: 0,
    latestGpa: null,
    activitiesCount: 0,
    achievementsCount: 0,
    placementsCount: 0,
    projectsCount: 0,
    skillsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showIdCard, setShowIdCard] = useState(false);
  const [academicList, setAcademicList] = useState([]);
  const [activitiesList, setActivitiesList] = useState([]);
  const [achievementsList, setAchievementsList] = useState([]);
  const [placementsList, setPlacementsList] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;

    async function loadStats() {
      try {
        const uid = user.uid;
        const [a, act, ach, pl, prj, sk] = await Promise.all([
          listByStudent("academicRecords", uid),
          listByStudent("activities", uid),
          listByStudent("achievements", uid),
          listByStudent("placements", uid),
          listByStudent("projects", uid),
          listByStudent("skills", uid),
        ]);

        if (!cancelled) {
          const sortedAcademic = a.sort((x, y) => {
            if (y.year !== x.year) return parseInt(y.year) - parseInt(x.year);
            return parseInt(y.semester) - parseInt(x.semester);
          });
          setAcademicList(sortedAcademic);
          setActivitiesList(act);
          setAchievementsList(ach);
          setPlacementsList(pl);

          setStats({
            academicCount: a.length,
            latestGpa: sortedAcademic[0]?.gpa || null,
            activitiesCount: act.length,
            achievementsCount: ach.length,
            placementsCount: pl.length,
            projectsCount: prj.length,
            skillsCount: sk.length,
          });
        }
      } catch (err) {
        // Non-critical background fetch failure
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadStats();
    return () => { cancelled = true; };
  }, [user?.uid]);

  return (
    <Layout title="Student Hub" access={ACCESS.STUDENT}>
      <div className="flex-1 w-full max-w-7xl mx-auto px-3 min-[360px]:px-6 py-4 min-[360px]:py-8 space-y-6 min-[360px]:space-y-8 animate-fade-in">
        
        {/* Welcome Header */}
        <div className="premium-card p-responsive bg-linear-to-r from-brand-900 to-indigo-900 text-white relative overflow-hidden border-none shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md text-[10px] min-[340px]:text-xs font-bold uppercase tracking-wider text-brand-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Student Portal
              </div>
              <h1 className="text-xl min-[340px]:text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white truncate">
                Welcome back, {profile?.name || "Student"}
              </h1>
              <p className="text-xs sm:text-sm text-brand-100/90 font-medium">
                {profile?.rollNumber ? `Roll No: ${profile.rollNumber}` : "Roll No: Unassigned"}
                {profile?.branch ? ` · ${profile.branch}` : ""}
                {profile?.year ? ` · Year ${profile.year}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 w-full sm:w-auto">
              <button
                onClick={() => setShowIdCard(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-white text-brand-900 px-4 py-2.5 text-xs font-bold hover:bg-brand-50 transition-all active:scale-95 shadow-md shrink-0"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                </svg>
                Digital ID Card
              </button>
              <Link
                href="/profile"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 text-xs font-bold transition-all shrink-0"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 min-[360px]:gap-4">
          <StatBox
            title="Academic Records"
            value={loading ? "..." : `${stats.academicCount} Semesters`}
            subtext={stats.latestGpa ? `Latest GPA: ${stats.latestGpa}` : "No GPA logged"}
            icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            color="bg-brand-50 text-brand-700 border-brand-100"
            href="/profile?tab=records"
          />
          <StatBox
            title="Placements & Interns"
            value={loading ? "..." : `${stats.placementsCount} Records`}
            subtext="Track career offers"
            icon="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            color="bg-emerald-50 text-emerald-700 border-emerald-100"
            href="/profile?tab=records"
          />
          <StatBox
            title="Achievements"
            value={loading ? "..." : `${stats.achievementsCount + stats.activitiesCount} Total`}
            subtext={`${stats.achievementsCount} Awards · ${stats.activitiesCount} Activities`}
            icon="M13 10V3L4 14h7v7l9-11h-7z"
            color="bg-amber-50 text-amber-700 border-amber-100"
            href="/profile?tab=records"
          />
          <StatBox
            title="Projects & Skills"
            value={loading ? "..." : `${stats.projectsCount} Projects`}
            subtext={`${stats.skillsCount} Skills listed`}
            icon="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            color="bg-indigo-50 text-indigo-700 border-indigo-100"
            href="/profile?tab=records"
          />
        </div>

        {/* Action Hub Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 min-[360px]:gap-6">
          
          {/* Card 1: Student Records */}
          <Link
            href="/profile?tab=records"
            className="group premium-card p-4 min-[360px]:p-6 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-lg hover:border-brand-300"
          >
            <div>
              <div className="h-12 w-12 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center border border-brand-100 mb-4 group-hover:bg-brand-700 group-hover:text-white transition-all shadow-sm">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-slate-900 group-hover:text-brand-700 transition-colors">Academic Ledger</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Log and manage semester grades, subjects, achievements, internships, and upload verified documents.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-bold text-brand-700 group-hover:translate-x-1 transition-transform">
              Manage Records &rarr;
            </div>
          </Link>

          {/* Card 2: Career Pulse */}
          <Link
            href="/profile?tab=intelligence"
            className="group premium-card p-4 min-[360px]:p-6 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-lg hover:border-indigo-300"
          >
            <div>
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100 mb-4 group-hover:bg-indigo-700 group-hover:text-white transition-all shadow-sm">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">AI Career Pulse</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Get an AI-evaluated placement readiness score, personalized skill roadmap, and weakness breakdown via Gemini.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-bold text-indigo-700 group-hover:translate-x-1 transition-transform">
              Run AI Analysis &rarr;
            </div>
          </Link>

          {/* Card 3: Profile & ID */}
          <Link
            href="/profile"
            className="group premium-card p-4 min-[360px]:p-6 flex flex-col justify-between sm:col-span-2 lg:col-span-1 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-slate-300"
          >
            <div>
              <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 mb-4 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-slate-900 group-hover:text-slate-950 transition-colors">My Profile</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Maintain contact details, residential address, LinkedIn and GitHub profiles, and download your academic dossier.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-bold text-slate-700 group-hover:translate-x-1 transition-transform">
              View Profile &rarr;
            </div>
          </Link>

        </div>

      </div>

      <IdentityCardPopup
        show={showIdCard}
        onClose={() => setShowIdCard(false)}
        role="student"
        data={profile}
        academic={academicList}
        activities={activitiesList}
        achievements={achievementsList}
        placements={placementsList}
      />
    </Layout>
  );
}

function StatBox({ title, value, subtext, icon, color, href }) {
  return (
    <Link
      href={href}
      className="premium-card p-3 min-[360px]:p-4 flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md transition-all group min-w-0"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className={`h-8 w-8 min-[360px]:h-9 min-[360px]:w-9 rounded-xl flex items-center justify-center border shrink-0 ${color}`}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] min-[340px]:text-xs font-medium text-slate-500 truncate">{title}</p>
        <p className="text-sm min-[340px]:text-base font-bold text-slate-900 truncate mt-0.5">{value}</p>
        <p className="text-[9px] min-[340px]:text-[10px] text-slate-400 truncate mt-0.5">{subtext}</p>
      </div>
    </Link>
  );
}
