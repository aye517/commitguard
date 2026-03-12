"use client";

import { useState } from "react";

interface RiskResult {
  level: "low" | "medium" | "high";
  message: string;
  details?: string[];
}

interface AnalysisResult {
  changedFiles: string[];
  changedFunctions: { file: string; function: { name: string; line: number } }[];
  impactedFunctions?: string[];
  risks: RiskResult[];
  commitMessage?: string;
  commitHash?: string;
  error?: string;
}

interface FunctionItem {
  name: string;
  file: string;
  line: number;
  type: string;
}

interface InitResult {
  functions: FunctionItem[];
  error?: string;
}

interface GenerateResult {
  generated: string[];
  count: number;
  error?: string;
}

type Tab = "check" | "init" | "generate";

// --- Styles ---
const styles = {
  tab: (active: boolean) => ({
    padding: "0.5rem 1rem",
    border: active ? "2px solid #333" : "1px solid #ccc",
    background: active ? "#f5f5f5" : "transparent",
    cursor: "pointer" as const,
    borderRadius: 4,
  }),
  input: {
    width: "100%",
    padding: "0.5rem",
    border: "1px solid #ccc",
    borderRadius: 4,
    boxSizing: "border-box" as const,
  },
  btnPrimary: (disabled: boolean) => ({
    padding: "0.5rem 1.5rem",
    background: "#333",
    color: "white",
    border: "none",
    borderRadius: 4,
    cursor: disabled ? "not-allowed" as const : "pointer" as const,
  }),
  section: {
    marginTop: "2rem",
    padding: "1rem",
    background: "#f9f9f9",
    borderRadius: 8,
  },
  dirHeader: (expanded: boolean) => ({
    display: "flex" as const,
    alignItems: "center" as const,
    gap: "0.5rem",
    cursor: "pointer" as const,
    padding: "0.4rem 0",
    fontWeight: 600 as const,
    fontSize: "0.9rem",
    userSelect: "none" as const,
    color: expanded ? "#333" : "#666",
  }),
  fnRow: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: "0.5rem",
    padding: "0.2rem 0 0.2rem 1.5rem",
    fontSize: "0.85rem",
  },
  badge: (type: string) => ({
    fontSize: "0.7rem",
    padding: "1px 5px",
    borderRadius: 3,
    background: type === "function" ? "#e3f2fd" : type === "method" ? "#f3e5f5" : "#fff3e0",
    color: type === "function" ? "#1565c0" : type === "method" ? "#7b1fa2" : "#e65100",
  }),
};

