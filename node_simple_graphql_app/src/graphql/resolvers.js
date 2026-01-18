const Diagram = require("../models/Diagram");

const resolvers = {
  // Queries
  getDiagrams: async () => {
    return await Diagram.find().sort({ createdAt: -1 });
  },

  getDiagram: async ({ id }) => {
    return await Diagram.findById(id);
  },

  // Mutations
  createDiagram: async ({ title, description }) => {
    const diagram = new Diagram({ title, description });
    return await diagram.save();
  },

  updateDiagram: async ({ id, title, description, d2Code, svg }) => {
    return await Diagram.findByIdAndUpdate(
      id,
      { title, description, d2Code, svg },
      { new: true }
    );
  },

  deleteDiagram: async ({ id }) => {
    await Diagram.findByIdAndDelete(id);
    return "✅ Diagram deleted successfully";
  }
};

module.exports = resolvers;
