import { createServer } from "node:http";
import { createDashboardMiddleware } from "./server/middleware.js";

const port = parseInt(process.env.PORT ?? "4820", 10);
const repoPath = process.argv[2] || process.cwd();

const middleware = createDashboardMiddleware({ repoPath });

const server = createServer((req, res) => {
  middleware(req, res);
});

server.listen(port, () => {
  console.log(`\n  CommitGuard Lab running at:`);
  console.log(`  http://localhost:${port}/__commit-guard-lab\n`);
});
