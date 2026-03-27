import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/lib/toast-context";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { createNotification } from "@/lib/notifications";
import { listByStudent, createRecord, removeRecord } from "@/lib/data";
import { downloadAsPDF } from "@/lib/pdf-download";

export default function ReadinessInsight({ profile, academic, activities, achievements, placements, projects, skills }) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const pdfRef = useRef(null);

  const loadHistory = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const reports = await listByStudent("aiReports", profile.id);
      setHistory(reports.sort((a, b) => {
        const da = a.createdAt?.toDate?.() || new Date(0);
        const db = b.createdAt?.toDate?.() || new Date(0);
        return db - da;
      }));
    } catch (e) { console.error("History load failed", e); }
  }, [profile?.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function analyze() {
    setLoading(true);
    try {
      const resp = await fetch("/api/analyze-readiness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, academic, activities, achievements, placements, projects, skills }),
      });
      const result = await resp.json();
      if (result.error) throw new Error(result.error);
      await createRecord("aiReports", {
        studentUid: profile.id,
        ...result,
        createdAtString: new Date().toLocaleDateString(),
      });
      addToast("Intelligence report saved to vault!", "success");
      await loadHistory();
      await createNotification(profile.id, {
        title: "AI Report Ready",
        message: "Your placement readiness report has been generated.",
        type: "info",
        link: "/profile?tab=intelligence",
      });
    } catch (err) {
      addToast(err.message || "AI Analysis failed", "error");
    } finally {
      setLoading(false);
    }
  }

  const handleDownloadPDF = () => {
    const el = pdfRef.current;
    if (!el) return;
    setPdfBusy(true);
    downloadAsPDF(
      el,
      `Career_Report_${profile?.name || "Student"}`,
      () => setPdfBusy(false),
      (msg) => { addToast(msg, "error"); setPdfBusy(false); }
    );
  };

  const scoreColor = (s) => s > 75 ? "text-emerald-500" : s >= 50 ? "text-amber-500" : "text-red-500";
  const scoreBg = (s) => s > 75 ? "bg-emerald-50 border-emerald-100" : s >= 50 ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100";
  const labelColor = (s) => s > 75 ? "#10b981" : s >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="space-y-10 animate-slide-up">

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Report?"
        message="Are you sure you want to delete this intelligence report? This action cannot be undone."
        onConfirm={async () => {
          try {
            await removeRecord("aiReports", deleteTarget, { actorUid: profile.id, description: "Deleted AI Readiness Report" });
            addToast("Report deleted", "success");
            setDeleteTarget(null);
            loadHistory();
          } catch { addToast("Failed to delete report", "error"); }
        }}
        onCancel={() => setDeleteTarget(null)}
        variant="danger"
      />

      {/* Preview Modal */}
      <Modal
        open={!!selectedReport}
        onClose={() => { setSelectedReport(null); }}
        title={
          <div className="flex items-center justify-between w-full pr-2">
            <span>Career Intelligence Report</span>
            <button
              onClick={handleDownloadPDF}
              disabled={pdfBusy}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-60 ml-4"
            >
              {pdfBusy
                ? <><div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
                : <><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Download PDF</>
              }
            </button>
          </div>
        }
        maxWidth="max-w-2xl"
      >
        {selectedReport && (
          /* This div is what gets captured by html2pdf */
          <div
            ref={pdfRef}
            style={{
              fontFamily: "Arial, sans-serif",
              background: "#ffffff",
              padding: "48px 52px",
              color: "#0f172a",
              width: "794px",
              boxSizing: "border-box",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #0ea5e9", paddingBottom: "18px", marginBottom: "24px" }}>
              <div>
                <p style={{ fontSize: "9px", fontWeight: 900, color: "#0ea5e9", textTransform: "uppercase", letterSpacing: "3px", margin: "0 0 4px" }}>Department Ledger Portal</p>
                <h1 style={{ fontSize: "22px", fontWeight: 900, margin: "0 0 4px" }}>Career Intelligence Report</h1>
                <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>{profile?.name} · {selectedReport.createdAtString}</p>
              </div>
              <div style={{ textAlign: "center", minWidth: "80px" }}>
                <svg width="72" height="72" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)", display: "block" }}>
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke={labelColor(selectedReport.score)} strokeWidth="12"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - selectedReport.score / 100)}
                    strokeLinecap="round" />
                </svg>
                <p style={{ fontSize: "20px", fontWeight: 900, margin: "-50px 0 0", textAlign: "center", color: "#0f172a" }}>{selectedReport.score}</p>
                <p style={{ fontSize: "9px", fontWeight: 900, color: labelColor(selectedReport.score), textTransform: "uppercase", letterSpacing: "2px", marginTop: "18px" }}>{selectedReport.label}</p>
              </div>
            </div>

            {/* Summary */}
            <div style={{ background: "#f0f9ff", borderLeft: "4px solid #0ea5e9", borderRadius: "8px", padding: "14px 18px", marginBottom: "20px" }}>
              <p style={{ fontSize: "9px", fontWeight: 900, color: "#0ea5e9", textTransform: "uppercase", letterSpacing: "2px", margin: "0 0 6px" }}>Executive Summary</p>
              <p style={{ fontSize: "12px", color: "#334155", lineHeight: 1.7, margin: 0 }}>{selectedReport.summary}</p>
            </div>

            {/* Strengths + Gaps */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
              <div style={{ flex: 1, background: "#f0fdf4", borderRadius: "8px", padding: "14px 18px" }}>
                <p style={{ fontSize: "9px", fontWeight: 900, color: "#16a34a", textTransform: "uppercase", letterSpacing: "2px", margin: "0 0 10px" }}>Core Strengths</p>
                {selectedReport.strengths?.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
                    <span style={{ color: "#16a34a", fontWeight: 900, fontSize: "12px" }}>✓</span>
                    <p style={{ fontSize: "11px", color: "#166534", margin: 0, lineHeight: 1.5 }}>{s}</p>
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, background: "#fff7ed", borderRadius: "8px", padding: "14px 18px" }}>
                <p style={{ fontSize: "9px", fontWeight: 900, color: "#ea580c", textTransform: "uppercase", letterSpacing: "2px", margin: "0 0 10px" }}>Critical Gaps</p>
                {selectedReport.weaknesses?.map((w, i) => (
                  <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
                    <span style={{ color: "#ea580c", fontWeight: 900, fontSize: "12px" }}>!</span>
                    <p style={{ fontSize: "11px", color: "#9a3412", margin: 0, lineHeight: 1.5 }}>{w}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div style={{ background: "#eff6ff", borderRadius: "8px", padding: "14px 18px", marginBottom: "20px" }}>
              <p style={{ fontSize: "9px", fontWeight: 900, color: "#2563eb", textTransform: "uppercase", letterSpacing: "2px", margin: "0 0 10px" }}>Action Roadmap</p>
              {selectedReport.recommendations?.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "8px", alignItems: "flex-start" }}>
                  <span style={{ background: "#2563eb", color: "#fff", borderRadius: "4px", minWidth: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 900 }}>{i + 1}</span>
                  <p style={{ fontSize: "11px", color: "#1e3a8a", margin: 0, lineHeight: 1.6 }}>{r}</p>
                </div>
              ))}
            </div>

            {/* Career Trajectory */}
            <div style={{ background: "#0f172a", borderRadius: "8px", padding: "14px 18px", marginBottom: "20px" }}>
              <p style={{ fontSize: "9px", fontWeight: 900, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "2px", margin: "0 0 6px" }}>Career Trajectory</p>
              <p style={{ fontSize: "11px", color: "#cbd5e1", lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>&ldquo;{selectedReport.careerRoadmap}&rdquo;</p>
            </div>

            {/* Footer */}
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px", display: "flex", justifyContent: "space-between" }}>
              <p style={{ fontSize: "9px", color: "#94a3b8", margin: 0 }}>Department Ledger Portal · Powered by Gemini AI</p>
              <p style={{ fontSize: "9px", color: "#94a3b8", margin: 0 }}>{selectedReport.createdAtString}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Generate button */}
      <section className="premium-card p-12 text-center border-2 border-dashed border-brand-200 bg-brand-50/20 hover:bg-brand-50/40 group overflow-hidden relative">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl group-hover:bg-brand-500/10 transition-all duration-700" />
        <div className="max-w-md mx-auto relative z-10">
          <div className="mb-8 inline-flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-white text-brand-600 group-hover:rotate-[10deg] transition-all duration-500 shadow-2xl shadow-brand-500/10 border border-brand-100">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">AI Placement Pulse</h2>
          <p className="mt-3 text-slate-500 font-medium leading-relaxed italic">&ldquo;Unlock deep career insights and a personalized readiness score powered by Gemini AI.&rdquo;</p>
          <Button onClick={analyze} disabled={loading} className="mt-10 px-12 py-5 text-base">
            {loading ? "Analysing your profile..." : "Generate Intelligence Report"}
          </Button>
        </div>
      </section>

      {/* Intelligence Vault */}
      <section>
        <div className="mb-6">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Intelligence Vault</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{history.length} Reports</p>
        </div>

        {history.length === 0 ? (
          <EmptyState title="Intelligence Vault Empty" message="Generate your first report to start your professional vault." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {history.map((h) => (
              <div key={h.id} className={`premium-card p-6 border transition-all duration-300 hover:shadow-lg ${scoreBg(h.score)}`}>
                <div className="flex items-center gap-4 mb-3">
                  <div className="h-14 w-14 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center shadow-lg flex-shrink-0">
                    <span className={`text-xl font-black leading-tight ${scoreColor(h.score)}`}>{h.score}</span>
                    <span className="text-[7px] uppercase font-black text-slate-400 tracking-widest">/ 100</span>
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">{h.createdAtString || "Report"}</p>
                    <p className={`text-xs font-black uppercase tracking-widest mt-0.5 ${scoreColor(h.score)}`}>{h.label}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4 italic">&ldquo;{h.summary}&rdquo;</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedReport(h)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-brand-600 transition-all active:scale-95"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Report
                  </button>
                  <button
                    onClick={() => setDeleteTarget(h.id)}
                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all active:scale-90"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
