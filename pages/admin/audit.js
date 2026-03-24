import { useEffect, useState } from "react";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import Layout, { ACCESS } from "@/components/Layout";
import { getDb } from "@/lib/firebase";

const ACTION_STYLES = {
  user_deleted: { bg: "bg-red-50 border-red-200", badge: "bg-red-100 text-red-700", label: "Deleted" },
  user_role_assigned: { bg: "bg-brand-50 border-brand-200", badge: "bg-brand-100 text-brand-700", label: "Role Assigned" },
};

function getActionStyle(action) {
  return ACTION_STYLES[action] || { bg: "bg-white border-slate-200", badge: "bg-slate-100 text-slate-600", label: action || "Action" };
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
        setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        setErr(e?.message || "Could not load audit log (check Firestore index).");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <Layout title="Audit Log" access={ACCESS.ADMIN}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
          <p className="mt-1 text-sm text-slate-500">Last 100 administrative actions, most recent first.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          {loading ? "Loading…" : `${rows.length} entries`}
        </span>
      </div>

      {err && (
        <div className="mb-6 flex gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3" role="alert">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-amber-800">{err}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
          <p className="text-slate-400 font-medium">No audit entries found.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => {
            const style = getActionStyle(r.action);
            const ts = r.timestamp?.toDate?.() || null;
            return (
              <li
                key={r.id}
                className={`rounded-xl border ${style.bg} px-4 py-3 flex flex-col sm:flex-row sm:items-start gap-3 transition-all`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${style.badge}`}>
                      {style.label}
                    </span>
                    <span className="font-semibold text-slate-900 text-sm truncate">
                      {r.description || r.action}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                    {r.actorUid && <span>Actor: <span className="font-mono text-slate-600">{r.actorUid}</span></span>}
                    {r.targetUid && <span>Target: <span className="font-mono text-slate-600">{r.targetUid}</span></span>}
                  </div>
                  {r.details && Object.keys(r.details).length > 0 && (
                    <pre className="mt-2 rounded-lg bg-white/70 border border-slate-200 px-3 py-1.5 text-[10px] text-slate-500 overflow-x-auto">
                      {JSON.stringify(r.details, null, 2)}
                    </pre>
                  )}
                </div>
                {ts && (
                  <span className="flex-shrink-0 text-[10px] font-bold text-slate-400 uppercase tracking-widest sm:mt-0.5">
                    {timeAgo(ts)}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Layout>
  );
}
