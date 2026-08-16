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
    <div className="mx-auto max-w-5xl space-y-6 min-[360px]:space-y-8 animate-fade-in no-print pb-16">
      <IdentityCardPopup
        show={showCardModal}
        onClose={() => setShowCardModal(false)}
        role="faculty"
        data={profile}
        showPdf={true}
      />

      <section className="premium-card p-responsive animate-slide-up transition-all duration-300">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Faculty Profile</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Manage your credentials, bio, and department contact info.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {!isEditing && (
              <button
                onClick={() => setShowCardModal(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold bg-brand-700 text-white hover:bg-brand-800 transition-all active:scale-95 shadow-sm shrink-0"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                </svg>
                Faculty ID Card
              </button>
            )}
            {!isEditing && (
              <Button
                variant="secondary"
                onClick={() => setIsEditing(true)}
                className="flex-1 sm:flex-none py-2 px-3.5 text-xs shrink-0 border-slate-200"
              >
                <svg className="h-3.5 w-3.5 text-slate-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4 sm:space-y-5 max-w-2xl animate-fade-in">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Full Name</label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Phone Number</label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Office Location / Address</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Date of Birth</label>
                <Input
                  type="date"
                  value={form.dob}
                  onChange={(e) => setForm({ ...form, dob: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 mb-1 block">LinkedIn Profile URL</label>
                <Input
                  placeholder="https://linkedin.com/in/..."
                  value={form.linkedin}
                  onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 mb-1 block">GitHub / Scholar URL</label>
                <Input
                  placeholder="https://github.com/..."
                  value={form.github}
                  onChange={(e) => setForm({ ...form, github: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Bio / Research Interests</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5"
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="grid gap-3 min-[360px]:gap-4 sm:gap-6 sm:grid-cols-2">
            {[
              { label: "Full Name", value: profile?.name },
              { label: "Email Address", value: profile?.email },
              { label: "Contact Phone", value: profile?.phone },
              { label: "Gender", value: profile?.gender, capitalize: true },
              { label: "Date of Birth", value: profile?.dob },
            ].map((item) => (
              <div key={item.label} className="space-y-1 p-3.5 min-[360px]:p-4 rounded-xl bg-slate-50/50 border border-slate-100 min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                <p className={`text-sm font-semibold text-slate-900 truncate ${item.capitalize ? "capitalize" : ""}`}>
                  {item.value || "-"}
                </p>
              </div>
            ))}

            <div className="sm:col-span-2 space-y-1 p-3.5 min-[360px]:p-4 rounded-xl bg-slate-50/50 border border-slate-100 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Office Location</p>
              <p className="text-sm font-semibold text-slate-900 break-words">{profile?.address || "-"}</p>
            </div>

            {[
              { label: "LinkedIn", value: profile?.linkedin },
              { label: "GitHub / Portfolio", value: profile?.github },
            ].map((item) => (
              <div key={item.label} className="space-y-1 p-3.5 min-[360px]:p-4 rounded-xl bg-slate-50/50 border border-slate-100 min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                <p className="text-xs font-bold text-brand-600 truncate">{item.value || "-"}</p>
              </div>
            ))}

            <div className="sm:col-span-2 space-y-1 p-3.5 min-[360px]:p-4 rounded-xl bg-slate-50/50 border border-slate-100 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bio & Research</p>
              <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-line">{profile?.bio || "No biography provided."}</p>
            </div>

            <div className="sm:col-span-2 space-y-2 pt-1">
              <Badge variant={profile?.role === "admin" ? "success" : "brand"} className="px-3 py-1 w-fit">
                {profile?.role === "admin" ? "Administrator" : "Faculty Staff"}
              </Badge>
            </div>
          </div>
        )}

        {!isEditing && (
          <div className="mt-10 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <h3 className="text-sm font-bold text-slate-900">Account Management</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4 max-w-xl">Requesting account deletion will submit a request to the department administrators to review and remove your records from the ledger.</p>

            {loadingDeletion ? (
              <div className="h-10 w-44 bg-slate-100 animate-pulse rounded-xl" />
            ) : pendingDeletion ? (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                <svg className="h-4 w-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Deletion request pending admin review</span>
              </div>
            ) : (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="danger"
                size="sm"
              >
                Request Account Deletion
              </Button>
            )}

            <ConfirmDialog
              open={showDeleteConfirm}
              title="Request Account Deletion"
              message="Are you sure you want to submit a deletion request? An administrator will review your request to remove your records from the ledger."
              onConfirm={requestDeletion}
              onCancel={() => setShowDeleteConfirm(false)}
              variant="danger"
            />
          </div>
        )}
      </section>
    </div>
  );
}
