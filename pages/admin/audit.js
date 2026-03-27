import { useEffect, useState } from "react";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import Layout, { ACCESS } from "@/components/Layout";
import { Button, EmptyState, Skeleton } from "@/components/ui";
import { getDb } from "@/lib/firebase";

const ACTION_STYLES = {
  user_deleted: { bg: "bg-red-50/50 border-red-100", badge: "bg-red-100 text-red-700", label: "Deleted" },
  user_role_assigned: { bg: "bg-brand-50/50 border-brand-100", badge: "bg-brand-100 text-brand-700", label: "Role Assigned" },
  profile_updated: { bg: "bg-indigo-50/50 border-indigo-100", badge: "bg-indigo-100 text-indigo-700", label: "Profile Update" },
};

function getActionStyle(action) {
  return ACTION_STYLES[action] || { bg: "bg-white border-slate-100", badge: "bg-slate-100 text-slate-600", label: action || "Action" };
}

function timeAgo(date) {
  if (!date) return "";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminAuditPage() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const db = getDb();
      if (!db) return;
      try {
        const q = query(collection(db, "auditLogs"), orderBy("timestamp", "desc"), limit(100));
        const snap = await getDocs(q);
        setRows(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
      } catch (e) {
        setErr(e?.message || "Could not load audit log (check Firestore index).");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const downloadCSV = () => {
    if (rows.length === 0) return;
    
    const headers = ["ID", "Action", "Description", "Actor", "Target", "Timestamp", "Details"];
    const csvRows = rows.map(r => [
      r.id,
      r.action,
      `"${(r.description || "").replace(/"/g, '""')}"`,
      r.actorUid || "",
      r.targetUid || "",
      r.timestamp?.toDate?.()?.toISOString() || "",
      `"${JSON.stringify(r.details || {}).replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers, ...csvRows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout title="Governance Audit" access={ACCESS.ADMIN}>
      <div className="space-y-10 animate-slide-up">
        {/* Header */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Governance Audit</h1>
            <p className="text-base text-slate-400 mt-2 font-medium">Real-time oversight of administrative and professional operations.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-50 border border-slate-100">
               <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{rows.length} Active Logs</span>
            </div>
            <Button
              onClick={downloadCSV}
              disabled={rows.length === 0}
              className="lg:w-auto w-full group shadow-xl shadow-emerald-500/10"
            >
              <svg className="h-4 w-4 mr-2 group-hover:-translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Archive (CSV)
            </Button>
          </div>
        </div>

        {err ? (
          <div className="premium-card p-10 bg-red-50/30 border-red-100 flex items-start gap-4">
            <svg className="h-6 w-6 text-red-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-black text-red-900 uppercase tracking-widest">Protocol Error Detected</p>
              <p className="text-sm text-red-600 font-medium mt-1 leading-relaxed">{err}</p>
            </div>
          </div>
        ) : loading ? (
          <div className="space-y-4">
             {[1,2,3,4,5].map(i => (
               <div key={i} className="premium-card p-6 border border-slate-100 flex items-center justify-between gap-6 animate-pulse">
                 <div className="flex items-start gap-5 flex-1">
                    <Skeleton className="h-10 w-10 rounded-2xl" />
                    <div className="flex-1 space-y-2">
                       <div className="flex gap-3 items-center">
                          <Skeleton className="h-4 w-20 rounded-full" />
                          <Skeleton className="h-3 w-16" />
                       </div>
                       <Skeleton className="h-5 w-3/4" />
                       <div className="flex gap-6 mt-2">
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-3 w-16" />
                       </div>
                    </div>
                 </div>
                 <Skeleton className="h-10 w-10 rounded-xl" />
               </div>
             ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState 
            title="Audit Vault Empty"
            message="No system-wide operations have been committed to the governance ledger yet."
          />
        ) : (
          <div className="space-y-4">
            {rows.map((r) => {
              const style = getActionStyle(r.action);
              const date = r.timestamp?.toDate?.() || null;

              return (
                <div key={r.id} className={`group premium-card p-6 border transition-all hover:bg-slate-50/80 ${style.bg}`}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-5">
                      <div className={`mt-1 h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm group-hover:scale-110 transition-transform ${style.bg}`}>
                        <svg className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-5.19 4.595-9.362 9.716-10.198" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-200/50 ${style.badge}`}>
                            {style.label}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{timeAgo(date)}</span>
                        </div>
                        <p className="mt-2 text-sm font-black text-slate-900 tracking-tight leading-snug">{r.description}</p>
                        <div className="mt-3 flex items-center gap-6">
                           <div className="flex flex-col">
                              <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">Actor ID</span>
                              <span className="text-[10px] font-bold text-slate-500 font-mono">{r.actorUid?.slice(-8) || "SYSTEM"}</span>
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">Sector</span>
                              <span className="text-[10px] font-bold text-slate-500 font-mono italic">{r.action?.split('_')[0] || "core"}</span>
                           </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                       <Button variant="ghost" className="h-10 w-10 !p-0 border border-slate-100 rounded-xl" title="Inspect Hash">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                       </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
