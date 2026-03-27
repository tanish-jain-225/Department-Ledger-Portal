import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout, { ACCESS } from "@/components/Layout";
import { useAuth } from "@/lib/auth-context";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const { login, resetPassword } = useAuth();
  const router = useRouter();
  const registered = router.isReady && router.query.registered === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (error) {
      setErr(error?.message || "Internal authentication fault.");
    } finally {
      setBusy(false);
    }
  }

  async function onReset(e) {
    e.preventDefault();
    if (!email.trim()) {
      setErr("Enter your email address above first.");
      return;
    }
    setErr("");
    setResetBusy(true);
    try {
      await resetPassword(email.trim());
      setResetSent(true);
      setResetMode(false);
    } catch {
      setErr("Could not send reset email. Check the address and try again.");
    } finally {
      setResetBusy(false);
    }
  }

  return (
    <Layout title="Secure Access" access={ACCESS.GUEST}>
      <div className="mx-auto max-w-lg pt-12 pb-24 px-6 animate-fade-in">
        <div className="premium-card p-10 sm:p-14 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <svg className="h-48 w-48" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>

          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-brand-600 shadow-2xl shadow-brand-500/30 mb-8 border-4 border-white">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Welcome back</h1>
            <p className="mt-2 text-slate-500 font-medium">Access your secure departmental workstation.</p>
          </div>

          {resetSent && (
            <div className="mb-8 flex gap-4 rounded-3xl bg-brand-50 border border-brand-100 p-6 animate-slide-up">
              <svg className="h-5 w-5 text-brand-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-brand-800 font-bold leading-relaxed">
                Password reset link sent. Check your inbox.
              </p>
            </div>
          )}

          {registered && (
            <div className="mb-8 flex gap-4 rounded-3xl bg-emerald-50 border border-emerald-100 p-6 animate-slide-up">
              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-emerald-800 font-bold leading-relaxed">
                Vault account created. Please await administrative role assignment for full clearance.
              </p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-1 mb-2 block">Instructional Identity</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Institutional Email"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-1 mb-2 block">Secure Passcode</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="pr-14"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-brand-500 transition-colors"
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
            </div>

            {err && (
              <div className="flex gap-4 rounded-3xl bg-red-50 border border-red-100 p-5 animate-slide-up">
                <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-red-700 font-bold leading-relaxed">{err}</p>
              </div>
            )}

            <Button type="submit" disabled={busy} className="w-full py-5 text-base mt-4 shadow-2xl shadow-brand-500/20">
              {busy ? "Authenticating Session..." : "Initialize Session"}
            </Button>

            <div className="text-center">
              {!resetMode ? (
                <button
                  type="button"
                  onClick={() => { setResetMode(true); setErr(""); }}
                  className="text-xs font-bold text-slate-400 hover:text-brand-600 transition-colors uppercase tracking-widest"
                >
                  Forgot password?
                </button>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={onReset}
                    disabled={resetBusy}
                    className="text-xs font-black text-brand-600 hover:text-brand-700 transition-colors uppercase tracking-widest"
                  >
                    {resetBusy ? "Sending..." : "Send reset link"}
                  </button>
                  <span className="text-slate-200">|</span>
                  <button
                    type="button"
                    onClick={() => { setResetMode(false); setErr(""); }}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </form>

          <p className="mt-10 text-center text-sm font-black text-slate-400 uppercase tracking-widest">
            Identity missing?{" "}
            <Link href="/register" className="text-brand-600 hover:text-brand-700 transition-colors">
              Initialize Account
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
