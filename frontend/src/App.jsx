import { useEffect, useMemo, useState } from "react";
import { Routes, Route, useParams, useNavigate } from "react-router-dom";
import {
  Download,
  Copy,
  RefreshCcw,
  Search,
  Wand2,
  ZoomIn,
  ZoomOut,
  FileCode2,
  Image as ImageIcon,
  Link2,
} from "lucide-react";

import { generateDiagram, getDiagrams, getDiagramById } from "./api/diagramApi";

// ✅ prompt examples
const PROMPT_EXAMPLES = [
  {
    title: "BlueprintAI Architecture",
    value:
      "Architecture diagram: React UI sends prompt to Node GraphQL API. API calls OpenAI to generate D2 code. Backend renders SVG using D2 CLI. SVG is stored in MongoDB and returned to UI. Add CI/CD using GitHub Actions: lint, test, docker build, deploy.",
  },
  {
    title: "CI/CD Pipeline",
    value:
      "CI/CD pipeline: Developer push -> GitHub Actions -> install -> lint -> test -> docker build -> deploy -> healthcheck -> notify",
  },
  {
    title: "Flowchart: Login",
    value:
      "Flowchart: Start -> Login -> Validate Credentials -> Decision(valid?) -> Yes: Dashboard -> No: Error -> Retry -> End",
  },
];

// ---------------------- utils ----------------------
function downloadFile(filename, content, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadSvg(svg, filename = "diagram.svg") {
  downloadFile(filename, svg, "image/svg+xml;charset=utf-8");
}

async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
}

function classNames(...arr) {
  return arr.filter(Boolean).join(" ");
}

// ✅ Convert SVG to PNG download
async function downloadPngFromSvg(svgText, filename = "diagram.png") {
  const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.crossOrigin = "anonymous";

  const imageLoaded = new Promise((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
  });

  img.src = url;
  await imageLoaded;

  const canvas = document.createElement("canvas");
  canvas.width = img.width || 1200;
  canvas.height = img.height || 800;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const pngUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(pngUrl);
  }, "image/png");

  URL.revokeObjectURL(url);
}

