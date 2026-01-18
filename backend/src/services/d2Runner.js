const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function ensureTmpDir() {
  const tempDir = path.join(__dirname, "..", "..", "tmp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  return tempDir;
}

function validateD2(inputPath) {
  try {
    execSync(`d2 validate "${inputPath}"`, { stdio: "pipe" });
    return { ok: true, error: "" };
  } catch (err) {
    return { ok: false, error: err.stderr?.toString() || err.message };
  }
}

function generateSVGFromD2(d2Code) {
  const tempDir = ensureTmpDir();

  const inputPath = path.join(tempDir, "input.d2");
  const outputPath = path.join(tempDir, "output.svg");

  fs.writeFileSync(inputPath, d2Code, "utf-8");

  // ✅ validate first
  const v = validateD2(inputPath);
  if (!v.ok) {
    throw new Error(v.error);
  }

  try {
    execSync(`d2 "${inputPath}" "${outputPath}"`, { stdio: "pipe" });
    return fs.readFileSync(outputPath, "utf-8");
  } catch (err) {
    console.error("❌ D2 render failed:", err.stderr?.toString() || "(empty)");
    throw new Error(err.stderr?.toString() || "D2 rendering failed");
  }
}

module.exports = { generateSVGFromD2 };
