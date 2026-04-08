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
import { Badge, Skeleton, Modal } from "@/components/ui";
import { getDb } from "@/lib/firebase";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0, students: 0, faculty: 0, admins: 0, pendingReqs: 0, recentAudits: []
  });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showHubModal, setShowHubModal] = useState(false);

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
          <h1 className="text-2xl min-[340px]:text-3xl min-[400px]:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Governance Overview</h1>
          <p className="text-xs min-[360px]:text-sm min-[400px]:text-base text-slate-500 mt-2 font-medium">Real-time surveillance and administrative metrics for the ledger.</p>
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
        <div className="grid gap-responsive sm:grid-cols-2 lg:grid-cols-4">
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

        <div className="grid gap-responsive lg:grid-cols-3">
          {/* Recent Activity */}
          <div className="lg:col-span-2 premium-card p-responsive min-w-0 overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col min-w-0">
                <h2 className="text-lg min-[340px]:text-xl font-black text-slate-900 tracking-tight truncate">Security Audit Stream</h2>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Live Institutional Oversight</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowAuditModal(true)}
                  className="sm:hidden px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-black uppercase text-brand-600 hover:bg-white transition-all shadow-sm"
                >
                  Inspect
                </button>
                <Link href="/admin/audit" className="hidden sm:block text-[10px] font-black uppercase tracking-[0.2em] text-brand-600 hover:text-brand-700 transition-colors">Full Logs</Link>
              </div>
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
                  <div key={log.id} className="p-3 min-[400px]:p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 hover:bg-white hover:border-slate-200 transition-all min-w-0 overflow-hidden">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs min-[400px]:text-sm font-bold text-slate-800 truncate">{log.description}</p>
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.15em] mt-0.5">
                        {log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleString() : "—"}
                      </p>
                    </div>
                    <Badge variant="neutral" className="flex-shrink-0 text-[8px] px-1.5 py-0.5 tracking-tighter">
                      {log.action?.replace(/_/g, ' ')?.slice(0, 12)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="premium-card p-responsive bg-slate-900 border-none shadow-2xl shadow-slate-900/40 relative overflow-hidden group min-w-0">
            <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none hidden sm:block group-hover:scale-125 transition-transform duration-700">
              <svg className="h-64 w-64 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="flex items-center justify-between mb-8 relative z-10 gap-3">
              <h2 className="text-lg min-[340px]:text-xl font-black text-white tracking-tight truncate">Administrative Hub</h2>
              <button 
                onClick={() => setShowHubModal(true)}
                className="sm:hidden px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-[10px] font-black uppercase text-white hover:bg-white/20 transition-all shadow-sm backdrop-blur-md"
              >
                Expand
              </button>
            </div>
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

        {/* ── Modals for Mobile Responsiveness ──────────────────────────────── */}
        
        {/* Audit Stream Modal */}
        <Modal 
          open={showAuditModal} 
          onClose={() => setShowAuditModal(false)}
          title="Security Monitoring Protocol"
        >
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-brand-50 border border-brand-100 mb-6">
              <p className="text-[10px] font-black text-brand-700 uppercase tracking-widest mb-1">Live Intelligence</p>
              <p className="text-xs text-brand-600 font-medium leading-relaxed italic">&ldquo;Tracing administrative lifecycle and institutional record integrity.&rdquo;</p>
            </div>
            
            <div className="space-y-3">
              {stats.recentAudits.map(log => (
                <div key={log.id} className="p-3 min-[400px]:p-4 rounded-[1.5rem] bg-white border border-slate-100 flex flex-col gap-3 shadow-sm min-w-0">
                  <div className="flex flex-col min-[450px]:flex-row min-[450px]:items-start justify-between gap-3 min-w-0">
                    <p className="text-sm font-black text-slate-900 tracking-tight leading-snug break-words flex-1">{log.description}</p>
                    <Badge variant="neutral" className="flex-shrink-0 text-[8px] tracking-widest p-0.5 px-2 self-start min-[450px]:self-auto">
                      {log.action?.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-50">
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">
                      {log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleString() : "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8">
              <Link 
                href="/admin/audit"
                className="flex items-center justify-center w-full py-4 rounded-2xl bg-brand-700 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-brand-700/20 active:scale-95 transition-all"
              >
                Access Comprehensive Logs
              </Link>
            </div>
          </div>
        </Modal>

        {/* Administrative Hub Modal */}
        <Modal
          open={showHubModal}
          onClose={() => setShowHubModal(false)}
          title="Administrative Operations Hub"
        >
          <div className="space-y-6 py-2">
            <div className="p-4 min-[400px]:p-5 rounded-[2rem] bg-slate-900 text-white relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-125 transition-transform duration-700">
                <svg className="h-24 w-24 min-[400px]:h-32 min-[400px]:w-32" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <p className="text-[9px] min-[400px]:text-[10px] font-black text-brand-400 uppercase tracking-[0.3em] mb-2">Central Node</p>
              <h3 className="text-xl min-[400px]:text-2xl font-black tracking-tighter leading-none">High-Trust Portal Control</h3>
              <p className="text-[10px] min-[400px]:text-[11px] text-slate-400 mt-3 font-medium italic opacity-80 leading-relaxed break-words">&ldquo;Executing departmental governance with cryptographic record-keeping protocols.&rdquo;</p>
            </div>

            <div className="grid gap-3 min-[400px]:grid-cols-1">
              <QuickActionLink href="/admin/requests" title="Role Clearance Queue" color="bg-amber-500" icon={<path d="M9 12l2 2 4-4" />} />
              <QuickActionLink href="/admin/students" title="Professional Directory" color="bg-emerald-500" icon={<path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1" />} />
              <QuickActionLink href="/admin/audit" title="Ledger Integrity Trace" color="bg-blue-500" icon={<path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944" />} />
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 bg-amber-500 text-white rounded-lg flex items-center justify-center shrink-0">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest leading-none mb-1">Status Protocol</p>
                  <p className="text-[11px] font-medium text-amber-600 leading-snug">All systems operational. Surveillance stream synchronized with ledger state.</p>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}

function StatCard({ title, value, loading, icon, color, highlight }) {
  return (
    <div className={`premium-card p-responsive group transition-all duration-300 min-w-0 ${highlight ? 'border-amber-500/50 shadow-amber-500/10' : 'hover:translate-y-[-4px]'}`}>
      <div className="flex flex-col gap-4 min-[400px]:gap-6 min-w-0">
        <div className={`h-10 w-10 min-[340px]:h-12 min-[340px]:w-12 min-[400px]:h-14 min-[400px]:w-14 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${color}`}>
          <svg className="h-5 w-5 min-[340px]:h-6 min-[340px]:w-6 min-[400px]:h-7 min-[400px]:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {icon}
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] min-[400px]:text-xs font-black uppercase text-slate-400 tracking-widest mb-1 truncate">{title}</p>
          {loading ? (
            <Skeleton className="h-10 w-16 rounded-xl" />
          ) : (
            <p className="text-2xl min-[360px]:text-3xl min-[400px]:text-4xl font-black text-slate-900 tracking-tighter leading-none truncate">{value}</p>
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
      className="flex items-center gap-3 min-[360px]:gap-4 p-3 min-[360px]:p-4 rounded-xl min-[360px]:rounded-2xl bg-white hover:bg-slate-50 transition-all group border border-slate-200 hover:border-brand-300 shadow-sm hover:shadow-md active:scale-[0.98] min-w-0"
    >
      <div className={`${color} h-8 w-8 min-[360px]:h-10 min-[360px]:w-10 rounded-lg min-[360px]:rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-all flex-shrink-0`}>
        <svg className="h-4 w-4 min-[360px]:h-5 min-[360px]:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          {icon}
        </svg>
      </div>
      <span className="text-xs min-[360px]:text-sm font-black text-slate-800 tracking-tight truncate">{title}</span>
    </Link>
  );
}