// ---------------------- Playground Page ----------------------
function PlaygroundPage() {
  const navigate = useNavigate();

  const [template, setTemplate] = useState(PROMPT_EXAMPLES[0].title);
  const [prompt, setPrompt] = useState(PROMPT_EXAMPLES[0].value);

  const [svg, setSvg] = useState("");
  const [d2Code, setD2Code] = useState("");
  const [activeTab, setActiveTab] = useState("preview"); // preview | d2 | svg
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(false);

  const [currentId, setCurrentId] = useState("");

  const [history, setHistory] = useState([]);
  const [historySearch, setHistorySearch] = useState("");

  const [toast, setToast] = useState("");

  // ✅ Ticket #9 Settings
  const [options, setOptions] = useState({
    diagramType: "architecture",
    direction: "right",
    detailLevel: "detailed",
    withIcons: true,
    withContainers: true,
    layout: "dagre",
  });

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  async function loadHistory() {
    try {
      const items = await getDiagrams();
      setHistory(items || []);
    } catch (e) {
      console.error(e);
      showToast("Failed to load history");
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredHistory = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    if (!q) return history;
    return history.filter((d) =>
      (d.description || "").toLowerCase().includes(q)
    );
  }, [history, historySearch]);

  // ✅ FIXED: Generate does NOT navigate to /diagram/:id
  const onGenerate = async () => {
    if (!prompt.trim()) return showToast("Prompt cannot be empty");

    setLoading(true);
    try {
      // ✅ IMPORTANT: options passed
      const res = await generateDiagram(prompt.trim(), options);

      setSvg(res?.svg || "");
      setD2Code(res?.d2Code || "");
      setCurrentId(res?.id || "");
      setActiveTab("preview");
      setZoom(1);

      showToast("Diagram generated ✅");
      await loadHistory();
    } catch (e) {
      console.error(e);
      showToast(e.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const onPickHistory = (item) => {
    setSvg(item.svg || "");
    setPrompt(item.description || "");
    setD2Code(item.d2Code || "");
    setCurrentId(item.id || "");
    setActiveTab("preview");
    setZoom(1);

    // ✅ load saved settings if available
    setOptions((prev) => ({
      ...prev,
      diagramType: item.diagramType || prev.diagramType,
      direction: item.direction || prev.direction,
      detailLevel: item.detailLevel || prev.detailLevel,
      withIcons:
        typeof item.withIcons === "boolean" ? item.withIcons : prev.withIcons,
      withContainers:
        typeof item.withContainers === "boolean"
          ? item.withContainers
          : prev.withContainers,
      layout: item.layout || prev.layout,
    }));

    showToast("Loaded from history ✅");
  };

  const shareUrl = currentId
    ? `${window.location.origin}/diagram/${currentId}`
    : "";

  const tabs = [
    { id: "preview", label: "Preview", icon: <ImageIcon size={16} /> },
    { id: "d2", label: "D2 Code", icon: <FileCode2 size={16} /> },
    { id: "svg", label: "SVG", icon: <FileCode2 size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top bar */}
      <div className="h-14 bg-white border-b flex items-center px-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-bold">
            B
          </div>
          <div>
            <div className="font-bold leading-4">BlueprintAI</div>
            <div className="text-[11px] text-slate-500 leading-4">
              Prompt → D2 → SVG Playground
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {shareUrl ? (
            <button
              onClick={async () => {
                await copyToClipboard(shareUrl);
                showToast("Share link copied ✅");
              }}
              className="text-sm px-3 py-2 rounded-xl border bg-white hover:bg-slate-50 flex items-center gap-2"
            >
              <Link2 size={16} /> Share
            </button>
          ) : null}

          <button
            onClick={() => loadHistory().then(() => showToast("History refreshed"))}
            className="text-sm px-3 py-2 rounded-xl border bg-white hover:bg-slate-50 flex items-center gap-2"
          >
            <RefreshCcw size={16} /> Refresh
          </button>

          <button
            onClick={onGenerate}
            disabled={loading}
            className="text-sm px-4 py-2 rounded-xl bg-black text-white hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
          >
            <Wand2 size={16} />
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-12 h-[calc(100vh-56px)]">
        {/* Sidebar */}
        <aside className="col-span-4 bg-white border-r p-4 overflow-auto">
          <div className="space-y-4">
            {/* ✅ settings panel */}
            <div className="rounded-2xl border p-3 bg-slate-50">
              <div className="text-sm font-semibold mb-2">Diagram Settings</div>

              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs">
                  Type
                  <select
                    className="mt-1 w-full rounded-xl border px-2 py-2 text-sm"
                    value={options.diagramType}
                    onChange={(e) =>
                      setOptions((o) => ({ ...o, diagramType: e.target.value }))
                    }
                  >
                    <option value="architecture">Architecture</option>
                    <option value="flowchart">Flowchart</option>
                    <option value="sequence">Sequence</option>
                    <option value="erd">ER Diagram</option>
                    <option value="network">Network</option>
                    <option value="mindmap">Mindmap</option>
                  </select>
                </label>

                <label className="text-xs">
                  Direction
                  <select
                    className="mt-1 w-full rounded-xl border px-2 py-2 text-sm"
                    value={options.direction}
                    onChange={(e) =>
                      setOptions((o) => ({ ...o, direction: e.target.value }))
                    }
                  >
                    <option value="right">Left → Right</option>
                    <option value="down">Top → Down</option>
                  </select>
                </label>

                <label className="text-xs">
                  Layout
                  <select
                    className="mt-1 w-full rounded-xl border px-2 py-2 text-sm"
                    value={options.layout}
                    onChange={(e) =>
                      setOptions((o) => ({ ...o, layout: e.target.value }))
                    }
                  >
                    <option value="dagre">Dagre</option>
                    <option value="elk">ELK</option>
                    <option value="grid">Grid</option>
                    <option value="layered">Layered</option>
                    <option value="concentric">Concentric</option>
                  </select>
                </label>

                <label className="text-xs">
                  Detail
                  <select
                    className="mt-1 w-full rounded-xl border px-2 py-2 text-sm"
                    value={options.detailLevel}
                    onChange={(e) =>
                      setOptions((o) => ({ ...o, detailLevel: e.target.value }))
                    }
                  >
                    <option value="minimal">Minimal</option>
                    <option value="detailed">Detailed</option>
                  </select>
                </label>
              </div>

              <div className="mt-3 flex items-center justify-between text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={options.withIcons}
                    onChange={(e) =>
                      setOptions((o) => ({ ...o, withIcons: e.target.checked }))
                    }
                  />
                  Icons
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={options.withContainers}
                    onChange={(e) =>
                      setOptions((o) => ({
                        ...o,
                        withContainers: e.target.checked,
                      }))
                    }
                  />
                  Containers
                </label>
              </div>
            </div>

            {/* template */}
            <div>
              <div className="text-sm font-semibold">Prompt Templates</div>
              <select
                className="mt-2 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                value={template}
                onChange={(e) => {
                  const t = e.target.value;
                  setTemplate(t);
                  const obj = PROMPT_EXAMPLES.find((x) => x.title === t);
                  setPrompt(obj?.value || "");
                }}
              >
                {PROMPT_EXAMPLES.map((p) => (
                  <option key={p.title} value={p.title}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            {/* prompt textarea */}
            <div>
              <div className="text-sm font-semibold">Prompt</div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="mt-2 w-full min-h-[170px] rounded-2xl border px-3 py-2 text-sm leading-5 focus:outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="Type your prompt here..."
              />
            </div>

            {/* history */}
            <div className="pt-2">
              <div className="text-sm font-semibold">History</div>

              <div className="mt-2 flex items-center gap-2 rounded-xl border px-3 py-2 bg-slate-50">
                <Search size={16} className="text-slate-500" />
                <input
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm"
                  placeholder="Search history..."
                />
              </div>

              <div className="mt-3 space-y-3">
                {filteredHistory.length === 0 ? (
                  <div className="text-xs text-slate-400">
                    No diagrams found. Generate your first one.
                  </div>
                ) : (
                  filteredHistory.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => onPickHistory(d)}
                      className="w-full text-left rounded-2xl border p-3 hover:bg-slate-50"
                    >
                      <div className="text-sm font-semibold">
                        {d.title || "Generated Diagram"}
                      </div>
                      <div className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {d.description || ""}
                      </div>

                      {/* show saved settings */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {d.diagramType ? (
                          <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 border">
                            {d.diagramType}
                          </span>
                        ) : null}
                        {d.direction ? (
                          <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 border">
                            dir:{d.direction}
                          </span>
                        ) : null}
                        {d.layout ? (
                          <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 border">
                            {d.layout}
                          </span>
                        ) : null}
                      </div>

                      <div className="text-[11px] text-slate-400 mt-2">
                        {d.createdAt
                          ? new Date(d.createdAt).toLocaleString()
                          : ""}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Preview panel */}
        <main className="col-span-8 p-4 overflow-auto">
          {/* Tabs + toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={classNames(
                    "px-4 py-2 rounded-xl border text-sm flex items-center gap-2",
                    activeTab === t.id
                      ? "bg-black text-white border-black"
                      : "bg-white hover:bg-slate-50"
                  )}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setZoom((z) => Math.max(0.4, +(z - 0.1).toFixed(1)))
                }
                className="px-3 py-2 rounded-xl border bg-white hover:bg-slate-50 text-sm"
                title="Zoom out"
              >
                <ZoomOut size={16} />
              </button>

              <div className="px-3 py-2 rounded-xl border bg-white text-sm">
                {(zoom * 100).toFixed(0)}%
              </div>

              <button
                onClick={() =>
                  setZoom((z) => Math.min(2.0, +(z + 0.1).toFixed(1)))
                }
                className="px-3 py-2 rounded-xl border bg-white hover:bg-slate-50 text-sm"
                title="Zoom in"
              >
                <ZoomIn size={16} />
              </button>

              <button
                onClick={async () => {
                  if (!d2Code) return showToast("No D2 to download");
                  downloadFile("diagram.d2", d2Code);
                  showToast("D2 downloaded ✅");
                }}
                className="px-3 py-2 rounded-xl border bg-white hover:bg-slate-50 text-sm"
                title="Download D2"
              >
                D2
              </button>

              <button
                onClick={async () => {
                  if (!svg) return showToast("No SVG available");
                  downloadSvg(svg, "diagram.svg");
                  showToast("SVG downloaded ✅");
                }}
                className="px-3 py-2 rounded-xl border bg-white hover:bg-slate-50 text-sm flex items-center gap-2"
              >
                <Download size={16} /> SVG
              </button>

              <button
                onClick={async () => {
                  if (!svg) return showToast("No SVG available");
                  await downloadPngFromSvg(svg, "diagram.png");
                  showToast("PNG downloaded ✅");
                }}
                className="px-3 py-2 rounded-xl bg-black text-white hover:opacity-90 text-sm flex items-center gap-2"
              >
                <Download size={16} /> PNG
              </button>

              <button
                onClick={async () => {
                  if (!svg) return showToast("Nothing to copy");
                  await copyToClipboard(svg);
                  showToast("SVG copied ✅");
                }}
                className="px-3 py-2 rounded-xl border bg-white hover:bg-slate-50 text-sm flex items-center gap-2"
              >
                <Copy size={16} /> Copy
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="mt-4 rounded-2xl border bg-white overflow-auto min-h-[80vh]">
            {activeTab === "preview" && (
              <div className="p-4 overflow-auto">
                {svg ? (
                  <div
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: "top left",
                    }}
                    dangerouslySetInnerHTML={{ __html: svg }}
                  />
                ) : (
                  <div className="text-slate-400 p-6">
                    No diagram yet. Click Generate.
                  </div>
                )}
              </div>
            )}

            {activeTab === "d2" && (
              <div className="p-4">
                <pre className="text-xs bg-slate-50 border rounded-2xl p-4 overflow-auto">
                  {d2Code || "// No D2 yet"}
                </pre>
              </div>
            )}

            {activeTab === "svg" && (
              <div className="p-4">
                <pre className="text-xs bg-slate-50 border rounded-2xl p-4 overflow-auto">
                  {svg || "<!-- No SVG yet -->"}
                </pre>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* toast */}
      {toast ? (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-xl shadow-lg text-sm">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------- Shared Diagram Page ----------------------
function SharedDiagramPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [svg, setSvg] = useState("");
  const [d2Code, setD2Code] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const d = await getDiagramById(id);
        setSvg(d?.svg || "");
        setD2Code(d?.d2Code || "");
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-14 bg-white border-b flex items-center px-4">
        <button
          onClick={() => navigate("/")}
          className="px-3 py-2 rounded-xl border bg-white hover:bg-slate-50"
        >
          ← Back
        </button>
        <div className="ml-3 font-bold">Shared Diagram</div>
      </div>

      <div className="p-6">
        {loading ? (
          <div>Loading...</div>
        ) : svg ? (
          <div className="rounded-2xl border bg-white p-4 overflow-auto">
            <div dangerouslySetInnerHTML={{ __html: svg }} />
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => downloadFile("diagram.d2", d2Code)}
                className="px-3 py-2 rounded-xl border bg-white hover:bg-slate-50"
              >
                Download D2
              </button>
              <button
                onClick={() => downloadSvg(svg)}
                className="px-3 py-2 rounded-xl border bg-white hover:bg-slate-50"
              >
                Download SVG
              </button>
              <button
                onClick={() => downloadPngFromSvg(svg)}
                className="px-3 py-2 rounded-xl bg-black text-white hover:opacity-90"
              >
                Download PNG
              </button>
            </div>
          </div>
        ) : (
          <div className="text-slate-500">Diagram not found.</div>
        )}
      </div>
    </div>
  );
}

// ---------------------- Router ----------------------
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PlaygroundPage />} />
      <Route path="/diagram/:id" element={<SharedDiagramPage />} />
    </Routes>
  );
}
