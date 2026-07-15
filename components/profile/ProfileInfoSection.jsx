import { useState } from "react";
import { useProfileEdit } from "@/lib/use-profile-edit";
import { useToast } from "@/lib/toast-context";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Select from "@/components/ui/Select";

export default function ProfileInfoSection({ user, profile, refreshProfile, onViewCard }) {
  const { addToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [downloadingDossier, setDownloadingDossier] = useState(false);
  const [form, setForm] = useState({
    name: profile?.name || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
    dob: profile?.dob || "",
    gender: profile?.gender || "",
    linkedin: profile?.linkedin || "",
    github: profile?.github || "",
    alumni: !!profile?.alumni,
    year: profile?.year || "",
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
      year: form.year,
    });
    if (ok) setIsEditing(false);
  }

  async function handleDownloadDossier() {
    if (!user?.uid) return;
    setDownloadingDossier(true);
    try {
      const { fetchExhaustiveStudentData } = await import("@/lib/student-data");
      const { computeReport } = await import("@/lib/student-analytics");
      const { buildStudentPdf } = await import("@/lib/pdf-export");
      const { buildFilename } = await import("@/lib/pdf-download");

      addToast("Assembling complete academic ledger dossier...", "info");

      const lists = await fetchExhaustiveStudentData(user.uid);
      const report = computeReport(profile, lists);
      const pdfBytes = await buildStudentPdf(profile, lists, report);

      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = buildFilename("Student_Dossier", profile.rollNumber || profile.name);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addToast("Dossier PDF downloaded successfully.", "success");
    } catch (err) {
      console.error("Dossier download failed:", err);
      addToast(err?.message || "Failed to download dossier.", "error");
    } finally {
      setDownloadingDossier(false);
    }
  }

  return (
    <section className="premium-card p-responsive animate-slide-up transition-all duration-300">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-6 mb-8">
        <div>
          <h2 className="text-2xl min-[360px]:text-3xl font-black text-slate-900 tracking-tighter uppercase">Personal Identity</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium italic">&ldquo;Manage your legal and professional identification.&rdquo;</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {!isEditing && (
            <button
              onClick={onViewCard}
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-xs font-black bg-brand-700 text-white hover:bg-brand-800 transition-all active:scale-95 shadow-xl shadow-brand-900/10 uppercase tracking-widest whitespace-nowrap"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
              </svg>
              Identity Card
            </button>
          )}
          {!isEditing && (
            <Button
              variant="brand"
              onClick={handleDownloadDossier}
              disabled={downloadingDossier}
              loading={downloadingDossier}
              className="group py-3.5 shrink-0"
            >
              <svg className="h-4 w-4 shrink-0 group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Dossier
            </Button>
          )}
          {!isEditing && (
            <Button
              variant="secondary"
              onClick={() => setIsEditing(true)}
              className="group py-3.5 border-slate-200"
            >
              <svg className="h-4 w-4 text-slate-500 transition-transform group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Details
            </Button>
          )}
        </div>
      </div>

      {!isEditing ? (
        <div className="grid gap-4 min-[360px]:gap-6 sm:gap-8 sm:grid-cols-2">
          {[
            { label: "Full Name", value: profile?.name },
            { label: "Email Address", value: profile?.email },
            { label: "Contact Phone", value: profile?.phone },
            { label: "Gender Identity", value: profile?.gender, capitalize: true },
            { label: "Date of Birth", value: profile?.dob },
            { 
              label: "Academic Year", 
              value: profile?.year ? (
                <span className="inline-flex items-center gap-1.5 text-brand-700 bg-brand-50 border border-brand-100 rounded-xl px-3 py-0.5 text-sm font-black uppercase tracking-wider">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  {profile.year} Year
                </span>
              ) : "-"
            },
          ].map((item) => (
            <div key={item.label} className="space-y-1.5 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-brand-200 transition-colors">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.label}</p>
              <p className={`text-base font-bold text-slate-900 ${item.capitalize ? "capitalize" : ""}`}>
                {item.value || "-"}
              </p>
            </div>
          ))}

          <div className="sm:col-span-2 space-y-1.5 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-brand-200 transition-colors">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Primary Address</p>
            <p className="text-base font-bold text-slate-900">{profile?.address || "-"}</p>
          </div>

          {[
            { label: "LinkedIn", value: profile?.linkedin, icon: "li" },
            { label: "GitHub", value: profile?.github, icon: "gh" },
          ].map((item) => (
            <div key={item.label} className="space-y-1.5 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-brand-200 transition-colors">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.label}</p>
              <p className="text-sm font-black text-brand-600 truncate">{item.value || "-"}</p>
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
              <label htmlFor="profile-name" className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Full Legal Name</label>
              <Input
                id="profile-name"
                name="name"
                autoComplete="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="profile-phone" className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Phone Number</label>
              <Input
                id="profile-phone"
                name="phone"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="profile-gender" className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Gender</label>
              <Select
                id="profile-gender"
                name="gender"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="profile-address" className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Residential Address</label>
              <textarea
                id="profile-address"
                name="address"
                autoComplete="street-address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows={2}
                className="w-full rounded-2xl border bg-white px-5 py-3.5 text-sm font-medium text-slate-900 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-300"
              />
            </div>
            <div>
              <label htmlFor="profile-dob" className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Date of Birth</label>
              <Input
                id="profile-dob"
                name="dob"
                autoComplete="bday"
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="profile-year" className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Academic Year of Study</label>
              <Select
                id="profile-year"
                name="year"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
              >
                <option value="">Select year of study</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </Select>
            </div>
            <div className="flex items-center pt-6">
              <label htmlFor="profile-alumni" className="flex items-center gap-3 text-sm font-black text-slate-700 cursor-pointer select-none">
                <input
                  id="profile-alumni"
                  name="alumni"
                  type="checkbox"
                  checked={form.alumni}
                  onChange={(e) => setForm({ ...form, alumni: e.target.checked })}
                  className="rounded-lg text-brand-600 focus:ring-brand-500 h-5 w-5 transition-all"
                />
                Mark as Alumni
              </label>
            </div>
            <div>
              <label htmlFor="profile-linkedin" className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">LinkedIn (URL)</label>
              <Input
                id="profile-linkedin"
                name="linkedin"
                placeholder="https://linkedin.com/in/..."
                value={form.linkedin}
                onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="profile-github" className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">GitHub (URL)</label>
              <Input
                id="profile-github"
                name="github"
                placeholder="https://github.com/..."
                value={form.github}
                onChange={(e) => setForm({ ...form, github: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-8 border-t">
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
        <div className="mt-16 pt-8 border-t-4 border-red-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-3 w-3 rounded-full bg-red-600 animate-pulse" />
            <h3 className="text-base font-black text-red-700 uppercase tracking-widest">Protocol: Global Purge</h3>
          </div>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed max-w-xl">Requesting data deletion will trigger an administrative workflow to permanently purge your records from the ledger. This operation is non-reversible.</p>

          {loadingDeletion ? (
            <div className="h-12 w-48 bg-slate-100 animate-pulse rounded-2xl" />
          ) : pendingDeletion ? (
            <div className="flex flex-col gap-4 items-start">
              <div className="flex items-center gap-4 px-8 py-5 rounded-2xl bg-amber-500 text-white shadow-xl shadow-amber-900/10">
                <svg className="h-6 w-6 text-white animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-[0.2em] leading-tight">Review Active</span>
                  <span className="text-[10px] font-bold opacity-80 mt-1 uppercase tracking-widest">Awaiting Administrative Clearance</span>
                </div>
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
            open={showDeleteConfirm}
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
