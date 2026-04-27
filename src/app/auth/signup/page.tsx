"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (res.ok) {
        router.push("/auth/signin?message=Account created successfully");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create account");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-forest-light flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-forest-mid/20">
        <div className="bg-forest-dark p-8 text-center">
          <Link href="/" className="text-3xl font-black text-forest-light tracking-tighter">Chatty</Link>
          <p className="text-forest-mid mt-2 font-medium">Join our language ecosystem</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <h2 className="text-2xl font-bold text-forest-deep text-center">Create Account</h2>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-forest-dark mb-1">Full Name</label>
              <input
                type="text"
                required
                className="w-full p-3 bg-forest-light/30 border border-forest-mid/30 rounded-xl focus:ring-2 focus:ring-forest-mid focus:outline-none transition text-forest-deep"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-forest-dark mb-1">Email Address</label>
              <input
                type="email"
                required
                className="w-full p-3 bg-forest-light/30 border border-forest-mid/30 rounded-xl focus:ring-2 focus:ring-forest-mid focus:outline-none transition text-forest-deep"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-forest-dark mb-1">Password</label>
              <input
                type="password"
                required
                className="w-full p-3 bg-forest-light/30 border border-forest-mid/30 rounded-xl focus:ring-2 focus:ring-forest-mid focus:outline-none transition text-forest-deep"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-forest-dark text-white py-4 rounded-xl font-bold hover:bg-forest-deep transition shadow-lg shadow-forest-dark/20 disabled:opacity-50"
          >
            {isLoading ? "Planting seeds..." : "Sign Up"}
          </button>

          <div className="text-center text-sm text-forest-dark/60 font-medium">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-forest-dark font-bold hover:underline">
              Log In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
