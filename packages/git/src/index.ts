import simpleGit, { SimpleGit } from "simple-git";

export interface DiffResult {
  file: string;
  content: string;
  status: "added" | "modified" | "deleted";
}

export async function getGit(repoPath?: string): Promise<SimpleGit> {
  return simpleGit(repoPath ?? process.cwd());
}

export async function getStagedFiles(repoPath?: string): Promise<string[]> {
  const git = await getGit(repoPath);
  const status = await git.status();
  return [...status.staged, ...status.created];
}

export async function getUnstagedFiles(repoPath?: string): Promise<string[]> {
  const git = await getGit(repoPath);
  const status = await git.status();
  return status.modified;
}

export async function getDiff(repoPath?: string): Promise<DiffResult[]> {
  try {
    const git = await getGit(repoPath);
    const diff = await git.diff(["--cached", "--no-color"]);
    return parseDiffOutput(diff);
  } catch {
    return [];
  }
}

export async function getLastCommitMessage(repoPath?: string): Promise<string> {
  try {
    const git = await getGit(repoPath);
    const log = await git.log({ maxCount: 1 });
    return log.latest?.message ?? "";
  } catch {
    return "";
  }
}

function parseDiffOutput(diff: string): DiffResult[] {
  const results: DiffResult[] = [];
  const chunks = diff.split(/^diff --git /m).filter(Boolean);

  for (const chunk of chunks) {
    const match = chunk.match(/^a\/(.+?) b\/(.+?)(?:\n|$)/m);
    if (match) {
      const file = match[2];
      const status = chunk.includes("new file") ? "added" : "modified";
      results.push({
        file,
        content: chunk,
        status,
      });
    }
  }

  return results;
}
