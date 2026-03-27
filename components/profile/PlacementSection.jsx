import { useState } from "react";
import { createRecord, removeRecord, updateRecord } from "@/lib/data";
import { useToast } from "@/lib/toast-context";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import SmartAssistant from "./SmartAssistant";


export default function PlacementSection({ uid, rows, onRefresh }) {
  const { addToast } = useToast();
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("intern");
  const [pkg, setPkg] = useState("");
  const [link, setLink] = useState("");

  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function add(e) {
    if (e) e.preventDefault();
    try {
      await createRecord("placements", {
        studentUid: uid,
        company,
        role,
        status,
        package: pkg,
        link,
        year: new Date().getFullYear(),
      }, {
        actorUid: uid,
        description: `Added placement/internship: ${company} (${role})`
      });
      addToast(`Added placement: ${company}`, "success");
      setCompany("");
      setRole("");
      setPkg("");
      setLink("");
      onRefresh();
    } catch (err) {
      addToast("Failed to add placement info", "error");
    }
  }

  async function handleUpdate() {
    if (!editingRecord) return;
    try {
      await updateRecord("placements", editingRecord.id, {
        company: editingRecord.company,
        role: editingRecord.role,
        status: editingRecord.status,
        package: editingRecord.package,
        link: editingRecord.link,
      }, {
        actorUid: uid,
        description: `Updated placement: ${editingRecord.company}`
      });
      addToast(`Updated placement: ${editingRecord.company}`, "success");
      setEditingRecord(null);
      onRefresh();
    } catch (err) {
      addToast("Failed to update placement info", "error");
    }
  }

  return (
    <section className="premium-card p-8 animate-slide-up">
      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Placements & Careers</h2>
      <p className="text-sm text-slate-400 mt-1">Manage your professional milestones and internships.</p>

      <div className="mt-8 bg-slate-50/50 p-6 rounded-3xl border border-slate-100 mb-8">
        <div className="mb-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Master Entry</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">Manual entry with AI assistance</p>
        </div>
        
        <SmartAssistant 
          mode="placement" 
          existingData={rows}
          onExtract={(data) => {
            if (data.company) setCompany(data.company);
            if (data.role) setRole(data.role);
            if (data.package) setPkg(data.package.toString());
            if (data.status) setStatus(data.status);
          }} 
          label="AI Career Assistant"
          description="Describe your placement/internship for AI suggestions"
        />
      </div>

      <form onSubmit={add} className="grid gap-4 sm:grid-cols-2">
        <Input
          placeholder="Organization / Company"
          required
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
        <Input
          placeholder="Job Role / Title"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-900 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-300"
        >
          <option value="placed">Full-time Placed</option>
          <option value="intern">Internship</option>
          <option value="unplaced">Unplaced</option>
        </select>
        <Input
          placeholder="Package (LPA) / Stipend"
          value={pkg}
          onChange={(e) => setPkg(e.target.value)}
        />
        <Input
          placeholder="Offer Letter / LinkedIn Post Link (Optional)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="sm:col-span-2"
        />
        <Button type="submit" className="sm:col-span-2 py-4">
          Log Placement Info
        </Button>
      </form>

      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Career Status</h3>
          <Badge variant="brand">{rows.length} Records</Badge>
        </div>

        {rows.length === 0 ? (
          <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-sm text-slate-400 font-medium italic">No professional records logged yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((r) => (
              <div key={r.id} className="group flex items-center justify-between p-5 rounded-2xl bg-slate-50/50 border border-slate-100 transition-all hover:bg-white hover:shadow-md hover:border-slate-200">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-base font-black text-slate-900 truncate">{r.company}</span>
                    <Badge variant={r.status === 'placed' ? 'success' : 'brand'}>{r.status}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 font-bold">
                    <span className="text-slate-800 font-black">{r.role || "Professional Role"}</span>
                    {r.package && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="text-emerald-600">₹ {r.package}</span>
                      </>
                    )}
                    {r.link && (
                      <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700 flex items-center gap-1.5 transition-colors pl-2">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View Details
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
                    onClick={() => setDeleteTarget({ id: r.id, company: r.company })}
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
        title="Edit Placement"
        open={!!editingRecord}
        onClose={() => setEditingRecord(null)}
      >
        <div className="grid gap-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Company</label>
              <Input
                value={editingRecord?.company || ""}
                onChange={(e) => setEditingRecord({...editingRecord, company: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Role</label>
              <Input
                value={editingRecord?.role || ""}
                onChange={(e) => setEditingRecord({...editingRecord, role: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Status</label>
              <select
                value={editingRecord?.status || "intern"}
                onChange={(e) => setEditingRecord({...editingRecord, status: e.target.value})}
                className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-900 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-300"
              >
                <option value="placed">Full-time Placed</option>
                <option value="intern">Internship</option>
                <option value="unplaced">Unplaced</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Pkg/Stipend</label>
              <Input
                value={editingRecord?.package || ""}
                onChange={(e) => setEditingRecord({...editingRecord, package: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Post Link</label>
            <Input
              value={editingRecord?.link || ""}
              onChange={(e) => setEditingRecord({...editingRecord, link: e.target.value})}
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
        title="Delete Record?"
        message={`Are you sure you want to delete the record for "${deleteTarget?.company}"?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await removeRecord("placements", deleteTarget.id, {
              actorUid: uid,
              targetUid: uid,
              description: `Deleted placement/internship: ${deleteTarget.company}`
            });
            addToast(`Deleted placement: ${deleteTarget.company}`, "success");
            setDeleteTarget(null);
            onRefresh();
          } catch (err) {
            addToast("Failed to delete record", "error");
          }
        }}
      />
    </section>
  );
}
