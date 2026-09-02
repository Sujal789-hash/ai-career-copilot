import React from "react";

interface LogoProps {
  className?: string;
  iconClassName?: string;
}

export default function Logo({
  className = "w-9 h-9",
  iconClassName = "w-5 h-5",
}: LogoProps) {
  return (
    <div
      className={`rounded-xl bg-gradient-to-tr from-cyan-950/80 via-zinc-900 to-zinc-800 border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-950/40 text-cyan-400 shrink-0 ${className}`}
    >
      <svg
        className={`text-cyan-400 ${iconClassName}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    </div>
  );
}
