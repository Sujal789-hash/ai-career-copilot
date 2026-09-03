import { NextResponse } from "next/server";
import { adminAuth, adminDb, getFirebaseInitError } from "@/lib/firebase-admin";
import { generateGeminiText } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  console.log("CHAT: request received");

  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      console.warn("CHAT ERROR: missing or invalid authorization header");
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const idToken = authorization.slice(7).trim();

    const firebaseInitError = getFirebaseInitError();
    if (firebaseInitError) {
      console.error("CHAT ERROR: Firebase Admin not properly configured:", firebaseInitError);
      return NextResponse.json(
        { error: "Server authentication is not configured. Please set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in Vercel environment variables." },
        { status: 500 }
      );
    }

    let uid = "";
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      uid = decodedToken.uid;
      console.log("CHAT: user verified");
    } catch (authErr) {
      console.error("CHAT ERROR: verifyIdToken failed", authErr);
      return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const message = body?.message;

    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Attempt to load user profile for tailored advice
    let profileContext = "";
    try {
      const profileSnapshot = await adminDb.collection("users").doc(uid).get();
      if (profileSnapshot.exists) {
        const p = profileSnapshot.data();
        const skills = Array.isArray(p?.skills) ? p.skills.join(", ") : p?.skills || "Not provided";
        profileContext = `
USER CONTEXT:
- Name: ${p?.name || "User"}
- Education: ${p?.education || "Not specified"}
- Target Goal: ${p?.careerGoal || "Software & Tech Career"}
- Known Skills: ${skills}
`;
        console.log("CHAT: user profile loaded");
      }
    } catch (dbErr) {
      console.warn("CHAT: unable to load user profile", dbErr);
    }

    const fullPrompt = `You are Career Copilot, an expert AI career mentor and tech advisor.
Be encouraging, structured, practical, and clear. Use markdown formatting with bullet points and bold headers where appropriate.

${profileContext}

USER MESSAGE:
${message.trim()}
`;

    console.log("CHAT: calling Gemini API");
    const reply = await generateGeminiText(fullPrompt, 2500);
    console.log("CHAT: response generated successfully");

    return NextResponse.json({
      reply,
      interactionId: Date.now().toString(),
    });
  } catch (error) {
    const safeErr = error instanceof Error ? error.message : String(error);
    console.error("CHAT ERROR: request failed", safeErr);

    if (/GEMINI_API_KEY|API key/i.test(safeErr)) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in Vercel environment variables." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "The AI service could not generate a response. Please try again." },
      { status: 502 }
    );
  }
}
