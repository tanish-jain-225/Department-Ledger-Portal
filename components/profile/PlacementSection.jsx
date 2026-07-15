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

export default function PlacementSection({ uid, rows, onRefresh }) {
  const { addToast } = useToast();
  const { editingRecord, setEditingRecord, deleteTarget, setDeleteTarget, saving, add, save, confirmDelete } =
    useLedgerSection("placements", uid, onRefresh);

  const assistantRef = useRef(null);

  const [company, setCompany] = useState("");
  const [role, setRole]       = useState("");
  const [status, setStatus]   = useState("intern");
  const [pkg, setPkg]         = useState("");
  const [document, setDocument] = useState(null);

  async function handleAdd(e) {
    if (e) e.preventDefault();
    const ok = await add(
      { company, role, status, package: pkg, document, year: new Date().getFullYear() },
      `Added placement: ${company} (${role})`
    );
    if (ok) {
      setCompany(""); setRole(""); setStatus("intern"); setPkg(""); setDocument(null);
      assistantRef.current?.reset();
    }
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
        <SmartAssistant ref={assistantRef} mode="placement" studentUid={uid} existingData={rows}
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
          <Input id="placement-company" name="placementCompany" placeholder="Organization / Company" required value={company} onChange={e => setCompany(e.target.value)} />
          <Input id="placement-role" name="placementRole" placeholder="Job Role / Title" value={role} onChange={e => setRole(e.target.value)} />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select id="placement-status" name="placementStatus" value={status} onChange={e => setStatus(e.target.value)} className={field}>
            <option value="placed">Full-time Placed</option>
            <option value="intern">Internship</option>
            <option value="unplaced">Unplaced</option>
          </select>
          <Input id="placement-pkg" name="placementPkg" placeholder="Package (LPA) / Stipend" value={pkg} onChange={e => setPkg(e.target.value)} />
        </div>
        <Button type="submit" className="w-full py-4">Log Placement Info</Button>
      </form>

      <div className="flex flex-col gap-4 mt-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Career Status</h3>
          <Badge variant="brand">{rows.length} Records</Badge>
        </div>

        <div className="flex flex-col gap-4">
          {rows.length === 0 ? (
            <div className="flex items-center justify-center py-16 bg-slate-50/50 rounded-4xl border-2 border-dashed border-slate-100">
              <p className="text-sm text-slate-500 italic">&ldquo;No career milestones logged in the ledger.&rdquo;</p>
            </div>
          ) : (
            rows.map((r) => (
              <div key={r.id} className="group flex flex-col gap-4 premium-card p-4 sm:p-6 border-slate-100 hover:border-brand-500/30 transition-all">
                <div className="flex items-center justify-between gap-3">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] ${
                    r.status === "placed" ? "bg-emerald-50 text-emerald-700" :
                    r.status === "intern" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
                  }`}>
                    {r.status === "placed" ? "Full-time Placed" : r.status === "intern" ? "Internship" : "Unplaced"}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingRecord({ ...r })} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => setDeleteTarget(r)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">{r.company}</h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{r.role || "Trainee"} &bull; {r.package || "Not Specified"} LPA</p>
                </div>
                {r.document && (
                  <div className="pt-2 border-t border-slate-100">
                    <DocumentPreview document={r.document} triggerLabel="View placement / offer document" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <Modal open={!!editingRecord} onClose={() => setEditingRecord(null)} title="Update Placement Info">
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="flex flex-col gap-1 flex-1">
              <label htmlFor="edit-placement-company" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Company</label>
              <Input id="edit-placement-company" name="editPlacementCompany" value={editingRecord?.company || ""} onChange={e => setEditingRecord({...editingRecord, company: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label htmlFor="edit-placement-role" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Role</label>
              <Input id="edit-placement-role" name="editPlacementRole" value={editingRecord?.role || ""} onChange={e => setEditingRecord({...editingRecord, role: e.target.value})} />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label htmlFor="edit-placement-status" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</label>
              <select id="edit-placement-status" name="editPlacementStatus" value={editingRecord?.status || "intern"} onChange={e => setEditingRecord({...editingRecord, status: e.target.value})} className={field}>
                <option value="placed">Full-time Placed</option>
                <option value="intern">Internship</option>
                <option value="unplaced">Unplaced</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label htmlFor="edit-placement-pkg" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pkg / Stipend</label>
              <Input id="edit-placement-pkg" name="editPlacementPkg" value={editingRecord?.package || ""} onChange={e => setEditingRecord({...editingRecord, package: e.target.value})} />
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
