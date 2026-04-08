import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState, Component } from "react";
import { useAuth } from "@/lib/auth-context";
import { ROLES, isStaff, canManageUsers, hasApprovedRole } from "@/lib/roles";
import { ACCESS } from "@/lib/route-access";
import CommonFooter from "@/components/ui/CommonFooter";
import NotificationCenter from "@/components/NotificationCenter";
import Sidebar from "@/components/Sidebar";
import NavContent from "@/components/NavContent";

class NotificationBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { }
  render() { return this.state.failed ? null : this.props.children; }
}

export { ACCESS };

function canRender(access, role) {
  switch (access) {
    case ACCESS.PUBLIC: return true;
    case ACCESS.GUEST: return !role;
    case ACCESS.AUTH: return !!role && hasApprovedRole(role);
    case ACCESS.STUDENT: return role === ROLES.STUDENT;
    case ACCESS.STAFF: return isStaff(role);
    case ACCESS.ADMIN: return canManageUsers(role);
    default: return false;
  }
}

function homeFor(role) {
  if (canManageUsers(role)) return "/admin";
  if (isStaff(role)) return "/faculty";
  if (role === ROLES.STUDENT) return "/student";
  return "/";
}

export default function Layout({ children, title = "", access = ACCESS.PUBLIC }) {
  const { user, profile, loading, logout, isLoggingOut } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Read localStorage synchronously on first render to avoid flicker.
  // The lazy initializer only runs once and is safe — typeof window check
  // guards against SSR where localStorage doesn't exist.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar_collapsed") === "true";
  });
  const [scrolled, setScrolled] = useState(false);

  const role = profile?.role ?? null;
  const isLogged = !!user;
  const isAdmin = isLogged && hasApprovedRole(role) && canManageUsers(role);
  const isFaculty = isLogged && hasApprovedRole(role) && isStaff(role) && !isAdmin;
  const isStudent = role === ROLES.STUDENT;

  const activePath = router.asPath.split("?")[0];
  const isDashboardPath = ["/admin", "/student", "/faculty", "/profile", "/dashboard"].some(p => activePath.startsWith(p));
  const showSidebar = isLogged && isDashboardPath;

  const logoHref = isAdmin ? "/admin" : isFaculty ? "/faculty" : isStudent ? "/student" : "/";

  useEffect(() => { setMobileMenuOpen(false); }, [router.asPath]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSidebarCollapse = (val) => {
    setSidebarCollapsed(val);
    localStorage.setItem("sidebar_collapsed", String(val));
  };

  // Auth redirect
  useEffect(() => {
    if (!router.isReady || loading || isLoggingOut) return;
    if (access === ACCESS.GUEST && user && hasApprovedRole(role)) {
      router.replace(homeFor(role)); return;
    }
    if (access !== ACCESS.PUBLIC && access !== ACCESS.GUEST) {
      if (!user || !hasApprovedRole(role)) { router.replace("/"); return; }
      if (access === ACCESS.STUDENT && role !== ROLES.STUDENT) { router.replace(homeFor(role)); return; }
      if (access === ACCESS.STAFF && !isStaff(role)) { router.replace(homeFor(role)); return; }
      if (access === ACCESS.ADMIN && !canManageUsers(role)) { router.replace(homeFor(role)); return; }
    }
    if (access === ACCESS.PUBLIC && router.asPath === "/" && user && hasApprovedRole(role)) {
      router.replace(homeFor(role));
    }
  }, [router.isReady, loading, isLoggingOut, user, role, access, router]);

  const allowed = loading || !router.isReady ? false : canRender(access, role);

  // Sidebar offset
  const sidebarWidth = showSidebar ? (sidebarCollapsed ? "md:pl-16" : "md:pl-64") : "";

  return (
    <>
      <Head>
        <title>{title ? `${title} — Department Ledger Portal` : "Department Ledger Portal"}</title>
        <meta name="description" content="Academic records management platform for departments." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#2563eb" />
      </Head>

      {/* Logout overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center no-print">
          <div className="h-10 w-10 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium text-slate-600">Signing out...</p>
        </div>
      )}

      <div className="flex min-h-screen bg-slate-50">

        {/* Desktop Sidebar */}
        {showSidebar && (
          <div className="hidden md:block no-print">
            <Sidebar collapsed={sidebarCollapsed} onCollapse={handleSidebarCollapse} />
          </div>
        )}

        {/* Main content column */}
        <div className={`flex flex-col flex-1 min-w-0 ${sidebarWidth}`}>

          {/* Public navbar (no sidebar) */}
          {!showSidebar && (
            <header className={`no-print sticky top-0 z-50 transition-colors duration-200 ${scrolled ? "bg-white border-b border-slate-200 shadow-sm" : "bg-transparent"
              }`}>
              <div className="mx-auto max-w-7xl px-4 min-[400px]:px-6 h-16 flex items-center justify-between gap-4">
                {/* Logo */}
                <Link href={logoHref} className="flex items-center gap-2.5 px-0.5 min-w-0 group">
                  <div className="bg-brand-700 rounded-xl p-1.5 flex-shrink-0 shadow-lg shadow-brand-700/20 group-hover:scale-110 transition-transform">
                    <Image src="/logo.png" alt="Logo" width={20} height={20} className="h-5 w-5" style={{ height: 'auto' }} priority />
                  </div>
                  <div className="flex flex-col leading-none transition-all duration-300">
                    <p className="text-sm font-black text-slate-900 tracking-tight whitespace-nowrap">Department Ledger</p>
                    <p className="hidden sm:block text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Academic Portal</p>
                  </div>
                </Link>

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center gap-2 bg-slate-100/50 p-1 rounded-xl border border-slate-200/50">
                  {!isLogged && !loading && (
                    <>
                      <Link href="/login" className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition-colors">
                        Sign In
                      </Link>
                      <Link href="/register" className="px-4 py-2 text-sm font-bold bg-white text-brand-700 shadow-sm border border-slate-200 rounded-lg hover:bg-brand-50 transition-all">
                        Get Started
                      </Link>
                    </>
                  )}
                  {isLogged && (
                    <>
                      <Link href={logoHref} className="px-4 py-2 text-sm font-bold bg-brand-700 text-white rounded-lg hover:bg-brand-800 shadow-lg shadow-brand-700/20 transition-all">
                        Dashboard
                      </Link>
                      <button onClick={logout} className="ml-1 px-4 py-2 text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        Sign Out
                      </button>
                    </>
                  )}
                </nav>

                {/* Mobile hamburger */}
                <button
                  type="button"
                  className="md:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  onClick={() => setMobileMenuOpen(o => !o)}
                  aria-label="Toggle menu"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                  </svg>
                </button>
              </div>

              {/* Mobile dropdown */}
              {mobileMenuOpen && (
                <div className="md:hidden glass border-t border-slate-200/50 px-6 py-8 space-y-4 animate-menu-down shadow-2xl overflow-y-auto max-h-[calc(100vh-64px)] sidebar-scroll">
                  {!isLogged && (
                    <>
                      <Link href="/login" className="block w-full text-center py-3 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Sign In</Link>
                      <Link href="/register" className="block w-full text-center py-3 text-sm font-bold bg-brand-700 text-white rounded-xl shadow-lg shadow-brand-700/20 hover:bg-brand-800 transition-all">Get Started</Link>
                    </>
                  )}
                  {isLogged && (
                    <>
                      <Link href={logoHref} className="block w-full text-center py-3 text-sm font-bold bg-brand-700 text-white rounded-xl shadow-lg shadow-brand-700/20 hover:bg-brand-800 transition-all">Dashboard</Link>
                      <button onClick={logout} className="block w-full text-center py-3 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all">Sign Out</button>
                    </>
                  )}
                </div>
              )}
            </header>
          )}

          {/* Mobile top bar (dashboard pages) */}
          {showSidebar && (
            <header className="md:hidden no-print sticky top-0 z-50 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-4 shadow-sm">
              <Link href={logoHref} className="flex items-center gap-2">
                <div className="bg-brand-700 rounded-lg p-1.5">
                  <Image src="/logo.png" alt="Logo" width={18} height={18} className="h-[18px] w-[18px]" style={{ height: 'auto' }} />
                </div>
                <span className="text-sm font-bold text-slate-900">Ledger</span>
              </Link>

              <div className="flex items-center gap-2">
                <NotificationBoundary><NotificationCenter /></NotificationBoundary>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(o => !o)}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  aria-label="Toggle menu"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                  </svg>
                </button>
              </div>

              {/* Mobile nav drawer */}
              {mobileMenuOpen && (
                <div className="absolute top-14 left-0 right-0 glass shadow-2xl z-50 px-6 py-8 animate-menu-down border-b border-slate-200/50 rounded-b-[2.5rem] overflow-y-auto max-h-[calc(100vh-56px)] sidebar-scroll">
                  <nav className="space-y-1 mb-6">
                    <NavContent role={role} activePath={activePath} router={router} />
                  </nav>
                  <div className="border-t border-slate-200/50 pt-6 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-brand-700 flex items-center justify-center text-white text-base font-bold flex-shrink-0 shadow-lg shadow-brand-700/20">
                        {profile?.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate tracking-tight">{profile?.name || "User"}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{role}</p>
                      </div>
                    </div>
                    <button
                      onClick={logout}
                      className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </header>
          )}

          {/* Page content */}
          <main id="main-content" className="flex-1 px-4 min-[400px]:px-6 py-8 mx-auto w-full max-w-7xl">
            {allowed ? children : (
              <div className="flex h-[60vh] items-center justify-center">
                <div className="text-center max-w-sm">
                  <div className="mx-auto h-14 w-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h1 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h1>
                  <p className="text-sm text-slate-500 mb-6">You don&apos;t have permission to view this page.</p>
                  <Link href="/" className="inline-flex items-center px-4 py-2 text-sm font-medium bg-brand-700 text-white rounded-lg hover:bg-brand-800 transition-colors">
                    Return Home
                  </Link>
                </div>
              </div>
            )}
          </main>

          <CommonFooter />
        </div>
      </div>
    </>
  );
}