// --- Helper: group functions by directory ---
function groupByDir(functions: FunctionItem[]): Map<string, FunctionItem[]> {
  const map = new Map<string, FunctionItem[]>();
  for (const fn of functions) {
    const dir = fn.file.includes("/") ? fn.file.slice(0, fn.file.lastIndexOf("/")) : ".";
    const list = map.get(dir) ?? [];
    list.push(fn);
    map.set(dir, list);
  }
  return new Map([...map.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

export default function Home() {
  const [path, setPath] = useState("");
  const [commit, setCommit] = useState("HEAD");
  const [tab, setTab] = useState<Tab>("check");
  const [loading, setLoading] = useState(false);

  // Check tab
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  // Init tab
  const [initResult, setInitResult] = useState<InitResult | null>(null);

  // Generate tab
  const [filter, setFilter] = useState("");
  const [scannedFunctions, setScannedFunctions] = useState<FunctionItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generateResult, setGenerateResult] = useState<GenerateResult | null>(null);
  const [scanned, setScanned] = useState(false);
  const [generating, setGenerating] = useState(false);

  // --- Check ---
  const runCheck = async () => {
    setLoading(true);
    setAnalysis(null);
    try {
      const params = new URLSearchParams({ commit });
      if (path) params.set("path", path);
      const res = await fetch(`/api/analyze?${params}`);
      const data = await res.json();
      if (!res.ok) setAnalysis({ ...data, error: data.error });
      else setAnalysis(data);
    } catch (e) {
      setAnalysis({ error: String(e), changedFiles: [], changedFunctions: [], risks: [] });
    } finally {
      setLoading(false);
    }
  };

  // --- Init ---
  const runInit = async () => {
    setLoading(true);
    setInitResult(null);
    try {
      const params = path ? `?path=${encodeURIComponent(path)}` : "";
      const res = await fetch(`/api/init${params}`);
      const data = await res.json();
      if (!res.ok) setInitResult({ functions: [], error: data.error });
      else setInitResult(data);
    } catch (e) {
      setInitResult({ functions: [], error: String(e) });
    } finally {
      setLoading(false);
    }
  };

  // --- Generate: scan ---
  const runScan = async () => {
    setLoading(true);
    setScannedFunctions([]);
    setSelected(new Set());
    setGenerateResult(null);
    setScanned(false);
    try {
      const params = new URLSearchParams();
      if (path) params.set("path", path);
      if (filter) params.set("filter", filter);
      const res = await fetch(`/api/init?${params}`);
      const data: InitResult = await res.json();
      if (!res.ok || data.error) {
        setGenerateResult({ generated: [], count: 0, error: data.error });
      } else {
        setScannedFunctions(data.functions);
        // Auto-select all
        setSelected(new Set(data.functions.map(fnKey)));
      }
      setScanned(true);
    } catch (e) {
      setGenerateResult({ generated: [], count: 0, error: String(e) });
    } finally {
      setLoading(false);
    }
  };

  // --- Generate: create tests ---
  const runGenerate = async () => {
    setGenerating(true);
    setGenerateResult(null);
    try {
      const selectedFns = scannedFunctions.filter((fn) => selected.has(fnKey(fn)));
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: path || undefined,
          functions: selectedFns,
        }),
      });
      const data: GenerateResult = await res.json();
      if (!res.ok) setGenerateResult({ generated: [], count: 0, error: data.error });
      else setGenerateResult(data);
    } catch (e) {
      setGenerateResult({ generated: [], count: 0, error: String(e) });
    } finally {
      setGenerating(false);
    }
  };

  // --- Selection helpers ---
  const fnKey = (fn: FunctionItem) => `${fn.file}:${fn.name}:${fn.line}`;

  const toggleFn = (fn: FunctionItem) => {
    const key = fnKey(fn);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleDir = (dir: string, fns: FunctionItem[]) => {
    const keys = fns.map(fnKey);
    const allSelected = keys.every((k) => selected.has(k));
    setSelected((prev) => {
      const next = new Set(prev);
      for (const k of keys) {
        if (allSelected) next.delete(k);
        else next.add(k);
      }
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(scannedFunctions.map(fnKey)));
  const selectNone = () => setSelected(new Set());

  const maxRisk = analysis?.risks?.length
    ? analysis.risks.some((r) => r.level === "high")
      ? "high"
      : analysis.risks.some((r) => r.level === "medium")
        ? "medium"
        : "low"
    : null;

  // --- Collapsed directories state ---
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const toggleDirExpand = (dir: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(dir)) next.delete(dir);
      else next.add(dir);
      return next;
    });
  };

  const grouped = groupByDir(scannedFunctions);

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ marginBottom: "0.25rem" }}>EasyTest Dashboard</h1>
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>
        테스트를 쉽게 시작하게 해주는 개발자 도구
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        {(["check", "init", "generate"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={styles.tab(tab === t)}>
            {t === "check" ? "Check" : t === "init" ? "Init (스캔)" : "Generate"}
          </button>
        ))}
      </div>

      {/* Path input (shared) */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>
          프로젝트 경로 (비워두면 현재 디렉터리)
        </label>
        <input
          type="text"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="."
          style={styles.input}
        />
      </div>

      {/* ===== CHECK TAB ===== */}
      {tab === "check" && (
        <>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>커밋</label>
            <input
              type="text"
              value={commit}
              onChange={(e) => setCommit(e.target.value)}
              placeholder="HEAD"
              style={styles.input}
            />
          </div>
          <button onClick={runCheck} disabled={loading} style={styles.btnPrimary(loading)}>
            {loading ? "분석 중..." : "Check"}
          </button>

          {analysis && (
            <section style={styles.section}>
              <h2 style={{ marginTop: 0 }}>Check 결과</h2>
              {analysis.error ? (
                <p style={{ color: "#c00" }}>{analysis.error}</p>
              ) : (
                <>
                  {analysis.changedFunctions?.length === 0 ? (
                    <p>변경된 함수가 없습니다.</p>
                  ) : (
                    <>
                      <h3>변경된 함수</h3>
                      <ul style={{ margin: "0.5rem 0" }}>
                        {analysis.changedFunctions?.map((cf, i) => (
                          <li key={i}>
                            {cf.function.name} ({cf.file})
                          </li>
                        ))}
                      </ul>
                      {analysis.impactedFunctions?.length ? (
                        <>
                          <h3>영향 함수</h3>
                          <ul style={{ margin: "0.5rem 0" }}>
                            {analysis.impactedFunctions.map((fn, i) => (
                              <li key={i}>{fn}</li>
                            ))}
                          </ul>
                        </>
                      ) : null}
                      {maxRisk && (
                        <p>
                          <strong>리스크:</strong>{" "}
                          <span
                            style={{
                              color: maxRisk === "high" ? "#c00" : maxRisk === "medium" ? "#c90" : "#090",
                            }}
                          >
                            {maxRisk}
                          </span>
                        </p>
                      )}
                      {analysis.commitMessage && (
                        <p style={{ fontSize: "0.9rem", color: "#666" }}>커밋: {analysis.commitMessage}</p>
                      )}
                    </>
                  )}
                </>
              )}
            </section>
          )}
        </>
      )}

      {/* ===== INIT TAB ===== */}
      {tab === "init" && (
        <>
          <button onClick={runInit} disabled={loading} style={styles.btnPrimary(loading)}>
            {loading ? "스캔 중..." : "스캔"}
          </button>

          {initResult && (
            <section style={styles.section}>
              <h2 style={{ marginTop: 0 }}>Init 결과</h2>
              {initResult.error ? (
                <p style={{ color: "#c00" }}>{initResult.error}</p>
              ) : (
                <>
                  <p>
                    <strong>{initResult.functions.length}개</strong> 함수 발견
                  </p>
                  <ul style={{ margin: "0.5rem 0", maxHeight: 200, overflow: "auto" }}>
                    {initResult.functions.slice(0, 50).map((fn, i) => (
                      <li key={i}>
                        {fn.name} ({fn.file}:{fn.line})
                      </li>
                    ))}
                    {initResult.functions.length > 50 && (
                      <li>... 외 {initResult.functions.length - 50}개</li>
                    )}
                  </ul>
                </>
              )}
            </section>
          )}
        </>
      )}

      {/* ===== GENERATE TAB ===== */}
      {tab === "generate" && (
        <>
          {/* Filter input */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>
              경로 필터 (예: src/utils)
            </label>
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="비워두면 전체 스캔"
              style={styles.input}
            />
          </div>

          <button onClick={runScan} disabled={loading} style={styles.btnPrimary(loading)}>
            {loading ? "스캔 중..." : "함수 스캔"}
          </button>

          {/* Scanned function list */}
          {scanned && scannedFunctions.length > 0 && (
            <section style={styles.section}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ marginTop: 0 }}>
                  함수 목록 ({selected.size}/{scannedFunctions.length} 선택)
                </h2>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={selectAll}
                    style={{ fontSize: "0.8rem", cursor: "pointer", padding: "2px 8px", border: "1px solid #ccc", borderRadius: 3, background: "white" }}
                  >
                    전체 선택
                  </button>
                  <button
                    onClick={selectNone}
                    style={{ fontSize: "0.8rem", cursor: "pointer", padding: "2px 8px", border: "1px solid #ccc", borderRadius: 3, background: "white" }}
                  >
                    선택 해제
                  </button>
                </div>
              </div>

              <div style={{ maxHeight: 400, overflow: "auto", marginTop: "0.5rem" }}>
                {[...grouped.entries()].map(([dir, fns]) => {
                  const dirKeys = fns.map(fnKey);
                  const allChecked = dirKeys.every((k) => selected.has(k));
                  const someChecked = !allChecked && dirKeys.some((k) => selected.has(k));
                  const expanded = expandedDirs.has(dir);

                  return (
                    <div key={dir} style={{ marginBottom: "0.25rem" }}>
                      <div style={styles.dirHeader(expanded)}>
                        <input
                          type="checkbox"
                          checked={allChecked}
                          ref={(el) => { if (el) el.indeterminate = someChecked; }}
                          onChange={() => toggleDir(dir, fns)}
                        />
                        <span onClick={() => toggleDirExpand(dir)} style={{ flex: 1 }}>
                          {expanded ? "\u25BC" : "\u25B6"} {dir}/ ({fns.length})
                        </span>
                      </div>
                      {expanded &&
                        fns.map((fn) => (
                          <div key={fnKey(fn)} style={styles.fnRow}>
                            <input
                              type="checkbox"
                              checked={selected.has(fnKey(fn))}
                              onChange={() => toggleFn(fn)}
                            />
                            <span style={styles.badge(fn.type)}>{fn.type}</span>
                            <span>{fn.name}</span>
                            <span style={{ color: "#999", fontSize: "0.75rem" }}>:{fn.line}</span>
                          </div>
                        ))}
                    </div>
                  );
                })}
              </div>

              {/* Generate button */}
              <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <button
                  onClick={runGenerate}
                  disabled={generating || selected.size === 0}
                  style={{
                    ...styles.btnPrimary(generating || selected.size === 0),
                    background: selected.size === 0 ? "#999" : "#1a7f37",
                  }}
                >
                  {generating ? "생성 중..." : `${selected.size}개 함수 테스트 생성`}
                </button>
              </div>
            </section>
          )}

          {scanned && scannedFunctions.length === 0 && !generateResult?.error && (
            <p style={{ marginTop: "1rem", color: "#666" }}>함수를 찾을 수 없습니다. 경로 필터를 확인하세요.</p>
          )}

          {/* Generate result */}
          {generateResult && (
            <section style={{ ...styles.section, marginTop: "1rem" }}>
              <h2 style={{ marginTop: 0 }}>생성 결과</h2>
              {generateResult.error ? (
                <p style={{ color: "#c00" }}>{generateResult.error}</p>
              ) : (
                <>
                  <p>
                    <strong>{generateResult.count}개</strong> 테스트 파일 생성 완료
                  </p>
                  <ul style={{ margin: "0.5rem 0", fontSize: "0.85rem" }}>
                    {generateResult.generated.map((f, i) => (
                      <li key={i} style={{ color: "#1a7f37" }}>+ {f}</li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          )}
        </>
      )}
    </main>
  );
}
