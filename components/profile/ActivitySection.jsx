import { useState, useRef } from "react";
import { useToast } from "@/lib/toast-context";
import { useLedgerSection } from "@/lib/use-ledger-section";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import DocumentPreview from "./DocumentPreview";
import SmartAssistant from "./SmartAssistant";

const field = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-300";

export default function ActivitySection({ uid, rows, onRefresh }) {
  const { addToast } = useToast();
  const { editingRecord, setEditingRecord, deleteTarget, setDeleteTarget, saving, add, save, confirmDelete } =
    useLedgerSection("activities", uid, onRefresh);

  const assistantRef = useRef(null);

  const [type, setType]               = useState("none");
  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate]               = useState("");
  const [document, setDocument]       = useState(null);

  async function handleAdd(e) {
    if (e) e.preventDefault();
    const ok = await add({ type, title, description, date, document }, `Added activity: ${title}`);
    if (ok) {
      setType("none"); setTitle(""); setDescription(""); setDate(""); setDocument(null);
      assistantRef.current?.reset();
    }
  }

  const handleUpdate = () => save(
    { type: editingRecord?.type, title: editingRecord?.title,
      description: editingRecord?.description, date: editingRecord?.date,
      document: editingRecord?.document || document },
    `Updated: ${editingRecord?.title}`
  );

  return (
    <section className="premium-card p-4 sm:p-6 lg:p-8 animate-slide-up">
      <div className="flex flex-col gap-1 mb-6">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Activities & Engagement</h2>
        <p className="text-sm text-slate-500">Co-curricular and leadership roles.</p>
      </div>

      <div className="flex flex-col gap-3 bg-slate-50/50 p-4 sm:p-5 rounded-2xl border border-slate-100 mb-6">
        <div>
          <p className="text-xs font-black text-slate-900 uppercase tracking-widest">AI Assistant</p>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-tight mt-0.5">Auto-fill with AI</p>
        </div>
        <SmartAssistant ref={assistantRef} mode="activity" studentUid={uid} existingData={rows}
          onExtract={(d) => {
            if (d.type) setType(d.type);
            if (d.title) setTitle(d.title);
            if (d.date) setDate(d.date);
            if (d.description) setDescription(d.description);
          }}
          onDocumentSaved={setDocument}
          label="AI Activity Assistant" description="Get AI suggestions for your activity"
        />
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input id="activity-title" name="activityTitle" placeholder="Activity Title / Event Name" required value={title} onChange={e => setTitle(e.target.value)} />
          <select id="activity-type" name="activityType" value={type} onChange={e => setType(e.target.value)} className={field}>
            <option value="extracurricular">Extracurricular Activity</option>
            <option value="co-curricular">Co-curricular Activity</option>
            <option value="sports">Sports / Athletics</option>
            <option value="social">Social Work / NGO</option>
            <option value="none">Other</option>
          </select>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input id="activity-date" name="activityDate" type="date" required value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <textarea id="activity-desc" name="activityDesc" placeholder="Short description, role, or impact..." value={description} onChange={e => setDescription(e.target.value)} rows={2} className={field} />
        <Button type="submit" className="w-full py-4">Register Activity</Button>
      </form>

      <div className="flex flex-col gap-4 mt-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Co-Curricular / Extracurricular</h3>
          <Badge variant="brand">{rows.length} Activities</Badge>
        </div>

        {rows.length === 0 ? (
          <div className="flex items-center justify-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-sm text-slate-500 italic">No activities registered yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map((r) => (
              <div key={r.id} className="flex flex-col gap-3 p-4 sm:p-5 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-md hover:border-slate-200 transition-all">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-black text-slate-900">{r.title}</span>
                  <Badge variant="brand">{r.type}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                  <span className="font-black text-slate-800">{r.date ? new Date(r.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A"}</span>
                  {r.description && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-600 leading-relaxed max-w-lg">{r.description}</span>
                    </>
                  )}
                  {r.document && (
                    <DocumentPreview document={r.document} triggerLabel="View uploaded file" />
                  )}
                </div>
                <div className="flex items-center gap-2 self-end">
                  <button onClick={() => setEditingRecord({ ...r })} className="p-2 text-slate-400 hover:text-brand-600 rounded-xl hover:bg-brand-50 transition-all">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M18.364 5.636a2.121 2.121 0 113 3L12 18l-4 1 1-4 9.364-9.364z" /></svg>
                  </button>
                  <button onClick={() => setDeleteTarget(r)} className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal title="Edit Activity" open={!!editingRecord} onClose={() => setEditingRecord(null)}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="edit-activity-type" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Category</label>
            <select id="edit-activity-type" name="editActivityType" value={editingRecord?.type || "none"} onChange={e => setEditingRecord({...editingRecord, type: e.target.value})} className={field}>
              <option value="none">None</option>
              <option value="co-curricular">Co-curricular</option>
              <option value="extra-curricular">Extra-curricular</option>
              <option value="cultural">Cultural</option>
              <option value="sports">Sports</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="edit-activity-title" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Title</label>
            <Input id="edit-activity-title" name="editActivityTitle" value={editingRecord?.title || ""} onChange={e => setEditingRecord({...editingRecord, title: e.target.value})} />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label htmlFor="edit-activity-date" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Date</label>
              <Input id="edit-activity-date" name="editActivityDate" type="date" value={editingRecord?.date || ""} onChange={e => setEditingRecord({...editingRecord, date: e.target.value})} />
            </div>
          </div>
          {editingRecord?.document && (
            <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-[11px] text-slate-600">
              Uploaded document: {editingRecord.document.fileName} (Firestore)
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label htmlFor="edit-activity-desc" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Description</label>
            <textarea id="edit-activity-desc" name="editActivityDesc" value={editingRecord?.description || ""} onChange={e => setEditingRecord({...editingRecord, description: e.target.value})} rows={3} className={field} />
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="ghost" onClick={() => setEditingRecord(null)}>Cancel</Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget} title="Delete Activity?"
        message={`Delete "${deleteTarget?.title}"? This is permanent.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await confirmDelete(`Deleted: ${deleteTarget.title}`);
        }}
      />
    </section>
  );
}
