import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ROLES, isStaff, canManageUsers, hasApprovedRole } from "@/lib/roles";
import Notification from "@/components/Notification";
// import ScrollToTop from "@/components/ui/ScrollToTop";
import { ACCESS } from "@/lib/route-access";

import CommonFooter from "@/components/ui/CommonFooter";

// ─── Access guard ─────────────────────────────────────────────────────────────
function canRender(access, role) {
  switch (access) {
    case ACCESS.PUBLIC: return true;
    case ACCESS.GUEST:  return !role;
    case ACCESS.AUTH:   return !!role && hasApprovedRole(role);
    case ACCESS.STUDENT: return role === ROLES.STUDENT;
    case ACCESS.STAFF:  return isStaff(role);
    case ACCESS.ADMIN:  return canManageUsers(role);
    default:            return false;
  }
}

// ─── Role-based home route ────────────────────────────────────────────────────
function homeFor(role) {
  if (canManageUsers(role)) return "/admin";
  if (isStaff(role)) return "/faculty";
  if (role === ROLES.STUDENT) return "/student";
  return "/";
}

// ─── Active link helper ───────────────────────────────────────────────────────
function NavLink({ href, mobile, children, active }) {
  return (
    <Link
      href={href}
      className={`relative transition-colors ${
        mobile ? "block py-2 border-b border-slate-100" : ""
      } ${
        active
          ? "text-brand-600 font-bold"
          : "text-slate-700 hover:text-brand-600"
      }`}
    >
      {children}
      {/* Active indicator line (desktop only) */}
      {active && !mobile && (
        <span className="absolute -bottom-[13px] left-0 right-0 h-0.5 bg-brand-600 rounded-full" />
      )}
    </Link>
  );
}

// ─── Navigation link sets ─────────────────────────────────────────────────────
function AdminLinks({ mobile, logout, activePath }) {
  return (
    <>
      <NavLink href="/profile"        mobile={mobile} active={activePath === "/profile"}>Profile</NavLink>
      <NavLink href="/admin"          mobile={mobile} active={activePath === "/admin"}>Overview</NavLink>
      <NavLink href="/admin/students" mobile={mobile} active={activePath === "/admin/students"}>Students</NavLink>
      <NavLink href="/admin/faculty"  mobile={mobile} active={activePath === "/admin/faculty"}>Faculty</NavLink>
      <NavLink href="/admin/requests" mobile={mobile} active={activePath === "/admin/requests"}>Requests</NavLink>
      <NavLink href="/admin/audit"    mobile={mobile} active={activePath === "/admin/audit"}>Audit Logs</NavLink>
      <div className={mobile ? "py-2 border-b border-slate-100" : ""}><Notification /></div>
      <button
        type="button"
        onClick={logout}
        className={`rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors ${mobile ? "block w-full px-3 py-2 mt-4 text-left font-medium" : "px-3 py-1.5 text-sm"}`}
      >
        Sign out
      </button>
    </>
  );
}

function StaffLinks({ mobile, isFaculty, logout, activePath }) {
  return (
    <>
      <NavLink href="/profile" mobile={mobile} active={activePath === "/profile"}>Profile</NavLink>
      {isFaculty && (
        <NavLink href="/dashboard" mobile={mobile} active={activePath.startsWith("/dashboard")}>Dashboard</NavLink>
      )}
      <button
        type="button"
        onClick={logout}
        className={`rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors ${mobile ? "block w-full px-3 py-2 mt-4 text-left font-medium" : "px-3 py-1.5 text-sm"}`}
      >
        Sign out
      </button>
    </>
  );
}

function StudentLinks({ mobile, logout, activePath }) {
  return (
    <>
      <NavLink href="/profile" mobile={mobile} active={activePath === "/profile"}>Profile</NavLink>
      <button
        type="button"
        onClick={logout}
        className={`rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors ${mobile ? "block w-full px-3 py-2 mt-4 text-left font-medium" : "px-3 py-1.5 text-sm"}`}
      >
        Sign out
      </button>
    </>
  );
}

