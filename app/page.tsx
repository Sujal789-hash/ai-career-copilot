import Link from "next/link";
import Logo from "@/components/Logo";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      {/* Navbar Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-950/80 border-b border-zinc-800/60 px-6 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="font-semibold text-lg tracking-tight text-white">
            Career Copilot
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 max-w-5xl mx-auto relative overflow-hidden">
        {/* Subtle glowing background gradient */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Intelligent Career Guidance for Developers</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white max-w-4xl leading-[1.12]">
          Navigate Your Tech Career with{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent">
            Precision AI Strategy
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl font-normal leading-relaxed">
          From custom learning roadmaps to real-time interview mentorship, Career Copilot aligns your background with your next target engineering role.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 text-zinc-950 shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Start Your Journey
            <span>→</span>
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-semibold bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Go to Dashboard
          </Link>
        </div>

        {/* Features Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-24 text-left w-full">
          <div className="p-7 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md hover:border-zinc-700 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Custom Learning Roadmaps
            </h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Step-by-step milestone plans tailored specifically to your existing skills and targeted career goal.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md hover:border-zinc-700 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              AI Career Mentor Chat
            </h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Ask questions on resume optimization, interview questions, tech stacks, and career transitions anytime.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md hover:border-zinc-700 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Persistent Profile Context
            </h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Store your background details in Firestore so AI guidance continuously adapts as you acquire new skills.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 px-6 text-center text-zinc-500 text-xs">
        <p>© {new Date().getFullYear()} AI Career Copilot. All rights reserved.</p>
      </footer>
    </div>
  );
}
