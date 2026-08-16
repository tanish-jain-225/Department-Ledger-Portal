import { useEffect, useState, useRef } from "react";
import { collection, getDocs, limit, orderBy, query, startAfter } from "firebase/firestore";
import Layout, { ACCESS } from "@/components/Layout";
import { Button, EmptyState, Skeleton, Badge } from "@/components/ui";
import { getDb } from "@/lib/firebase";
import { PAGE_SIZE } from "@/lib/constants";

const ACTION_STYLES = {
  delete: { color: "bg-red-600 text-white", label: "Deleted" },
  deleted: { color: "bg-red-600 text-white", label: "Deleted" },
  removed: { color: "bg-red-600 text-white", label: "Removed" },
  rejected: { color: "bg-red-600 text-white", label: "Rejected" },

  created: { color: "bg-emerald-600 text-white", label: "Created" },
  added: { color: "bg-emerald-600 text-white", label: "Added" },
  approved: { color: "bg-emerald-600 text-white", label: "Approved" },
  assigned: { color: "bg-emerald-600 text-white", label: "Assigned" },

  updated: { color: "bg-brand-700 text-white", label: "Updated" },
  modified: { color: "bg-brand-700 text-white", label: "Modified" },
  changed: { color: "bg-brand-700 text-white", label: "Changed" },
  processed: { color: "bg-brand-700 text-white", label: "Processed" },

  login: { color: "bg-slate-700 text-white", label: "Session" },
  logout: { color: "bg-slate-700 text-white", label: "Session" },
  system: { color: "bg-slate-700 text-white", label: "System" },
};

function getActionStyle(action = "") {
  const lowAction = action.toLowerCase();
  if (ACTION_STYLES[lowAction]) return ACTION_STYLES[lowAction];

  if (lowAction.includes("delete") || lowAction.includes("remove") || lowAction.includes("purge"))
    return ACTION_STYLES.delete;
  if (lowAction.includes("create") || lowAction.includes("add") || lowAction.includes("approve"))
    return ACTION_STYLES.created;
  if (lowAction.includes("update") || lowAction.includes("modify") || lowAction.includes("change"))
    return ACTION_STYLES.updated;
  if (lowAction.includes("login") || lowAction.includes("logout") || lowAction.includes("session"))
    return ACTION_STYLES.login;

  return { color: "bg-slate-700 text-white", label: action.replace(/_/g, " ").toUpperCase() };
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const lastDocRef = useRef(null);

  useEffect(() => {
    async function load() {
      const db = getDb();
      if (!db) return;
      try {
        const q = query(
          collection(db, "auditLogs"), 
          orderBy("timestamp", "desc"), 
          limit(PAGE_SIZE.AUDIT_LOGS)
        );
        const snap = await getDocs(q);
        setRows(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
        setHasMore(snap.docs.length === PAGE_SIZE.AUDIT_LOGS);
        lastDocRef.current = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
      } catch (e) {
        setErr(e?.message || "Could not load audit logs.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function loadMore() {
    if (!lastDocRef.current || loadingMore) return;
    setLoadingMore(true);
    const db = getDb();
    if (!db) return;
    try {
      const q = query(
        collection(db, "auditLogs"),
        orderBy("timestamp", "desc"),
        startAfter(lastDocRef.current),
        limit(PAGE_SIZE.AUDIT_LOGS)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      setRows(prev => {
        const ids = new Set(prev.map(r => r.id));
        return [...prev, ...data.filter(r => !ids.has(r.id))];
      });
      setHasMore(data.length === PAGE_SIZE.AUDIT_LOGS);
      lastDocRef.current = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    } catch (e) {
      setErr(e?.message || "Could not load more logs.");
    } finally {
      setLoadingMore(false);
    }
  }

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
    <Layout title="Audit Logs" access={ACCESS.ADMIN}>
      <div className="flex-1 w-full max-w-7xl mx-auto px-3 min-[360px]:px-6 py-4 min-[360px]:py-8 space-y-6 min-[360px]:space-y-8 animate-slide-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl min-[340px]:text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Audit Trail</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Real-time log of administrative and system operations.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={downloadCSV}
              disabled={rows.length === 0}
              variant="secondary"
              className="w-full sm:w-auto text-xs font-bold py-2.5"
            >
              <svg className="h-4 w-4 mr-1.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV ({rows.length})
            </Button>
          </div>
        </div>

        {err ? (
          <div className="premium-card p-4 bg-red-50 border-red-200 flex items-start gap-3 text-red-800">
            <svg className="h-5 w-5 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Log Retrieval Notice</p>
              <p className="text-xs mt-0.5">{err}</p>
            </div>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="premium-card p-4 border border-slate-100 flex items-center justify-between gap-4 animate-pulse">
                <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="No Audit Logs Recorded"
            message="No administrative operations have been logged yet."
          />
        ) : (
          <div className="space-y-3 min-w-0">
            {rows.map((r) => {
              const style = getActionStyle(r.action);
              const date = r.timestamp?.toDate?.() || null;
              const actionLabel = r.actionLabel || style.label || (r.action || "Unknown");
              const details = r.details && typeof r.details === "object" ? r.details : {};

              return (
                <div key={r.id} className="premium-card p-3.5 min-[360px]:p-4 border border-slate-200 bg-white transition-all hover:border-slate-300 min-w-0">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`mt-0.5 h-8 w-8 min-[360px]:h-9 min-[360px]:w-9 rounded-xl flex items-center justify-center shrink-0 ${style.color}`}>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${style.color}`}>
                          {actionLabel}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">{timeAgo(date)}</span>
                        {date && (
                          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                            · {date.toLocaleString()}
                          </span>
                        )}
                      </div>

                      <p className="mt-1.5 text-xs sm:text-sm font-semibold text-slate-900 leading-snug break-words">
                        {r.description || "No description provided."}
                      </p>

                      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                        {r.actorUid && (
                          <span>Actor: <strong className="text-slate-700 font-mono">{r.actorUid.slice(-8)}</strong></span>
                        )}
                        {r.targetUid && (
                          <span>Target: <strong className="text-slate-700 font-mono">{r.targetUid.slice(-8)}</strong></span>
                        )}
                      </div>

                      {Object.keys(details).length > 0 && (
                        <div className="mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[10px] text-slate-600 font-mono break-all">
                          {JSON.stringify(details)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {hasMore && (
              <div className="flex justify-center mt-6">
                <Button 
                  onClick={loadMore} 
                  loading={loadingMore} 
                  variant="secondary"
                  size="sm"
                  className="px-6"
                >
                  Load More Logs
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
