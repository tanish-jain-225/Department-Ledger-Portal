import { useState } from "react";
import { createRecord, removeRecord, updateRecord } from "@/lib/data";
import { useToast } from "@/lib/toast-context";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import SmartAssistant from "./SmartAssistant";


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
      await createRecord("achievements", {
        studentUid: uid,
        type: "achievement",
        title,
        issuer,
        level,
        date,
        description,
        certificateLink: link,
      }, {
        actorUid: uid,
        description: `Added achievement: ${title}`
      });
      addToast(`Added achievement: ${title}`, "success");
      setTitle("");
      setIssuer("");
      setLevel("college");
      setDate("");
      setDescription("");
      setLink("");
      onRefresh();
    } catch (err) {
      addToast("Failed to add achievement", "error");
    }
  }

  async function handleUpdate() {
    if (!editingRecord) return;
    try {
      await updateRecord("achievements", editingRecord.id, {
        title: editingRecord.title,
        issuer: editingRecord.issuer,
        level: editingRecord.level,
        date: editingRecord.date,
        description: editingRecord.description,
        certificateLink: editingRecord.certificateLink,
      }, {
        actorUid: uid,
        description: `Updated achievement: ${editingRecord.title}`
      });
      addToast(`Updated achievement: ${editingRecord.title}`, "success");
      setEditingRecord(null);
      onRefresh();
    } catch (err) {
      addToast("Failed to update achievement", "error");
    }
  }

  return (
    <section className="premium-card p-8 animate-slide-up">
      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Achievements & Awards</h2>
      <p className="text-sm text-slate-400 mt-1">Collect your accolades and institutional recognitions.</p>

      <div className="mt-8 bg-slate-50/50 p-6 rounded-3xl border border-slate-100 mb-8">
        <div className="mb-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Master Entry</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">Manual entry with AI assistance</p>
        </div>
        
        <SmartAssistant 
          mode="achievement" 
          existingData={rows}
          onExtract={(data) => {
            if (data.title) setTitle(data.title);
            if (data.issuer) setIssuer(data.issuer);
            if (data.level) setLevel(data.level);
            if (data.date) setDate(data.date);
          }} 
          label="AI Achievement Assistant"
          description="Describe your achievement for AI suggestions"
        />
      </div>

      <form onSubmit={add} className="grid gap-4 sm:grid-cols-2">
        <Input
          placeholder="Honor / Award Title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          placeholder="Issuing Authority"
          value={issuer}
          onChange={(e) => setIssuer(e.target.value)}
        />
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-900 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-300"
        >
          <option value="college">College Level</option>
          <option value="state">State Level</option>
          <option value="national">National Level</option>
          <option value="international">International Level</option>
          <option value="other">Other</option>
        </select>
        <Input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Input
          placeholder="Credential Link (Optional)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="sm:col-span-2"
        />
        <textarea
          placeholder="Briefly describe the significance of this award..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-900 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-300 sm:col-span-2"
        />
        <Button type="submit" className="sm:col-span-2 py-4">
          Add Achievement
        </Button>
      </form>

      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Wall of Fame</h3>
          <Badge variant="success">{rows.length} Awards</Badge>
        </div>

        {rows.length === 0 ? (
          <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-sm text-slate-400 font-medium italic">No achievements recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((r) => (
              <div key={r.id} className="group flex items-center justify-between p-5 rounded-2xl bg-slate-50/50 border border-slate-100 transition-all hover:bg-white hover:shadow-md hover:border-slate-200">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-base font-black text-slate-900 truncate">{r.title}</span>
                    <Badge variant="brand">{r.level}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 font-bold">
                    <span className="opacity-80 font-black text-slate-600">{r.issuer || "Independent"}</span>
                    <span className="text-slate-300">·</span>
                    <span className="flex items-center gap-1.5 opacity-70 italic font-medium">
                      {r.date}
                    </span>
                    {r.certificateLink && (
                      <a href={r.certificateLink} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700 flex items-center gap-1.5 transition-colors">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                        </svg>
                        View Credential
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  <button
                    onClick={() => setEditingRecord({...r})}
                    className="p-2.5 text-slate-400 hover:text-brand-600 transition-all rounded-xl hover:bg-brand-50"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M18.364 5.636a2.121 2.121 0 113 3L12 18l-4 1 1-4 9.364-9.364z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ id: r.id, title: r.title })}
                    className="p-2.5 text-slate-400 hover:text-red-500 transition-all rounded-xl hover:bg-red-50"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        title="Edit Achievement"
        open={!!editingRecord}
        onClose={() => setEditingRecord(null)}
      >
        <div className="grid gap-5">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Award Title</label>
            <Input
              value={editingRecord?.title || ""}
              onChange={(e) => setEditingRecord({...editingRecord, title: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Issuer</label>
              <Input
                value={editingRecord?.issuer || ""}
                onChange={(e) => setEditingRecord({...editingRecord, issuer: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Level</label>
              <select
                value={editingRecord?.level || "college"}
                onChange={(e) => setEditingRecord({...editingRecord, level: e.target.value})}
                className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-900 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-300"
              >
                <option value="college">College Level</option>
                <option value="state">State Level</option>
                <option value="national">National Level</option>
                <option value="international">International Level</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Date</label>
              <Input
                type="date"
                value={editingRecord?.date || ""}
                onChange={(e) => setEditingRecord({...editingRecord, date: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Credential URL</label>
              <Input
                value={editingRecord?.certificateLink || ""}
                onChange={(e) => setEditingRecord({...editingRecord, certificateLink: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Description</label>
            <textarea
              value={editingRecord?.description || ""}
              onChange={(e) => setEditingRecord({...editingRecord, description: e.target.value})}
              rows={3}
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-900 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-300"
            />
          </div>
          <div className="mt-4 flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setEditingRecord(null)}>Cancel</Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Award?"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be revoked.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await removeRecord("achievements", deleteTarget.id, {
              actorUid: uid,
              targetUid: uid,
              description: `Deleted achievement: ${deleteTarget.title}`
            });
            addToast(`Deleted achievement: ${deleteTarget.title}`, "success");
            setDeleteTarget(null);
            onRefresh();
          } catch (err) {
            addToast("Failed to delete award", "error");
          }
        }}
      />
    </section>
  );
}
