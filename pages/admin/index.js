import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from "firebase/firestore";
import Layout, { ACCESS } from "@/components/Layout";
import { Badge, Skeleton } from "@/components/ui";
import { getDb } from "@/lib/firebase";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    students: 0,
    faculty: 0,
    admins: 0,
    pendingReqs: 0,
    recentAudits: []
  });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function fetchStats() {
    const db = getDb();
    if (!db) return;
    setLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const users = usersSnap.docs.map(d => d.data());

      const reqsSnap = await getDocs(query(collection(db, "roleRequests"), where("status", "==", "pending")));
      const auditsSnap = await getDocs(query(collection(db, "auditLogs"), orderBy("timestamp", "desc"), limit(6)));

      setStats({
        totalUsers: users.length,
        students: users.filter(u => u.role === "student").length,
        faculty: users.filter(u => u.role === "faculty").length,
        admins: users.filter(u => u.role === "admin").length,
        pendingReqs: reqsSnap.size,
        recentAudits: auditsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      });
    } catch (error) {
      setErr(error?.message || "Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <Layout title="Admin Overview" access={ACCESS.ADMIN}>
      <div className="flex-1 w-full max-w-7xl mx-auto px-3 min-[360px]:px-6 py-4 min-[360px]:py-8 space-y-6 min-[360px]:space-y-8 animate-slide-up">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl min-[340px]:text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Governance Overview</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Institutional records, user directory, and administrative audit logs.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/requests"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white px-4 py-2.5 text-xs font-bold transition-all shadow-sm"
            >
              Review Requests
              {stats.pendingReqs > 0 && (
                <span className="h-5 px-1.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center">
                  {stats.pendingReqs}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Error notice */}
        {err ? (
          <div className="premium-card p-4 bg-red-50 border-red-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <svg className="h-5 w-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs sm:text-sm font-medium text-red-700 truncate">{err}</p>
            </div>
            <button onClick={fetchStats} className="text-xs font-bold text-red-700 hover:underline shrink-0">Retry</button>
          </div>
        ) : null}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 min-[360px]:gap-4">
          <StatCard
            title="Total Accounts"
            value={stats.totalUsers}
            loading={loading}
            icon={<path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />}
            color="bg-brand-50 text-brand-700 border-brand-100"
            href="/admin/students"
          />
          <StatCard
            title="Pending Requests"
            value={stats.pendingReqs}
            loading={loading}
            icon={<path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
            color="bg-amber-50 text-amber-700 border-amber-100"
            highlight={stats.pendingReqs > 0}
            href="/admin/requests"
          />
          <StatCard
            title="Faculty Members"
            value={stats.faculty}
            loading={loading}
            icon={<path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />}
            color="bg-indigo-50 text-indigo-700 border-indigo-100"
            href="/admin/faculty"
          />
          <StatCard
            title="Enrolled Students"
            value={stats.students}
            loading={loading}
            icon={<path d="M12 14l9-5-9-5-9 5 9 5z" />}
            color="bg-emerald-50 text-emerald-700 border-emerald-100"
            href="/admin/students"
          />
        </div>

        <div className="grid gap-4 min-[360px]:gap-6 lg:grid-cols-3">
          {/* Recent Audit Logs */}
          <div className="lg:col-span-2 premium-card p-3 min-[360px]:p-5 sm:p-6 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">Recent Audit Logs</h2>
                <p className="text-xs text-slate-400 font-medium">Real-time record operations</p>
              </div>
              <Link
                href="/admin/audit"
                className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors shrink-0"
              >
                View All &rarr;
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2.5">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {stats.recentAudits.length === 0 ? (
                  <p className="text-xs sm:text-sm text-slate-500 italic text-center py-6">No audit records recorded yet.</p>
                ) : stats.recentAudits.map(log => (
                  <div key={log.id} className="p-2.5 min-[360px]:p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2.5 hover:bg-white hover:border-slate-200 transition-all min-w-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{log.description}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleString() : "—"}
                      </p>
                    </div>
                    <Badge variant="neutral" className="shrink-0 text-[9px] px-2 py-0.5">
                      {log.action?.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="premium-card p-3 min-[360px]:p-5 sm:p-6 bg-slate-900 border-none text-white shadow-xl flex flex-col justify-between min-w-0">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white mb-1">Administrative Shortcuts</h2>
              <p className="text-xs text-slate-400 mb-4">Direct shortcuts to governance modules</p>
              
              <div className="space-y-2.5">
                <QuickActionLink href="/admin/requests" title="Role & Deletion Requests" badge={stats.pendingReqs > 0 ? `${stats.pendingReqs} pending` : null} icon={<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />} />
                <QuickActionLink href="/admin/students" title="Student Directory" icon={<path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />} />
                <QuickActionLink href="/admin/faculty" title="Faculty Directory" icon={<path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />} />
                <QuickActionLink href="/admin/audit" title="Complete Audit Trail" icon={<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />} />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
              Department Ledger Governance Portal
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}

function StatCard({ title, value, loading, icon, color, highlight, href }) {
  return (
    <Link
      href={href}
      className={`premium-card p-3 min-[360px]:p-4 group transition-all duration-200 min-w-0 ${
        highlight ? 'border-amber-400 shadow-sm bg-amber-50/20' : 'hover:-translate-y-0.5 hover:shadow-md'
      }`}
    >
      <div className="flex flex-col gap-2 min-w-0">
        <div className={`h-9 w-9 min-[360px]:h-10 min-[360px]:w-10 rounded-xl flex items-center justify-center border transition-all shrink-0 ${color}`}>
          <svg className="h-4 w-4 min-[360px]:h-5 min-[360px]:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {icon}
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] min-[340px]:text-xs font-semibold text-slate-500 truncate">{title}</p>
          {loading ? (
            <Skeleton className="h-6 w-12 rounded-md mt-1" />
          ) : (
            <p className="text-xl min-[340px]:text-2xl font-black text-slate-900 tracking-tight leading-none mt-0.5 truncate">{value}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

function QuickActionLink({ href, title, icon, badge }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-white transition-all group min-w-0 text-xs font-bold"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="h-6 w-6 rounded-lg bg-slate-700 flex items-center justify-center text-slate-200 shrink-0">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {icon}
          </svg>
        </div>
        <span className="truncate">{title}</span>
      </div>
      {badge ? (
        <span className="rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 shrink-0">
          {badge}
        </span>
      ) : (
        <svg className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      )}
    </Link>
  );
}
