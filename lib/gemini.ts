import { GoogleGenerativeAI } from "@google/generative-ai";

const getApiKey = () => process.env.GEMINI_API_KEY || "";

// Model fallback chain: primary fast stable model -> lightweight model -> preview model
export const GEMINI_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.7-flash",
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
 */
export async function generateGeminiText(prompt: string, maxOutputTokens: number = 2500) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server. Please add GEMINI_API_KEY to your environment variables.");
  }

  let lastError: Error | null = null;

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
          signal: AbortSignal.timeout(90_000),
        }
      );

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        console.warn(`Gemini model ${model} HTTP ${response.status}: ${errText.slice(0, 200)}`);
        lastError = new Error(`Model ${model} failed with HTTP ${response.status}`);
        continue; // try next model in chain
      }

      const data = (await response.json()) as GeminiResponse;
      const text = data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("")
        .trim();

      if (text) {
        return text;
      } else {
        console.warn(`Gemini model ${model} returned empty response`);
        lastError = new Error(`Model ${model} returned empty response`);
      }
    } catch (err) {
      console.warn(`Gemini model ${model} threw error:`, err);
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error("All Gemini models in the fallback chain failed.");
}
