const Diagram = require("../models/Diagram");
const { generateD2Code } = require("../services/openaiService");
const { generateSVGFromD2 } = require("../services/d2Runner");

const resolvers = {
  Query: {
    getDiagrams: async () => {
      return await Diagram.find().sort({ createdAt: -1 });
    },

    getDiagram: async (_, { id }) => {
      return await Diagram.findById(id);
    },
  },

  Mutation: {
    createDiagram: async (_, { title, description }) => {
      const diagram = new Diagram({ title, description });
      return await diagram.save();
    },

    updateDiagram: async (_, { id, title, description, d2Code, svg }) => {
      return await Diagram.findByIdAndUpdate(
        id,
        { title, description, d2Code, svg },
        { new: true }
      );
    },

    deleteDiagram: async (_, { id }) => {
      await Diagram.findByIdAndDelete(id);
      return "✅ Diagram deleted successfully";
    },

    /**
     * ✅ Core feature:
     * description -> OpenAI -> D2 code -> D2 docker -> SVG -> Mongo -> return
     *
     * Includes fallback retry: if D2 compile fails, retry with "minimal safe D2"
     */
    generateDiagram: async (_, { description }) => {
      if (!description || !description.trim()) {
        throw new Error("Description is required");
      }

      // 1) OpenAI generates D2
      let d2Code = await generateD2Code(description.trim());

      // 2) Convert to SVG (with fallback)
      let svg = "";
      try {
        svg = generateSVGFromD2(d2Code);
      } catch (e) {
        console.error("\n⚠️ First D2 render failed. Retrying with safe mode...");
        console.error("Reason:", e.message);

        // Fallback prompt: minimal safe D2 (no heavy style/classes)
        const safeModePrompt = `
Generate VALID D2 code ONLY. It MUST compile.
Use only safe simple syntax:
- layout: elk
- direction: right
- simple node labels
- arrows A -> B
- groups with braces
DO NOT use: classes, vars, icons, fancy styling, or custom features.
Description:
${description.trim()}
`;

        d2Code = await generateD2Code(safeModePrompt);
        svg = generateSVGFromD2(d2Code);
      }

      // 3) Save result
      const diagram = new Diagram({
        title: "Generated Diagram",
        description,
        d2Code,
        svg,
      });

      return await diagram.save();
    },
  },
};

module.exports = resolvers;
