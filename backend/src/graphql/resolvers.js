const Diagram = require("../models/Diagram");
const { generateSVGFromD2 } = require("../services/d2Runner");
const { sanitizeD2 } = require("../services/d2Sanitizer");
const { generateD2FromPrompt } = require("../services/openaiService");

const fallbackD2 = (description) => `
layout: dagre
direction: right

# Fallback diagram (AI output invalid)
user: "User Prompt" { shape: rectangle }
openai: "OpenAI (D2 Generator)" { shape: hexagon }
d2: "D2 Renderer" { shape: rectangle }
svg: "SVG Output" { shape: rectangle }

user -> openai: "${description.slice(0, 40)}..."
openai -> d2: "D2 code"
d2 -> svg: "SVG"
`.trim();

const resolvers = {
  Query: {
    diagrams: async () => Diagram.find().sort({ createdAt: -1 }).limit(50),
    diagram: async (_, { id }) => Diagram.findById(id),
  },


  Mutation: {
    generateDiagram: async (_, { description, options }) => {
      let finalD2 = "";
      let finalSVG = "";
      let lastError = "";

      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const raw = await generateD2FromPrompt(description, options || {}, attempt, lastError);
          const sanitized = sanitizeD2(raw);

          finalD2 = sanitized;
          finalSVG = generateSVGFromD2(finalD2);

          break;
        } catch (err) {
          lastError = err.message || String(err);
          console.error(`❌ Attempt ${attempt} failed:`, lastError);
        }
      }

      if (!finalSVG) {
        finalD2 = fallbackD2(description);
        finalSVG = generateSVGFromD2(finalD2);
      }

      const doc = await Diagram.create({
        title: "Generated Diagram",
        description,
        d2Code: finalD2,
        svg: finalSVG,

        // ✅ store options
        diagramType: options?.diagramType || "architecture",
        direction: options?.direction || "right",
        detailLevel: options?.detailLevel || "detailed",
        withIcons: options?.withIcons ?? true,
        withContainers: options?.withContainers ?? true,
        layout: options?.layout || "dagre",
      });

      return doc;
    },
  },
};

module.exports = resolvers;
