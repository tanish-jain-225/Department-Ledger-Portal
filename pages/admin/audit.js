import { useEffect, useState } from "react";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import Layout, { ACCESS } from "@/components/Layout";
import { Button, EmptyState, Skeleton } from "@/components/ui";
import { getDb } from "@/lib/firebase";

const ACTION_STYLES = {
  // Destructive (Red 700)
  delete: { color: "bg-red-700", label: "Purge Protocol" },
  deleted: { color: "bg-red-700", label: "Purge Protocol" },
  removed: { color: "bg-red-700", label: "Removed" },
  rejected: { color: "bg-red-700", label: "Rejected" },

  // Constructive (Emerald 700)
  created: { color: "bg-emerald-700", label: "Creation" },
  added: { color: "bg-emerald-700", label: "Addition" },
  approved: { color: "bg-emerald-700", label: "Approved" },
  assigned: { color: "bg-emerald-700", label: "Assigned" },

  // Informative (Brand 700)
  updated: { color: "bg-brand-700", label: "Update" },
  modified: { color: "bg-brand-700", label: "Modification" },
  changed: { color: "bg-brand-700", label: "Change" },
  processed: { color: "bg-brand-700", label: "Processed" },

  // System (Slate 900)
  login: { color: "bg-slate-900", label: "Session" },
  logout: { color: "bg-slate-900", label: "Session" },
  system: { color: "bg-slate-900", label: "System" },
};

function getActionStyle(action = "") {
  const lowAction = action.toLowerCase();

  // Try exact match first
  if (ACTION_STYLES[lowAction]) return ACTION_STYLES[lowAction];

  // Try suffix/keyword match
  if (lowAction.includes("delete") || lowAction.includes("remove") || lowAction.includes("purge"))
    return ACTION_STYLES.delete;
  if (lowAction.includes("create") || lowAction.includes("add") || lowAction.includes("approve"))
    return ACTION_STYLES.created;
  if (lowAction.includes("update") || lowAction.includes("modify") || lowAction.includes("change"))
    return ACTION_STYLES.updated;
  if (lowAction.includes("login") || lowAction.includes("logout") || lowAction.includes("session"))
    return ACTION_STYLES.login;

  return { color: "bg-slate-900", label: action.replace(/_/g, " ").toUpperCase() };
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

    const escapeCell = (value) => {
      const text = String(value ?? "");
      if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
      return text;
    };

    const headers = ["ID", "Timestamp", "Action", "Action Label", "Sector", "Description", "Actor UID", "Target UID", "Details"];
    const csvRows = rows.map((r) => {
      const timestamp = r.timestamp?.toDate?.()?.toISOString() || "";
      const actionLabel = r.actionLabel || r.action || "";
      const sector = r.sector || (r.action?.split("_")[0]?.toUpperCase() || "SYSTEM");
      return [
        escapeCell(r.id),
        escapeCell(timestamp),
        escapeCell(r.action || ""),
        escapeCell(actionLabel),
        escapeCell(sector),
        escapeCell(r.description || ""),
        escapeCell(r.actorUid || ""),
        escapeCell(r.targetUid || ""),
        escapeCell(JSON.stringify(r.details || {})),
      ];
    });

    const csvContent = [headers, ...csvRows].map((row) => row.join(",")).join("\n");
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
            <p className="text-base text-slate-500 mt-2 font-medium">Real-time oversight of administrative and professional operations.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-700 animate-pulse" />
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
          <div className="premium-card p-8 bg-red-700 border-red-800 flex items-start gap-5 text-white shadow-xl">
            <div className="h-10 w-10 shrink-0 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-red-100">Protocol Incident Detected</p>
              <p className="text-sm font-medium mt-1 leading-relaxed opacity-90">{err}</p>
            </div>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
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
              const actionLabel = r.actionLabel || style.label || (r.action || "Unknown");
              const sector = r.sector || (r.action?.split("_")[0]?.toUpperCase() || "SYSTEM");
              const details = r.details && typeof r.details === "object" ? r.details : {};

              return (
                <div key={r.id} className="group premium-card p-6 border border-slate-200 bg-white transition-all shadow-sm hover:shadow-md hover:border-brand-200">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-5">
                      <div className={`mt-1 h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-slate-900/5 ${style.color} text-white`}>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] text-white ${style.color}`}>
                            {actionLabel}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{timeAgo(date)}</span>
                        </div>
                        <p className="mt-4 text-sm font-black text-slate-900 tracking-tight leading-snug">{r.description || "No description provided."}</p>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <DataPoint label="Actor" value={r.actorUid || "SYSTEM"} />
                          <DataPoint label="Target" value={r.targetUid || "N/A"} />
                          <DataPoint label="Sector" value={sector} />
                          <DataPoint label="Timestamp" value={date ? date.toLocaleString() : "Unknown"} />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <Button variant="secondary" size="sm" className="font-black" title="Inspect Audit">
                        Details
                      </Button>
                    </div>
                  </div>

                  {Object.keys(details).length > 0 && (
                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-4 font-black">Audit Telemetry Payload</p>
                      <div className="grid gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                        {Object.entries(details).map(([key, value]) => (
                          <div key={key} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0 w-24">{key}</span>
                            <span className="break-all text-xs font-bold text-slate-700">{typeof value === "object" ? JSON.stringify(value) : String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

function DataPoint({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-xs text-slate-900 font-bold truncate max-w-[150px]" title={value}>{value}</span>
    </div>
  );
}
