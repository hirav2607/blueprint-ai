const mongoose = require("mongoose");

const DiagramSchema = new mongoose.Schema(
  {
    title: { type: String, default: "Generated Diagram" },
    description: String,
    d2Code: String,
    svg: String,

    // ✅ Ticket #9 metadata
    diagramType: { type: String, default: "architecture" }, // architecture|flowchart|sequence|erd|network|mindmap
    direction: { type: String, default: "right" }, // right|down
    detailLevel: { type: String, default: "detailed" }, // minimal|detailed
    withIcons: { type: Boolean, default: true },
    withContainers: { type: Boolean, default: true },
    layout: { type: String, default: "dagre" }, // dagre|elk|grid|layered|concentric
  },
  { timestamps: true }
);

module.exports = mongoose.model("Diagram", DiagramSchema);
