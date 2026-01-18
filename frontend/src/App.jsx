import { useEffect, useState } from "react";
import { generateDiagram, getDiagrams } from "./api/diagramApi";

const PROMPT_EXAMPLES = [
  {
    title: "BlueprintAI Architecture",
    value:
      "Architecture diagram: React diagram playground UI sends prompt to Node.js GraphQL API. API calls OpenAI to generate D2 code, runs D2 via Docker to produce SVG, stores in MongoDB and returns SVG to UI. Add CI/CD with GitHub Actions.",
  },
  {
    title: "CI/CD Pipeline",
    value:
      "CI/CD pipeline: Developer pushes to GitHub -> GitHub Actions runs lint and unit tests -> Build Docker images -> Push to registry -> Deploy -> Health check -> Notify success/failure.",
  },
  {
    title: "Login Flowchart",
    value:
      "Flowchart: Start -> Login -> Validate -> Decision(valid?) -> Yes: Dashboard -> No: Error -> Retry -> End.",
  },
];

export default function App() {
  const [description, setDescription] = useState(PROMPT_EXAMPLES[0].value);
  const [svg, setSvg] = useState("");
  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadHistory() {
    try {
      const items = await getDiagrams();
      setHistory(items);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const onGenerate = async () => {
    setError("");
    setLoading(true);

    try {
      const diagram = await generateDiagram(description);
      setSvg(diagram.svg);
      await loadHistory();
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Arial" }}>
      {/* LEFT */}
      <div
        style={{
          width: "38%",
          padding: 16,
          borderRight: "1px solid #ddd",
          overflow: "auto",
        }}
      >
        <h2 style={{ margin: 0 }}>BlueprintAI Playground</h2>
        <p style={{ marginTop: 6, color: "#666", fontSize: 13 }}>
          Type a prompt → Generate diagram → Preview SVG
        </p>

        {/* Prompt examples */}
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 13, color: "#444" }}>
            Prompt templates:
          </label>
          <select
            style={{
              width: "100%",
              marginTop: 6,
              padding: 10,
              borderRadius: 10,
              border: "1px solid #ccc",
            }}
            onChange={(e) => setDescription(e.target.value)}
            defaultValue={description}
          >
            {PROMPT_EXAMPLES.map((p) => (
              <option key={p.title} value={p.value}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={10}
          style={{
            width: "100%",
            padding: 12,
            fontSize: 14,
            borderRadius: 12,
            border: "1px solid #ccc",
            marginTop: 12,
            resize: "vertical",
          }}
        />

        <button
          onClick={onGenerate}
          disabled={loading}
          style={{
            marginTop: 12,
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: "none",
            background: "#111",
            color: "#fff",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "bold",
          }}
        >
          {loading ? "Generating..." : "Generate Diagram"}
        </button>

        {error ? (
          <div
            style={{
              marginTop: 12,
              padding: 10,
              borderRadius: 12,
              background: "#ffe4e4",
              color: "#900",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        ) : null}

        <h3 style={{ marginTop: 24 }}>History</h3>

        <div style={{ maxHeight: "44vh", overflow: "auto" }}>
          {history.map((d) => (
            <div
              key={d.id}
              onClick={() => setSvg(d.svg)}
              style={{
                border: "1px solid #eee",
                padding: 10,
                borderRadius: 12,
                marginBottom: 10,
                cursor: "pointer",
                background: "#fafafa",
              }}
            >
              <b>{d.title || "Generated Diagram"}</b>
              <div style={{ fontSize: 12, color: "#555" }}>
                {d.description?.slice(0, 60)}...
              </div>
              <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>
                {d.createdAt ? new Date(d.createdAt).toLocaleString() : ""}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT */}
      <div style={{ flex: 1, padding: 16, overflow: "auto" }}>
        <h2 style={{ margin: 0 }}>Diagram Preview</h2>
        <p style={{ marginTop: 6, color: "#666", fontSize: 13 }}>
          SVG output from backend
        </p>

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 16,
            padding: 14,
            marginTop: 12,
            background: "#fff",
            minHeight: "80vh",
          }}
          dangerouslySetInnerHTML={{
            __html: svg || "<p style='color:#888;'>No diagram yet</p>",
          }}
        />
      </div>
    </div>
  );
}
