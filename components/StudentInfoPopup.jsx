import { useState, useEffect } from "react";
import { getDoc, doc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { listByStudent } from "@/lib/data";
import { useAuth } from "@/lib/auth-context";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";

export default function StudentInfoPopup({ uid, onClose }) {
  const { profile: currentUser } = useAuth();
  const [data, setData] = useState(null);
  const [lists, setLists] = useState({
    academic: [],
    activities: [],
    achievements: [],
    placements: [],
  });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!uid) return;
    async function load() {
      setLoading(true);
      const db = getDb();
      if (!db) return;
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (!snap.exists()) {
          setErr("Student not found");
          return;
        }
        setData({ id: snap.id, ...snap.data() });
        const [academic, activities, achievements, placements] =
          await Promise.all([
            listByStudent("academicRecords", uid),
            listByStudent("activities", uid),
            listByStudent("achievements", uid),
            listByStudent("placements", uid),
          ]);
        setLists({
          academic,
          activities,
          achievements,
          placements,
        });
      } catch (e) {
        setErr(e?.message || "Load failed");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [uid]);

  return (
    <Modal title="Student Profile" open={!!uid} onClose={onClose} fullScreen={true}>
      {loading ? (
        <p className="text-slate-500 animate-pulse text-center py-8">
          Loading detailed records...
        </p>
      ) : data ? (
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">{data.name}</h2>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600">
              <Badge variant="brand">{data.branch || "—"}</Badge>
              <Badge variant="brand">Year {data.year || "—"}</Badge>
              {data.alumni && <Badge variant="success">Alumni</Badge>}
            </div>
          </div>

          <div className="grid gap-6">
            <section>
              <h3 className="mb-3 border-b border-brand-100 pb-2 text-lg font-semibold text-slate-900">Academic</h3>
              {lists.academic.length === 0 ? (
                <p className="text-sm text-slate-500">No academic records.</p>
              ) : (
                <div className="space-y-3">
                  {lists.academic.map((r) => (
                    <div key={r.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">Year {r.year} · Sem {r.semester}</p>
                          <p className="text-sm text-slate-600">GPA: {r.gpa}</p>
                        </div>
                        <span className="rounded bg-brand-50 px-2 py-1 text-xs font-bold text-brand-600">
                          GPA {r.gpa}
                        </span>
                      </div>
                      {r.subjects && (
                        <p className="mt-2 text-sm text-slate-600">{r.subjects}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h3 className="mb-3 border-b border-brand-100 pb-2 text-lg font-semibold text-slate-900">Activities</h3>
              {lists.activities.length === 0 ? (
                <p className="text-sm text-slate-500">No activities.</p>
              ) : (
                <ul className="space-y-2">
                  {lists.activities.map((r) => (
                    <li key={r.id} className="text-sm text-slate-700">
                      <strong>{r.title}</strong> ({r.type}) — {r.date}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="mb-3 border-b border-brand-100 pb-2 text-lg font-semibold text-slate-900">Achievements</h3>
              {lists.achievements.length === 0 ? (
                <p className="text-sm text-slate-500">No achievements.</p>
              ) : (
                <ul className="space-y-2">
                  {lists.achievements.map((r) => (
                    <li key={r.id} className="text-sm text-slate-700">
                      {r.title} ({r.level}) — {r.date}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="mb-3 border-b border-brand-100 pb-2 text-lg font-semibold text-slate-900">Placements</h3>
              {lists.placements.length === 0 ? (
                <p className="text-sm text-slate-500">No placements.</p>
              ) : (
                <ul className="space-y-2">
                  {lists.placements.map((r) => (
                    <li key={r.id} className="text-sm text-slate-700">
                      <strong>{r.company}</strong> — {r.role} ({r.status}) {r.package && `· ${r.package}`}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      ) : (
        <p className="py-8 text-center text-slate-500">No student data available.</p>
      )}
    </Modal>
  );
}