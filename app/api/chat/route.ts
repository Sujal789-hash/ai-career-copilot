import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { generateGeminiText } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(authorization.slice(7));
    const uid = decodedToken.uid;

    const { message } = await request.json();

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

    const reply = await generateGeminiText(fullPrompt, 2500);

    return NextResponse.json({
      reply,
      interactionId: Date.now().toString(),
    });
  } catch (error) {
    console.error("CHAT: request failed", error);

    return NextResponse.json(
      { error: "The AI service could not generate a response. Please try again." },
      { status: 502 }
    );
  }
}
