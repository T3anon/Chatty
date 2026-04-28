"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Camera, Loader2, CheckCircle2 } from "lucide-react";

export default function ProfilePage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    fluentLanguages: "",
    learningLanguages: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const COMMON_LANGUAGES = [
    "English", "Spanish", "French", "German", "Italian", "Portuguese", "Russian", "Chinese", 
    "Japanese", "Korean", "Arabic", "Hindi", "Bengali", "Turkish", "Dutch", "Swedish", 
    "Norwegian", "Danish", "Finnish", "Greek", "Hebrew", "Polish", "Romanian", "Thai", 
    "Vietnamese", "Indonesian", "Malay", "Czech", "Hungarian", "Ukrainian"
  ];

  const validateLanguages = (str: string) => {
    // If the field is empty, it's invalid (required attribute covers this, but for completeness)
    if (!str.trim()) return false;
    
    // Check if it contains multiple words without commas
    const wordsRaw = str.trim().split(/\s+/);
    if (wordsRaw.length > 1 && !str.includes(",")) {
      return false;
    }

    // Check if each language is in our list and spelled properly
    const languages = str.split(",").map(lang => lang.trim()).filter(lang => lang !== "");
    for (const lang of languages) {
      if (!COMMON_LANGUAGES.some(valid => valid.toLowerCase() === lang.toLowerCase())) {
        return false;
      }
    }

    return true;
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setFormData({
          name: data.name || "",
          username: data.username || "",
          fluentLanguages: data.fluentLanguages || "",
          learningLanguages: data.learningLanguages || "",
        });
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchProfile();
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess(false);

    if (!validateLanguages(formData.fluentLanguages)) {
      setError("Please ensure fluent languages are spelled correctly and separated by commas (e.g., English, Spanish) If your language is not currently accepted we apologize, more will be added soon!");
      setIsSaving(false);
      return;
    }

    if (!validateLanguages(formData.learningLanguages)) {
      setError("Please ensure learning languages are spelled correctly and separated by commas (e.g., French, Japanese) If your language is not currently accepted we apologize, more will be added soon!");
      setIsSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setSuccess(true);
        // Update session to reflect username changes in nav
        await updateSession({
          name: formData.name,
          username: formData.username,
          fluentLanguages: formData.fluentLanguages,
          learningLanguages: formData.learningLanguages,
        });
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong");
      }
    } catch (err) {
      setError("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-forest-light/30">
        <Loader2 className="w-8 h-8 animate-spin text-forest-dark" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forest-light/30 p-4 md:p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/dashboard" className="w-10 h-10 bg-white rounded-full flex items-center justify-center transition shadow-sm border border-white hover:bg-forest-light">
            <ArrowLeft size={20} className="text-black" />
          </Link>
          <h1 className="text-2xl font-black text-white">Your Profile</h1>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-forest-dark/5 border border-forest-mid/10 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-black text-forest-deep uppercase tracking-wider ml-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="w-full p-4 bg-forest-light/20 border-2 border-transparent rounded-2xl focus:bg-white focus:border-forest-mid transition-all outline-none font-medium text-forest-deep"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Username */}
              <div className="space-y-2">
                <label className="text-sm font-black text-forest-deep uppercase tracking-wider ml-1">Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. johndoe"
                  className="w-full p-4 bg-forest-light/20 border-2 border-transparent rounded-2xl focus:bg-white focus:border-forest-mid transition-all outline-none font-medium text-forest-deep"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-6">
              {/* Fluent Languages */}
              <div className="space-y-2">
                <label className="text-sm font-black text-forest-deep uppercase tracking-wider ml-1">Languages you speak fluently (comma separated)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. English, Spanish"
                  className="w-full p-4 bg-forest-light/20 border-2 border-transparent rounded-2xl focus:bg-white focus:border-forest-mid transition-all outline-none font-medium text-forest-deep"
                  value={formData.fluentLanguages}
                  onChange={(e) => setFormData({ ...formData, fluentLanguages: e.target.value })}
                />
              </div>

              {/* Learning Languages */}
              <div className="space-y-2">
                <label className="text-sm font-black text-forest-deep uppercase tracking-wider ml-1">Languages you want to learn (comma separated)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. French, Japanese"
                  className="w-full p-4 bg-forest-light/20 border-2 border-transparent rounded-2xl focus:bg-white focus:border-forest-mid transition-all outline-none font-medium text-forest-deep"
                  value={formData.learningLanguages}
                  onChange={(e) => setFormData({ ...formData, learningLanguages: e.target.value })}
                />
              </div>
            </div>

            {error && <p className="text-red-600 text-sm font-bold bg-red-50 p-4 rounded-xl border border-red-100">{error}</p>}
            
            {success && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 p-4 rounded-xl border border-green-100">
                <CheckCircle2 size={20} />
                <p className="text-sm font-bold">Profile updated successfully!</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-5 bg-forest-dark text-white rounded-2xl font-black text-lg hover:bg-forest-deep transition-all transform active:scale-[0.98] shadow-lg shadow-forest-dark/20 disabled:bg-forest-mid/50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : "Update Profile"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
