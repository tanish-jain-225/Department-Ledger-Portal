import { useState, useEffect } from "react";
import { useProfileEdit } from "@/lib/use-profile-edit";
import ConfirmDialog from "./ui/ConfirmDialog";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Badge from "./ui/Badge";
import IdentityCardPopup from "./IdentityCardPopup";

export default function FacultyProfile({ profile, onRefresh }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", address: "", dob: "", gender: "", linkedin: "", github: "", bio: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || "", phone: profile.phone || "",
        address: profile.address || "", dob: profile.dob || "",
        gender: profile.gender || "", linkedin: profile.linkedin || "",
        github: profile.github || "", bio: profile.bio || "",
      });
    }
  }, [profile]);

  const {
    saving, pendingDeletion, loadingDeletion,
    showDeleteConfirm, setShowDeleteConfirm,
    saveProfile, requestDeletion,
  } = useProfileEdit(profile?.id, profile?.email, profile?.name, onRefresh);

  async function handleSave(e) {
    if (e) e.preventDefault();
    const ok = await saveProfile(form);
    if (ok) setIsEditing(false);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10 animate-fade-in no-print pb-24">
      <IdentityCardPopup
        show={showCardModal}
        onClose={() => setShowCardModal(false)}
        role="faculty"
        data={profile}
        showPdf={true}
      />

      <section className="premium-card p-8 animate-slide-up transition-all duration-300">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Professional Identity</h1>
            <p className="text-sm text-slate-400 mt-1 font-medium italic">Manage your instructional credentials and departmental status.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {!isEditing && (
              <button
                onClick={() => setShowCardModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-xs font-black bg-brand-700 text-white hover:bg-brand-800 transition-all active:scale-95 shadow-xl shadow-brand-900/10 uppercase tracking-widest whitespace-nowrap"
              >
                View Identity Card
              </button>
            )}
            {!isEditing && (
              <Button
                variant="secondary"
                onClick={() => setIsEditing(true)}
                className="group py-3.5"
              >
                Edit Credentials
              </Button>
            )}
          </div>
        </div>

        {isEditing ? (
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
              <div className="sm:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Office Address</label>
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
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-900 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-300"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">LinkedIn (URL)</label>
                <Input
                  placeholder="https://linkedin.com/in/..."
                  value={form.linkedin}
                  onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">GitHub (URL)</label>
                <Input
                  placeholder="https://github.com/..."
                  value={form.github}
                  onChange={(e) => setForm({ ...form, github: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Professional Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={5}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-900 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-300"
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
        ) : (
          <div className="grid gap-8 sm:grid-cols-2">
            {[
              { label: "Full Name", value: profile?.name },
              { label: "Email Address", value: profile?.email },
              { label: "Contact Phone", value: profile?.phone },
              { label: "Gender", value: profile?.gender, capitalize: true },
              { label: "Date of Birth", value: profile?.dob },
            ].map((item) => (
              <div key={item.label} className="space-y-1.5 p-4 rounded-2xl bg-slate-50/50 border border-slate-100/50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.label}</p>
                <p className={`text-base font-bold text-slate-900 ${item.capitalize ? "capitalize" : ""}`}>
                  {item.value || "-"}
                </p>
              </div>
            ))}

            <div className="sm:col-span-2 space-y-1.5 p-4 rounded-2xl bg-slate-50/50 border border-slate-100/50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Office Address</p>
              <p className="text-base font-bold text-slate-900">{profile?.address || "-"}</p>
            </div>

            {[
              { label: "LinkedIn", value: profile?.linkedin },
              { label: "GitHub", value: profile?.github },
            ].map((item) => (
              <div key={item.label} className="space-y-1.5 p-4 rounded-2xl bg-slate-50/50 border border-slate-100/50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.label}</p>
                <p className="text-sm font-black text-brand-600 truncate">{item.value || "-"}</p>
              </div>
            ))}

            <div className="sm:col-span-2 space-y-1.5 p-4 rounded-2xl bg-slate-50/50 border border-slate-100/50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Professional Bio</p>
              <p className="text-base font-bold text-slate-900">{profile?.bio || "No professional biography provided."}</p>
            </div>

            <div className="sm:col-span-2 space-y-3">
              <Badge variant={profile?.role === "admin" ? "success" : "brand"} className="px-5 py-2 w-fit">
                {profile?.role === "admin" ? "Admin Access" : "Faculty Staff"}
              </Badge>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100/50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</p>
                  <p className="text-xs font-black text-emerald-600 uppercase">Verified</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100/50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Clearance</p>
                  <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{profile?.role === 'admin' ? 'L3 ROOT' : 'L2 STAFF'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isEditing && (
          <div className="mt-16 pt-8 border-t border-red-50/50">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <h3 className="text-sm font-black text-red-600 uppercase tracking-widest">Protocol: Data Deletion</h3>
            </div>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed max-w-xl">Requesting data deletion will trigger an administrative workflow to permanently purge your professional records. This operation is non-reversible.</p>

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
              <>
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

                <ConfirmDialog
                  open={showDeleteConfirm}
                  title="Account Purge Protocol"
                  message="You are about to submit a request for permanent account and record deletion. This action will initiate an administrative workflow to remove your professional profile from the ledger. Are you sure you wish to proceed?"
                  onConfirm={requestDeletion}
                  onCancel={() => setShowDeleteConfirm(false)}
                  variant="danger"
                />
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
