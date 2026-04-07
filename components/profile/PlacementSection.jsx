import { useState } from "react";
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

export default function PlacementSection({ uid, rows, onRefresh }) {
  const { addToast } = useToast();
  const { editingRecord, setEditingRecord, deleteTarget, setDeleteTarget, saving, add, save, confirmDelete } =
    useLedgerSection("placements", uid, onRefresh);

  const [company, setCompany] = useState("");
  const [role, setRole]       = useState("");
  const [status, setStatus]   = useState("intern");
  const [pkg, setPkg]         = useState("");
  const [document, setDocument] = useState(null);

  async function handleAdd(e) {
    if (e) e.preventDefault();
    await add(
      { company, role, status, package: pkg, document, year: new Date().getFullYear() },
      `Added placement: ${company} (${role})`
    );
    setCompany(""); setRole(""); setStatus("intern"); setPkg(""); setDocument(null);
  }

  const handleUpdate = () => save(
    { company: editingRecord?.company, role: editingRecord?.role,
      status: editingRecord?.status, package: editingRecord?.package,
      document: editingRecord?.document || document },
    `Updated: ${editingRecord?.company}`
  );

  return (
    <section className="premium-card p-4 sm:p-6 lg:p-8 animate-slide-up">
      <div className="flex flex-col gap-1 mb-6">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Placements & Careers</h2>
        <p className="text-sm text-slate-500">Professional milestones and internships.</p>
      </div>

      <div className="flex flex-col gap-3 bg-slate-50/50 p-4 sm:p-5 rounded-2xl border border-slate-100 mb-6">
        <div>
          <p className="text-xs font-black text-slate-900 uppercase tracking-widest">AI Assistant</p>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-tight mt-0.5">Auto-fill with AI</p>
        </div>
        <SmartAssistant mode="placement" studentUid={uid} existingData={rows}
          onExtract={(d) => {
            if (d.company) setCompany(d.company);
            if (d.role) setRole(d.role);
            if (d.package) setPkg(d.package.toString());
            if (d.status) setStatus(d.status);
          }}
          onDocumentSaved={setDocument}
          label="AI Career Assistant" description="Describe your placement/internship for AI suggestions"
        />
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input placeholder="Organization / Company" required value={company} onChange={e => setCompany(e.target.value)} />
          <Input placeholder="Job Role / Title" value={role} onChange={e => setRole(e.target.value)} />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={status} onChange={e => setStatus(e.target.value)} className={field}>
            <option value="placed">Full-time Placed</option>
            <option value="intern">Internship</option>
            <option value="unplaced">Unplaced</option>
          </select>
          <Input placeholder="Package (LPA) / Stipend" value={pkg} onChange={e => setPkg(e.target.value)} />
        </div>
        <Button type="submit" className="w-full py-4">Log Placement Info</Button>
      </form>

      <div className="flex flex-col gap-4 mt-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Career Status</h3>
          <Badge variant="brand">{rows.length} Records</Badge>
        </div>

        {rows.length === 0 ? (
          <div className="flex items-center justify-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-sm text-slate-500 italic">No professional records logged yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map((r) => (
              <div key={r.id} className="flex flex-col gap-3 p-4 sm:p-5 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-md hover:border-slate-200 transition-all">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-black text-slate-900">{r.company}</span>
                  <Badge variant={r.status === "placed" ? "success" : "brand"}>{r.status}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                  <span className="font-black text-slate-800">{r.role || "Professional Role"}</span>
                  {r.package && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="text-emerald-600 font-black">₹ {r.package}</span>
                    </>
                  )}
                  {r.link && (
                    <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      View Details
                    </a>
                  )}
                  {r.document && (
                    <DocumentPreview document={r.document} triggerLabel="View uploaded file" />
                  )}
                </div>
                <div className="flex items-center gap-2 self-end">
                  <button onClick={() => setEditingRecord({...r})} className="p-2 text-slate-400 hover:text-brand-600 rounded-xl hover:bg-brand-50 transition-all">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M18.364 5.636a2.121 2.121 0 113 3L12 18l-4 1 1-4 9.364-9.364z" /></svg>
                  </button>
                  <button onClick={() => setDeleteTarget({ id: r.id, company: r.company })} className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal title="Edit Placement" open={!!editingRecord} onClose={() => setEditingRecord(null)}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Company</label>
              <Input value={editingRecord?.company || ""} onChange={e => setEditingRecord({...editingRecord, company: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Role</label>
              <Input value={editingRecord?.role || ""} onChange={e => setEditingRecord({...editingRecord, role: e.target.value})} />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</label>
              <select value={editingRecord?.status || "intern"} onChange={e => setEditingRecord({...editingRecord, status: e.target.value})} className={field}>
                <option value="placed">Full-time Placed</option>
                <option value="intern">Internship</option>
                <option value="unplaced">Unplaced</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pkg / Stipend</label>
              <Input value={editingRecord?.package || ""} onChange={e => setEditingRecord({...editingRecord, package: e.target.value})} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {editingRecord?.document ? (
              <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-[11px] text-slate-600">
                Uploaded document: {editingRecord.document.fileName} (Firestore)
              </div>
            ) : null}
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="ghost" onClick={() => setEditingRecord(null)}>Cancel</Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget} title="Delete Record?"
        message={`Delete record for "${deleteTarget?.company}"?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await confirmDelete(`Deleted: ${deleteTarget.company}`);
        }}
      />
    </section>
  );
}
