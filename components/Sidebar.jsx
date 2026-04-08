import { useRouter } from "next/router";
import { useAuth } from "@/lib/auth-context";
import Image from "next/image";
import Link from "next/link";
import NavContent from "./NavContent";
import NotificationCenter from "./NotificationCenter";
import { Component, useEffect, useState } from "react";

class NotificationBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function Sidebar({ collapsed = false, onCollapse }) {
  const router = useRouter();
  const { profile, logout } = useAuth();
  const activePath = router.asPath.split("?")[0];
  const role = profile?.role;

  // Suppress width transition on first render to prevent flicker.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-[110] flex flex-col bg-white border-r border-slate-200 no-print
        ${mounted ? "transition-all duration-300" : ""}
        ${collapsed ? "w-16" : "w-64"}`}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="relative flex items-center h-16 border-b border-slate-200 flex-shrink-0 overflow-hidden">
        <Link href="/" className="flex items-center gap-2.5 px-4 min-w-0 flex-1 group">
          <div className="flex-shrink-0 bg-brand-700 rounded-xl p-1.5 shadow-lg shadow-brand-700/20 group-hover:scale-110 transition-transform">
            <Image src="/logo.png" alt="Logo" width={20} height={20} className="h-5 w-5" style={{ height: 'auto' }} />
          </div>
          <div className={`transition-all duration-300 overflow-hidden ${collapsed ? "w-0 opacity-0 invisible" : "w-48 opacity-100 visible"}`}>
            <p className="text-sm font-black text-slate-900 leading-tight whitespace-nowrap">Department Ledger</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Academic Portal</p>
          </div>
        </Link>

        {/* Action icons — only visible when expanded */}
        <div className={`flex items-center gap-1 px-2 transition-opacity duration-300 ${collapsed ? "opacity-0 invisible w-0" : "opacity-100 visible"}`}>
          <NotificationBoundary><NotificationCenter /></NotificationBoundary>
          <button
            onClick={() => onCollapse?.(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            title="Collapse sidebar"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Expand button — visible ONLY when collapsed */}
        {collapsed && (
          <button
            onClick={() => onCollapse?.(!collapsed)}
            className="absolute -right-3 top-[18px] h-6 w-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-brand-600 hover:border-brand-300 shadow-xl z-50 transition-all animate-fade-in"
            title="Expand sidebar"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Navigation ─────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 sidebar-scroll">
        {!collapsed ? (
          <NavContent role={role} activePath={activePath} router={router} />
        ) : (
          <CollapsedNav role={role} activePath={activePath} router={router} />
        )}
      </nav>

      {/* ── Footer / User ──────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-slate-200 p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-brand-700 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {profile?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{profile?.name || "User"}</p>
              <p className="text-xs text-slate-500 capitalize truncate">{role}</p>
            </div>
            <button
              onClick={logout}
              className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Sign out"
              aria-label="Sign out"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-700 flex items-center justify-center text-white text-sm font-semibold">
              {profile?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Sign out"
              aria-label="Sign out"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

// ── Collapsed icon-only nav ─────────────────────────────────────────────────

function IconLink({ href, active, title, d }) {
  return (
    <Link
      href={href}
      title={title}
      className={`flex items-center justify-center h-9 w-9 mx-auto rounded-lg transition-colors ${active
        ? "bg-brand-50 text-brand-700"
        : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        }`}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
      </svg>
    </Link>
  );
}

function CollapsedNav({ role, activePath, router }) {
  const isAdmin = role === "admin";
  const isFaculty = role === "faculty";
  const isStudent = role === "student";

  if (isAdmin) return (
    <div className="flex flex-col gap-1">
      <IconLink href="/admin" active={activePath === "/admin"} title="Overview" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      <IconLink href="/admin/students" active={activePath === "/admin/students"} title="Students" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      <IconLink href="/admin/faculty" active={activePath === "/admin/faculty"} title="Faculty" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      <IconLink href="/admin/requests" active={activePath === "/admin/requests"} title="Requests" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      <IconLink href="/admin/audit" active={activePath === "/admin/audit"} title="Audit Logs" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      <IconLink href="/profile" active={activePath === "/profile"} title="My Profile" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </div>
  );

  if (isFaculty) return (
    <div className="flex flex-col gap-1">
      <IconLink href="/faculty" active={activePath === "/faculty"} title="Home" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      <IconLink href="/dashboard" active={activePath === "/dashboard"} title="Student Records" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      <IconLink href="/profile" active={activePath === "/profile"} title="My Profile" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </div>
  );

  if (isStudent) return (
    <div className="flex flex-col gap-1">
      <IconLink href="/student" active={activePath === "/student"} title="Home" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      <IconLink href="/profile?tab=records" active={activePath === "/profile" && router?.query?.tab === "records"} title="Student Records" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      <IconLink href="/profile?tab=intelligence" active={activePath === "/profile" && router?.query?.tab === "intelligence"} title="Career Pulse" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z" />
      <IconLink href="/profile" active={activePath === "/profile" && (!router?.query?.tab || router?.query?.tab === "profile")} title="My Profile" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </div>
  );

  return null;
}
