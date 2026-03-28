import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getDb } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";
import Modal from "@/components/ui/Modal";
import { markAllAsRead } from "@/lib/notifications";

export default function NotificationCenter() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [show, setShow] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!user) return;
    const db = getDb();
    if (!db) return;

    const q = query(
      collection(db, "notifications"),
      where("userUid", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsub = onSnapshot(q,
      (snap) => {
        setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (err) => {
        // Listener errors are non-fatal — silently ignore permission/auth errors
      }
    );

    return () => unsub();
  }, [user]);

  const handleNotificationClick = (link) => {
    if (link) {
      router.push(link);
      setShow(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="relative group flex items-center justify-center h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-brand-600 hover:bg-white hover:shadow-xl hover:shadow-brand-500/10 transition-all duration-500 active:scale-90"
        title="Intelligence Terminal"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-4 ring-white shadow-lg animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      <Modal 
        open={show} 
        onClose={() => setShow(false)} 
        title="Intelligence Terminal"
        maxWidth="max-w-xl"
      >
        <div className="flex flex-col h-full min-h-[400px]">
          {/* Header Utilities */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col">
               <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Notification Flow</span>
               <span className="text-xs font-bold text-slate-900 mt-0.5">{unreadCount} Actionable Protocols</span>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead(user?.uid)}
                  className="text-[9px] font-black uppercase tracking-widest text-brand-600 hover:text-brand-700 transition-colors border border-brand-100 px-3 py-1.5 rounded-xl hover:bg-brand-50"
                >
                  Mark all read
                </button>
              )}
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Live</span>
              </div>
            </div>
          </div>

          {/* List Area */}
          <div className="flex-1 space-y-4">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                <div className="h-20 w-20 rounded-[2.5rem] bg-slate-100 flex items-center justify-center mb-6">
                   <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                   </svg>
                </div>
                <p className="text-sm font-black uppercase tracking-widest text-slate-400">Zero Disruptions Detected</p>
                <p className="text-xs font-medium text-slate-300 mt-2">Intelligence feed is currently clear.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n.link)}
                  className={`group relative p-6 rounded-3xl border transition-all duration-300 transform cursor-pointer
                    ${n.read ? "bg-slate-50/50 border-slate-100" : "bg-white border-brand-100 shadow-xl shadow-brand-500/5 hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-500/10"}`}
                >
                  <div className="flex gap-5">
                    <div className={`mt-1 flex-shrink-0 h-10 w-10 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110
                      ${n.type === "alert" || n.type === "warning" ? "bg-rose-50 text-rose-500" : "bg-brand-50 text-brand-600"}`}>
                      {(n.type === "alert" || n.type === "warning") ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h4 className={`text-sm font-black tracking-tight leading-none ${n.read ? "text-slate-600" : "text-slate-900"} group-hover:text-brand-600 transition-colors`}>
                          {n.title}
                        </h4>
                        <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">
                          {n.createdAt?.seconds ? new Date(n.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "NOW"}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-400 mt-2 leading-relaxed">
                        {n.message}
                      </p>
                      <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                         <span className="text-[9px] font-black uppercase tracking-widest text-brand-600">Access Research Terminal</span>
                         <svg className="h-3 w-3 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                         </svg>
                      </div>
                    </div>
                  </div>
                  {!n.read && (
                    <div className="absolute top-6 right-6 h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-lg shadow-rose-500/50" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
