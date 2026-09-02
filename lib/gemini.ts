import { GoogleGenerativeAI } from "@google/generative-ai";

const getApiKey = () => process.env.GEMINI_API_KEY || "";

// Active model chain: preferred gemini-3.7-flash -> gemini-3.6-flash -> gemini-3.5-flash-lite
export const GEMINI_MODELS = [
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
];

export const GEMINI_MODEL = GEMINI_MODELS[0];
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

export const gemini = new GoogleGenerativeAI(getApiKey() || "dummy-key-for-build");

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: {
    code?: number;
    message?: string;
  };
};

/**
 * Robust text generation helper with automatic model fallback chain.
 * Tries official SDK first, then REST API fallback for each active model.
 */
export async function generateGeminiText(prompt: string, maxOutputTokens: number = 2500) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server. Please add GEMINI_API_KEY to your Vercel environment variables.");
  }

  const client = new GoogleGenerativeAI(apiKey);
  let lastError: Error | null = null;

  // 1. Try official SDK first
  for (const modelName of GEMINI_MODELS) {
    try {
      const model = client.getGenerativeModel({ model: modelName });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens },
      });
      const text = result.response.text().trim();
      if (text) {
        return text;
      }
    } catch (sdkErr) {
      console.warn(`Gemini SDK model ${modelName} attempt failed:`, sdkErr);
      lastError = sdkErr instanceof Error ? sdkErr : new Error(String(sdkErr));
    }
  }

  // 2. Fallback to direct REST API if SDK call fails
  for (const model of GEMINI_MODELS) {
    try {
      const response = await fetch(
        `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens },
          }),
          signal: AbortSignal.timeout(45_000),
        }
      );

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        console.warn(`Gemini model ${model} HTTP ${response.status}: ${errText.slice(0, 200)}`);
        lastError = new Error(`Model ${model} failed with HTTP ${response.status}`);
        continue;
      }

      const data = (await response.json()) as GeminiResponse;
      const text = data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("")
        .trim();

      if (text) {
        return text;
      } else {
        lastError = new Error(`Model ${model} returned empty response`);
      }
    } catch (err) {
      console.warn(`Gemini REST model ${model} threw error:`, err);
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error("All Gemini models in the fallback chain failed.");
}
