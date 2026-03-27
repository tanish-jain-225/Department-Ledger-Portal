import { useState } from "react";
import { createRecord, removeRecord, updateRecord } from "@/lib/data";
import { useToast } from "@/lib/toast-context";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import SmartAssistant from "./SmartAssistant";

export default function ActivitySection({ uid, rows, onRefresh }) {
  const { addToast } = useToast();
  const [type, setType] = useState("none");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [link, setLink] = useState("");

  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function add(e) {
    if (e) e.preventDefault();
    try {
      await createRecord("activities", {
        studentUid: uid,
        type,
        title,
        description,
        date,
        link,
      }, {
        actorUid: uid,
        description: `Added activity: ${title}`
      });
      addToast(`Added activity: ${title}`, "success");
      setTitle("");
      setDescription("");
      setDate("");
      setLink("");
      onRefresh();
    } catch (err) {
      addToast("Failed to add activity", "error");
    }
  }

  async function handleUpdate() {
    if (!editingRecord) return;
    try {
      await updateRecord("activities", editingRecord.id, {
        type: editingRecord.type,
        title: editingRecord.title,
        description: editingRecord.description,
        date: editingRecord.date,
        link: editingRecord.link,
      }, {
        actorUid: uid,
        description: `Updated activity: ${editingRecord.title}`
      });
      addToast(`Updated activity: ${editingRecord.title}`, "success");
      setEditingRecord(null);
      onRefresh();
    } catch (err) {
      addToast("Failed to update activity", "error");
    }
  }

  return (
    <section className="premium-card p-8 animate-slide-up">
      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Activities & Engagement</h2>
      <p className="text-sm text-slate-400 mt-1">Showcase your co-curricular and leadership roles.</p>

      <div className="mt-8 bg-slate-50/50 p-6 rounded-3xl border border-slate-100 mb-8">
        <div className="mb-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Master Entry</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">Manual entry with AI assistance</p>
        </div>
        <SmartAssistant
          mode="activity"
          existingData={rows}
          onExtract={(data) => {
            if (data.type) setType(data.type);
            if (data.title) setTitle(data.title);
            if (data.date) setDate(data.date);
            if (data.description) setDescription(data.description);
          }}
          label="AI Activity Assistant"
          description="Get AI suggestions for your activity"
        />
      </div>

      <form onSubmit={add} className="grid gap-4 sm:grid-cols-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-900 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-300"
        >
          <option value="none">Select Type</option>
          <option value="co-curricular">Co-curricular</option>
          <option value="extra-curricular">Extra-curricular</option>
          <option value="cultural">Cultural</option>
          <option value="sports">Sports</option>
          <option value="other">Other</option>
        </select>
        <Input
          placeholder="Activity Name"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Input
          placeholder="Evidence / Portfolio Link (Optional)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        <textarea
          placeholder="Short description, role, or impact..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-900 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-300 sm:col-span-2"
        />
        <Button type="submit" className="sm:col-span-2 py-4">
          Add Activity
        </Button>
      </form>

      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Activity Feed</h3>
          <Badge variant="brand">{rows.length} Events</Badge>
        </div>

        {rows.length === 0 ? (
          <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-sm text-slate-400 font-medium italic">No activities logged yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((r) => (
              <div key={r.id} className="group flex items-center justify-between p-5 rounded-2xl bg-slate-50/50 border border-slate-100 transition-all hover:bg-white hover:shadow-md hover:border-slate-200">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-base font-black text-slate-900 truncate">{r.title}</span>
                    <Badge variant={r.type === 'none' ? 'neutral' : 'brand'}>{r.type}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 font-bold">
                    <span className="flex items-center gap-1.5 grayscale opacity-70">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {r.date}
                    </span>
                    {r.link && (
                      <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700 flex items-center gap-1.5 transition-colors">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                        </svg>
                        Portfolio link
                      </a>
                    )}
                  </div>
                  {r.description && <p className="mt-2 text-xs text-slate-500 leading-relaxed line-clamp-2">{r.description}</p>}
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
        title="Edit Activity"
        open={!!editingRecord}
        onClose={() => setEditingRecord(null)}
      >
        <div className="grid gap-5">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Category</label>
            <select
              value={editingRecord?.type || "none"}
              onChange={(e) => setEditingRecord({...editingRecord, type: e.target.value})}
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-900 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-300"
            >
              <option value="none">None</option>
              <option value="co-curricular">Co-curricular</option>
              <option value="extra-curricular">Extra-curricular</option>
              <option value="cultural">Cultural</option>
              <option value="sports">Sports</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Title</label>
            <Input
              value={editingRecord?.title || ""}
              onChange={(e) => setEditingRecord({...editingRecord, title: e.target.value})}
            />
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
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Evidence URL</label>
              <Input
                value={editingRecord?.link || ""}
                onChange={(e) => setEditingRecord({...editingRecord, link: e.target.value})}
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
        title="Delete Activity?"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action is permanent.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await removeRecord("activities", deleteTarget.id, {
              actorUid: uid,
              targetUid: uid,
              description: `Deleted activity: ${deleteTarget.title}`
            });
            addToast(`Deleted activity: ${deleteTarget.title}`, "success");
            setDeleteTarget(null);
            onRefresh();
          } catch (err) {
            addToast("Failed to delete activity", "error");
          }
        }}
      />
    </section>
  );
}
