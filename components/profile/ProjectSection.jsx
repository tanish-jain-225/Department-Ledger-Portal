import { useState } from "react";
import { createRecord, removeRecord, updateRecord } from "@/lib/data";
import { useToast } from "@/lib/toast-context";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import SmartAssistant from "./SmartAssistant";

export default function ProjectSection({ uid, rows, onRefresh }) {
  const { addToast } = useToast();
  const [title, setTitle] = useState("");
  const [techStack, setTechStack] = useState("");
  const [link, setLink] = useState("");
  const [github, setGithub] = useState("");
  const [description, setDescription] = useState("");

  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function add(e) {
    if (e) e.preventDefault();
    try {
      await createRecord("projects", {
        studentUid: uid,
        title,
        techStack,
        link,
        github,
        description,
        createdAt: new Date(),
      }, {
        actorUid: uid,
        description: `Added project: ${title}`
      });
      addToast(`Added project: ${title}`, "success");
      setTitle("");
      setTechStack("");
      setLink("");
      setGithub("");
      setDescription("");
      onRefresh();
    } catch (err) {
      addToast("Failed to add project", "error");
    }
  }

  async function handleUpdate() {
    if (!editingRecord) return;
    try {
      await updateRecord("projects", editingRecord.id, {
        title: editingRecord.title,
        techStack: editingRecord.techStack,
        link: editingRecord.link,
        github: editingRecord.github,
        description: editingRecord.description,
      }, {
        actorUid: uid,
        description: `Updated project: ${editingRecord.title}`
      });
      addToast(`Updated project: ${editingRecord.title}`, "success");
      setEditingRecord(null);
      onRefresh();
    } catch (err) {
      addToast("Failed to update project", "error");
    }
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Technical Portfolio</h2>
      <p className="text-sm text-slate-400 mt-1 italic">&ldquo;Showcase your engineering initiatives and research projects.&rdquo;</p>

      <div className="mt-8 bg-slate-50/50 p-6 rounded-3xl border border-slate-100 mb-8">
        <div className="mb-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Master Entry</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">Manual entry with AI assistance</p>
        </div>
        <SmartAssistant
          mode="project"
          existingData={rows}
          onExtract={(data) => {
            if (data.title) setTitle(data.title);
            if (data.techStack) setTechStack(data.techStack);
            if (data.description) setDescription(data.description);
          }}
          label="AI Project Assistant"
          description="Get AI suggestions for your project"
        />
      </div>

      <form onSubmit={add} className="grid gap-4 sm:grid-cols-2">
        <Input
          placeholder="Project Title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          placeholder="Tech Stack (e.g. Next.js, Firebase, PyTorch)"
          value={techStack}
          onChange={(e) => setTechStack(e.target.value)}
        />
        <Input
          placeholder="Live Preview URL"
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        <Input
          placeholder="GitHub Repository"
          type="url"
          value={github}
          onChange={(e) => setGithub(e.target.value)}
        />
        <div className="sm:col-span-2">
          <textarea
            placeholder="Detailed Project Description"
            className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-900 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-300 min-h-[100px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" className="w-full py-4 uppercase tracking-widest text-[10px] font-black">
            Register Project in Ledger
          </Button>
        </div>
      </form>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.id} className="group premium-card p-6 border-slate-100 hover:border-brand-500/30 transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <Badge variant="brand" className="uppercase tracking-[0.2em] text-[9px]">{r.techStack || "General Project"}</Badge>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => setEditingRecord(r)} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => setDeleteTarget(r)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-black text-slate-900 leading-tight mb-2 uppercase tracking-tight">{r.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed mb-4">{r.description}</p>
            </div>
            
            <div className="flex items-center gap-4 mt-4">
               {r.link && (
                 <a href={r.link} target="_blank" rel="noreferrer" className="text-[10px] font-black text-brand-600 uppercase tracking-widest hover:underline hover:translate-x-1 transition-all">Live Demo →</a>
               )}
               {r.github && (
                 <a href={r.github} target="_blank" rel="noreferrer" className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:underline hover:translate-x-1 transition-all">Source Code →</a>
               )}
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="sm:col-span-2 py-20 text-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
            <p className="text-sm text-slate-400 font-medium italic">&ldquo;No project entries found in the institutional ledger.&rdquo;</p>
          </div>
        )}
      </div>

      <Modal open={!!editingRecord} onClose={() => setEditingRecord(null)} title="Update Project">
        <div className="space-y-4 pt-4">
          <Input placeholder="Title" value={editingRecord?.title} onChange={e => setEditingRecord({...editingRecord, title: e.target.value})} />
          <Input placeholder="Tech Stack" value={editingRecord?.techStack} onChange={e => setEditingRecord({...editingRecord, techStack: e.target.value})} />
          <Input placeholder="Live URL" value={editingRecord?.link} onChange={e => setEditingRecord({...editingRecord, link: e.target.value})} />
          <Input placeholder="GitHub URL" value={editingRecord?.github} onChange={e => setEditingRecord({...editingRecord, github: e.target.value})} />
          <textarea
            placeholder="Description"
            className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-900 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 focus:outline-none"
            rows={4}
            value={editingRecord?.description}
            onChange={e => setEditingRecord({...editingRecord, description: e.target.value})}
          />
          <Button onClick={handleUpdate} className="w-full py-4">Save Ledger Entry</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          await removeRecord("projects", deleteTarget.id, {
            actorUid: uid,
            description: `Removed project: ${deleteTarget.title}`
          });
          onRefresh();
          setDeleteTarget(null);
          addToast("Project entry erased", "success");
        }}
        title="Erase Project Record"
        message="Are you sure you want to permanently remove this project from the institutional ledger? This action cannot be undone."
      />
    </div>
  );
}
