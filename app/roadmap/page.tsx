"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import Logo from "@/components/Logo";

export default function Roadmap() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [roadmap, setRoadmap] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function loadLatestRoadmap(currentUser: User) {
    try {
      const savedRoadmaps = await getDocs(
        query(
          collection(db, "users", currentUser.uid, "roadmaps"),
          orderBy("createdAt", "desc"),
          limit(1)
        )
      );
      const latest = savedRoadmaps.docs[0]?.data()?.roadmap;
      if (typeof latest === "string") setRoadmap(latest);
    } catch (loadError) {
      console.error("Roadmap load error:", loadError);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
        void loadLatestRoadmap(currentUser);
      }
    });

    return unsubscribe;
  }, [router]);

  const generateRoadmap = async () => {
    if (!user || loading) return;

    setLoading(true);
    setError("");

    try {
      const idToken = await user.getIdToken();

      const response = await fetch("/api/roadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });

      const contentType = response.headers.get("content-type") || "";

      if (!response.ok) {
        let errorMessage = "Unable to generate your roadmap. Please try again.";

        if (contentType.includes("application/json")) {
          const errorData = await response.json().catch(() => ({}));
          if (errorData?.error) {
            errorMessage = errorData.error;
          } else if (response.status === 401) {
            errorMessage = "Unable to authenticate with the server. Please sign in again.";
          } else if (response.status === 500) {
            errorMessage = "Server configuration error. Please contact administrator.";
          }
        } else {
          const text = await response.text().catch(() => "");
          if (text) {
            console.error("ROADMAP API non-JSON response:", text.slice(0, 300));
          }
          if (response.status === 401) {
            errorMessage = "Unable to authenticate with the server. Please sign in again.";
          }
        }

        throw new Error(errorMessage);
      }

      if (!contentType.includes("application/json")) {
        const text = await response.text().catch(() => "");
        console.error("ROADMAP API non-JSON response:", text.slice(0, 300));
        throw new Error("Unable to generate your roadmap. Please try again.");
      }

      const data = await response.json().catch(() => null);

      if (!data || !data.roadmap) {
        throw new Error(data?.error || "Unable to generate your roadmap. Please try again.");
      }

      setRoadmap(data.roadmap);

      try {
        await addDoc(collection(db, "users", user.uid, "roadmaps"), {
          roadmap: data.roadmap,
          createdAt: serverTimestamp(),
        });
      } catch (firestoreError) {
        console.error("Roadmap save error:", firestoreError);
      }
    } catch (err) {
      console.error("Roadmap frontend error:", err);
      setError(err instanceof Error ? err.message : "Unable to generate your roadmap. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyRoadmapToClipboard = () => {
    if (!roadmap) return;
    navigator.clipboard.writeText(roadmap);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
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
            href="/resume"
            className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors"
          >
            Resume AI
          </Link>
          <Link
            href="/profile"
            className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors"
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

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Career Strategy Roadmap 🎯
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1.5">
              Personalized milestone phases, skill focus, project ideas & interview prep
            </p>
          </div>

          {roadmap && (
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={copyRoadmapToClipboard}
                className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-all"
              >
                {copied ? "✓ Copied!" : "📋 Copy Markdown"}
              </button>
              <button
                onClick={generateRoadmap}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold text-xs shadow-md transition-all disabled:opacity-50"
              >
                {loading ? "Generating..." : "🔄 Regenerate"}
              </button>
            </div>
          )}
        </div>

        {/* Blank state / Prompt to generate */}
        {!roadmap && (
          <div className="bg-zinc-900/80 border border-zinc-800/90 backdrop-blur-xl rounded-2xl p-10 sm:p-14 text-center my-8 shadow-xl">
            <div className="mb-6 flex justify-center">
              <Logo className="w-16 h-16" iconClassName="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              Generate Your Personalized Strategy Roadmap
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-xs leading-relaxed mb-8">
              Career Copilot analyzes your education background, current skills, and target job goal to craft a tailored step-by-step learning path.
            </p>

            <button
              onClick={generateRoadmap}
              disabled={loading || !user}
              className="px-7 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold text-xs shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Creating Roadmap..." : "✨ Generate My Strategy Roadmap"}
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Generated Roadmap Display */}
        {roadmap && (
          <div className="bg-zinc-900/80 border border-zinc-800/90 backdrop-blur-xl rounded-2xl p-8 sm:p-12 shadow-xl">
            <div className="prose prose-invert max-w-none prose-headings:font-bold prose-h1:text-xl prose-h2:text-lg prose-h3:text-sm prose-h2:text-cyan-400 prose-h3:text-cyan-200 prose-li:my-1 text-zinc-200 text-xs sm:text-sm leading-relaxed">
              <ReactMarkdown>{roadmap}</ReactMarkdown>
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
