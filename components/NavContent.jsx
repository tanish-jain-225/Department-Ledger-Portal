import Link from "next/link";
import { useRouter } from "next/router";
import { ROLES, isStaff, canManageUsers } from "@/lib/roles";
import { useAuth } from "@/lib/auth-context";

export function SidebarLink({ href, icon, children, active, collapsed, mobile }) {
  if (mobile) {
    return (
      <Link
        href={href}
        className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
          active ? "bg-brand-600 text-white shadow-lg" : "text-slate-600 active:bg-slate-100"
        }`}
      >
        <div className="flex-shrink-0">{icon}</div>
        <span className="text-sm font-bold">{children}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`group relative flex flex-col md:flex-row items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-500 ${
        active 
          ? "bg-brand-50/80 text-brand-600 font-bold" 
          : "text-slate-400 hover:text-slate-900 hover:bg-slate-50/50"
      }`}
    >
      <div className={`flex-shrink-0 transition-all duration-500 ${active ? "scale-110 text-brand-600" : "group-hover:scale-110 group-hover:text-slate-900"}`}>
        {icon}
      </div>
      <span className={`text-[12px] tracking-tight whitespace-nowrap overflow-hidden transition-all duration-700 ${collapsed ? "md:opacity-100 scale-90 translate-x-1" : "opacity-100 translate-x-0"} ${active ? "text-slate-900" : ""}`}>
        {children}
      </span>
      {active && !collapsed && (
        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-500 shadow-[0_0_10px_rgba(79,70,229,0.5)] hidden md:block animate-fade-in" />
      )}
    </Link>
  );
}

export default function NavContent({ role, activePath, collapsed, mobile, router }) {
  const { user } = useAuth();
  const isAdmin = canManageUsers(role);
  const isFaculty = isStaff(role) && !isAdmin;
  const isStudent = role === ROLES.STUDENT;

  const GroupTitle = ({ children }) => (
    <div className={`pt-4 pb-2 ${mobile ? "px-5" : (collapsed ? "px-0 text-center" : "px-4")}`}>
      <p className={`font-black uppercase tracking-[0.2em] text-slate-400 transition-all ${collapsed ? "text-[8px]" : "text-[10px]"}`}>{children}</p>
    </div>
  );

  if (isAdmin) {
    return (
      <>
        <GroupTitle>Operations</GroupTitle>
        <SidebarLink mobile={mobile} href="/admin" active={activePath === "/admin"} collapsed={collapsed} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>}>Overview</SidebarLink>
        <SidebarLink mobile={mobile} href="/admin/students" active={activePath === "/admin/students"} collapsed={collapsed} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>}>Students</SidebarLink>
        <SidebarLink mobile={mobile} href="/admin/faculty" active={activePath === "/admin/faculty"} collapsed={collapsed} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>}>Faculty</SidebarLink>
        
        <GroupTitle>Governance</GroupTitle>
        <SidebarLink mobile={mobile} href="/admin/requests" active={activePath === "/admin/requests"} collapsed={collapsed} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}>Requests</SidebarLink>
        <SidebarLink mobile={mobile} href="/admin/audit" active={activePath === "/admin/audit"} collapsed={collapsed} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002-2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01"/></svg>}>Audit Logs</SidebarLink>
        
        <GroupTitle>Personal</GroupTitle>
        <SidebarLink mobile={mobile} href="/profile" active={activePath === "/profile"} collapsed={collapsed} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>}>My Profile</SidebarLink>
      </>
    );
  }
  
  if (isFaculty) {
    return (
      <>
        <GroupTitle>Operations</GroupTitle>
        <SidebarLink mobile={mobile} href="/faculty" active={activePath === "/faculty"} collapsed={collapsed} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>}>Staff Home</SidebarLink>
        <SidebarLink mobile={mobile} href="/dashboard" active={activePath === "/dashboard"} collapsed={collapsed} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>}>Student Records</SidebarLink>
        
        <GroupTitle>Personal</GroupTitle>
        <SidebarLink mobile={mobile} href="/profile" active={activePath === "/profile"} collapsed={collapsed} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>}>My Profile</SidebarLink>
      </>
    );
  }
  
  if (isStudent) {
    return (
      <>
        <SidebarLink mobile={mobile} href="/student" active={activePath === "/student"} collapsed={collapsed} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>}>Home</SidebarLink>
        
        <GroupTitle>Student Records</GroupTitle>
        <SidebarLink mobile={mobile} href="/profile?tab=records" active={activePath === "/profile" && router.query.tab === "records"} collapsed={collapsed} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>}>Records</SidebarLink>
        
        <GroupTitle>Smart Analysis</GroupTitle>
        <SidebarLink mobile={mobile} href="/profile?tab=intelligence" active={activePath === "/profile" && router.query.tab === "intelligence"} collapsed={collapsed} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z"/></svg>}>Career Pulse</SidebarLink>
        
        <GroupTitle>Account</GroupTitle>
        <SidebarLink mobile={mobile} href="/profile" active={activePath === "/profile" && (!router.query.tab || router.query.tab === "profile")} collapsed={collapsed} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>}>My Profile</SidebarLink>
      </>
    );
  }
  return null;
}
