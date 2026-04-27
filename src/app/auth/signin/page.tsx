"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SigninPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const msg = searchParams.get("message");
    const err = searchParams.get("error");
    if (msg) setMessage(msg);
    if (err) setError(err === "CredentialsSignin" ? "Invalid email or password" : err);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setIsLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-forest-light flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-forest-mid/20">
        <div className="bg-forest-dark p-8 text-center">
          <Link href="/" className="text-3xl font-black text-forest-light tracking-tighter">Chatty</Link>
          <p className="text-forest-mid mt-2 font-medium">Continue your growth journey</p>
        </div>
        
        <div className="p-8 space-y-6">
          <h2 className="text-2xl font-bold text-forest-deep text-center">Log In</h2>
          
          {message && (
            <div className="bg-forest-light/50 text-forest-dark p-4 rounded-xl text-sm font-bold border border-forest-mid/30">
              {message}
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          {/* Google Login Option */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-forest-mid/30 py-3 rounded-xl font-bold text-forest-deep hover:bg-forest-light transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>

          <div className="relative flex items-center gap-4 text-forest-dark/30">
            <div className="flex-1 h-px bg-current"></div>
            <span className="text-xs font-black uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-current"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-forest-dark text-white py-4 rounded-xl font-bold hover:bg-forest-deep transition shadow-lg shadow-forest-dark/20 disabled:opacity-50"
            >
              {isLoading ? "Cultivating session..." : "Log In"}
            </button>
          </form>

          <div className="text-center text-sm text-forest-dark/60 font-medium pt-2">
            New to the ecosystem?{" "}
            <Link href="/auth/signup" className="text-forest-dark font-bold hover:underline">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
