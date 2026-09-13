import React, { useState, useEffect } from "react";
import { FiX, FiChevronDown } from "react-icons/fi";
import { useUserProfile } from "../context/UserProfileContext";

const CAREER_STAGES = [
  "Student",
  "Working Professional",
  "Freelancer / Self-Employed",
  "Other",
];

const FINANCIAL_LEVELS = [
  "Beginner (Level 1) - Starting with basics",
  "Intermediate (Level 2) - Familiar with mutual funds & stocks",
  "Advanced (Level 3) - Actively investing & tax planning",
];

export default function EditProfileModal() {
  const { profile, isEditModalOpen, closeEditModal, saveProfile } = useUserProfile();

  const [username, setUsername] = useState("");
  const [careerStage, setCareerStage] = useState(CAREER_STAGES[0]);
  const [financialLevel, setFinancialLevel] = useState(FINANCIAL_LEVELS[0]);
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setCareerStage(profile.career_stage || CAREER_STAGES[0]);
      setFinancialLevel(profile.financial_level || FINANCIAL_LEVELS[0]);
      setBio(profile.bio || "");
      setError("");
    }
  }, [profile, isEditModalOpen]);

  if (!isEditModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanUsername = username.trim().replace(/^@/, "");
    if (!cleanUsername) {
      setError("Username cannot be empty.");
      return;
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      setError("Username must be between 3 and 30 characters.");
      return;
    }

    const validRegex = /^[a-zA-Z0-9_]+$/;
    if (!validRegex.test(cleanUsername)) {
      setError("Username can only contain letters, numbers, and underscores.");
      return;
    }

    setSaving(true);
    try {
      await saveProfile({
        username: cleanUsername,
        career_stage: careerStage,
        financial_level: financialLevel,
        bio: bio.trim(),
      });
      closeEditModal();
    } catch (err) {
      setError(err?.message || "Failed to save profile changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 id="edit-profile-title" className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Edit Profile
          </h2>
          <button
            type="button"
            onClick={closeEditModal}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Read-Only Display Name */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={profile?.display_name || "Rashi Karule"}
              readOnly
              disabled
              className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200/80 rounded-2xl text-slate-600 font-semibold text-sm cursor-not-allowed select-none"
              title="Managed by Auth0 account"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Display name is managed by your account provider.
            </span>
          </div>

          {/* Clean Username Input - NO URL prefix */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
              placeholder="username"
              maxLength={30}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-slate-800 font-semibold text-sm focus:outline-none focus:border-[#FA7516] focus:ring-2 focus:ring-[#FA7516]/20 transition"
              required
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              3–30 characters (letters, numbers, underscores only).
            </span>
          </div>

          {/* Career Stage Dropdown */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
              Career Stage
            </label>
            <div className="relative">
              <select
                value={careerStage}
                onChange={(e) => setCareerStage(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 pr-10 bg-white border border-slate-200 rounded-2xl text-slate-800 font-semibold text-sm focus:outline-none focus:border-[#FA7516] focus:ring-2 focus:ring-[#FA7516]/20 transition cursor-pointer"
              >
                {CAREER_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
              <FiChevronDown
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
            </div>
          </div>

          {/* Financial Knowledge Level Dropdown */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
              Financial Knowledge Level
            </label>
            <div className="relative">
              <select
                value={financialLevel}
                onChange={(e) => setFinancialLevel(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 pr-10 bg-white border border-slate-200 rounded-2xl text-slate-800 font-semibold text-sm focus:outline-none focus:border-[#FA7516] focus:ring-2 focus:ring-[#FA7516]/20 transition cursor-pointer"
              >
                {FINANCIAL_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
              <FiChevronDown
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
            </div>
          </div>

          {/* Bio & Learning Goal Textarea */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
              Bio & Learning Goal
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What are your financial discipline and learning goals on FinEd?"
              rows={3}
              maxLength={400}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-none focus:border-[#FA7516] focus:ring-2 focus:ring-[#FA7516]/20 resize-none transition leading-relaxed"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeEditModal}
              disabled={saving}
              className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-sm transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-full bg-[#FA7516] hover:bg-[#EA580C] text-white font-bold text-sm shadow-sm hover:shadow transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
