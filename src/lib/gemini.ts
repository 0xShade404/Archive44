import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!client) client = new GoogleGenAI({ apiKey });
  return client;
}

type SearchResultForSummary = {
  type: string;
  title: string;
  subtitle: string;
  summary: string;
  risk: string;
};

/**
 * Synthesizes a natural-language summary of search results with Gemini.
 * Returns null if no API key is configured or the call fails, so callers
 * can fall back to a plain templated summary.
 */
export async function generateSearchSummary(
  query: string,
  results: SearchResultForSummary[]
): Promise<string | null> {
  const ai = getClient();
  if (!ai) return null;

  if (results.length === 0) {
    return null;
  }

  const context = results
    .map(
      (r, i) =>
        `${i + 1}. [${r.type}] ${r.title} (${r.subtitle}) — risk: ${r.risk}. ${r.summary}`
    )
    .join("\n");

  const prompt = `You are the AI search assistant for Archive44, a crypto intelligence platform. A user searched for: "${query}"

Here are the matching entities from the knowledge base:
${context}

Write a concise 2-3 sentence synthesized summary of these results for the user. Only use information given above — do not invent facts, prices, dates, or relationships that aren't stated. If the results don't fully answer the query, say so plainly.`;

  try {
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    const text = response.text?.trim();
    return text || null;
  } catch (err) {
    console.error("Gemini summary generation failed", err);
    return null;
  }
}
