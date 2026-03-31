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
    } catch (e) { /* history load is non-critical — fail silently */ }
  }, [profile?.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function analyze() {
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
                windowWidth={794}
                className="text-xs px-3 py-1.5"
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

/**
 * Responsive report card. Accepts a forwarded ref so the parent can pass
 * it to DownloadPdfButton — pdf-download.js clones the element into a
 * fixed-size body container before capturing, so overflow-hidden / scroll
 * containers don't cause blank PDFs.
 */
const ReportContent = forwardRef(function ReportContent({ report, profile, labelColor }, ref) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference * (1 - report.score / 100);
  const scoreCol = labelColor(report.score);

  return (
    <div ref={ref} className="flex flex-col bg-white rounded-2xl border border-slate-100 overflow-hidden">

      {/* Header — score badge stacks below on mobile, beside on sm+ */}
      <div className="flex flex-col gap-4 border-b-4 border-sky-500 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black text-sky-500 uppercase tracking-[3px] mb-1">Department Ledger Portal</p>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 leading-tight">Career Intelligence Report</h2>
            <p className="text-xs text-slate-500 mt-1 truncate">{profile?.name} · {report.createdAtString}</p>
          </div>
          {/* Score ring — always visible, no negative margin tricks */}
          <div className="flex flex-col items-center flex-shrink-0 gap-1">
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
        <div className="flex flex-col gap-2 bg-sky-50 border-l-4 border-sky-500 rounded-lg p-4">
          <p className="text-[9px] font-black text-sky-500 uppercase tracking-widest">Executive Summary</p>
          <p className="text-sm text-slate-700 leading-relaxed">{report.summary}</p>
        </div>

        {/* Strengths + Gaps — stack on mobile, side by side on sm+ */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col gap-2 flex-1 bg-green-50 rounded-lg p-4">
            <p className="text-[9px] font-black text-green-700 uppercase tracking-widest">Core Strengths</p>
            <ul className="flex flex-col gap-1.5">
              {report.strengths?.map((s, i) => (
                <li key={i} className="flex gap-2 text-xs text-green-800 leading-relaxed">
                  <span className="font-black text-green-600 flex-shrink-0 mt-px">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-2 flex-1 bg-orange-50 rounded-lg p-4">
            <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest">Critical Gaps</p>
            <ul className="flex flex-col gap-1.5">
              {report.weaknesses?.map((w, i) => (
                <li key={i} className="flex gap-2 text-xs text-orange-900 leading-relaxed">
                  <span className="font-black text-orange-500 flex-shrink-0 mt-px">!</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recommendations */}
        <div className="flex flex-col gap-2 bg-blue-50 rounded-lg p-4">
          <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Action Roadmap</p>
          <ol className="flex flex-col gap-2">
            {report.recommendations?.map((r, i) => (
              <li key={i} className="flex gap-3 text-xs text-blue-900 leading-relaxed">
                <span className="flex-shrink-0 flex items-center justify-center bg-blue-600 text-white rounded font-black text-[9px] h-5 w-5 mt-px">{i + 1}</span>
                <span>{r}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Career Trajectory */}
        <div className="flex flex-col gap-2 bg-slate-900 rounded-lg p-4">
          <p className="text-[9px] font-black text-sky-400 uppercase tracking-widest">Career Trajectory</p>
          <p className="text-xs text-slate-300 leading-relaxed italic">&ldquo;{report.careerRoadmap}&rdquo;</p>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 pt-2 border-t border-slate-100">
          <p className="text-[9px] text-slate-400">Department Ledger Portal · Powered by Gemini AI</p>
          <p className="text-[9px] text-slate-400">{report.createdAtString}</p>
        </div>
      </div>
    </div>
  );
});
