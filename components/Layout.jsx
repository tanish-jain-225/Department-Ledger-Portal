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
  componentDidCatch() { /* suppress notification errors */ }
  render() { return this.state.failed ? null : this.props.children; }
}

export { ACCESS };

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

function homeFor(role) {
  if (canManageUsers(role)) return "/admin";
  if (isStaff(role))         return "/faculty";
  if (role === ROLES.STUDENT) return "/student";
  return "/";
}

function GuestLinks({ mobile }) {
  return (
    <div className={mobile ? "flex flex-col gap-2 p-4" : "flex items-center gap-1"}>
      <Link href="/login" className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-all">Sign In</Link>
      <Link href="/register" className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95">Get Started</Link>
    </div>
  );
}

export default function Layout({ children, title = "", access = ACCESS.PUBLIC }) {
  const { user, profile, loading, logout, isLoggingOut } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const role = profile?.role ?? null;
  const isLogged = !!user;
  const isApproved = hasApprovedRole(role);
  const isAdmin = isApproved && canManageUsers(role);
  const isFaculty = isApproved && isStaff(role) && !isAdmin;
  const isStudent = role === ROLES.STUDENT;

  const activePath = router.asPath.split("?")[0];
  const isDashboardPath = ["/admin", "/student", "/faculty", "/profile", "/dashboard"].some(p => activePath.startsWith(p));
  
  const showSidebar = isLogged && isDashboardPath;

  useEffect(() => { 
    setMobileMenuOpen(false); 
  }, [router.asPath]);
  
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    
    const handleStart = () => setIsNavigating(true);
    const handleStop = () => {
      setTimeout(() => setIsNavigating(false), 300); // Small delay to ensure render
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleStop);
    router.events.on("routeChangeError", handleStop);

    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved !== null) setSidebarCollapsed(saved === "true");

    return () => {
      window.removeEventListener("scroll", handleScroll);
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleStop);
      router.events.off("routeChangeError", handleStop);
    };
  }, [router]);

  const handleSidebarCollapse = (val) => {
    setSidebarCollapsed(val);
    localStorage.setItem("sidebar_collapsed", val);
  };

  useEffect(() => {
    if (!router.isReady || loading || isLoggingOut) return;
    if (access === ACCESS.GUEST && user && hasApprovedRole(role)) {
      router.replace(homeFor(role));
      return;
    }
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
    if (access === ACCESS.PUBLIC && router.asPath === "/" && user && hasApprovedRole(role)) {
      router.replace(homeFor(role));
    }
  }, [router.isReady, loading, isLoggingOut, user, role, access, router]);

  const allowed = loading || !router.isReady ? false : canRender(access, role);
  const logoHref = isAdmin ? "/admin" : isFaculty ? "/faculty" : isStudent ? "/student" : "/";

  return (
    <>
      <Head>
        <title>{title ? `${title} — Department Ledger` : "Department Ledger Portal"}</title>
        <meta name="description" content="A high-intelligence platform for academic records, student performance tracking, and departmental oversight." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#4f46e5" />
      </Head>

      {isLoggingOut && (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center animate-fade-in no-print">
          <div className="relative">
             <div className="h-24 w-24 rounded-full border-4 border-slate-100 border-t-brand-600 animate-spin" />
             <div className="absolute inset-0 flex items-center justify-center">
                <Image src="/logo.png" alt="Logo" width={32} height={32} className="h-8 w-auto opacity-20" />
             </div>
          </div>
          <div className="mt-8 text-center px-6">
             <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Securely Terminating Session</h2>
             <p className="text-sm font-medium text-slate-400 mt-2">Flushing encrypted vaults and synchronizing global state...</p>
          </div>
          <div className="fixed bottom-12 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
             System Integrity Verified
          </div>
        </div>
      )}

      <div className="flex min-h-screen bg-slate-50/50">
        {!showSidebar && (
          <header className={`no-print fixed top-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-700 w-[calc(100%-3rem)] max-w-7xl
            ${scrolled ? "glass-island py-3 px-8 rounded-[2rem] shadow-2xl" : "bg-transparent py-4 px-6"}`}>
            <div className="flex items-center justify-between gap-4">
              <Link href={logoHref} className="flex items-center gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98]">
                <div className="bg-white p-2 rounded-2xl shadow-xl border border-slate-100">
                  <Image src="/logo.png" alt="Logo" width={32} height={32} className="h-8 w-auto" priority />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-900 leading-none tracking-tight uppercase">Ledger</span>
                  <span className="text-[10px] font-bold text-brand-500 uppercase tracking-widest mt-0.5">Records</span>
                </div>
              </Link>

              <nav className="hidden md:flex items-center gap-3">
                 {!isLogged && !loading && <GuestLinks mobile={false} />}
                 {isLogged && (
                   <div className="flex items-center gap-3">
                      <Link href={logoHref} className="px-5 py-2 rounded-xl bg-brand-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20">Dashboard</Link>
                      <button onClick={logout} className="px-5 py-2 rounded-xl bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Exit</button>
                   </div>
                 )}
              </nav>

              <div className="flex items-center gap-3 md:hidden">
                <button
                  type="button"
                  className="rounded-2xl p-2.5 bg-white border border-slate-200 text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
                  onClick={() => setMobileMenuOpen((o) => !o)}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"} />
                  </svg>
                </button>
              </div>
            </div>

            {mobileMenuOpen && (
              <div className="md:hidden mt-4 border-t border-slate-100/50 pt-4 animate-menu-down">
                {!isLogged && <GuestLinks mobile={true} />}
                {isLogged && (
                  <div className="flex flex-col gap-2 p-4">
                    <Link href={logoHref} className="w-full text-center py-3 rounded-2xl bg-brand-600 text-white font-black text-xs uppercase tracking-widest">Dashboard</Link>
                    <button onClick={logout} className="w-full text-center py-3 rounded-2xl bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest">Exit</button>
                  </div>
                )}
              </div>
            )}
          </header>
        )}

        {/* Desktop Sidebar */}
        <div className="hidden md:block no-print">
          {showSidebar && <Sidebar collapsed={sidebarCollapsed} onCollapse={handleSidebarCollapse} />}
        </div>

        {/* Mobile Navbar for Dashboard */}
        {showSidebar && (
          <header className={`md:hidden no-print fixed top-4 left-4 right-4 z-[100] transition-all duration-500 glass-island py-4 px-6 rounded-[2rem] shadow-2xl`}>
             <div className="flex items-center justify-between">
                <Link href={logoHref} className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-xl shadow-lg border border-slate-100">
                    <Image src="/logo.png" alt="Logo" width={24} height={24} className="h-6 w-auto" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-900 leading-none">DASHBOARD</span>
                    <span className="text-[8px] font-bold text-brand-500 opacity-70 uppercase tracking-tighter">Ledger Portal</span>
                  </div>
                </Link>
                
                <div className="flex items-center gap-3">
                  <NotificationBoundary><NotificationCenter /></NotificationBoundary>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen((o) => !o)}
                    className="p-2.5 rounded-2xl bg-slate-900 text-white shadow-xl active:scale-95 transition-all"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"} />
                    </svg>
                  </button>
                </div>
             </div>

             {mobileMenuOpen && (
               <div className="mt-4 border-t border-slate-100 pt-4 animate-menu-down max-h-[70vh] overflow-y-auto no-scrollbar">
                  <div className="flex flex-col gap-1 pb-4">
                    <NavContent mobile role={role} activePath={activePath} router={router} />
                    <div className="mt-4 pt-4 border-t border-slate-50 flex flex-col gap-2">
                      <div className="px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-black text-xs">
                          {profile?.name?.charAt(0) || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black text-slate-900 uppercase truncate">{profile?.name || "User"}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase">{role}</p>
                        </div>
                      </div>
                      <button onClick={logout} className="w-full py-4 rounded-2xl bg-rose-50 text-rose-600 font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95">End Session</button>
                    </div>
                  </div>
               </div>
             )}
          </header>
        )}

        <div className={`flex flex-col flex-1 transition-all duration-700 ${showSidebar ? (sidebarCollapsed ? "md:pl-[160px]" : "md:pl-[400px]") : ""}`}>
          <div className={`no-print ${showSidebar ? "h-24 md:h-0" : "h-32"}`} /> {/* Responsive Spacer */}
          
          <main 
            key={router.asPath}
            id="main-content" 
            className={`mx-auto w-full px-6 py-8 flex-1 max-w-7xl transition-all duration-500 
              ${isNavigating ? "opacity-0 translate-y-4 scale-[0.98]" : "opacity-100 translate-y-0 scale-100 animate-slide-up"}`}
          >
            {allowed ? children : (
              <div className="flex h-[60vh] items-center justify-center">
                <div className="text-center animate-slide-up">
                  <div className="mx-auto h-20 w-20 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 mb-6">
                    <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Access Restricted</h1>
                  <p className="text-slate-500 font-medium max-w-md mx-auto mb-8">You don&apos;t have permission to view this section or your session has expired.</p>
                  <Link href="/" className="px-8 py-3 rounded-2xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">Return Home</Link>
                </div>
              </div>
            )}
          </main>
          
          {!showSidebar && <CommonFooter />}
        </div>
      </div>
    </>
  );
}
