import React from "react";
import CommonFooter from "@/components/ui/CommonFooter";

export default function StudentCard({
  data,
  academic = [],
  activities = [],
  achievements = [],
  placements = [],
}) {
  if (!data) return null;

  return (
    <article className="mx-auto w-full max-w-full sm:max-w-4xl rounded-xl border border-brand-200 bg-white p-responsive shadow-md print:border-0 print:shadow-none print:p-0 overflow-hidden print:overflow-visible">

      {/* Header */}
      <header className="border-b-2 border-brand-100 pb-4 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-[10px] font-black text-brand-700 uppercase tracking-widest mb-1">
            Department Ledger Portal
          </p>
          <h1 className="text-xl min-[360px]:text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {data.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2 min-[360px]:gap-3 text-slate-500 text-xs min-[360px]:text-sm font-medium mt-1">
            <span className="truncate max-w-[200px]">{data.email}</span>
            {data.phone && <span className="hidden min-[360px]:inline">· {data.phone}</span>}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {data.linkedin && (
              <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded flex items-center gap-1">
                LinkedIn
              </span>
            )}
            {data.github && (
              <span className="text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded flex items-center gap-1">
                GitHub
              </span>
            )}
          </div>
        </div>
        {/* Official QR box removed as requested */}
      </header>

      {/* Core Profile Data */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 mb-10 print:break-inside-avoid">

        <dl className="grid grid-cols-3 gap-3">
          {[
            { label: "Gender", value: data.gender || "-" },
            { label: "Phone", value: data.phone || "-" },
            { label: "Date of Birth", value: data.dob || "-" }
          ].map((item, i) => (
            <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm">
              <dt className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">{item.label}</dt>
              <dd className="font-bold text-slate-900 truncate text-xs">{item.value}</dd>
            </div>
          ))}
        </dl>

        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm grow h-full">
            <h4 className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-2">Residential Address</h4>
            <p className="text-sm font-bold text-slate-800 leading-relaxed">
              {data.address || "No address provided -"}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-200">
              <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${data.alumni ? "bg-emerald-100 text-emerald-700" : "bg-brand-100 text-brand-700"}`}>
                {data.alumni ? "Alumni Status Verified" : "Regular Academic Status"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-10">
        {/* Academic Profile */}
        <section className="print:break-inside-avoid">

          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Academic Portfolio</h2>
            <div className="flex-1 h-px bg-slate-100"></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {academic.length === 0 && <p className="text-slate-400 text-xs italic py-2">No academic records found.</p>}
            {academic.map((r) => (
              <div key={r.id} className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm ring-1 ring-slate-50 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-black text-slate-900">Year {r.year} · Sem {r.semester}</span>
                  <span className="text-xs font-black text-brand-600 bg-brand-50 px-2 py-1 rounded-lg">GPA {r.gpa}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                    <span className="bg-slate-50 px-2 py-1 rounded border border-slate-100">Roll: {r.rollNumber || "-"}</span>
                    <span className="bg-slate-50 px-2 py-1 rounded border border-slate-100">Branch: {r.branch || "-"}</span>
                  </div>
                  {r.subjects && (
                    <p className="text-xs text-slate-500 leading-relaxed italic line-clamp-2">
                      {r.subjects}
                    </p>
                  )}
                  {r.resultLink && (
                    <div className="text-[10px] text-brand-600 font-bold flex items-center gap-1.5 opacity-60">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                      </svg>
                      Verified Result Linked
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Professional Sections */}
        <div className="grid gap-10 sm:grid-cols-2">
          {/* Activities */}
          <section className="print:break-inside-avoid">

            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Activities</h2>
              <div className="flex-1 h-px bg-slate-100"></div>
            </div>
            <ul className="space-y-6">
              {activities.length === 0 && <li className="text-slate-400 text-xs italic">No activities listed.</li>}
              {activities.map((r) => (
                <li key={r.id} className="relative pl-4 border-l-2 border-brand-100">
                  <div className="font-black text-slate-900 text-xs uppercase tracking-tight">{r.title}</div>
                  <div className="text-[10px] font-bold text-brand-600 mt-0.5 mb-1.5 uppercase tracking-tighter">{r.type} · {r.date}</div>
                  {r.description && <p className="text-xs text-slate-500 leading-relaxed mb-2">{r.description}</p>}
                  {r.link && (
                    <div className="text-[10px] text-brand-500 font-bold flex items-center gap-1">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Verification Doc Verified
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* Achievements */}
          <section className="print:break-inside-avoid">

            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Achievements</h2>
              <div className="flex-1 h-px bg-slate-100"></div>
            </div>
            <ul className="space-y-6">
              {achievements.length === 0 && <li className="text-slate-400 text-xs italic">No achievements reported.</li>}
              {achievements.map((r) => (
                <li key={r.id} className="relative pl-4 border-l-2 border-emerald-100">
                  <div className="font-black text-slate-900 text-xs uppercase tracking-tight">{r.title}</div>
                  <div className="text-[10px] font-bold text-emerald-600 mt-0.5 mb-1.5 uppercase tracking-tighter">{r.level} · {r.date}</div>
                  {r.issuer && <div className="text-xs font-bold text-slate-700 mb-1 leading-tight">{r.issuer}</div>}
                  {r.description && <p className="text-xs text-slate-500 leading-relaxed mb-1">{r.description}</p>}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Placements */}
        <section className="print:break-inside-avoid">

          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Placements & Careers</h2>
            <div className="flex-1 h-px bg-slate-100"></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {placements.length === 0 && <p className="text-slate-400 text-xs italic">No placement records.</p>}
            {placements.map((r) => (
              <div key={r.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 flex items-start justify-between">
                <div className="min-w-0">
                  <div className="font-black text-slate-900 text-sm uppercase tracking-tight truncate">{r.company}</div>
                  <div className="text-xs font-bold text-brand-600 mt-1 uppercase tracking-tighter">{r.role}</div>
                  {r.package && <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Package: {r.package}</div>}
                </div>
                <div className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter ${r.status === 'placed' ? 'bg-emerald-700 text-white' : 'bg-brand-700 text-white'
                  }`}>
                  {r.status}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <CommonFooter />
    </article>
  );
}
