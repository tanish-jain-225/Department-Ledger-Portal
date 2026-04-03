import Link from "next/link";
import Head from "next/head";
import Layout, { ACCESS } from "@/components/Layout";
import { useAuth } from "@/lib/auth-context";
import { isStaff, canManageUsers, hasApprovedRole } from "@/lib/roles";
import Button from "@/components/ui/Button";

export default function Home() {
  const { user, profile, loading } = useAuth();
  const role = profile?.role;

  return (
    <Layout title="Department Ledger" access={ACCESS.PUBLIC}>
      <Head>
        <title>Department Ledger Portal - AI-Powered Academic Records</title>
        <meta name="description" content="The modern academic ledger for departments. Track student GPA, placements, achievements and generate AI-powered placement readiness reports using Gemini." />
        <meta property="og:title" content="Department Ledger Portal - AI-Powered Academic Records" />
        <meta property="og:description" content="The modern academic ledger for departments. Track student GPA, placements, achievements and generate AI-powered placement readiness reports using Gemini." />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Department Ledger Portal",
            "description": "AI-powered academic records platform for departments. Track student performance, placements, achievements and generate AI readiness reports.",
            "applicationCategory": "EducationApplication",
            "operatingSystem": "Web",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
            "featureList": [
              "AI-powered document auto-fill",
              "Placement readiness reports",
              "Academic record tracking",
              "Faculty dashboard",
              "Admin governance panel",
              "Audit trail"
            ]
          })}}
        />
      </Head>
      <div className="mx-auto max-w-7xl pt-12 pb-24">
        {/* Hero Section */}
        <div className="text-center py-20 relative px-6">
          <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-200/20 rounded-full blur-[120px] animate-float opacity-60" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-200/20 rounded-full blur-[100px] animate-float opacity-40" style={{ animationDelay: "2s" }} />
          </div>

          <div className="inline-flex items-center gap-2 rounded-2xl bg-white/50 backdrop-blur-md border border-white px-5 py-2 text-[10px] font-black text-brand-700 uppercase tracking-[0.2em] mb-12 shadow-xl shadow-brand-500/5 animate-slide-up">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            Next-Gen Academic Infrastructure
          </div>

          <h1 className="text-5xl sm:text-8xl font-black tracking-tighter text-slate-900 leading-[0.9] animate-slide-up" style={{ animationDelay: "0.1s" }}>
            The Modern Ledger <br/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600">for Departments.</span>
          </h1>
          
          <p className="mt-8 text-xl sm:text-2xl text-slate-500 max-w-3xl mx-auto leading-relaxed font-medium animate-slide-up" style={{ animationDelay: "0.2s" }}>
            A high-intelligence platform for academic records, student performance tracking and departmental oversight. Precision engineered for elite institutions.
          </p>

          <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            {loading ? (
              <div className="h-14 w-48 flex items-center justify-center bg-slate-100 rounded-3xl">
                <div className="h-5 w-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : user && hasApprovedRole(role) ? (
              <>
                <Link href="/profile" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto px-10 py-5 text-base">Dashboard Home</Button>
                </Link>
                {canManageUsers(role) && (
                  <Link href="/admin" className="w-full sm:w-auto">
                    <Button variant="secondary" className="w-full sm:w-auto px-10 py-5 text-base">Governance Panel</Button>
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link href="/register" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto px-12 py-5 text-base shadow-2xl shadow-brand-500/20">Initialize Account</Button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                  <Button variant="secondary" className="w-full sm:w-auto px-12 py-5 text-base">Sign in</Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid gap-8 sm:grid-cols-3 mt-12 px-6 animate-slide-up" style={{ animationDelay: "0.4s" }}>
          {[
            {
              title: "AI Pulse Readiness",
              desc: "Personalized placement readiness scores and actionable roadmap generated via Gemini AI Pro.",
              icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z" />
                </svg>
              ),
              iconClass: "bg-brand-50 text-brand-600 border-brand-100 shadow-brand-500/10",
            },
            {
              title: "Comprehensive Tracking",
              desc: "Track academic performance, activities, achievements and placements in one unified platform.",
              icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ),
              iconClass: "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-500/10",
            },
            {
              title: "Audited Ledger",
              desc: "Every record is tracked and verified. Complete administrative oversight with secure audit trails.",
              icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
              iconClass: "bg-indigo-50 text-indigo-600 border-indigo-100 shadow-indigo-500/10",
            },
          ].map((feature, i) => (
            <div key={feature.title} className="premium-card p-10 group hover:translate-y-[-8px] transition-all duration-500">
               <div className={`mb-8 inline-flex h-14 w-14 items-center justify-center rounded-[1.25rem] group-hover:rotate-12 group-hover:scale-110 transition-all shadow-xl border ${feature.iconClass}`}>
                 {feature.icon}
               </div>
               <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">{feature.title}</h3>
               <p className="text-slate-500 text-base leading-relaxed font-medium">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Dynamic Social Proof / Stats */}
        <div className="mt-32 px-6 animate-slide-up" style={{ animationDelay: "0.5s" }}>
          <div className="premium-card p-12 bg-slate-900 overflow-hidden relative border border-slate-800">
            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
              <svg className="h-64 w-64 text-brand-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            
            <div className="relative z-10 grid gap-12 md:grid-cols-3 text-center">
              {[
                { label: "AI Features", value: "2", suffix: "" },
                { label: "Role Systems", value: "3", suffix: "" },
                { label: "Firestore Collections", value: "12", suffix: "" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-4xl sm:text-6xl font-black text-white tracking-tighter mb-2">
                    {stat.value}<span className="text-brand-500">{stat.suffix}</span>
                  </p>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
