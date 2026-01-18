const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function generateSVGFromD2(d2Code) {
  const tempDir = path.join(__dirname, "..", "..", "tmp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const inputPath = path.join(tempDir, "input.d2");
  const outputPath = path.join(tempDir, "output.svg");

  fs.writeFileSync(inputPath, d2Code, "utf-8");

  try {
    // ✅ run D2 directly
    execSync(`d2 "${inputPath}" "${outputPath}"`, { stdio: "pipe" });
    return fs.readFileSync(outputPath, "utf-8");
  } catch (err) {
    console.log("\n================== D2 CODE (FAILED) ==================\n");
    console.log(d2Code);
    console.log("\n======================================================\n");

    console.error("❌ D2 Failed");
    console.error("\n--- STDERR ---\n", err.stderr?.toString() || "(empty)");

    throw new Error(err.stderr?.toString() || "D2 rendering failed");
  }
}

module.exports = { generateSVGFromD2 };
