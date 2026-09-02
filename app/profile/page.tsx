"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function Profile() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [education, setEducation] = useState("");
  const [careerGoal, setCareerGoal] = useState("");
  const [skills, setSkills] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
      } else {
        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          if (snap.exists()) {
            const data = snap.data();
            setName(data.name || "");
            setEducation(data.education || "");
            setCareerGoal(data.careerGoal || "");
            setSkills(Array.isArray(data.skills) ? data.skills.join(", ") : data.skills || "");
          }
        } catch (err) {
          console.error("Error fetching existing profile:", err);
        } finally {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    const user = auth.currentUser;
    if (!user) {
      router.push("/login");
      return;
    }

    setSaving(true);

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          email: user.email,
          name: name.trim(),
          education: education.trim(),
          careerGoal: careerGoal.trim(),
          skills: skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMessage("Profile saved successfully! Redirecting to Dashboard...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (error) {
      console.error(error);
      setIsError(true);
      setMessage("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-950/80 border-b border-zinc-800/60 px-6 lg:px-12 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Logo />
          <span className="font-semibold text-lg tracking-tight text-white">
            Career Copilot
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/chat"
            className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors"
          >
            AI Chat
          </Link>
          <Link
            href="/roadmap"
            className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors"
          >
            Roadmap
          </Link>
          <Link
            href="/resume"
            className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors"
          >
            Resume AI
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 my-8">
        <div className="w-full max-w-xl bg-zinc-900/80 border border-zinc-800/90 backdrop-blur-xl p-8 sm:p-10 rounded-2xl shadow-xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1.5">
              Career Profile Setup 👤
            </h1>
            <p className="text-zinc-400 text-xs">
              Provide your details to receive personalized career guidance and roadmap generation.
            </p>
          </div>

          {loading ? (
            <div className="py-12 text-center text-zinc-400 text-xs">
              Loading existing profile details...
            </div>
          ) : (
            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-all text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Education Background
                </label>
                <input
                  type="text"
                  placeholder="e.g. B.Tech Computer Science / Self-Taught"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-all text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Target Career Goal
                </label>
                <input
                  type="text"
                  placeholder="e.g. Full Stack Engineer / AI Specialist"
                  value={careerGoal}
                  onChange={(e) => setCareerGoal(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-all text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Current Skills (Comma Separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. React, TypeScript, Node.js, Python"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-all text-xs"
                />
              </div>

              {message && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-medium ${
                    isError
                      ? "bg-red-500/10 border border-red-500/20 text-red-400"
                      : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold text-xs shadow-md transition-all disabled:opacity-50 mt-4"
              >
                {saving ? "Saving Profile..." : "Save Profile Details"}
              </button>
            </form>
          )}
        </div>
      </main>

      <footer className="border-t border-zinc-900 py-6 px-6 text-center text-zinc-500 text-xs">
        <p>© {new Date().getFullYear()} AI Career Copilot</p>
      </footer>
    </div>
  );
}