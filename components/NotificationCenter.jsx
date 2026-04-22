import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getDb } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import Modal from "@/components/ui/Modal";
import { markAllAsRead, clearAllNotifications } from "@/lib/notifications";

export default function NotificationCenter() {
  const { user } = useAuth();
  const { addToast } = useToast();
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
        const normalized = snap.docs
          .map((snapDoc) => {
            const data = snapDoc.data() || {};
            return {
              id: snapDoc.id,
              title: String(data.title || "Notification"),
              message: String(data.message || ""),
              type: String(data.type || "info"),
              link: typeof data.link === "string" ? data.link : "",
              read: Boolean(data.read),
              createdAt: data.createdAt || null,
            };
          });
        setNotifications(normalized);
      },
      (err) => {
        // Listener errors are non-fatal - silently ignore permission/auth errors
      }
    );

    return () => unsub();
  }, [user]);

  const handleNotificationClick = async (link) => {
    if (typeof link !== "string" || !link.trim()) return;
    if (!link.startsWith("/")) return;

    try {
      await router.push(link);
      setShow(false);
    } catch {
      addToast("Unable to open notification link.", "error");
    }
  };

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="relative flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        title="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <Modal
        open={show}
        onClose={() => setShow(false)}
        title="Notifications Window"
        maxWidth="max-w-xl"
      >
        <div className="flex flex-col h-full min-h-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-semibold text-slate-900">{unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}</p>
            </div>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={async () => {
                    try {
                      await clearAllNotifications(user?.uid);
                      setNotifications([]);
                    } catch {
                      addToast("Failed to clear notifications.", "error");
                    }
                  }}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50"
                >
                  Clear all
                </button>
              )}
              {unreadCount > 0 && (
                <button
                  onClick={async () => {
                    try {
                      await markAllAsRead(user?.uid);
                    } catch {
                      addToast("Failed to mark notifications as read.", "error");
                    }
                  }}
                  className="text-xs font-black text-brand-700 hover:text-brand-800 transition-colors border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-50"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* List Area */}
          <div className="flex-1 space-y-4">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-600">No notifications</p>
                <p className="text-xs text-slate-500 mt-1">You are all caught up</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n.link)}
                  className={`relative p-4 rounded-xl border transition-colors cursor-pointer
                    ${n.read
                      ? "bg-white border-slate-200 hover:bg-slate-50"
                      : "bg-brand-50 border-brand-200 hover:bg-brand-100"
                    }`}
                >
                  <div className="flex gap-3">
                    <div className={`mt-0.5 shrink-0 h-8 w-8 rounded-lg flex items-center justify-center
                      ${n.type === "alert" || n.type === "warning" ? "bg-amber-100 text-amber-700" : "bg-brand-100 text-brand-700"}`}>
                      {(n.type === "alert" || n.type === "warning") ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold truncate ${n.read ? "text-slate-700" : "text-slate-900"}`}>
                          {n.title}
                        </p>
                        <span className="text-xs text-slate-500 shrink-0">
                          {n.createdAt?.seconds ? new Date(n.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                  </div>
                  {!n.read && (
                    <span className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-brand-700 border-2 border-white shadow-sm" />
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
