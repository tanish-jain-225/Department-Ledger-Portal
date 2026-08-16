import { useState } from "react";
import Link from "next/link";
import Head from "next/head";
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
  const [demoBusyRole, setDemoBusyRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  const demoAccounts = [
    {
      key: "admin",
      label: "Demo Admin",
      email: process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL || "",
      password: process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD || "",
      variant: "primary",
    },
    {
      key: "faculty",
      label: "Demo Faculty",
      email: process.env.NEXT_PUBLIC_DEMO_FACULTY_EMAIL || "",
      password: process.env.NEXT_PUBLIC_DEMO_FACULTY_PASSWORD || "",
      variant: "secondary",
    },
    {
      key: "student",
      label: "Demo Student",
      email: process.env.NEXT_PUBLIC_DEMO_STUDENT_EMAIL || "",
      password: process.env.NEXT_PUBLIC_DEMO_STUDENT_PASSWORD || "",
      variant: "soft",
    },
  ];

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (error) {
      setErr(error?.message || "Invalid credentials. Please check your email and password.");
    } finally {
      setBusy(false);
    }
  }

  async function onReset(e) {
    e.preventDefault();
    if (!email.trim()) { setErr("Please enter your email address first."); return; }
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

  async function onDemoLogin(account) {
    setErr("");
    if (!account.email || !account.password) {
      setErr("Demo credentials are not configured. Set environment variables to enable demo login.");
      return;
    }
    setDemoBusyRole(account.key);
    try {
      await login(account.email, account.password);
      router.push("/");
    } catch (error) {
      setErr(error?.message || "Demo login failed. Check credentials.");
    } finally {
      setDemoBusyRole("");
    }
  }

  return (
    <Layout title="Sign In" access={ACCESS.GUEST}>
      <Head>
        <title>Sign In - Department Ledger Portal</title>
        <meta name="description" content="Sign in to your Department Ledger Portal account to access your academic records, AI reports and departmental dashboard." />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg mx-auto py-4 min-[360px]:py-8 px-3 min-[360px]:px-6 animate-fade-in">
        <div className="premium-card p-responsive w-full relative overflow-hidden">
          
          <div className="mb-6 sm:mb-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 min-[360px]:w-14 min-[360px]:h-14 rounded-2xl bg-brand-700 text-white mb-4 shadow-md">
              <svg className="h-6 w-6 min-[360px]:h-7 min-[360px]:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h1 className="text-xl min-[360px]:text-2xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">Sign in to your academic ledger account</p>
          </div>

          {resetSent && (
            <div className="mb-5 flex gap-2.5 rounded-xl bg-brand-50 border border-brand-200 p-3.5 animate-slide-up">
              <svg className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-xs sm:text-sm text-brand-800">Password reset link sent. Check your inbox.</p>
            </div>
          )}

          {registered && (
            <div className="mb-5 flex gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 animate-slide-up text-emerald-900">
              <svg className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs sm:text-sm font-medium">
                Account created successfully. Awaiting administrative role assignment before initial access.
              </p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <Input id="login-email" name="email" autoComplete="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu" />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Input id="login-password" name="password" autoComplete="current-password" type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1" aria-label="Toggle password visibility">
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            {err && (
              <div className="flex gap-2.5 rounded-xl bg-red-50 border border-red-200 p-3 text-red-700 animate-slide-up">
                <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <p className="text-xs font-medium">{err}</p>
              </div>
            )}

            <Button type="submit" loading={busy} className="w-full py-2.5 text-xs font-bold">
              Sign In
            </Button>

            <div className="space-y-2.5 pt-2">
              <p className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Quick Demo Access
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {demoAccounts.map((account) => (
                  <Button
                    key={account.key}
                    type="button"
                    variant={account.variant}
                    size="sm"
                    onClick={() => onDemoLogin(account)}
                    loading={demoBusyRole === account.key}
                    className="cursor-pointer text-xs py-2"
                  >
                    {account.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="text-center pt-2">
              {!resetMode ? (
                <button
                  type="button"
                  onClick={() => { setResetMode(true); setErr(""); }}
                  className="text-xs font-semibold text-slate-500 hover:text-brand-700 hover:underline"
                >
                  Forgot password?
                </button>
              ) : (
                <div className="flex flex-col items-center gap-2 pt-1">
                  <Button type="button" variant="brand" size="sm" onClick={onReset} disabled={resetBusy} className="w-full text-xs py-2">
                    {resetBusy ? "Sending..." : "Send Reset Link"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => { setResetMode(false); setErr(""); }}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-brand-700 hover:underline font-bold">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
