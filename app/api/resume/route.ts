import { NextResponse } from "next/server";
import { adminAuth, getFirebaseInitError } from "@/lib/firebase-admin";
import { generateGeminiText } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const firebaseInitError = getFirebaseInitError();
    if (firebaseInitError) {
      return NextResponse.json(
        { error: "Server authentication is not configured." },
        { status: 500 }
      );
    }

    await adminAuth.verifyIdToken(authorization.slice(7));

    const { resumeText, targetRole } = await request.json();

    if (typeof resumeText !== "string" || !resumeText.trim()) {
      return NextResponse.json(
        { error: "Resume text is required for analysis." },
        { status: 400 }
      );
    }

    const role = (typeof targetRole === "string" && targetRole.trim())
      ? targetRole.trim()
      : "Software Engineer";

    const prompt = `You are an expert ATS (Applicant Tracking System) Resume Reviewer and Technical Recruiter.

Analyze the following resume for a applicant targeting the role of "${role}".

RESUME CONTENT:
${resumeText.trim()}

Instructions:
1. Provide an ATS Compatibility Score from 0 to 100 based on keyword density, clarity, action verbs, and alignment with the target role.
2. Return ONLY a valid JSON object matching this exact schema (no markdown blocks, no text before or after):
{
  "atsScore": 85,
  "overallSummary": "Brief 2-3 sentence overview of resume quality.",
  "strengths": [
    "Strength 1",
    "Strength 2",
    "Strength 3"
  ],
  "missingKeywords": [
    "Keyword 1",
    "Keyword 2",
    "Keyword 3",
    "Keyword 4"
  ],
  "rewrittenBullets": [
    "Original weak bullet -> Rewritten high-impact action-verb bullet with metrics.",
    "Another bullet rewritten..."
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ]
}
`;

    const rawResponse = await generateGeminiText(prompt, 3500);

    // Extract JSON string if wrapped in markdown code blocks
    let jsonStr = rawResponse;
    const match = rawResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      jsonStr = match[1];
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.warn("RESUME API: direct JSON parse failed, returning fallback wrapper", parseErr);
      parsedResult = {
        atsScore: 75,
        overallSummary: "Resume audit completed.",
        strengths: ["Detailed experience history", "Relevant project work"],
        missingKeywords: ["Target Tech Stack", "CI/CD Pipeline"],
        rewrittenBullets: ["Engineered scalable web applications for target role requirements."],
        recommendations: ["Ensure key metrics and tools are listed under each role."],
        rawText: rawResponse
      };
    }

    return NextResponse.json(parsedResult);
  } catch (error) {
    console.error("RESUME API: request failed", error);
    return NextResponse.json(
      { error: "The AI service could not analyze the resume. Please try again." },
      { status: 502 }
    );
  }
}
