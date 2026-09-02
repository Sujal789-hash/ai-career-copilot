"use client";

import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

interface ProfileData {
  name?: string;
  education?: string;
  careerGoal?: string;
  skills?: string[];
}

export default function Dashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
      } else {
        setCurrentUser(user);
        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          if (snap.exists()) {
            setProfile(snap.data() as ProfileData);
          }
        } catch (err) {
          console.error("Error loading user profile:", err);
        } finally {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  // Skill match percentage calculator helper based on current skills count & goal
  const calculateSkillMatch = () => {
    if (!profile?.skills || profile.skills.length === 0) return 35;
    const count = profile.skills.length;
    if (count >= 6) return 92;
    if (count >= 4) return 82;
    if (count >= 2) return 68;
    return 50;
  };

  const matchPercentage = calculateSkillMatch();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-950/80 border-b border-zinc-800/60 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Logo />
          <span className="font-semibold text-lg tracking-tight text-white">
            Career Copilot
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
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
            className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-cyan-400 hover:text-white text-xs font-medium transition-colors"
          >
            Resume AI
          </Link>
          <Link
            href="/profile"
            className="hidden sm:inline-block px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors"
          >
            Profile
          </Link>
          <button
            onClick={handleLogout}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
        {/* Welcome Section */}
        <div className="mb-8 text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Welcome back, {profile?.name || currentUser?.displayName || currentUser?.email?.split("@")[0] || "Developer"}
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1.5">
            Your personal AI career workspace. Review your skill readiness & tools below.
          </p>
        </div>

        {/* Profile Setup Prompt Banner */}
        {!loading && (!profile || !profile.careerGoal) && (
          <div className="mb-8 p-6 rounded-2xl bg-zinc-900/90 border border-cyan-500/30 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="text-cyan-400">✦</span> Complete Your Profile Details
              </h2>
              <p className="text-zinc-400 text-xs mt-1">
                Set up your education background and target role to enable personalized AI responses and skill match analytics.
              </p>
            </div>
            <button
              onClick={() => router.push("/profile")}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold text-xs shadow-md shrink-0 transition-all"
            >
              Set Up Profile
            </button>
          </div>
        )}

        {/* Visual Skill Gap & Match Percentage Gauge */}
        {profile && profile.careerGoal && (
          <div className="mb-10 p-7 rounded-2xl bg-zinc-900/80 border border-zinc-800/90 backdrop-blur-xl grid lg:grid-cols-3 gap-6 items-center">
            {/* Visual Score Ring */}
            <div className="flex items-center gap-5 border-b lg:border-b-0 lg:border-r border-zinc-800 pb-6 lg:pb-0 lg:pr-6">
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center rounded-full border-4 border-cyan-500/30 bg-cyan-500/10 font-bold text-cyan-400 shadow-inner">
                <div className="text-center">
                  <span className="text-2xl font-extrabold">{matchPercentage}%</span>
                  <span className="block text-[9px] uppercase tracking-wider text-zinc-400 font-semibold">Match</span>
                </div>
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-semibold">
                  Skill Readiness Score
                </span>
                <h3 className="text-base font-bold text-white mt-1.5">
                  {profile.careerGoal}
                </h3>
                <p className="text-zinc-400 text-xs mt-0.5">
                  {matchPercentage >= 75
                    ? "Great alignment! High job readiness."
                    : "Good baseline! Keep building target skills."}
                </p>
              </div>
            </div>

            {/* Categorized Skills Breakdown */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <span className="text-[11px] uppercase font-semibold text-zinc-400 tracking-wider flex items-center gap-1">
                  <span className="text-emerald-400">✓</span> Mastered Skills ({profile.skills?.length || 0})
                </span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {profile.skills && profile.skills.length > 0 ? (
                    profile.skills.map((skill, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-zinc-500 text-xs">Add your skills in Profile to calculate match</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[11px] uppercase font-semibold text-zinc-400 tracking-wider flex items-center gap-1">
                  <span className="text-amber-400">✦</span> Recommended Next Skills
                </span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700/60 text-zinc-300 text-xs font-medium">
                    System Design
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700/60 text-zinc-300 text-xs font-medium">
                    Docker & Kubernetes
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700/60 text-zinc-300 text-xs font-medium">
                    CI/CD Pipelines
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Grid */}
        <div className="grid md:grid-cols-4 gap-5">
          <button
            onClick={() => router.push("/chat")}
            className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 text-left transition-all hover:scale-[1.01] group flex flex-col justify-between min-h-[200px]"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <h2 className="text-base font-bold text-white mb-1.5 group-hover:text-cyan-400 transition-colors">
                AI Career Chat
              </h2>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Chat with your AI mentor for code reviews & interview prep.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-cyan-400 text-xs font-semibold">
              <span>Open Chat</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>

          <button
            onClick={() => router.push("/roadmap")}
            className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 text-left transition-all hover:scale-[1.01] group flex flex-col justify-between min-h-[200px]"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <h2 className="text-base font-bold text-white mb-1.5 group-hover:text-cyan-400 transition-colors">
                Career Roadmap
              </h2>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Generate a structured milestone strategy for your role.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-cyan-400 text-xs font-semibold">
              <span>View Roadmap</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>

          <button
            onClick={() => router.push("/resume")}
            className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 text-left transition-all hover:scale-[1.01] group flex flex-col justify-between min-h-[200px]"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              </div>
              <h2 className="text-base font-bold text-white mb-1.5 group-hover:text-cyan-400 transition-colors">
                ATS Resume AI
              </h2>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Audit resume ATS score, missing keywords & bullet rewrites.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-cyan-400 text-xs font-semibold">
              <span>Analyze Resume</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>

          <button
            onClick={() => router.push("/profile")}
            className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 text-left transition-all hover:scale-[1.01] group flex flex-col justify-between min-h-[200px]"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <h2 className="text-base font-bold text-white mb-1.5 group-hover:text-cyan-400 transition-colors">
                My Profile
              </h2>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Update background details and active skills list.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-cyan-400 text-xs font-semibold">
              <span>Edit Profile</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 px-6 text-center text-zinc-500 text-xs">
        <p>© {new Date().getFullYear()} AI Career Copilot</p>
      </footer>
    </div>
  );
}
