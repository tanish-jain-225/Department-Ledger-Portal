import { useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout, { ACCESS } from "@/components/Layout";
import { useAuth } from "@/lib/auth-context";
import { Input, Button, Select } from "@/components/ui";

export default function RegisterPage() {
  const { register, loading, login } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [year, setYear] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [demoBusyRole, setDemoBusyRole] = useState("");

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
    if (password.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      await register({ email, password, name, rollNumber, year });
      await router.push("/login?registered=1");
    } catch (error) {
      setErr(error?.message || "Registration failed. Please verify your details.");
    } finally {
      setBusy(false);
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
      setErr(error?.message || "Demo login failed.");
    } finally {
      setDemoBusyRole("");
    }
  }

  return (
    <Layout title="Register" access={ACCESS.GUEST}>
      <Head>
        <title>Create Account - Department Ledger Portal</title>
        <meta name="description" content="Create your Department Ledger Portal account to access AI-powered academic records, placement tracking and career readiness reports." />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg mx-auto py-4 min-[360px]:py-8 px-3 min-[360px]:px-6 animate-fade-in">
        <div className="premium-card p-responsive w-full relative overflow-hidden">
          
          <div className="mb-6 sm:mb-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 min-[360px]:w-14 min-[360px]:h-14 rounded-2xl bg-brand-700 text-white mb-4 shadow-md">
              <svg className="h-6 w-6 min-[360px]:h-7 min-[360px]:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
            </div>
            <h1 className="text-xl min-[360px]:text-2xl font-black text-slate-900 tracking-tight">Create Account</h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">Join the department academic portal</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="register-name" className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
              <Input id="register-name" name="name" autoComplete="name" required placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label htmlFor="register-roll" className="block text-xs font-semibold text-slate-700 mb-1">University Roll Number</label>
              <Input id="register-roll" name="rollNumber" required placeholder="e.g. 210101010" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} />
            </div>
            <div>
              <label htmlFor="register-year" className="block text-xs font-semibold text-slate-700 mb-1">Academic Year / Role</label>
              <Select
                id="register-year"
                name="year"
                required
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                <option value="">Select year / role</option>
                <option value="1">1st Year Student</option>
                <option value="2">2nd Year Student</option>
                <option value="3">3rd Year Student</option>
                <option value="4">4th Year Student</option>
                <option value="alumni">Alumni</option>
                <option value="faculty">Faculty Member</option>
              </Select>
            </div>
            <div>
              <label htmlFor="register-email" className="block text-xs font-semibold text-slate-700 mb-1">University Email</label>
              <Input id="register-email" name="email" autoComplete="email" type="email" required placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label htmlFor="register-password" className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Input
                  id="register-password"
                  name="password"
                  autoComplete="new-password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${password.length >= i * 3
                        ? password.length >= 12 ? "bg-emerald-600 shadow-sm" : password.length >= 8 ? "bg-amber-500 shadow-sm" : "bg-red-600 shadow-sm"
                        : "bg-slate-200"
                        }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {err && (
              <div className="flex gap-2.5 rounded-xl bg-red-50 border border-red-200 p-3 text-red-700 animate-slide-up">
                <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <p className="text-xs font-medium">{err}</p>
              </div>
            )}

            <Button type="submit" loading={busy} className="w-full py-2.5 text-xs font-bold">
              Create Account
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
          </form>

          <p className="mt-6 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-700 hover:underline font-bold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
