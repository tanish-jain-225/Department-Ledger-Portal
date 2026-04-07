import Link from "next/link";
import { ROLES, isStaff, canManageUsers } from "@/lib/roles";

export function SidebarLink({ href, icon, children, active }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${active
        ? "bg-brand-50 text-brand-700"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
    >
      <span className={`flex-shrink-0 ${active ? "text-brand-700" : "text-slate-400"}`}>
        {icon}
      </span>
      <span className="truncate">{children}</span>
      {active && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-700 flex-shrink-0" />
      )}
    </Link>
  );
}

function GroupTitle({ children }) {
  return (
    <p className="px-3 pt-5 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
      {children}
    </p>
  );
}

const ICONS = {
  home: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  students: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  faculty: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  requests: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  audit: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  profile: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  records: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  pulse: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z" /></svg>,
  dashboard: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
};

export default function NavContent({ role, activePath, router }) {
  const isAdmin = canManageUsers(role);
  const isFaculty = isStaff(role) && !isAdmin;
  const isStudent = role === ROLES.STUDENT;

  if (isAdmin) return (
    <>
      <GroupTitle>Operations</GroupTitle>
      <SidebarLink href="/admin" active={activePath === "/admin"} icon={ICONS.home}>Overview</SidebarLink>
      <SidebarLink href="/admin/students" active={activePath === "/admin/students"} icon={ICONS.students}>Students</SidebarLink>
      <SidebarLink href="/admin/faculty" active={activePath === "/admin/faculty"} icon={ICONS.faculty}>Faculty</SidebarLink>
      <GroupTitle>Governance</GroupTitle>
      <SidebarLink href="/admin/requests" active={activePath === "/admin/requests"} icon={ICONS.requests}>Requests</SidebarLink>
      <SidebarLink href="/admin/audit" active={activePath === "/admin/audit"} icon={ICONS.audit}>Audit Logs</SidebarLink>
      <GroupTitle>Account</GroupTitle>
      <SidebarLink href="/profile" active={activePath === "/profile"} icon={ICONS.profile}>My Profile</SidebarLink>
    </>
  );

  if (isFaculty) return (
    <>
      <GroupTitle>Operations</GroupTitle>
      <SidebarLink href="/faculty" active={activePath === "/faculty"} icon={ICONS.home}>Home</SidebarLink>
      <SidebarLink href="/dashboard" active={activePath === "/dashboard"} icon={ICONS.dashboard}>Student Records</SidebarLink>
      <GroupTitle>Account</GroupTitle>
      <SidebarLink href="/profile" active={activePath === "/profile"} icon={ICONS.profile}>My Profile</SidebarLink>
    </>
  );

  if (isStudent) return (
    <>
      <GroupTitle>Navigation</GroupTitle>
      <SidebarLink href="/student" active={activePath === "/student"} icon={ICONS.home}>Home</SidebarLink>
      <GroupTitle>Records</GroupTitle>
      <SidebarLink href="/profile?tab=records" active={activePath === "/profile" && router?.query?.tab === "records"} icon={ICONS.records}>Student Records</SidebarLink>
      <SidebarLink href="/profile?tab=intelligence" active={activePath === "/profile" && router?.query?.tab === "intelligence"} icon={ICONS.pulse}>Career Pulse</SidebarLink>
      <GroupTitle>Account</GroupTitle>
      <SidebarLink href="/profile" active={activePath === "/profile" && (!router?.query?.tab || router?.query?.tab === "profile")} icon={ICONS.profile}>My Profile</SidebarLink>
    </>
  );

  return null;
}
