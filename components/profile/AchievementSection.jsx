import { useState } from "react";
import { createRecord, removeRecord, updateRecord } from "@/lib/data";
import { useToast } from "@/lib/toast-context";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import SmartAssistant from "./SmartAssistant";

const field = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-300";

export default function AchievementSection({ uid, rows, onRefresh }) {
  const { addToast } = useToast();
  const [title, setTitle] = useState("");
  const [issuer, setIssuer] = useState("");
  const [level, setLevel] = useState("college");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function add(e) {
    if (e) e.preventDefault();
    try {
      await createRecord("achievements", { studentUid: uid, type: "achievement", title, issuer, level, date, description, certificateLink: link }, {
        actorUid: uid, description: `Added achievement: ${title}`
      });
      addToast(`Added: ${title}`, "success");
      setTitle(""); setIssuer(""); setLevel("college"); setDate(""); setDescription(""); setLink("");
      onRefresh();
    } catch { addToast("Failed to add achievement", "error"); }
  }

  async function handleUpdate() {
    if (!editingRecord) return;
    try {
      await updateRecord("achievements", editingRecord.id, {
        title: editingRecord.title, issuer: editingRecord.issuer, level: editingRecord.level,
        date: editingRecord.date, description: editingRecord.description, certificateLink: editingRecord.certificateLink,
      }, { actorUid: uid, description: `Updated: ${editingRecord.title}` });
      addToast("Achievement updated", "success");
      setEditingRecord(null);
      onRefresh();
    } catch { addToast("Failed to update", "error"); }
  }

  return (
    <section className="premium-card p-4 sm:p-6 lg:p-8 animate-slide-up">
      <div className="flex flex-col gap-1 mb-6">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Achievements & Awards</h2>
        <p className="text-sm text-slate-400">Accolades and institutional recognitions.</p>
      </div>

      <div className="flex flex-col gap-3 bg-slate-50/50 p-4 sm:p-5 rounded-2xl border border-slate-100 mb-6">
        <div>
          <p className="text-xs font-black text-slate-900 uppercase tracking-widest">AI Assistant</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">Auto-fill with AI</p>
        </div>
        <SmartAssistant mode="achievement" existingData={rows}
          onExtract={(d) => {
            if (d.title) setTitle(d.title);
            if (d.issuer) setIssuer(d.issuer);
            if (d.level) setLevel(d.level);
            if (d.date) setDate(d.date);
          }}
          label="AI Achievement Assistant" description="Describe your achievement for AI suggestions"
        />
      </div>

      <form onSubmit={add} className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input placeholder="Honor / Award Title" required value={title} onChange={e => setTitle(e.target.value)} />
          <Input placeholder="Issuing Authority" value={issuer} onChange={e => setIssuer(e.target.value)} />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={level} onChange={e => setLevel(e.target.value)} className={field}>
            <option value="college">College Level</option>
            <option value="state">State Level</option>
            <option value="national">National Level</option>
            <option value="international">International Level</option>
            <option value="other">Other</option>
          </select>
          <Input type="date" required value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <Input placeholder="Credential Link (Optional)" value={link} onChange={e => setLink(e.target.value)} />
        <textarea placeholder="Briefly describe the significance of this award..." value={description} onChange={e => setDescription(e.target.value)} rows={2} className={field} />
        <Button type="submit" className="w-full py-4">Add Achievement</Button>
      </form>

      <div className="flex flex-col gap-4 mt-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Wall of Fame</h3>
          <Badge variant="success">{rows.length} Awards</Badge>
        </div>

        {rows.length === 0 ? (
          <div className="flex items-center justify-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-sm text-slate-400 italic">No achievements recorded yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map((r) => (
              <div key={r.id} className="flex flex-col gap-3 p-4 sm:p-5 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-md hover:border-slate-200 transition-all">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-black text-slate-900">{r.title}</span>
                  <Badge variant="brand">{r.level}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                  <span className="font-black text-slate-600">{r.issuer || "Independent"}</span>
                  <span className="text-slate-300">·</span>
                  <span className="italic">{r.date}</span>
                  {r.certificateLink && (
                    <a href={r.certificateLink} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" /></svg>
                      View Credential
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2 self-end">
                  <button onClick={() => setEditingRecord({...r})} className="p-2 text-slate-400 hover:text-brand-600 rounded-xl hover:bg-brand-50 transition-all">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M18.364 5.636a2.121 2.121 0 113 3L12 18l-4 1 1-4 9.364-9.364z" /></svg>
                  </button>
                  <button onClick={() => setDeleteTarget({ id: r.id, title: r.title })} className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal title="Edit Achievement" open={!!editingRecord} onClose={() => setEditingRecord(null)}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Award Title</label>
            <Input value={editingRecord?.title || ""} onChange={e => setEditingRecord({...editingRecord, title: e.target.value})} />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Issuer</label>
              <Input value={editingRecord?.issuer || ""} onChange={e => setEditingRecord({...editingRecord, issuer: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Level</label>
              <select value={editingRecord?.level || "college"} onChange={e => setEditingRecord({...editingRecord, level: e.target.value})} className={field}>
                <option value="college">College Level</option>
                <option value="state">State Level</option>
                <option value="national">National Level</option>
                <option value="international">International Level</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Date</label>
              <Input type="date" value={editingRecord?.date || ""} onChange={e => setEditingRecord({...editingRecord, date: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Credential URL</label>
              <Input value={editingRecord?.certificateLink || ""} onChange={e => setEditingRecord({...editingRecord, certificateLink: e.target.value})} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Description</label>
            <textarea value={editingRecord?.description || ""} onChange={e => setEditingRecord({...editingRecord, description: e.target.value})} rows={3} className={field} />
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="ghost" onClick={() => setEditingRecord(null)}>Cancel</Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget} title="Delete Award?"
        message={`Delete "${deleteTarget?.title}"? This cannot be revoked.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await removeRecord("achievements", deleteTarget.id, { actorUid: uid, targetUid: uid, description: `Deleted: ${deleteTarget.title}` });
            addToast(`Deleted: ${deleteTarget.title}`, "success");
            setDeleteTarget(null);
            onRefresh();
          } catch { addToast("Failed to delete", "error"); }
        }}
      />
    </section>
  );
}
