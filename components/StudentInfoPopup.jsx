import { useState, useEffect } from "react";
import { getDoc, doc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { listByStudent } from "@/lib/data";
import { useAuth } from "@/lib/auth-context";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { downloadStudentsCsv } from "@/lib/csv-download";
import { computeReport } from "@/lib/student-analytics";

// ── Report popup ─────────────────────────────────────────────────────────────

function ReportPopup({ data, lists, onClose }) {
  const r = computeReport(data, lists);

  const ringColor = r.overall >= 75 ? "#10b981" : r.overall >= 50 ? "#f59e0b" : "#ef4444";
  const circumference = 2 * Math.PI * 36;
  const offset = circumference * (1 - r.overall / 100);

  const verdictColors = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    brand:   "bg-brand-50 text-brand-700 border-brand-200",
    amber:   "bg-amber-50 text-amber-700 border-amber-200",
    red:     "bg-red-50 text-red-700 border-red-200",
  };

  const barColor = (pct) =>
    pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <Modal title="Student Profile Report" open={true} onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex flex-col gap-6 p-1">

        {/* ── Header: score + identity ── */}
        <div className="flex flex-col sm:flex-row items-center gap-5 p-5 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="relative flex items-center justify-center flex-shrink-0">
            <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="48" cy="48" r="36" fill="none" stroke="#e2e8f0" strokeWidth="10" />
              <circle cx="48" cy="48" r="36" fill="none" stroke={ringColor} strokeWidth="10"
                strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-slate-900">{r.overall}</span>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">/ 100</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-center sm:text-left flex-1 min-w-0">
            <p className="text-xl font-black text-slate-900 tracking-tight truncate">{data.name}</p>
            <p className="text-xs text-slate-500 truncate">{data.email}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              {data.branch && <Badge variant="brand">{data.branch}</Badge>}
              {data.year && <Badge variant="brand">Year {data.year}</Badge>}
              <span className={`px-3 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${verdictColors[r.verdict.color]}`}>
                {r.verdict.label}
              </span>
            </div>
          </div>
        </div>

        {/* ── Quick stats row ── */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Avg GPA",      value: r.avgGpa || "—",       sub: r.gpaTrend !== "stable" ? r.gpaTrend : null },
            { label: "Latest GPA",   value: r.latestGpa || "—",    sub: null },
            { label: "Semesters",    value: r.academicCount,        sub: null },
            { label: "Achievements", value: lists.achievements.length, sub: r.hasNational ? "Natl/Intl" : null },
            { label: "Activities",   value: lists.activities.length,   sub: r.actDiversity > 0 ? `${r.actDiversity} types` : null },
            { label: "Internships",  value: r.internships.length,      sub: r.placed ? "Placed ✓" : null },
          ].map((s, i) => (
            <div key={i} className="flex flex-col gap-0.5 flex-1 min-w-[90px] p-3 rounded-xl bg-white border border-slate-100 text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
              <p className="text-lg font-black text-slate-900">{s.value}</p>
              {s.sub && <p className="text-[9px] font-bold text-brand-600 uppercase tracking-widest">{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* ── Profile completeness ── */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Profile Completeness</p>
          <BarRow label="Profile Fields" pct={r.profilePct} barColor={barColor(r.profilePct)}
            sub={r.missingProfile.length === 0 ? "All fields filled" : `Missing: ${r.missingProfile.slice(0, 3).join(", ")}${r.missingProfile.length > 3 ? ` +${r.missingProfile.length - 3}` : ""}`} />
          {r.sectionScores.map(s => (
            <BarRow key={s.key}
              label={`${s.icon} ${s.label}`}
              pct={s.pct}
              barColor={barColor(s.pct)}
              sub={s.met ? `${s.count} records — target met` : `${s.count} / ${s.min} minimum`}
            />
          ))}
        </div>

        {/* ── Academic performance ── */}
        {r.avgGpa && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Academic Performance</p>
            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white border border-slate-100">
              <div className="flex flex-wrap gap-4 text-xs">
                <span><span className="font-black text-slate-900">{r.avgGpa}</span> <span className="text-slate-400">avg GPA</span></span>
                <span><span className="font-black text-slate-900">{r.highestGpa}</span> <span className="text-slate-400">highest</span></span>
                <span><span className="font-black text-slate-900">{r.lowestGpa}</span> <span className="text-slate-400">lowest</span></span>
                <span className={`font-black uppercase tracking-widest ${r.gpaTrend === "improving" ? "text-emerald-600" : r.gpaTrend === "declining" ? "text-red-500" : "text-slate-400"}`}>
                  {r.gpaTrend === "improving" ? "↑ Improving" : r.gpaTrend === "declining" ? "↓ Declining" : "→ Stable"}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.min((parseFloat(r.avgGpa) / 10) * 100, 100)}%`, background: barColor(parseFloat(r.avgGpa) >= 7 ? 80 : parseFloat(r.avgGpa) >= 6 ? 55 : 30) }} />
              </div>
              <p className="text-[10px] text-slate-400 capitalize">{r.gpaRating.replace("-", " ")} academic standing</p>
            </div>
          </div>
        )}

        {/* ── Placement status ── */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Placement Status</p>
          <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white border border-slate-100">
            {r.placed ? (
              <div className="flex flex-col gap-1">
                <p className="text-sm font-black text-emerald-700">✓ Placed</p>
                <p className="text-xs text-slate-600">{r.placedAt.company}{r.placedAt.role ? ` · ${r.placedAt.role}` : ""}{r.maxPackage ? ` · ₹${r.maxPackage} LPA` : ""}</p>
              </div>
            ) : r.internships.length > 0 ? (
              <div className="flex flex-col gap-1">
                <p className="text-sm font-black text-brand-700">{r.internships.length} Internship{r.internships.length > 1 ? "s" : ""}</p>
                <p className="text-xs text-slate-500">{r.internships.map(i => i.company).join(", ")}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">No placement or internship records</p>
            )}
          </div>
        </div>

        {/* ── Strengths ── */}
        {r.strengths.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Strengths</p>
            {r.strengths.map((s, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 font-medium">
                <span className="flex-shrink-0 font-black">✓</span>{s}
              </div>
            ))}
          </div>
        )}

        {/* ── Recommendations ── */}
        {r.recommendations.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Recommendations</p>
            {r.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-800 font-medium">
                <span className="flex-shrink-0 font-black text-amber-500">{i + 1}.</span>{rec}
              </div>
            ))}
          </div>
        )}

      </div>
    </Modal>
  );
}

function BarRow({ label, pct, barColor, sub }) {
  return (
    <div className="flex flex-col gap-1.5 p-3 sm:p-4 rounded-2xl bg-white border border-slate-100">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-black text-slate-700">{label}</span>
        <span className="text-xs font-black flex-shrink-0" style={{ color: barColor }}>{Math.min(pct, 100)}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, background: barColor }} />
      </div>
      {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
    </div>
  );
}

// ── Main popup ────────────────────────────────────────────────────────────────

export default function StudentInfoPopup({ uid, onClose }) {
  const { profile: currentUser } = useAuth();
  const [data, setData] = useState(null);
  const [lists, setLists] = useState({ academic: [], activities: [], achievements: [], placements: [] });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    if (!uid) return;
    async function load() {
      setLoading(true);
      const db = getDb();
      if (!db) return;
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (!snap.exists()) { setErr("Student not found"); return; }
        setData({ id: snap.id, ...snap.data() });
        const [academic, activities, achievements, placements] = await Promise.all([
          listByStudent("academicRecords", uid),
          listByStudent("activities", uid),
          listByStudent("achievements", uid),
          listByStudent("placements", uid),
        ]);
        setLists({ academic, activities, achievements, placements });
      } catch (e) {
        setErr(e?.message || "Load failed");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [uid]);

  function handleCsvDownload() {
    if (!data) return;
    downloadStudentsCsv([data], `record-${data.name || uid}.csv`, { maskSensitive: false });
  }

  return (
    <>
      {showReport && data && (
        <ReportPopup data={data} lists={lists} onClose={() => setShowReport(false)} />
      )}

      <Modal title="Student Profile" open={!!uid} onClose={onClose} fullScreen={true}>
        {loading ? (
          <p className="text-slate-500 animate-pulse text-center py-12">Loading detailed records...</p>
        ) : err ? (
          <p className="py-12 text-center text-red-500">{err}</p>
        ) : data ? (
          <div className="flex flex-col gap-6 p-4 sm:p-6">

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                onClick={() => setShowReport(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black uppercase tracking-widest transition-all active:scale-95 w-full sm:w-auto"
              >
                <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View Profile Report
              </button>
              <button
                onClick={handleCsvDownload}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest transition-all active:scale-95 w-full sm:w-auto"
              >
                <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download CSV
              </button>
            </div>

            {/* Profile header */}
            <div className="flex flex-col gap-4 pb-5 border-b border-slate-100">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">{data.name}</h2>
                  <p className="text-sm text-slate-500 truncate">{data.email}</p>
                </div>
                <span className={`flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  data.facultyVerification === "approved"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : "bg-amber-50 text-amber-700 border-amber-100"
                }`}>
                  {data.facultyVerification === "approved" ? "Verified" : "Pending"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {data.branch && <Badge variant="brand">{data.branch}</Badge>}
                {data.year && <Badge variant="brand">Year {data.year}</Badge>}
                {data.alumni && <Badge variant="success">Alumni</Badge>}
                {data.phone && <span className="text-xs text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">{data.phone}</span>}
                {data.gender && <span className="text-xs text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">{data.gender}</span>}
              </div>
            </div>

            {/* Sections */}
            <div className="flex flex-col gap-6">
              <Section title="Academic Records" count={lists.academic.length} countVariant="brand">
                {lists.academic.length === 0 ? <Empty text="No academic records." /> :
                  lists.academic.map((r) => (
                    <Row key={r.id}>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <p className="text-sm font-black text-slate-900">Year {r.year} · Sem {r.semester}</p>
                        {r.branch && <p className="text-xs text-slate-400">{r.branch}</p>}
                        {r.subjects && <p className="text-xs text-slate-500 line-clamp-2">{r.subjects}</p>}
                      </div>
                      <Chip color="emerald">{r.gpa} GPA</Chip>
                    </Row>
                  ))
                }
              </Section>

              <Section title="Achievements" count={lists.achievements.length} countVariant="success">
                {lists.achievements.length === 0 ? <Empty text="No achievements." /> :
                  lists.achievements.map((r) => (
                    <Row key={r.id}>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <p className="text-sm font-black text-slate-900">{r.title}</p>
                        {r.issuer && <p className="text-xs text-slate-500">{r.issuer}</p>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                        <Chip color="brand">{r.level}</Chip>
                        {r.date && <span className="text-xs text-slate-400">{r.date}</span>}
                      </div>
                    </Row>
                  ))
                }
              </Section>

              <Section title="Activities" count={lists.activities.length} countVariant="brand">
                {lists.activities.length === 0 ? <Empty text="No activities." /> :
                  lists.activities.map((r) => (
                    <Row key={r.id}>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <p className="text-sm font-black text-slate-900">{r.title}</p>
                        {r.description && <p className="text-xs text-slate-500 line-clamp-1">{r.description}</p>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                        <Chip color="slate">{r.type}</Chip>
                        {r.date && <span className="text-xs text-slate-400">{r.date}</span>}
                      </div>
                    </Row>
                  ))
                }
              </Section>

              <Section title="Placements" count={lists.placements.length} countVariant="brand">
                {lists.placements.length === 0 ? <Empty text="No placements." /> :
                  lists.placements.map((r) => (
                    <Row key={r.id}>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <p className="text-sm font-black text-slate-900">{r.company}</p>
                        {r.role && <p className="text-xs text-slate-500">{r.role}</p>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                        <Chip color={r.status === "placed" ? "emerald" : "brand"}>{r.status}</Chip>
                        {r.package && <span className="text-xs font-black text-emerald-600">₹ {r.package}</span>}
                      </div>
                    </Row>
                  ))
                }
              </Section>
            </div>
          </div>
        ) : (
          <p className="py-12 text-center text-slate-500">No student data available.</p>
        )}
      </Modal>
    </>
  );
}

function Section({ title, count, countVariant, children }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">{title}</h3>
        <Badge variant={countVariant}>{count}</Badge>
      </div>
      {children}
    </section>
  );
}

function Row({ children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-100">
      {children}
    </div>
  );
}

function Chip({ color = "slate", children }) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    brand:   "bg-brand-50 text-brand-700 border-brand-100",
    slate:   "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase ${colors[color] || colors.slate}`}>
      {children}
    </span>
  );
}

function Empty({ text }) {
  return <p className="text-sm text-slate-400 italic py-2">{text}</p>;
}
