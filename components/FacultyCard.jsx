import React from "react";
import CommonFooter from "@/components/ui/CommonFooter";

export default function FacultyCard({ data }) {
  if (!data) return null;

  return (
    <article className="mx-auto w-full max-w-full sm:max-w-4xl rounded-xl border bg-white p-responsive shadow-md print:border-0 print:shadow-none print:p-0" style={{ borderColor: '#e2e8f0' }}>
      {/* Header */}
      <header className="pb-4 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" style={{ borderBottom: '2px solid #e2e8f0' }}>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#475569' }}>
            Department Ledger Portal · Faculty
          </p>
          <h1 className="text-xl min-[360px]:text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {data.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2 min-[360px]:gap-3 text-slate-500 text-xs min-[360px]:text-sm font-medium mt-1">
            <span className="truncate max-w-50">{data.email}</span>
            {data.phone && <span className="hidden min-[360px]:inline">· {data.phone}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
            data.facultyVerification === 'approved'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          }`}>
            {data.facultyVerification === 'approved' ? 'Verified Faculty' : 'Verification Pending'}
          </span>
        </div>
      </header>
      
      {/* Profile Sections */}
      <div className="space-y-10">
        <section className="print:break-inside-avoid">
           <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Personal Details</h2>
            <div className="flex-1 h-px bg-slate-100"></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
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
          </div>
        </section>

        <section className="print:break-inside-avoid">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Address & Bio</h2>
            <div className="flex-1 h-px bg-slate-100"></div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
              <h4 className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-2">Residential Address</h4>
              <p className="text-sm font-bold text-slate-800 leading-relaxed">
                {data.address || "No address provided -"}
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Professional Biography</h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                {data.bio || "No biography provided."}
              </p>
            </div>
          </div>
        </section>

        <section className="print:break-inside-avoid">
           <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Links</h2>
            <div className="flex-1 h-px bg-slate-100"></div>
          </div>
          <div className="flex flex-wrap gap-4">
             {data.linkedin && (
                <div className="text-xs font-bold text-violet-600 bg-violet-50 px-3 py-1.5 rounded-lg border border-violet-100">
                  LinkedIn: {data.linkedin}
                </div>
              )}
              {data.github && (
                <div className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                  GitHub / Portfolio: {data.github}
                </div>
              )}
          </div>
        </section>
      </div>

      <div className="mt-12">
        <CommonFooter />
      </div>
    </article>
  );
}
