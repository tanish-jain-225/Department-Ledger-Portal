import { useRouter } from "next/router";
import { useAuth } from "@/lib/auth-context";
import Image from "next/image";
import NavContent from "./NavContent";
import NotificationCenter from "./NotificationCenter";
import { Component } from "react";

// Isolates NotificationCenter crashes from taking down the sidebar/app
class NotificationBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(e) { console.warn("[NotificationCenter] Firestore listener error suppressed:", e.code || e.message); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function Sidebar({ collapsed = false, onCollapse }) {
  const router = useRouter();
  const { profile, logout } = useAuth();
  const activePath = router.asPath.split("?")[0];
  const role = profile?.role;

  return (
    <aside className={`fixed inset-y-0 left-0 bg-white border-r border-slate-200/60 z-[110] transition-width duration-700 flex flex-col no-print
      ${collapsed ? "w-[160px]" : "w-[400px]"}`}>
      
      {/* Brand Section */}
      <div className={`flex items-center justify-between border-b border-slate-100/50 transition-all duration-700 px-6 py-8 flex-shrink-0
        ${collapsed ? "gap-4" : "p-10 gap-6"}`}>
        
        <div className="flex items-center gap-4 min-w-0">
          <div className="bg-white p-2.5 rounded-2xl shadow-xl border border-slate-100 flex-shrink-0 group-hover:rotate-12 transition-transform duration-500">
            <Image src="/logo.png" alt="Logo" width={32} height={32} className="h-8 w-auto" />
          </div>
          <div className={`flex flex-col transition-all duration-700 overflow-hidden ${collapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
            <span className="text-base font-black text-slate-900 leading-none tracking-tight uppercase whitespace-nowrap">Ledger</span>
            <span className="text-[11px] font-bold text-brand-500 uppercase tracking-widest mt-1.5 opacity-80 whitespace-nowrap">Department Portal</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {!collapsed && <NotificationBoundary><NotificationCenter /></NotificationBoundary>}
          <button
            onClick={() => onCollapse?.(!collapsed)}
            className={`flex items-center justify-center rounded-2xl bg-slate-900 text-white shadow-2xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95 outline-none group flex-shrink-0
              ${collapsed ? "h-9 w-9" : "h-12 w-12"}`}
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <svg className={`h-5 w-5 transition-transform duration-700 ${collapsed ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Nav Section (Hidden in collapsed mode) */}
      {!collapsed ? (
        <nav className="flex-1 px-8 py-10 space-y-2 overflow-y-auto no-scrollbar animate-fade-in">
          <NavContent role={role} activePath={activePath} collapsed={collapsed} router={router} />
        </nav>
      ) : (
        <div className="flex-1" /> // Spacer for balanced layout when collapsed
      )}

      {/* Bottom Section */}
      <div className={`mt-auto border-t border-slate-100/50 relative transition-all duration-700 px-6 py-10 flex items-center justify-between flex-shrink-0 ${collapsed ? "gap-4" : "p-10 bg-slate-50/20 gap-6"}`}>
        
        {/* Profile Section */}
        <div className={`transition-all duration-700 flex items-center min-w-0 ${collapsed ? "justify-center" : "gap-4 animate-slide-up"}`}>
            <div className={`flex-shrink-0 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-black uppercase shadow-xl shadow-brand-500/20 group-hover:scale-110 transition-transform duration-500
              ${collapsed ? "h-10 w-10 text-xs" : "h-12 w-12 text-base"}`}>
              {profile?.name?.charAt(0) || "U"}
            </div>
            <div className={`flex flex-col transition-all duration-700 overflow-hidden ${collapsed ? "w-0 opacity-0" : "w-auto opacity-100 ml-4"}`}>
               <p className="text-xs font-black text-slate-900 truncate uppercase tracking-tight whitespace-nowrap">{profile?.name || "User"}</p>
               <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest mt-0.5 whitespace-nowrap">{role}</p>
            </div>
        </div>
        
        {/* Logout Button */}
        <button
          onClick={logout}
          className={`flex items-center justify-center group transition-all duration-300 rounded-2xl flex-shrink-0
            ${collapsed 
              ? "h-10 w-10 bg-rose-50 text-rose-600 shadow-lg shadow-rose-900/5 hover:bg-rose-100 active:scale-95" 
              : "px-5 py-3 bg-rose-50 text-rose-600 font-black text-[10px] uppercase tracking-widest hover:bg-rose-100"}`}
          title="End Session"
        >
          <svg className={`h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110 ${collapsed ? "text-rose-600" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && <span className="ml-3">Exit</span>}
        </button>
      </div>
    </aside>
  );
}
