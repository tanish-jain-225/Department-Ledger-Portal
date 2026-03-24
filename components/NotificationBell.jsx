import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { canManageUsers } from "@/lib/roles";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/router";

export default function NotificationBell() {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const router = useRouter();

  const isAdmin = canManageUsers(profile?.role);

  useEffect(() => {
    const db = getDb();
    if (!db || !isAdmin) return undefined;
    const q = query(
      collection(db, "roleRequests"),
      where("status", "==", "pending")
    );
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      docs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
        return timeB - timeA;
      });
      setItems(docs);
    });
    return () => unsub();
  }, [isAdmin]);

  if (!isAdmin) return null;

  return (
    <div className="relative">
      <button
        type="button"
        className="relative rounded-md border border-slate-300 px-2 py-1 text-slate-700 hover:bg-slate-50"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen(!open)}
      >
        Alerts
        {items.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] text-white">
            {items.length}
          </span>
        )}
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div
            className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl relative"
            role="dialog"
            aria-modal="true"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/80 px-4 py-3 backdrop-blur-md">
              <h3 className="font-semibold text-slate-900">Notifications</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                aria-label="Close notifications"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {items.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-slate-500">No pending requests.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 p-2">
                {items.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      className="w-full flex flex-col px-4 py-3 text-left text-sm rounded-lg hover:bg-slate-50 transition"
                      onClick={() => {
                        setOpen(false);
                        router.push("/admin/requests");
                      }}
                    >
                      <span className="block truncate font-medium text-slate-900">{r.email}</span>
                      <span className="block mt-0.5 text-slate-600">
                        Requests: <strong className="capitalize text-brand-600">{r.requestedRole || "None"}</strong>
                      </span>
                      {r.createdAt?.toDate && (
                        <span className="mt-1 block text-xs text-slate-400">
                          {formatDistanceToNow(r.createdAt.toDate(), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
