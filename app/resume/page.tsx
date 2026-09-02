"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";

interface ResumeAnalysis {
  atsScore: number;
  overallSummary: string;
  strengths: string[];
  missingKeywords: string[];
  rewrittenBullets: string[];
  recommendations: string[];
}

export default function ResumeAnalyzer() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResumeAnalysis | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
        try {
          const snap = await getDoc(doc(db, "users", currentUser.uid));
          if (snap.exists() && snap.data().careerGoal) {
            setTargetRole(snap.data().careerGoal);
          }
        } catch (err) {
          console.error("Error loading user profile role:", err);
        }
      }
    });

    return unsubscribe;
  }, [router]);

  const analyzeResume = async () => {
    if (!user || !resumeText.trim() || loading) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const idToken = await user.getIdToken();

      const response = await fetch("/api/resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          resumeText: resumeText.trim(),
          targetRole: targetRole.trim() || "Software Engineer",
        }),
      });

      const contentType = response.headers.get("content-type") || "";

      if (!response.ok) {
        let errorMessage = `Unable to analyze resume. Please try again.`;
        if (contentType.includes("application/json")) {
          const errorData = await response.json().catch(() => ({}));
          errorMessage = errorData.error || errorMessage;
        } else {
          const text = await response.text().catch(() => "");
          if (text) {
            console.error("RESUME API non-JSON response:", text.slice(0, 300));
          }
        }
        throw new Error(errorMessage);
      }

      if (!contentType.includes("application/json")) {
        const text = await response.text().catch(() => "");
        console.error("RESUME API non-JSON response:", text.slice(0, 300));
        throw new Error("Unable to analyze resume. Please try again.");
      }

      const data = await response.json().catch(() => null);

      if (!data || data.error) {
        throw new Error(data?.error || "Unable to analyze resume. Please try again.");
      }

      setResult(data as ResumeAnalysis);

      try {
        await addDoc(collection(db, "users", user.uid, "resumes"), {
          targetRole: targetRole.trim(),
          atsScore: data.atsScore,
          analysis: data,
          createdAt: serverTimestamp(),
        });
      } catch (dbErr) {
        console.warn("Error saving resume audit to cloud:", dbErr);
      }
    } catch (err) {
      console.error("Resume analysis error:", err);
      setError(err instanceof Error ? err.message : "Unable to analyze resume.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (score >= 60) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    return "text-red-400 border-red-500/30 bg-red-500/10";
  };

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
            className="px-3.5 py-1.5 rounded-xl bg-zinc-800 border border-cyan-500/40 text-cyan-400 text-xs font-semibold transition-colors"
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

      {/* Main Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
        <div className="mb-8 text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            ATS Resume Analyzer & Score 📄
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1.5">
            Audit your resume against applicant tracking systems (ATS) and target engineering roles with AI feedback.
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-zinc-900/80 border border-zinc-800/90 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-xl mb-10">
          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Target Role / Job Title
              </label>
              <input
                type="text"
                placeholder="e.g. Full Stack Developer / Senior Backend Engineer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Paste Resume Text or Key Bullet Points
            </label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your work experience, skills, education, and project bullet points here..."
              rows={8}
              className="w-full p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-cyan-500 resize-none font-mono leading-relaxed"
            />
          </div>

          {error && (
            <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {error}
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <button
              onClick={analyzeResume}
              disabled={loading || !resumeText.trim() || !user}
              className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold text-xs shadow-md transition-all disabled:opacity-40 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  Auditing Resume...
                </>
              ) : (
                "✦ Analyze Resume with AI"
              )}
            </button>
          </div>
        </div>

        {/* Results Presentation */}
        {result && (
          <div className="space-y-8">
            {/* Score & Summary Banner */}
            <div className="p-8 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col md:flex-row items-center gap-8">
              {/* Radial Score Display */}
              <div className="flex flex-col items-center shrink-0">
                <div className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center font-extrabold shadow-inner ${getScoreColor(result.atsScore)}`}>
                  <span className="text-3xl">{result.atsScore}</span>
                  <span className="text-[10px] uppercase font-semibold text-zinc-400">ATS Score</span>
                </div>
              </div>

              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-semibold">
                    Target: {targetRole || "Software Engineer"}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Overall ATS Compatibility Review
                </h3>
                <p className="text-zinc-300 text-xs leading-relaxed">
                  {result.overallSummary}
                </p>
              </div>
            </div>

            {/* Grid of Feedback Cards */}
            <div className="grid md:grid-cols-2 gap-6 text-left">
              {/* Missing Keywords Card */}
              <div className="p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800">
                <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                  <span className="text-amber-400">⚠️</span> Critical Missing Keywords
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.missingKeywords && result.missingKeywords.length > 0 ? (
                    result.missingKeywords.map((kw, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
                        + {kw}
                      </span>
                    ))
                  ) : (
                    <span className="text-zinc-500 text-xs">No missing keywords identified!</span>
                  )}
                </div>
              </div>

              {/* Strengths Card */}
              <div className="p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800">
                <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                  <span className="text-emerald-400">✓</span> Resume Strengths
                </h4>
                <ul className="space-y-2">
                  {result.strengths.map((str, idx) => (
                    <li key={idx} className="text-zinc-300 text-xs flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* High-Impact Bullet Point Rewrites */}
              <div className="p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800 md:col-span-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                  <span className="text-cyan-400">⚡</span> High-Impact Bullet Point Rewrites
                </h4>
                <div className="space-y-3">
                  {result.rewrittenBullets.map((bullet, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-mono leading-relaxed">
                      💡 {bullet}
                    </div>
                  ))}
                </div>
              </div>

              {/* Format & Structural Recommendations */}
              <div className="p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800 md:col-span-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                  <span className="text-indigo-400">💡</span> ATS Formatting & Structural Recommendations
                </h4>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-zinc-300 text-xs flex items-start gap-2">
                      <span className="text-indigo-400 font-bold">→</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-900 py-6 px-6 text-center text-zinc-500 text-xs">
        <p>© {new Date().getFullYear()} AI Career Copilot</p>
      </footer>
    </div>
  );
}
