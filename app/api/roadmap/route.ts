import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { generateGeminiText } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  console.log("ROADMAP: request received");

  try {
    // 1. Check authorization header
    const authorization = request.headers.get("authorization");

    if (!authorization || !authorization.startsWith("Bearer ")) {
      console.warn("ROADMAP ERROR: Missing or invalid authorization header");
      return NextResponse.json(
        { error: "Authentication required. Please sign in again." },
        { status: 401 }
      );
    }

    console.log("ROADMAP: authorization header present");

    // 2. Extract & verify Firebase ID token
    const idToken = authorization.substring(7).trim();
    if (!idToken) {
      console.warn("ROADMAP ERROR: Empty Bearer token");
      return NextResponse.json(
        { error: "Authentication token missing." },
        { status: 401 }
      );
    }

    console.log("ROADMAP: verifying Firebase token");

    let uid = "";
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      uid = decodedToken.uid;
      console.log("ROADMAP: Firebase token verified");
      console.log("ROADMAP: uid obtained");
    } catch (authError) {
      const safeAuthErr = authError instanceof Error ? authError.message : String(authError);
      console.error("ROADMAP ERROR:", safeAuthErr);
      return NextResponse.json(
        { error: "Your authentication session has expired or is invalid. Please sign in again." },
        { status: 401 }
      );
    }

    // 3. Fetch user profile with fallback
    console.log("ROADMAP: loading Firestore profile");
    let profile: Record<string, unknown> = {
      name: "Developer",
      education: "Not specified",
      careerGoal: "Software Engineering",
      skills: ["Problem Solving", "Software Development"],
    };

    try {
      const profileSnapshot = await adminDb.collection("users").doc(uid).get();
      const data = profileSnapshot.data();
      if (profileSnapshot.exists && data) {
        profile = data as Record<string, unknown>;
        console.log("ROADMAP: profile loaded");
      } else {
        console.log("ROADMAP: profile snapshot empty, using default fallback");
      }
    } catch (dbErr) {
      const safeDbErr = dbErr instanceof Error ? dbErr.message : String(dbErr);
      console.warn("ROADMAP ERROR: Database fetch skipped or failed:", safeDbErr);
    }

    const skills = Array.isArray(profile?.skills)
      ? profile.skills.join(", ")
      : typeof profile?.skills === "string"
        ? profile.skills
        : "Not specified";

    // 4. Create prompt
    const prompt = `
You are Career Copilot, an expert AI career mentor and senior tech lead.

Create a highly detailed, personalized career roadmap for this user.

USER PROFILE
- Name: ${profile?.name || "User"}
- Education: ${profile?.education || "Not specified"}
- Target Goal: ${profile?.careerGoal || "Software Engineering"}
- Current Skills: ${skills}

Structure the response clearly using Markdown formatting with sections:
# 🎯 Career Roadmap
## 👤 Current Profile Assessment
## 📊 Skill Assessment & Gap Analysis
## 🚀 Phase 1: Core Fundamentals & Immediate Focus
### Goal
### Skills to Learn
### Hands-on Project
## 🚀 Phase 2: Intermediate Mastery & System Design
### Goal
### Skills to Learn
### Hands-on Project
## 🚀 Phase 3: Advanced Specialization
### Goal
### Skills to Learn
### Hands-on Project
## 🚀 Phase 4: Production Readiness & Portfolio Polish
### Goal
### Skills to Learn
### Hands-on Project
## 💼 Technical Interview Preparation
## 🏆 Capstone Portfolio Project
## 📅 Recommended Weekly Study Schedule

Make it specific to the user's current background and target career goal.
`;

    console.log("ROADMAP: checking Gemini configuration");
    if (!process.env.GEMINI_API_KEY) {
      console.error("ROADMAP ERROR: GEMINI_API_KEY is not configured on the server");
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured on the server" },
        { status: 500 }
      );
    }

    console.log("ROADMAP: calling Gemini");

    // 5. Generate roadmap with Gemini
    let roadmap = "";
    try {
      roadmap = await generateGeminiText(prompt, 3500);
      console.log("ROADMAP: Gemini response received");
    } catch (geminiError) {
      const safeGeminiErr = geminiError instanceof Error ? geminiError.message : String(geminiError);
      console.error("ROADMAP ERROR:", safeGeminiErr);

      if (/GEMINI_API_KEY|API key/i.test(safeGeminiErr)) {
        return NextResponse.json(
          { error: "GEMINI_API_KEY is not configured on the server" },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: "The AI service encountered an error while generating your roadmap. Please try again." },
        { status: 502 }
      );
    }

    if (!roadmap) {
      console.warn("ROADMAP ERROR: Empty roadmap string returned");
      return NextResponse.json(
        { error: "The AI service returned an empty response. Please try again." },
        { status: 502 }
      );
    }

    console.log("ROADMAP: returning roadmap");
    return NextResponse.json({
      roadmap,
    });
  } catch (error) {
    const safeErr = error instanceof Error ? error.message : String(error);
    console.error("ROADMAP ERROR:", safeErr);

    return NextResponse.json(
      { error: "Unable to generate your roadmap at this time. Please try again." },
      { status: 500 }
    );
  }
}
