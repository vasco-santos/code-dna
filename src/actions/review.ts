import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { TEMPLATES_DIR } from './core';

const MYAI_CONFIG = path.join(
  process.env.HOME || process.env.USERPROFILE || '',
  '.myai',
  'config.json',
);

interface PRData {
  title: string;
  body: string;
  number: number;
  baseRefName: string;
  headRefName: string;
  files: { path: string }[];
  reviews: { body: string; state: string }[];
  comments: { body: string }[];
}

interface AuthContext {
  token: string | undefined;
  ghPath: string;
}

export function linkAuth(): string {
  try {
    const token = execSync('gh auth token', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (!token) throw new Error('No gh token found. Run gh auth login first.');

    const configDir = path.dirname(MYAI_CONFIG);
    if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });

    fs.writeFileSync(MYAI_CONFIG, JSON.stringify({ GITHUB_TOKEN: token }, null, 2));
    return `✅ Token linked and saved to ${MYAI_CONFIG}`;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return `❌ Failed to link token: ${message}`;
  }
}

async function getAuthContext(): Promise<AuthContext> {
  let token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

  if (!token && fs.existsSync(MYAI_CONFIG)) {
    try {
      const config = JSON.parse(fs.readFileSync(MYAI_CONFIG, 'utf8'));
      token = config.GITHUB_TOKEN || config.GH_TOKEN;
    } catch {
      // Ignore config errors
    }
  }

  const paths = ['gh', '/opt/homebrew/bin/gh', '/usr/local/bin/gh', '/usr/bin/gh'];
  let ghPath = 'gh';

  for (const p of paths) {
    try {
      if (!token) {
        token = execSync(`${p} auth token`, {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        }).trim();
      }
      execSync(`${p} --version`, { stdio: 'ignore' });
      ghPath = p;
      if (token) break;
    } catch {
      // Try next path
    }
  }

  return { token, ghPath };
}

export async function reviewPR(prLink: string, mode: 'inbound' | 'outbound' = 'outbound') {
  try {
    const { token, ghPath } = await getAuthContext();
    const env = { ...process.env, GH_TOKEN: token };

    let pr: PRData;
    let diff: string = '';

    try {
      const fields = 'title,body,number,baseRefName,headRefName,files,reviews,comments';
      pr = JSON.parse(
        execSync(`${ghPath} pr view ${prLink} --json ${fields}`, { encoding: 'utf8', env }),
      );
      diff = execSync(`${ghPath} pr diff ${prLink}`, { encoding: 'utf8', env });
    } catch (cliError: unknown) {
      const cliMessage = cliError instanceof Error ? cliError.message : String(cliError);
      const match = prLink.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
      if (!match)
        throw new Error(`Invalid PR Link: ${prLink}. CLI Error: ${cliMessage}`);

      const [, owner, repo, number] = match;
      const headers: Record<string, string> = {
        'User-Agent': 'myai-mcp-server',
        Accept: 'application/vnd.github.v3+json',
        ...(token ? { Authorization: `token ${token}` } : {}),
      };

      const [apiRes, diffRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${number}`, { headers }),
        fetch(`${prLink}.diff`, { headers }),
      ]);

      if (!apiRes.ok)
        throw new Error(`GitHub API failed (${apiRes.status}). CLI Error: ${cliMessage}`);

      const apiPr = (await apiRes.json()) as any; // Cast as any for raw fetch mapping
      pr = {
        title: apiPr.title,
        body: apiPr.body,
        number: apiPr.number,
        baseRefName: apiPr.base?.ref,
        headRefName: apiPr.head?.ref,
        files: [],
        reviews: [],
        comments: [],
      };
      diff = await diffRes.text();
    }

    if (mode === 'inbound') {
      const templatePath = path.join(TEMPLATES_DIR, 'review-inbound.md.template');
      const instructions = fs.existsSync(templatePath)
        ? fs.readFileSync(templatePath, 'utf8')
        : 'Perform inbound review analysis.';

      return {
        status: 'success',
        mode: 'inbound',
        data: { pr, diff },
        instructions,
      };
    } else {
      const templatePath = path.join(TEMPLATES_DIR, 'review-outbound.md.template');
      const instructions = fs.existsSync(templatePath)
        ? fs.readFileSync(templatePath, 'utf8')
        : 'Perform outbound review analysis.';

      return {
        status: 'success',
        mode: 'outbound',
        data: { pr, diff },
        instructions,
      };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      status: 'error',
      message: `Failed to fetch PR: ${message}. Ensure 'gh' CLI is authenticated and the PR exists.`,
    };
  }
}
