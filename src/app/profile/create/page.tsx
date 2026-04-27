"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function CreateProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [fluentLanguages, setFluentLanguages] = useState("");
  const [learningLanguages, setLearningLanguages] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (status === "loading") return <div className="p-10 text-center text-gray-900">Loading...</div>;
  if (status === "unauthenticated") {
    router.push("/api/auth/signin");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          fluentLanguages,
          learningLanguages,
        }),
      });

      if (res.ok) {
        // Force the session to update so the dashboard knows we have a username now
        await update({ username });
        router.push("/dashboard");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Something went wrong");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Complete Your Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Username</label>
          <input
            type="text"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Fluent Languages (comma separated)</label>
          <input
            type="text"
            required
            placeholder="e.g. English, Spanish"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
            value={fluentLanguages}
            onChange={(e) => setFluentLanguages(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Languages to Learn (comma separated)</label>
          <input
            type="text"
            required
            placeholder="e.g. French, Japanese"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
            value={learningLanguages}
            onChange={(e) => setLearningLanguages(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Create Profile"}
        </button>
      </form>
    </div>
  );
}
