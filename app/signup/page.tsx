"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function Signup() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 p-6 relative overflow-hidden selection:bg-cyan-500 selection:text-black">
      {/* Glow background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-zinc-900/80 border border-zinc-800/90 backdrop-blur-xl p-8 rounded-2xl shadow-xl z-10">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 group text-zinc-400 hover:text-white transition-colors text-xs"
          >
            <span>←</span> Back to Home
          </Link>
          <Logo className="w-8 h-8" iconClassName="w-4 h-4" />
        </div>

        <div className="text-left mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1.5">
            Create Account
          </h1>
          <p className="text-zinc-400 text-xs">
            Start getting personalized AI career strategy and roadmaps
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-all text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-all text-xs"
              required
            />
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold text-xs shadow-md transition-all disabled:opacity-50 mt-2"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-zinc-400 mt-6 text-center text-xs">
          Already have an account?{" "}
          <Link href="/login" className="text-cyan-400 font-semibold hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
