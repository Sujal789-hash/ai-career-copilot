import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { generateGeminiText } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    console.log("ROADMAP: request received");

    // 1. Check authentication header
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // 2. Extract Firebase ID token
    const idToken = authorization.substring(7);

    console.log("ROADMAP: verifying user");

    // 3. Verify Firebase user
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    console.info("ROADMAP: user verified");

    // 4. Fetch profile with fallback
    let profile: Record<string, unknown> = {
      name: "Developer",
      education: "Not provided",
      careerGoal: "Software Developer",
      skills: ["Problem Solving", "Web Development"]
    };

    try {
      const profileSnapshot = await adminDb.collection("users").doc(uid).get();
      const data = profileSnapshot.data();
      if (profileSnapshot.exists && data) {
        profile = data as Record<string, unknown>;
      }
    } catch (dbErr) {
      console.warn("ROADMAP: database fetch skipped or failed", dbErr);
    }

    const skills = Array.isArray(profile?.skills)
      ? profile.skills.join(", ")
      : typeof profile?.skills === "string"
        ? profile.skills
        : "Not provided";

    // 5. Create personalized roadmap prompt
    const prompt = `
You are Career Copilot, an expert AI career mentor.

Create a personalized career roadmap for this user.

USER PROFILE

Name: ${profile?.name || "User"}
Education: ${profile?.education || "Not provided"}
Career Goal: ${profile?.careerGoal || "Not provided"}
Current Skills: ${skills}

Build the roadmap based on the user's existing skills.

Do not recommend beginner topics that the user already knows unless revision is necessary.

Keep the roadmap practical, specific, and actionable.

Use this structure:

# 🎯 Career Roadmap

## 👤 Current Profile

Give a short assessment of the user's current situation.

## 📊 Skill Assessment

Explain:
- What the user already knows
- What they are good at
- What skills are missing

## 🚀 Phase 1

### Goal
Explain the goal.

### Skills to Learn
- Skill
- Skill
- Skill

### Project
Suggest one practical project.

## 🚀 Phase 2

### Goal
Explain the goal.

### Skills to Learn
- Skill
- Skill
- Skill

### Project
Suggest one practical project.

## 🚀 Phase 3

### Goal
Explain the goal.

### Skills to Learn
- Skill
- Skill
- Skill

### Project
Suggest one practical project.

## 🚀 Phase 4

### Goal
Explain the goal.

### Skills to Learn
- Skill
- Skill
- Skill

### Project
Suggest one practical project.

## 💼 Interview Preparation

List important interview topics.

## 🏆 Final Portfolio Project

Suggest one impressive portfolio project related to the user's career goal.

## 📅 Weekly Plan

Create a practical weekly learning schedule.

Be specific to the user's current skills and career goal.
`;

    console.log("ROADMAP: calling Gemini");

    // 6. Generate roadmap with Gemini
    const roadmap = await generateGeminiText(prompt, 4000);

    console.log("ROADMAP: roadmap generated successfully");

    // 7. Return roadmap to frontend
    return NextResponse.json({
      roadmap,
    });
  } catch (error) {
    console.error("ROADMAP: request failed", error);

    const message = error instanceof Error ? error.message : "Failed to generate roadmap";
    const status = /GEMINI_API_KEY|credential|permission|unauthenticated/i.test(message)
      ? 503
      : /token|auth/i.test(message)
        ? 401
        : 502;

    return NextResponse.json(
      {
        error: status === 503
          ? "The AI service is not configured correctly. Please contact support."
          : status === 401
            ? "Your session could not be verified. Please sign in again."
            : "The AI service could not generate a roadmap. Please try again.",
      },
      { status }
    );
  }
}