function GuestLinks({ mobile }) {
  return (
    <>
      <Link href="/login" className={`text-slate-700 hover:text-brand-600 ${mobile ? "block py-2" : ""}`}>
        Sign in
      </Link>
      <Link
        href="/register"
        className={`rounded-lg bg-brand-600 text-white hover:bg-brand-700 text-center transition-colors ${mobile ? "block w-full px-4 py-3 mt-4" : "px-3.5 py-1.5 text-sm"}`}
      >
        Register
      </Link>
    </>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
// Footer replaced by CommonFooter

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function Layout({ children, title = "", access = ACCESS.PUBLIC }) {
  const { user, profile, loading, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = profile?.role ?? null;
  const isAdmin   = hasApprovedRole(role) && canManageUsers(role);
  const isFaculty = hasApprovedRole(role) && isStaff(role) && !isAdmin;
  const isStudent = role === ROLES.STUDENT;
  const activePath = router.asPath.split("?")[0];

  // Close mobile menu on navigation
  useEffect(() => { setMobileMenuOpen(false); }, [router.asPath]);

  // Access guard + post-login redirects
  useEffect(() => {
    if (!router.isReady || loading) return;

    // Redirect logged-in users away from guest-only pages
    if (access === ACCESS.GUEST && user && hasApprovedRole(role)) {
      router.replace(homeFor(role));
      return;
    }

    // Redirect unapproved / wrong-role users away from protected pages
    if (access !== ACCESS.PUBLIC && access !== ACCESS.GUEST) {
      if (!user || !hasApprovedRole(role)) {
        router.replace("/");
        return;
      }
      if (access === ACCESS.STUDENT && role !== ROLES.STUDENT) {
        router.replace(homeFor(role));
        return;
      }
      if (access === ACCESS.STAFF && !isStaff(role)) {
        router.replace(homeFor(role));
        return;
      }
      if (access === ACCESS.ADMIN && !canManageUsers(role)) {
        router.replace(homeFor(role));
        return;
      }
    }

    // Redirect users away from the root landing page once they are logged in
    if (access === ACCESS.PUBLIC && router.asPath === "/" && user && hasApprovedRole(role)) {
      router.replace(homeFor(role));
    }
  }, [router.isReady, loading, user, role, access, router]);

  // Determine whether to render page content (avoids flash)
  const allowed =
    loading || !router.isReady
      ? false
      : canRender(access, role);

  const logoHref = isAdmin ? "/admin" : isFaculty ? "/faculty" : isStudent ? "/student" : "/";

  function navLinks(mobile) {
    if (user && isAdmin)   return <AdminLinks   mobile={mobile} logout={logout} activePath={activePath} />;
    if (user && isFaculty) return <StaffLinks   mobile={mobile} isFaculty logout={logout} activePath={activePath} />;
    if (user && isStudent) return <StudentLinks mobile={mobile} logout={logout} activePath={activePath} />;
    if (!user && !loading) return <GuestLinks   mobile={mobile} />;
    return null;
  }

  return (
    <>
      <Head>
        <title>{title ? `${title} — Department Ledger Portal` : "Department Ledger Portal"}</title>
        <meta name="viewport"     content="width=device-width, initial-scale=1" />
        <meta name="description"  content="Official ledger and professional records portal for academic departments." />
        <meta property="og:title" content={title || "Department Ledger Portal"} />
        <meta property="og:type"  content="website" />
        <meta name="theme-color"  content="#4f46e5" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-brand-600 focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>

      <div className="flex min-h-screen flex-col">
        <header className="no-print border-b border-slate-200 bg-white shadow-sm relative z-50">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <Link href={logoHref} className="flex items-center gap-2 text-lg font-semibold text-brand-800 hover:text-brand-600 transition-colors">
              <Image src="/logo.png" alt="Department Ledger Logo" width={32} height={32} className="h-8 w-auto" priority />
              <span>Department Ledger Portal</span>
            </Link>

            <nav className="hidden md:flex flex-wrap items-center gap-4 text-sm font-medium" aria-label="Primary">
              {navLinks(false)}
            </nav>

            <button
              type="button"
              className="md:hidden rounded-lg p-2 -mr-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-expanded={mobileMenuOpen}
              aria-label="Open main menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"} />
              </svg>
            </button>
          </div>

          {/* Mobile menu with slide animation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 shadow-lg absolute w-full left-0 animate-menu-down">
              <nav className="flex flex-col text-base font-medium space-y-1 pb-4" aria-label="Mobile">
                {navLinks(true)}
              </nav>
            </div>
          )}
        </header>

        <main id="main-content" className="mx-auto max-w-6xl w-full px-4 py-8 flex-1">
          {allowed ? (
            children
          ) : (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 text-sm">Loading…</p>
              </div>
            </div>
          )}
        </main>

        <CommonFooter />
      </div>

      {/* <ScrollToTop /> removed as requested */}
    </>
  );
}

export { ACCESS };
