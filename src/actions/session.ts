import fs from 'fs';
import path from 'path';

function getPRTemplate(cwd: string): string | null {
  const locations = [
    path.join(cwd, '.github', 'PULL_REQUEST_TEMPLATE.md'),
    path.join(cwd, '.github', 'pull_request_template.md'),
    path.join(cwd, 'PULL_REQUEST_TEMPLATE.md'),
    path.join(cwd, 'pull_request_template.md'),
    path.join(cwd, 'docs', 'PULL_REQUEST_TEMPLATE.md'),
    path.join(cwd, 'docs', 'pull_request_template.md'),
    path.join(cwd, '.github', 'PULL_REQUEST_TEMPLATE', 'pull_request_template.md'),
  ];

  for (const loc of locations) {
    if (fs.existsSync(loc)) {
      return fs.readFileSync(loc, 'utf8');
    }
  }

  // Also check for template directory (take the first one found)
  const templateDirs = [
    path.join(cwd, '.github', 'PULL_REQUEST_TEMPLATE'),
    path.join(cwd, 'docs', 'PULL_REQUEST_TEMPLATE'),
  ];

  for (const templateDir of templateDirs) {
    if (fs.existsSync(templateDir) && fs.statSync(templateDir).isDirectory()) {
      const files = fs.readdirSync(templateDir);
      const mdFile = files.find((f) => f.toLowerCase().endsWith('.md'));
      if (mdFile) {
        return fs.readFileSync(path.join(templateDir, mdFile), 'utf8');
      }
    }
  }

  return null;
}

export function startSession(cwd: string, name: string, mainRepoPath?: string) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-T:]/g, '').slice(0, 12);
  const sessionId = `${timestamp}-${name.replace(/\s+/g, '-')}`;
  const dnaSessionsDir = path.join(cwd, '.dna', 'sessions');
  const sessionDir = path.join(dnaSessionsDir, sessionId);

  if (!fs.existsSync(dnaSessionsDir)) {
    fs.mkdirSync(dnaSessionsDir, { recursive: true });
  }

  if (mainRepoPath) {
    const absoluteMainPath = path.isAbsolute(mainRepoPath)
      ? mainRepoPath
      : path.resolve(cwd, mainRepoPath);

    const mainSessionDir = path.join(absoluteMainPath, '.dna', 'sessions', sessionId);

    // AI Safety Check: Ensure main session actually exists
    if (!fs.existsSync(mainSessionDir)) {
      throw new Error(
        `Main session folder not found at: ${mainSessionDir}. ` +
          `You MUST call start_session in the Main repository (${absoluteMainPath}) before initializing linked repositories.`,
      );
    }

    if (fs.existsSync(sessionDir)) {
      try {
        const stats = fs.lstatSync(sessionDir);
        if (stats.isSymbolicLink()) {
          fs.unlinkSync(sessionDir);
        } else {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        }
      } catch (e) {
        // Ignore
      }
    }

    try {
      fs.symlinkSync(mainSessionDir, sessionDir, 'dir');
      return {
        sessionId,
        logPath: `.dna/sessions/${sessionId}/`,
        mode: 'linked',
        mainPath: absoluteMainPath,
      };
    } catch (err: any) {
      throw new Error(`Failed to symlink to main session: ${err.message}`, { cause: err });
    }
  }

  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  const decisionsPath = path.join(sessionDir, 'decisions.md');
  const prPath = path.join(sessionDir, 'draft-pr.md');
  const manifestPath = path.join(sessionDir, 'session-manifest.v1.md');
  const discussionPath = path.join(sessionDir, 'discussion-log.v1.md');

  if (!fs.existsSync(decisionsPath)) {
    fs.writeFileSync(decisionsPath, `# DNA Session ADR: ${name}\n\n## Decisions\n- `);
  }

  if (!fs.existsSync(prPath)) {
    const template = getPRTemplate(cwd);
    let content = `# PR Description: ${name}\n\n`;
    if (template) {
      content += `> [!NOTE]\n> Using project PULL_REQUEST_TEMPLATE.md\n\n${template}`;
    } else {
      content += `## Summary\n\n## Validation Results\n- `;
    }
    fs.writeFileSync(prPath, content);
  }

  if (!fs.existsSync(discussionPath)) {
    const discussionContent = `# DNA Discussion Log: ${name}

## 💬 Conversation Journal
Capture key dialogue, user preferences, and the "why" behind changes that aren't captured in formal ADRs.

### Turn: ${timestamp}
- **Context**: Session initialized.
- **Key Points**: (Agent to summarize initial user request and constraints).
`;
    fs.writeFileSync(discussionPath, discussionContent);
  }

  if (!fs.existsSync(manifestPath)) {
    const manifestContent = `# DNA Session Manifest: ${name}
    
## 🧠 Context Handoff (Brain Dump)
This file preserves the agent's internal state. Update it before ending a turn.

### Current Status
- [ ] Research phase
- [ ] Strategy phase
- [ ] Execution phase

### 🔗 Session Assets
- **ADRs**: [decisions.md](./decisions.md)
- **Journal**: [discussion-log.v1.md](./discussion-log.v1.md)
- **PR Draft**: [draft-pr.md](./draft-pr.md)

### Key Findings & Logic
- (Summarize what you know so far)

### Pending Questions & Next Steps
- (What should the next agent or session focus on?)
`;
    fs.writeFileSync(manifestPath, manifestContent);
  }

  return {
    sessionId,
    logPath: `.dna/sessions/${sessionId}/`,
    mode: 'main',
  };
}

