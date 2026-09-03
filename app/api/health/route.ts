import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = {};

  // Check environment variables (presence only, never values)
  checks["GEMINI_API_KEY"] = process.env.GEMINI_API_KEY ? "SET" : "MISSING";
  checks["FIREBASE_PROJECT_ID"] = process.env.FIREBASE_PROJECT_ID ? "SET" : "MISSING";
  checks["FIREBASE_CLIENT_EMAIL"] = process.env.FIREBASE_CLIENT_EMAIL ? "SET" : "MISSING";
  checks["FIREBASE_PRIVATE_KEY"] = process.env.FIREBASE_PRIVATE_KEY ? "SET" : "MISSING";
  checks["NEXT_PUBLIC_FIREBASE_PROJECT_ID"] = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "SET" : "MISSING";

  // Check Firebase Admin initialization
  try {
    const { adminAuth, adminDb } = await import("@/lib/firebase-admin");
    checks["FIREBASE_ADMIN_AUTH"] = adminAuth ? "INITIALIZED" : "NULL";
    checks["FIREBASE_ADMIN_DB"] = adminDb ? "INITIALIZED" : "NULL";
  } catch (e) {
    checks["FIREBASE_ADMIN"] = `INIT_FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: checks,
  });
}
