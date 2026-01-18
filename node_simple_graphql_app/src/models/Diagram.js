const mongoose = require("mongoose");

const diagramSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true }, // user input prompt
    d2Code: { type: String }, // generated D2 code (later)
    svg: { type: String } // generated SVG (later)
  },
  { timestamps: true }
);

module.exports = mongoose.model("Diagram", diagramSchema);
