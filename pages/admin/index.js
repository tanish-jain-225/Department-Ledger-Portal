import { useEffect, useState } from "react";
import Link from "next/link";
import Layout, { ACCESS } from "@/components/Layout";
import { useAuth } from "@/lib/auth-context";
import { getDb } from "@/lib/firebase";
import { collection, query, where, getCountFromServer } from "firebase/firestore";

const navItems = [
  {
    href: "/admin/students",
    title: "Student Dashboard",
    desc: "Browse and search all registered student profiles.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    color: "brand",
  },
  {
    href: "/admin/faculty",
    title: "Faculty Dashboard",
    desc: "View all faculty members and manage verification statuses.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: "violet",
  },
  {
    href: "/admin/requests",
    title: "Role Requests",
    desc: "Approve or reject faculty and admin promotion requests.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    color: "amber",
  },
  {
    href: "/admin/audit",
    title: "Audit Log",
    desc: "Review the last 100 sensitive administrative actions.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    color: "slate",
  },
];

const colorMap = {
  brand: { bg: "bg-brand-50", text: "text-brand-600", border: "border-brand-200", hover: "hover:border-brand-300 hover:shadow-brand-500/5" },
  violet: { bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-200", hover: "hover:border-violet-300 hover:shadow-violet-500/5" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", hover: "hover:border-amber-300 hover:shadow-amber-500/5" },
  slate: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200", hover: "hover:border-slate-300 hover:shadow-slate-500/5" },
};

export default function AdminHome() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ students: 0, faculty: 0, admins: 0, requests: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const db = getDb();
      if (!db) return;
      try {
        const [sCount, fCount, aCount, rCount] = await Promise.all([
          getCountFromServer(query(collection(db, "users"), where("role", "==", "student"))),
          getCountFromServer(query(collection(db, "users"), where("role", "==", "faculty"))),
          getCountFromServer(query(collection(db, "users"), where("role", "==", "admin"))),
          getCountFromServer(query(collection(db, "roleRequests"), where("status", "==", "pending"))),
        ]);
        setStats({
          students: sCount.data().count,
          faculty: fCount.data().count,
          admins: aCount.data().count,
          requests: rCount.data().count,
        });
      } catch (e) {
        console.error("Failed to load stats", e);
      } finally {
        setLoadingStats(false);
      }
    }
    fetchStats();
  }, []);

  const statCards = [
    { label: "Students", value: stats.students, color: "brand", icon: "👨‍🎓" },
    { label: "Faculty", value: stats.faculty, color: "violet", icon: "👩‍🏫" },
    { label: "Admins", value: stats.admins, color: "slate", icon: "🛡️" },
    { label: "Pending", value: stats.requests, color: "amber", icon: "⏳" },
  ];

  return (
    <Layout title="Admin Overview" access={ACCESS.ADMIN}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Administration Overview</h1>
          <p className="mt-1 text-slate-500 text-sm">Manage access, review requests, and monitor audit activity.</p>
        </div>
        {profile?.email && (
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {profile.email}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((s) => {
          const c = colorMap[s.color];
          return (
            <div key={s.label} className={`rounded-2xl border ${c.border} ${c.bg} p-5 shadow-sm`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl">{s.icon}</span>
              </div>
              <p className={`text-3xl font-extrabold ${s.color === "brand" ? "text-brand-900" : s.color === "violet" ? "text-violet-900" : s.color === "amber" ? "text-amber-900" : "text-slate-900"}`}>
                {loadingStats ? <span className="text-2xl animate-pulse">—</span> : s.value}
              </p>
              <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${s.color === "brand" ? "text-brand-700" : s.color === "violet" ? "text-violet-700" : s.color === "amber" ? "text-amber-700" : "text-slate-600"}`}>
                {s.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick Navigation */}
      <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Quick Navigation</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {navItems.map((item) => {
          const c = colorMap[item.color];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-lg ${c.hover} active:scale-[0.98]`}
            >
              <div className={`flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl ${c.bg} ${c.text} transition-all group-hover:scale-110`}>
                {item.icon}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 group-hover:text-brand-700 transition-colors">{item.title}</h3>
                <p className="mt-0.5 text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`ml-auto flex-shrink-0 h-5 w-5 ${c.text} opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          );
        })}
      </div>
    </Layout>
  );
}
