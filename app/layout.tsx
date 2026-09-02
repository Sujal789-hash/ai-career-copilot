import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Career Copilot",
  description: "Personalized career guidance powered by Gemini.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 selection:bg-cyan-500 selection:text-black font-sans">
        {children}
      </body>
    </html>
  );
}
