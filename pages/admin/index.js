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
    totalUsers: 0, students: 0, faculty: 0, admins: 0, pendingReqs: 0, recentAudits: []
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

      const auditsSnap = await getDocs(query(collection(db, "auditLogs"), orderBy("timestamp", "desc"), limit(5)));

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
    <Layout title="Governance Overview" access={ACCESS.ADMIN}>
      <div className="space-y-10 animate-slide-up">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Governance Overview</h1>
          <p className="text-base text-slate-500 mt-2 font-medium">Real-time surveillance and administrative metrics for the ledger.</p>
        </div>

        {/* Quick Stats Grid */}
        {err ? (
          <div className="premium-card p-6 bg-red-50 border-red-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <p className="text-sm font-medium text-red-700">{err}</p>
            </div>
            <button onClick={fetchStats} className="text-xs font-black text-red-600 hover:text-red-800 uppercase tracking-widest border border-red-200 px-3 py-1.5 rounded-xl hover:bg-red-50 transition-all">Retry</button>
          </div>
        ) : null}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Registry Accounts"
            value={stats.totalUsers}
            loading={loading}
            icon={<path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />}
            color="bg-brand-700 text-white border-brand-700"
          />
          <StatCard
            title="Awaiting Clearance"
            value={stats.pendingReqs}
            loading={loading}
            icon={<path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
            color="bg-amber-700 text-white border-amber-700"
            highlight={stats.pendingReqs > 0}
          />
          <StatCard
            title="Faculty Nodes"
            value={stats.faculty}
            loading={loading}
            icon={<path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />}
            color="bg-slate-700 text-white border-slate-700"
          />
          <StatCard
            title="Enrolled Learners"
            value={stats.students}
            loading={loading}
            icon={<path d="M12 14l9-5-9-5-9 5 9 5z" />}
            color="bg-emerald-700 text-white border-emerald-700"
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Recent Activity */}
          <div className="lg:col-span-2 premium-card p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Security Audit Stream</h2>
              <Link href="/admin/audit" className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-600 hover:text-brand-700 transition-colors">Full Logs</Link>
            </div>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentAudits.length === 0 ? (
                  <p className="text-sm text-slate-500 italic text-center py-8">No audit events yet.</p>
                ) : stats.recentAudits.map(log => (
                  <div key={log.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4 hover:bg-white hover:border-slate-200 transition-all">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 line-clamp-1">{log.description}</p>
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5">
                        {log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleString() : "—"}
                      </p>
                    </div>
                    <Badge variant="neutral" className="flex-shrink-0 text-[9px]">
                      {log.action?.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="premium-card p-8 border-none shadow-2xl shadow-slate-900/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
              <svg className="h-64 w-64" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>

            <h2 className="text-xl font-black mb-8 relative z-10">Administrative Hub</h2>
            <div className="space-y-4 relative z-10">
              <QuickActionLink href="/admin/requests" title="Role Clearance" color="bg-amber-500" icon={<path d="M9 12l2 2 4-4" />} />
              <QuickActionLink href="/admin/students" title="Student Directory" color="bg-emerald-500" icon={<path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1" />} />
              <QuickActionLink href="/admin/audit" title="Ledger Integrity" color="bg-blue-500" icon={<path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944" />} />
            </div>

            <div className="mt-10 pt-6 border-t border-white/10">
              <p className="text-xs text-slate-500 italic">&ldquo;Administering the department with zero-trust security and high-fidelity record keeping.&rdquo;</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ title, value, loading, icon, color, highlight }) {
  return (
    <div className={`premium-card p-8 group transition-all duration-300 ${highlight ? 'border-amber-500/50 shadow-amber-500/10' : 'hover:translate-y-[-4px]'}`}>
      <div className="flex flex-col gap-6">
        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${color}`}>
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {icon}
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-1">{title}</p>
          {loading ? (
            <Skeleton className="h-10 w-16 rounded-xl" />
          ) : (
            <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{value}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickActionLink({ href, title, icon, color }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-5 p-5 rounded-2xl bg-white hover:bg-slate-50 transition-all group border border-slate-200 hover:border-brand-300 shadow-sm hover:shadow-md active:scale-[0.98]"
    >
      <div className={`${color} h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-all`}>
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          {icon}
        </svg>
      </div>
      <span className="text-sm font-black text-slate-800 tracking-tight">{title}</span>
    </Link>
  );
}
