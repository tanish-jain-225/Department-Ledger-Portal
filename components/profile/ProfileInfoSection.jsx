import { useState } from "react";
import { useProfileEdit } from "@/lib/use-profile-edit";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function ProfileInfoSection({ user, profile, refreshProfile, onViewCard }) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: profile?.name || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
    dob: profile?.dob || "",
    gender: profile?.gender || "",
    linkedin: profile?.linkedin || "",
    github: profile?.github || "",
    alumni: !!profile?.alumni,
  });

  const {
    saving, pendingDeletion, loadingDeletion,
    showDeleteConfirm, setShowDeleteConfirm,
    saveProfile, requestDeletion,
  } = useProfileEdit(user?.uid, user?.email, profile?.name, refreshProfile);

  async function handleSave(e) {
    e.preventDefault();
    const ok = await saveProfile({
      name: form.name.trim(), phone: form.phone.trim(),
      address: form.address.trim(), alumni: form.alumni,
      dob: form.dob, gender: form.gender,
      linkedin: form.linkedin.trim(), github: form.github.trim(),
    });
    if (ok) setIsEditing(false);
  }

  return (
    <section className="premium-card p-8 animate-slide-up transition-all duration-300">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Personal Identity</h2>
          <p className="text-sm text-slate-400 mt-1 font-medium italic">&ldquo;Manage your legal and professional identification.&rdquo;</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {!isEditing && (
            <button
               onClick={onViewCard}
               className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5 text-xs font-black text-white hover:bg-brand-600 transition-all active:scale-95 shadow-xl shadow-slate-900/10 uppercase tracking-widest whitespace-nowrap"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
              </svg>
              View Identity Card
            </button>
          )}
          {!isEditing && (
            <Button
              variant="secondary"
              onClick={() => setIsEditing(true)}
              className="group py-3.5"
            >
              <svg className="h-4 w-4 text-brand-500 transition-transform group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Attributes
            </Button>
          )}
        </div>
      </div>

      {!isEditing ? (
        <div className="grid gap-8 sm:grid-cols-2">
          {[
            { label: "Full Name", value: profile?.name },
            { label: "Email Address", value: profile?.email },
            { label: "Contact Phone", value: profile?.phone },
            { label: "Gender Identity", value: profile?.gender, capitalize: true },
            { label: "Date of Birth", value: profile?.dob },
          ].map((item) => (
            <div key={item.label} className="space-y-1.5 p-4 rounded-2xl bg-slate-50/50 border border-slate-100/50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.label}</p>
              <p className={`text-base font-bold text-slate-900 ${item.capitalize ? "capitalize" : ""}`}>
                {item.value || "—"}
              </p>
            </div>
          ))}
          
          <div className="sm:col-span-2 space-y-1.5 p-4 rounded-2xl bg-slate-50/50 border border-slate-100/50">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Primary Address</p>
            <p className="text-base font-bold text-slate-900">{profile?.address || "—"}</p>
          </div>

          {[
            { label: "LinkedIn", value: profile?.linkedin, icon: "li" },
            { label: "GitHub", value: profile?.github, icon: "gh" },
          ].map((item) => (
            <div key={item.label} className="space-y-1.5 p-4 rounded-2xl bg-slate-50/50 border border-slate-100/50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.label}</p>
              <p className="text-sm font-black text-brand-600 truncate">{item.value || "—"}</p>
            </div>
          ))}

          <div className="sm:col-span-2 pt-2">
            <Badge variant={profile?.alumni ? "success" : "brand"} className="px-5 py-2">
              {profile?.alumni ? "Verified Alumni" : "Undergraduate Student"}
            </Badge>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6 max-w-2xl animate-fade-in">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Full Legal Name</label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Phone Number</label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-900 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-300"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Residential Address</label>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows={2}
                className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-900 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-300"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Date of Birth</label>
              <Input
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
              />
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-3 text-sm font-black text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.alumni}
                  onChange={(e) => setForm({ ...form, alumni: e.target.checked })}
                  className="rounded-lg border-slate-300 text-brand-600 focus:ring-brand-500 h-5 w-5 transition-all"
                />
                Mark as Alumni
              </label>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">LinkedIn (URL)</label>
              <Input
                placeholder="https://linkedin.com/in/..."
                value={form.linkedin}
                onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">GitHub (URL)</label>
              <Input
                placeholder="https://github.com/..."
                value={form.github}
                onChange={(e) => setForm({ ...form, github: e.target.value })}
              />
            </div>
          </div>
          
          <div className="flex gap-4 pt-8 border-t border-slate-100">
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 py-4"
            >
              {saving ? "Persisting Changes..." : "Commit Changes"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditing(false)}
              className="flex-1 py-4"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {!isEditing && (
        <div className="mt-16 pt-8 border-t border-red-50/50">
          <div className="flex items-center gap-2 mb-4">
             <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
             <h3 className="text-sm font-black text-red-600 uppercase tracking-widest">Protocol: Data Deletion</h3>
          </div>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed max-w-xl">Requesting data deletion will trigger an administrative workflow to permanently purge your records from the ledger. This operation is non-reversible.</p>
          
          {loadingDeletion ? (
            <div className="h-12 w-48 bg-slate-100 animate-pulse rounded-2xl" />
          ) : pendingDeletion ? (
            <div className="flex flex-col gap-4 items-start">
               <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-800 animate-fade-in shadow-sm">
                  <svg className="h-5 w-5 text-amber-500 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-black uppercase tracking-widest">Awaiting Administrative Review</span>
               </div>
               <p className="text-[10px] font-bold text-slate-400 italic pl-2">Protocol: Your purge request is active. System access will be revoked upon clearance.</p>
            </div>
          ) : (
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="danger"
              className="px-6"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Initialize Deletion Request
            </Button>
          )}

          <ConfirmDialog 
            show={showDeleteConfirm}
            title="Account Purge Protocol"
            message="You are about to submit a request for permanent account and record deletion. This action will initiate an administrative workflow to remove your professional profile from the ledger. Are you sure you wish to proceed?"
            onConfirm={requestDeletion}
            onCancel={() => setShowDeleteConfirm(false)}
            variant="danger"
          />
        </div>
      )}
    </section>
  );
}