export function writeSessionDoc(cwd: string, sessionId: string, filename: string, content: string) {
  const sessionDir = path.join(cwd, '.dna', 'sessions', sessionId);
  if (!fs.existsSync(sessionDir)) {
    throw new Error(`DNA Session ${sessionId} not found.`);
  }

  const baseName = filename.endsWith('.md') ? filename.slice(0, -3) : filename;
  const files = fs.readdirSync(sessionDir);
  const escapedBase = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const versionRegex = new RegExp(`^${escapedBase}\\.v(\\d+)\\.md$`);
  let maxVersion = 0;

  files.forEach((f) => {
    const match = f.match(versionRegex);
    if (match) {
      const v = parseInt(match[1], 10);
      if (v > maxVersion) maxVersion = v;
    }
  });

  const nextVersion = maxVersion + 1;
  const newFilename = `${baseName}.v${nextVersion}.md`;
  const filePath = path.join(sessionDir, newFilename);

  fs.writeFileSync(filePath, content);

  return {
    filename: newFilename,
    path: `.dna/sessions/${sessionId}/${newFilename}`,
    version: nextVersion,
  };
}

export function cleanupSession(cwd: string, sessionId: string, keepLast: number = 3) {
  const sessionDir = path.join(cwd, '.dna', 'sessions', sessionId);
  if (!fs.existsSync(sessionDir)) {
    throw new Error(`DNA Session ${sessionId} not found.`);
  }

  const files = fs.readdirSync(sessionDir);
  const docGroups: Record<string, { name: string; version: number }[]> = {};

  files.forEach((f) => {
    const match = f.match(/^(.*)\.v(\d+)\.md$/);
    if (match) {
      const base = match[1];
      const version = parseInt(match[2], 10);
      if (!docGroups[base]) docGroups[base] = [];
      docGroups[base].push({ name: f, version });
    }
  });

  const deleted: string[] = [];
  Object.keys(docGroups).forEach((base) => {
    const group = docGroups[base].sort((a, b) => b.version - a.version);
    if (group.length > keepLast) {
      const toDelete = group.slice(keepLast);
      toDelete.forEach((file) => {
        fs.unlinkSync(path.join(sessionDir, file.name));
        deleted.push(file.name);
      });
    }
  });

  return {
    deleted,
    message:
      deleted.length > 0
        ? `Deleted ${deleted.length} old versions: ${deleted.join(', ')}`
        : 'No files needed cleanup.',
  };
}

export function recordDecision(cwd: string, sessionId: string, decision: string) {
  const sessionDir = path.join(cwd, '.dna', 'sessions', sessionId);
  const decisionsPath = path.join(sessionDir, 'decisions.md');

  if (!fs.existsSync(decisionsPath)) {
    throw new Error(`DNA Session ${sessionId} not found.`);
  }

  fs.appendFileSync(decisionsPath, `\n- ${decision}`);
  return `✅ Decision recorded in ${sessionId}`;
}
