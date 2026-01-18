const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function buildSystemPrompt(options = {}) {
  const {
    diagramType = "architecture",
    direction = "right",
    detailLevel = "detailed",
    withIcons = true,
    withContainers = true,
    layout = "dagre",
  } = options;

  return `
You are an expert D2 (d2lang) diagram generator.

STRICT RULES:
1) Output ONLY valid D2 code. No explanations. No markdown. No backticks.
2) Never ask clarifying questions. Always generate a diagram.
3) It MUST compile with: d2 input.d2 output.svg
4) Use correct D2 styles:
   - style.fill, style.stroke, style.font-size, style.border-radius, style.stroke-width
5) Use these settings:
   - diagramType: ${diagramType}
   - direction: ${direction}
   - layout: ${layout}
   - detailLevel: ${detailLevel}
   - withIcons: ${withIcons}
   - withContainers: ${withContainers}

TYPE RULES:
- architecture: components + connections
- flowchart: steps + decisions (diamond)
- sequence: lifelines + messages (use containers/swimlanes if helpful)
- erd: entities with attributes; relationships with labels
- network: zones/subnets/firewall/dmz/internal + connections
- mindmap: central topic with branches

OUTPUT FORMAT:
- start with "layout: ${layout}"
- include "direction: ${direction}"

Return ONLY D2 code.
`.trim();
}

async function generateD2FromPrompt(userPrompt, options = {}, attempt = 1, lastError = "") {
  const SYSTEM_PROMPT = buildSystemPrompt(options);

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `
User description:
${userPrompt}

${lastError ? `Previous D2 compile error:\n${lastError}\n\nFix and regenerate valid D2.` : ""}
`.trim(),
    },
  ];

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages,
  });

  return (res.choices?.[0]?.message?.content || "").trim();
}

module.exports = { generateD2FromPrompt };
