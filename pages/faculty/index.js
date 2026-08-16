import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Layout, ACCESS, FacultyInfoPopup } from "@/components";
import { useAuth } from "@/lib/auth-context";
import { getDb } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Button, Skeleton } from "@/components/ui";

export default function FacultyWorkspacePage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalStudents: 0,
    year1: 0,
    year2: 0,
    year3: 0,
    year4: 0,
    facultyCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadDepartmentMetrics() {
      const db = getDb();
      if (!db) return;
      try {
        const usersRef = collection(db, "users");
        const [studentSnap, facultySnap] = await Promise.all([
          getDocs(query(usersRef, where("role", "==", "student"))),
          getDocs(query(usersRef, where("role", "==", "faculty"))),
        ]);

        if (!cancelled) {
          const students = studentSnap.docs.map(d => d.data());
          setStats({
            totalStudents: students.length,
            year1: students.filter(s => String(s.year) === "1").length,
            year2: students.filter(s => String(s.year) === "2").length,
            year3: students.filter(s => String(s.year) === "3").length,
            year4: students.filter(s => String(s.year) === "4").length,
            facultyCount: facultySnap.size,
          });
        }
      } catch (err) {
        // Non-critical background fetch failure
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDepartmentMetrics();
    return () => { cancelled = true; };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <Layout title="Faculty Hub" access={ACCESS.STAFF}>
      <div className="flex-1 w-full max-w-7xl mx-auto px-3 min-[360px]:px-6 py-4 min-[360px]:py-8 space-y-6 min-[360px]:space-y-8 animate-fade-in">
        
        {/* Welcome Header */}
        <div className="premium-card p-responsive bg-linear-to-r from-slate-900 via-indigo-950 to-brand-900 text-white relative overflow-hidden border-none shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md text-[10px] min-[340px]:text-xs font-bold uppercase tracking-wider text-indigo-200">
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                Faculty Portal
              </div>
              <h1 className="text-xl min-[340px]:text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white truncate">
                Welcome, {profile?.name || "Professor"}
              </h1>
              <p className="text-xs sm:text-sm text-indigo-200/90 font-medium">
                {profile?.designation || "Instructional Staff"}
                {profile?.department ? ` · ${profile.department}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 w-full sm:w-auto">
              <Link
                href="/dashboard"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 text-xs font-bold transition-all shadow-md shrink-0"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                Student Records
              </Link>
              <Link
                href="/profile"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 text-xs font-bold transition-all shrink-0"
              >
                My Credentials
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Search Student */}
        <form onSubmit={handleSearchSubmit} className="premium-card p-2 sm:p-3 flex items-center gap-2 bg-white border-slate-200 shadow-sm">
          <div className="relative flex-1 min-w-0">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              placeholder="Search student by name, roll number, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border-none bg-transparent pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-0 outline-none"
            />
          </div>
          <Button type="submit" size="sm" className="shrink-0 px-4 py-2 text-xs">
            Search
          </Button>
        </form>

        {/* Department Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 min-[360px]:gap-4">
          <StatBox
            title="Total Students"
            value={loading ? "..." : `${stats.totalStudents}`}
            subtext="Enrolled in department"
            icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            color="bg-brand-50 text-brand-700 border-brand-100"
            href="/dashboard"
          />
          <StatBox
            title="Junior Years"
            value={loading ? "..." : `${stats.year1 + stats.year2}`}
            subtext={`Year 1: ${stats.year1} · Year 2: ${stats.year2}`}
            icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            color="bg-emerald-50 text-emerald-700 border-emerald-100"
            href="/dashboard"
          />
          <StatBox
            title="Senior Years"
            value={loading ? "..." : `${stats.year3 + stats.year4}`}
            subtext={`Year 3: ${stats.year3} · Year 4: ${stats.year4}`}
            icon="M13 10V3L4 14h7v7l9-11h-7z"
            color="bg-amber-50 text-amber-700 border-amber-100"
            href="/dashboard"
          />
          <StatBox
            title="Faculty Members"
            value={loading ? "..." : `${stats.facultyCount}`}
            subtext="Department teaching staff"
            icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            color="bg-indigo-50 text-indigo-700 border-indigo-100"
            href="/profile"
          />
        </div>

        {/* Action Hub Cards */}
        <div className="grid sm:grid-cols-2 gap-4 min-[360px]:gap-6">
          
          {/* Card 1: Student Records */}
          <Link
            href="/dashboard"
            className="group premium-card p-4 min-[360px]:p-6 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-lg hover:border-brand-300"
          >
            <div>
              <div className="h-12 w-12 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center border border-brand-100 mb-4 group-hover:bg-brand-700 group-hover:text-white transition-all shadow-sm">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-slate-900 group-hover:text-brand-700 transition-colors">Student Records Directory</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Filter students by branch and year, examine full academic ledgers, review transcripts, and export consolidated department CSV summaries.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-bold text-brand-700 group-hover:translate-x-1 transition-transform">
              Open Student Directory &rarr;
            </div>
          </Link>

          {/* Card 2: Faculty Profile */}
          <Link
            href="/profile"
            className="group premium-card p-4 min-[360px]:p-6 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-lg hover:border-indigo-300"
          >
            <div>
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100 mb-4 group-hover:bg-indigo-700 group-hover:text-white transition-all shadow-sm">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">Faculty Credentials & ID</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Manage your instructional profile, office location, research bio, contact details, and view your verified Faculty ID card.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-bold text-indigo-700 group-hover:translate-x-1 transition-transform">
              Manage Credentials &rarr;
            </div>
          </Link>

        </div>

      </div>

      {showProfileModal && user?.uid && (
        <FacultyInfoPopup uid={user.uid} onClose={() => setShowProfileModal(false)} />
      )}
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
