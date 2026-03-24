import { useEffect, useState, useRef } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/router";
import { createPortal } from "react-dom";

export default function Notification() {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const prevCount = useRef(0);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Example: Only admins get notifications. Adjust logic as needed for universal use.
  const isAdmin = profile?.role === "admin" || profile?.role === "ADMIN";

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
      prevCount.current = docs.length;
      setItems(docs);
    });
    return () => unsub();
  }, [isAdmin]);

  if (!isAdmin) return null;

  const popup = open && (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(30, 41, 59, 0.45)', // slate-800/45
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(2px)',
      transition: 'background 0.2s',
    }} onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div style={{
        background: '#fff',
        border: 'none',
        borderRadius: 16,
        minWidth: 320,
        maxWidth: 420,
        width: '100%',
        padding: 0,
        boxShadow: '0 8px 32px rgba(30,41,59,0.18)',
        overflow: 'hidden',
        animation: 'notif-scale-in 0.18s cubic-bezier(.4,1.2,.6,1)'
      }}>
        <style>{`
          @keyframes notif-scale-in {
            from { opacity: 0; transform: scale(0.96); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 28px 16px 28px',
          background: 'rgba(248,250,252,0.98)', // slate-50
          borderBottom: '1px solid #e2e8f0', // slate-200
        }}>
          <span style={{ fontWeight: 700, fontSize: 18, color: '#1e293b' }}>Notifications</span>
          <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', fontSize: 22, color: '#64748b', cursor: 'pointer', lineHeight: 1 }} aria-label="Close">×</button>
        </div>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '36px 0 36px 0', fontSize: 15 }}>No pending requests</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 340, overflowY: 'auto' }}>
            {items.map(r => (
              <li key={r.id} style={{ borderBottom: '1px solid #f1f5f9', padding: 0 }}>
                <button onClick={() => { setOpen(false); router.push("/admin/requests"); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    width: '100%',
                    cursor: 'pointer',
                    padding: '18px 28px',
                    transition: 'background 0.15s',
                    fontFamily: 'inherit',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseOut={e => e.currentTarget.style.background = 'none'}
                >
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 15 }}>{r.email}</div>
                  <div style={{ fontSize: 13, color: '#334155', marginTop: 2 }}>Requests: <strong style={{ color: '#6366f1' }}>{r.requestedRole || 'None'}</strong></div>
                  {r.createdAt?.toDate && (
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{r.createdAt.toDate().toLocaleString()}</div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Notifications${items.length > 0 ? ` (${items.length} pending)` : ""}`}
        onClick={() => setOpen(!open)}
        style={{
          border: 'none',
          borderRadius: 8,
          padding: 8,
          background: '#f1f5f9', // slate-100
          cursor: 'pointer',
          boxShadow: '0 1px 4px rgba(30,41,59,0.06)',
          position: 'relative',
          transition: 'background 0.15s',
        }}
        onMouseOver={e => e.currentTarget.style.background = '#e0e7ef'}
        onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
      >
        {/* Bell icon */}
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#334155">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {items.length > 0 && (
          <span style={{
            position: 'absolute',
            top: 4,
            right: 4,
            background: '#ef4444', // red-500
            color: '#fff',
            borderRadius: '50%',
            fontSize: 11,
            minWidth: 18,
            height: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 5px',
            fontWeight: 700,
            boxShadow: '0 1px 4px rgba(239,68,68,0.12)',
          }}>{items.length}</span>
        )}
      </button>
      {mounted && popup ? createPortal(popup, document.body) : null}
    </div>
  );
}
