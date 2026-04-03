import { useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout, { ACCESS } from "@/components/Layout";
import { useAuth } from "@/lib/auth-context";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    if (password.length < 8) {
      setErr("Password security violation: Minimum 8 characters required.");
      return;
    }
    setBusy(true);
    try {
      await register({ email, password, name });
      await router.push("/login?registered=1");
    } catch (error) {
      setErr(error?.message || "Internal registration fault.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout title="Register" access={ACCESS.GUEST}>
      <Head>
        <title>Create Account - Department Ledger Portal</title>
        <meta name="description" content="Create your Department Ledger Portal account to access AI-powered academic records, placement tracking and career readiness reports." />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="mx-auto max-w-lg pt-12 pb-24 px-6 animate-fade-in">
        <div className="premium-card p-10 sm:p-14 relative overflow-hidden">
          <div className="absolute top-0 left-0 p-8 opacity-[0.03] pointer-events-none">
            <svg className="h-48 w-48 rotate-180" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>

          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-indigo-600 shadow-2xl shadow-indigo-500/30 mb-8 border-4 border-white">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Initialize Account</h1>
            <p className="mt-2 text-slate-500 font-medium">Provision your credentials for the department ledger.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-1 mb-2 block">Full Legal Name</label>
              <Input
                required
                placeholder="Ex: John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-1 mb-2 block">Instructional Email</label>
              <Input
                type="email"
                required
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-1 mb-2 block">
                Secure Passcode
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-14"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-500 transition-colors"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {password.length > 0 && (
                <div className="mt-4 flex flex-col gap-2 animate-fade-in">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                          password.length >= i * 3
                            ? password.length >= 12 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : password.length >= 8 ? "bg-amber-400" : "bg-red-400"
                            : "bg-slate-100"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between items-center px-0.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Entropy Strength</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${password.length >= 12 ? "text-emerald-600" : password.length >= 8 ? "text-amber-600" : "text-red-500"}`}>
                      {password.length >= 12 ? "Elite" : password.length >= 8 ? "Secure" : "Vulnerable"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {err && (
              <div className="flex gap-4 rounded-3xl bg-red-50 border border-red-100 p-5 animate-slide-up">
                <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-red-700 font-bold leading-relaxed">{err}</p>
              </div>
            )}

            <Button type="submit" disabled={busy} className="w-full py-5 text-base mt-2 shadow-2xl shadow-indigo-500/20">
              {busy ? "Provisioning Identity..." : "Request Access"}
            </Button>
          </form>

          <p className="mt-10 text-center text-sm font-black text-slate-400 uppercase tracking-widest">
            Already provisioned?{" "}
            <Link href="/login" className="text-indigo-600 hover:text-indigo-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
