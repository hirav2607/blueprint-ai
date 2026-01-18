require("dotenv").config();
const OpenAI = require("openai");
const d2SystemPrompt = require("../prompts/d2SystemPrompt"); 

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Remove markdown fences, "D2 code:" labels, etc.
 */
function cleanupLLMText(text) {
  if (!text) return "";

  let out = text.trim();

  // remove markdown fences
  out = out.replace(/^```(\w+)?/gm, "").replace(/```$/gm, "").trim();

  // remove common labels
  out = out.replace(/^D2\s*code\s*:/i, "").trim();
  out = out.replace(/^Output\s*:/i, "").trim();

  return out;
}

/**
 * Convert invalid style keys to valid style.* keys
 * Example: fill: "#fff" -> style.fill: "#fff"
 */
function sanitizeD2Styles(d2) {
  if (!d2) return "";

  return d2
    .replace(/^\s*fill\s*:/gm, "  style.fill:")
    .replace(/^\s*stroke\s*:/gm, "  style.stroke:")
    .replace(/^\s*font-size\s*:/gm, "  style.font-size:")
    .replace(/^\s*border-radius\s*:/gm, "  style.border-radius:")
    .replace(/^\s*opacity\s*:/gm, "  style.opacity:");
}

/**
 * Fix common D2 syntax mistakes:
 * - unquoted hex colors
 * - trailing commas
 * - double style.style.
 */
function sanitizeD2Syntax(d2) {
  if (!d2) return "";

  let out = d2;

  // Fix unquoted hex colors: style.fill: #E0F2FE -> style.fill: "#E0F2FE"
  out = out.replace(
    /(style\.(fill|stroke)\s*:\s*)(#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}))/g,
    '$1"$3"'
  );

  // remove trailing commas after values
  out = out.replace(/(style\.(fill|stroke)\s*:\s*".+?"),/g, "$1");
  out = out.replace(/(style\.(font-size|border-radius)\s*:\s*\d+),/g, "$1");

  // accidental "style.style.fill"
  out = out.replace(/style\.style\./g, "style.");

  return out.trim();
}

/**
 * Quick heuristic: does response look like D2 code?
 */
function looksLikeD2(d2) {
  if (!d2) return false;

  // D2 usually has at least one of these patterns
  const patterns = [
    "->",
    "{",
    "layout:",
    "direction:",
    "shape:",
    "style.",
    "classes:",
  ];

  return patterns.some((p) => d2.includes(p));
}

/**
 * Ask OpenAI to generate D2 code.
 * Includes:
 * - cleanup
 * - sanitization
 * - retry if output doesn't look like D2
 */
async function generateD2Code(userDescription) {
  if (!userDescription || !userDescription.trim()) {
    throw new Error("Description is required to generate diagram.");
  }

  // 1) primary call
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: d2SystemPrompt },
      { role: "user", content: userDescription.trim() },
    ],
    temperature: 0.2,
    max_tokens: 900,
  });

  let d2 = cleanupLLMText(response?.choices?.[0]?.message?.content || "");
  d2 = sanitizeD2Styles(d2);
  d2 = sanitizeD2Syntax(d2);

  // 2) Retry if output isn't D2
  if (!looksLikeD2(d2)) {
    const retry = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            d2SystemPrompt +
            "\n\nIMPORTANT:\n- OUTPUT ONLY D2 CODE.\n- DO NOT ask questions.\n- DO NOT output explanations.\n- Must compile.\n",
        },
        {
          role: "user",
          content:
            "Convert this description into D2 code ONLY:\n\n" +
            userDescription.trim(),
        },
      ],
      temperature: 0.1,
      max_tokens: 900,
    });

    d2 = cleanupLLMText(retry?.choices?.[0]?.message?.content || "");
    d2 = sanitizeD2Styles(d2);
    d2 = sanitizeD2Syntax(d2);
  }

  // 3) final guard
  if (!looksLikeD2(d2)) {
    throw new Error(
      "LLM did not return D2 code. Try prompt starting with: 'Architecture diagram:' or 'Flowchart:'"
    );
  }

  return d2.trim();
}

module.exports = { generateD2Code };
