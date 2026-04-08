import { useState, useEffect, useRef, useCallback, forwardRef } from "react";
import { useToast } from "@/lib/toast-context";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { DownloadPdfButton } from "@/components/ui";
import { createNotification } from "@/lib/notifications";
import { listByStudent, createRecord, removeRecord } from "@/lib/data";
import { buildFilename } from "@/lib/pdf-download";
import { getIdToken } from "@/lib/get-id-token";

export default function ReadinessInsight({ profile, academic, activities, achievements, placements, projects, skills }) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
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
    } catch (e) { /* history load is non-critical - fail silently */ }
  }, [profile?.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function analyze(attempt = 1) {
    setLoading(true);
    try {
      const token = await getIdToken();
      const resp = await fetch("/api/analyze-readiness", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ profile, academic, activities, achievements, placements, projects, skills }),
      });

      // Handle Gemini High Demand (503) or Server Error with high-demand message with retry
      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        const msg = errorData.error || "AI Analysis failed";
        const status = resp.status;

        const isHighDemand = status === 503 || (status === 500 && msg.toLowerCase().includes("high demand"));

        if (isHighDemand && attempt < 5) {
          const delay = attempt * 2000;
          console.warn(`Career Intelligence high demand detected. Retrying in ${delay}ms... (Attempt ${attempt}/5)`);
          await new Promise(r => setTimeout(r, delay));
          return analyze(attempt + 1);
        }

        // Final failure after retries
        console.error("Career Intelligence extraction failed:", msg);
        let userMessage = "AI Analysis failed. Please try again.";
        if (isHighDemand) {
          userMessage = "AI is currently experiencing peak demand. Please wait a moment and try again.";
        }
        addToast(userMessage, "error");
        return;
      }

      const result = await resp.json();
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
      console.error("Analysis Critical Failure:", err);
      addToast("A communication error occurred. Please refresh and try again.", "error");
    } finally {
      if (attempt === 1) setLoading(false);
    }
  }

  const scoreColor = (s) => s > 75 ? "text-emerald-500" : s >= 50 ? "text-amber-500" : "text-red-500";
  const scoreBg = (s) => s > 75 ? "bg-emerald-700 border-emerald-700 text-white" : s >= 50 ? "bg-amber-700 border-amber-700 text-white" : "bg-red-700 border-red-700 text-white";
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
        title="Career Intelligence Report"
        maxWidth="max-w-3xl"
      >
        {selectedReport && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <DownloadPdfButton
                elementRef={pdfRef}
                filename={buildFilename("Career_Report", profile?.name || "Student")}
                label="Download PDF"
                orientation="portrait"
              />
            </div>
            <ReportContent
              ref={pdfRef}
              report={selectedReport}
              profile={profile}
              labelColor={labelColor}
            />
          </div>
        )}
      </Modal>

      {/* Generate button */}
      <section className="premium-card p-12 text-center border-2 border-dashed border-brand-200 bg-brand-50/20 hover:bg-brand-50/40 group overflow-hidden relative">
        <div className="max-w-md mx-auto relative z-10">
          <div className="mb-8 inline-flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-white text-brand-600 group-hover:rotate-10 transition-all duration-500 shadow-2xl shadow-brand-500/10 border border-brand-100">
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
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{history.length} Reports</p>
        </div>

        {history.length === 0 ? (
          <EmptyState title="Intelligence Vault Empty" message="Generate your first report to start your professional vault." />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {history.map((h) => {
              const accentColor = h.score > 75 ? "border-emerald-500" : h.score >= 50 ? "border-amber-500" : "border-rose-500";
              const accentBg = h.score > 75 ? "bg-emerald-50" : h.score >= 50 ? "bg-amber-50" : "bg-rose-50";

              return (
                <div key={h.id} className={`premium-card p-6 border-l-[6px] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${accentColor}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`h-14 w-14 rounded-2xl flex flex-col items-center justify-center shadow-sm border border-slate-100 bg-white shrink-0`}>
                      <span className={`text-xl font-black leading-tight ${scoreColor(h.score)}`}>{h.score}</span>
                      <span className="text-[7px] uppercase font-black text-slate-400 tracking-widest">Score</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-900 truncate">{h.createdAtString || "Report"}</p>
                      <p className={`text-[10px] font-black uppercase tracking-[0.2em] mt-0.5 ${scoreColor(h.score)}`}>
                        {h.label}
                      </p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border border-slate-100 mb-5 ${accentBg}/30`}>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 italic font-medium">&ldquo;{h.summary}&rdquo;</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedReport(h)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-brand-700 text-white hover:bg-brand-800 shadow-lg shadow-brand-900/10 transition-all active:scale-95"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Report
                    </button>
                    <button
                      onClick={() => setDeleteTarget(h.id)}
                      className="h-11 w-11 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all active:scale-90"
                      title="Purge Report"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * Responsive report card. Accepts a forwarded ref so the parent can pass
 * it to DownloadPdfButton - pdf-download.js clones the element into a
 * fixed-size body container before capturing, so overflow-hidden / scroll
 * containers don't cause blank PDFs.
 */
const ReportContent = forwardRef(function ReportContent({ report, profile, labelColor }, ref) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference * (1 - report.score / 100);
  const scoreCol = labelColor(report.score);

  return (
    <div ref={ref} className="flex flex-col bg-white rounded-2xl border border-slate-100">

      {/* Header - score badge stacks below on mobile, beside on sm+ */}
      <div className="flex flex-col gap-4 border-b-4 border-sky-500 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black text-sky-500 uppercase tracking-[3px] mb-1">Department Ledger Portal</p>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 leading-tight">Career Intelligence Report</h2>
            <p className="text-xs text-slate-500 mt-1 truncate">{profile?.name} · {report.createdAtString}</p>
          </div>
          {/* Score ring - always visible, no negative margin tricks */}
          <div className="flex flex-col items-center shrink-0 gap-1">
            <div className="relative flex items-center justify-center">
              <svg width="64" height="64" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="14" />
                <circle cx="50" cy="50" r="40" fill="none" stroke={scoreCol} strokeWidth="14"
                  strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
              </svg>
              <span className="absolute text-lg font-black text-slate-900">{report.score}</span>
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: scoreCol }}>{report.label}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-4 p-4 sm:p-6">

        {/* Summary */}
        <div className="flex flex-col gap-2 bg-slate-900 border-l-4 border-brand-500 rounded-lg p-5 text-white shadow-xl">
          <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest">Executive Summary</p>
          <p className="text-sm font-medium leading-relaxed opacity-90">{report.summary}</p>
        </div>

        {/* Strengths + Gaps - stack on mobile, side by side on sm+ */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col gap-3 flex-1 bg-emerald-700 rounded-xl p-5 text-white shadow-lg shadow-emerald-900/10">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Core Strengths</p>
            <ul className="flex flex-col gap-2">
              {report.strengths?.map((s, i) => (
                <li key={i} className="flex gap-2 text-xs leading-relaxed font-medium">
                  <span className="font-black text-emerald-300 shrink-0 mt-px">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3 flex-1 bg-red-700 rounded-xl p-5 text-white shadow-lg shadow-red-900/10">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Critical Gaps</p>
            <ul className="flex flex-col gap-2">
              {report.weaknesses?.map((w, i) => (
                <li key={i} className="flex gap-2 text-xs leading-relaxed font-medium">
                  <span className="font-black text-rose-300 shrink-0 mt-px">!</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recommendations */}
        <div className="flex flex-col gap-3 bg-brand-700 rounded-xl p-6 text-white shadow-xl shadow-brand-900/10">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Action Roadmap</p>
          <ol className="flex flex-col gap-3">
            {report.recommendations?.map((r, i) => (
              <li key={i} className="flex gap-4 text-xs font-medium leading-relaxed">
                <span className="shrink-0 flex items-center justify-center bg-white text-brand-700 rounded font-black text-[10px] h-5 w-5 mt-px shadow-sm">{i + 1}</span>
                <span>{r}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Career Trajectory */}
        <div className="flex flex-col gap-2 rounded-lg p-4">
          <p className="text-[9px] font-black text-sky-400 uppercase tracking-widest">Career Trajectory</p>
          <p className="text-xs text-slate-300 leading-relaxed italic">&ldquo;{report.careerRoadmap}&rdquo;</p>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">Department Ledger Portal · Powered by Gemini AI</p>
          <p className="text-xs text-slate-500">{report.createdAtString}</p>
        </div>
      </div>
    </div>
  );
});
