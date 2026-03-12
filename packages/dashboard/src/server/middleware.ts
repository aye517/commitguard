import type { IncomingMessage, ServerResponse } from "node:http";
import { renderDashboardHtml } from "./html.js";
import { handleApiRequest, type ApiRequest } from "./api.js";
import { URL } from "node:url";

const BASE_PATH = "/__commit-guard-lab";
const API_PREFIX = BASE_PATH + "/api";

export interface DashboardOptions {
  /** Project root path for analysis. Defaults to process.cwd() */
  repoPath?: string;
}

/**
 * Create an Express/Connect-compatible middleware that serves CommitGuard Lab.
 *
 * Usage:
 *   app.use(createDashboardMiddleware());
 *   app.use(createDashboardMiddleware({ repoPath: "/path/to/project" }));
 */
export function createDashboardMiddleware(options?: DashboardOptions) {
  const repoPath = options?.repoPath;
  const html = renderDashboardHtml();

  return async function commitguardLabMiddleware(
    req: IncomingMessage,
    res: ServerResponse,
    next?: () => void
  ) {
    const url = parseUrl(req);
    if (!url.pathname.startsWith(BASE_PATH)) {
      if (next) return next();
      return;
    }

    // API routes
    if (url.pathname.startsWith(API_PREFIX)) {
      const apiPath = url.pathname.slice(API_PREFIX.length) || "/";
      const query: Record<string, string> = {};
      url.searchParams.forEach((v, k) => {
        query[k] = v;
      });

      const body = req.method === "POST" ? await readBody(req) : undefined;

      const apiReq: ApiRequest = {
        method: req.method ?? "GET",
        path: apiPath,
        query,
        body,
      };

      const result = await handleApiRequest(apiReq, repoPath);

      res.writeHead(result.status, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify(result.body));
      return;
    }

    // Dashboard HTML (SPA — all non-API routes serve the same HTML)
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(html);
  };
}

function parseUrl(req: IncomingMessage): URL {
  const host = req.headers.host ?? "localhost";
  return new URL(req.url ?? "/", `http://${host}`);
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf-8");
        resolve(JSON.parse(raw));
      } catch {
        resolve(undefined);
      }
    });
    req.on("error", () => resolve(undefined));
  });
}
