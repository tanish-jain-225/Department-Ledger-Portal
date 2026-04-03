import { useState } from "react";
import { useLedgerSection } from "@/lib/use-ledger-section";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import SmartAssistant from "./SmartAssistant";

const field = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-300";

export default function ProjectSection({ uid, rows, onRefresh }) {
  const { editingRecord, setEditingRecord, deleteTarget, setDeleteTarget, saving, add, save, confirmDelete } =
    useLedgerSection("projects", uid, onRefresh);

  const [title, setTitle]           = useState("");
  const [techStack, setTechStack]   = useState("");
  const [link, setLink]             = useState("");
  const [github, setGithub]         = useState("");
  const [description, setDescription] = useState("");

  async function handleAdd(e) {
    if (e) e.preventDefault();
    await add({ title, techStack, link, github, description }, `Added project: ${title}`);
    setTitle(""); setTechStack(""); setLink(""); setGithub(""); setDescription("");
  }

  const handleUpdate = () => save(
    { title: editingRecord?.title, techStack: editingRecord?.techStack,
      link: editingRecord?.link, github: editingRecord?.github, description: editingRecord?.description },
    `Updated: ${editingRecord?.title}`
  );

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Technical Portfolio</h2>
        <p className="text-sm text-slate-400 italic">&ldquo;Engineering initiatives and research projects.&rdquo;</p>
      </div>

      <div className="flex flex-col gap-3 bg-slate-50/50 p-4 sm:p-5 rounded-2xl border border-slate-100">
        <div>
          <p className="text-xs font-black text-slate-900 uppercase tracking-widest">AI Assistant</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">Auto-fill with AI</p>
        </div>
        <SmartAssistant mode="project" existingData={rows}
          onExtract={(d) => {
            if (d.title) setTitle(d.title);
            if (d.techStack) setTechStack(d.techStack);
            if (d.description) setDescription(d.description);
          }}
          label="AI Project Assistant" description="Get AI suggestions for your project"
        />
      </div>

      <form onSubmit={add} className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input placeholder="Project Title" required value={title} onChange={e => setTitle(e.target.value)} />
          <Input placeholder="Tech Stack (e.g. Next.js, Firebase)" value={techStack} onChange={e => setTechStack(e.target.value)} />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input placeholder="Live Preview URL" type="url" value={link} onChange={e => setLink(e.target.value)} />
          <Input placeholder="GitHub Repository" type="url" value={github} onChange={e => setGithub(e.target.value)} />
        </div>
        <textarea placeholder="Detailed Project Description" className={field} value={description} onChange={e => setDescription(e.target.value)} rows={3} />
        <Button type="submit" className="w-full py-4 uppercase tracking-widest text-[10px] font-black">Register Project in Ledger</Button>
      </form>

      {/* Project cards - flex column always, no grid that squeezes */}
      <div className="flex flex-col gap-4">
        {rows.length === 0 ? (
          <div className="flex items-center justify-center py-16 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
            <p className="text-sm text-slate-400 italic">&ldquo;No project entries found in the institutional ledger.&rdquo;</p>
          </div>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="group flex flex-col gap-4 premium-card p-4 sm:p-6 border-slate-100 hover:border-brand-500/30 transition-all">
              {/* Card header */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <Badge variant="brand" className="uppercase tracking-[0.2em] text-[9px]">{r.techStack || "General Project"}</Badge>
                <div className="flex gap-2">
                  <button onClick={() => setEditingRecord(r)} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => setDeleteTarget(r)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{r.title}</h3>
              {r.description && <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">{r.description}</p>}
              {(r.link || r.github) && (
                <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100">
                  {r.link && <a href={r.link} target="_blank" rel="noreferrer" className="text-[10px] font-black text-brand-600 uppercase tracking-widest hover:underline transition-all">Live Demo →</a>}
                  {r.github && <a href={r.github} target="_blank" rel="noreferrer" className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:underline transition-all">Source Code →</a>}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <Modal open={!!editingRecord} onClose={() => setEditingRecord(null)} title="Update Project">
        <div className="flex flex-col gap-4">
          <Input placeholder="Title" value={editingRecord?.title || ""} onChange={e => setEditingRecord({...editingRecord, title: e.target.value})} />
          <Input placeholder="Tech Stack" value={editingRecord?.techStack || ""} onChange={e => setEditingRecord({...editingRecord, techStack: e.target.value})} />
          <div className="flex flex-col sm:flex-row gap-3">
            <Input placeholder="Live URL" value={editingRecord?.link || ""} onChange={e => setEditingRecord({...editingRecord, link: e.target.value})} />
            <Input placeholder="GitHub URL" value={editingRecord?.github || ""} onChange={e => setEditingRecord({...editingRecord, github: e.target.value})} />
          </div>
          <textarea placeholder="Description" className={field} rows={4} value={editingRecord?.description || ""} onChange={e => setEditingRecord({...editingRecord, description: e.target.value})} />
          <Button onClick={handleUpdate} className="w-full py-4">Save Ledger Entry</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget} onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          await removeRecord("projects", deleteTarget.id, { actorUid: uid, description: `Removed: ${deleteTarget.title}` });
          onRefresh(); setDeleteTarget(null);
          addToast("Project entry erased", "success");
        }}
        title="Erase Project Record"
        message="Permanently remove this project from the institutional ledger? This cannot be undone."
      />
    </div>
  );
}
