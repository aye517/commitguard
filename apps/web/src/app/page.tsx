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

interface InitResult {
  functions: { name: string; file: string; line: number; type: string }[];
  error?: string;
}

export default function Home() {
  const [path, setPath] = useState("");
  const [commit, setCommit] = useState("HEAD");
  const [tab, setTab] = useState<"check" | "init">("check");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [initResult, setInitResult] = useState<InitResult | null>(null);

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

  const maxRisk = analysis?.risks?.length
    ? analysis.risks.some((r) => r.level === "high")
      ? "high"
      : analysis.risks.some((r) => r.level === "medium")
        ? "medium"
        : "low"
    : null;

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ marginBottom: "0.25rem" }}>EasyTest Dashboard</h1>
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>
        테스트를 쉽게 시작하게 해주는 개발자 도구
      </p>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button
          onClick={() => setTab("check")}
          style={{
            padding: "0.5rem 1rem",
            border: tab === "check" ? "2px solid #333" : "1px solid #ccc",
            background: tab === "check" ? "#f5f5f5" : "transparent",
            cursor: "pointer",
            borderRadius: 4,
          }}
        >
          Check
        </button>
        <button
          onClick={() => setTab("init")}
          style={{
            padding: "0.5rem 1rem",
            border: tab === "check" ? "1px solid #ccc" : "2px solid #333",
            background: tab === "init" ? "#f5f5f5" : "transparent",
            cursor: "pointer",
            borderRadius: 4,
          }}
        >
          Init (스캔)
        </button>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>
          프로젝트 경로 (비워두면 현재 디렉터리)
        </label>
        <input
          type="text"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="."
          style={{
            width: "100%",
            padding: "0.5rem",
            border: "1px solid #ccc",
            borderRadius: 4,
            boxSizing: "border-box",
          }}
        />
      </div>

      {tab === "check" && (
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>
            커밋
          </label>
          <input
            type="text"
            value={commit}
            onChange={(e) => setCommit(e.target.value)}
            placeholder="HEAD"
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: 4,
              boxSizing: "border-box",
            }}
          />
        </div>
      )}

      <button
        onClick={tab === "check" ? runCheck : runInit}
        disabled={loading}
        style={{
          padding: "0.5rem 1.5rem",
          background: "#333",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "분석 중..." : tab === "check" ? "Check" : "스캔"}
      </button>

      {analysis && (
        <section style={{ marginTop: "2rem", padding: "1rem", background: "#f9f9f9", borderRadius: 8 }}>
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
                          color:
                            maxRisk === "high" ? "#c00" : maxRisk === "medium" ? "#c90" : "#090",
                        }}
                      >
                        {maxRisk}
                      </span>
                    </p>
                  )}
                  {analysis.commitMessage && (
                    <p style={{ fontSize: "0.9rem", color: "#666" }}>
                      커밋: {analysis.commitMessage}
                    </p>
                  )}
                </>
              )}
            </>
          )}
        </section>
      )}

      {initResult && (
        <section style={{ marginTop: "2rem", padding: "1rem", background: "#f9f9f9", borderRadius: 8 }}>
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
    </main>
  );
}
