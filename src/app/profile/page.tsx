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
    image: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchProfile();
    }
  }, [status, router]);

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
          image: data.image || "",
        });
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        setError("Image size should be less than 1MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setSuccess(true);
        // Update session to reflect username/image changes in nav
        await updateSession({
          name: formData.name,
          username: formData.username,
          image: formData.image,
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
            {/* Profile Picture */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-forest-light shadow-inner bg-forest-light/50 flex items-center justify-center">
                  {formData.image ? (
                    <img src={formData.image} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-black text-forest-dark/40">
                      {formData.username?.[0]?.toUpperCase() || formData.name?.[0]?.toUpperCase() || "?"}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-forest-dark text-white rounded-xl shadow-lg hover:bg-forest-deep transition transform hover:scale-110"
                >
                  <Camera size={20} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
              <p className="mt-4 text-sm font-bold text-forest-dark/60 uppercase tracking-widest">Update Photo</p>
            </div>

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
                <label className="text-sm font-black text-forest-deep uppercase tracking-wider ml-1">Languages you speak fluently</label>
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
                <label className="text-sm font-black text-forest-deep uppercase tracking-wider ml-1">Languages you want to learn</label>
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
