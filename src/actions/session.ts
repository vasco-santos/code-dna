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

  // Final Fallback: Internal Code DNA Template
  const internalTemplate = path.join(
    __dirname,
    '..',
    '..',
    'templates',
    'PULL_REQUEST_TEMPLATE.md',
  );
  if (fs.existsSync(internalTemplate)) {
    return fs.readFileSync(internalTemplate, 'utf8');
  }

  return null;
}

export function startSession(
  cwd: string,
  name: string,
  mainRepoPath?: string,
  metadata?: { tool?: string; externalId?: string },
) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-T:]/g, '').slice(0, 12);
  const sessionId = `${timestamp}-${name.replace(/\s+/g, '-')}`;

  // Load package.json for versioning
  let dnaVersion = 'unknown';
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8'),
    );
    dnaVersion = pkg.version;
  } catch {
    // Ignore
  }

  const dnaDir = path.join(cwd, '.dna');
  const dnaSessionsDir = path.join(dnaDir, 'sessions');

  if (!fs.existsSync(dnaSessionsDir)) {
    fs.mkdirSync(dnaSessionsDir, { recursive: true });
  }

  // Persistent active session marker (hidden)
  fs.writeFileSync(path.join(dnaDir, '.session'), sessionId);

  let targetSessionDir = path.join(dnaSessionsDir, sessionId);
  let mode: 'main' | 'linked' = 'main';
  let absoluteMainPath: string | undefined;

  if (mainRepoPath) {
    absoluteMainPath = path.isAbsolute(mainRepoPath)
      ? mainRepoPath
      : path.resolve(cwd, mainRepoPath);

    const mainDnaSessionsDir = path.join(absoluteMainPath, '.dna', 'sessions');
    const mainSessionDir = path.join(mainDnaSessionsDir, sessionId);

    if (!fs.existsSync(mainDnaSessionsDir)) {
      fs.mkdirSync(mainDnaSessionsDir, { recursive: true });
    }

    if (!fs.existsSync(mainSessionDir)) {
      fs.mkdirSync(mainSessionDir, { recursive: true });
    }

    // Symlink current repo's session dir to the main repo's session dir
    if (fs.existsSync(targetSessionDir)) {
      try {
        const stats = fs.lstatSync(targetSessionDir);
        if (stats.isSymbolicLink()) {
          fs.unlinkSync(targetSessionDir);
        } else {
          fs.rmSync(targetSessionDir, { recursive: true, force: true });
        }
      } catch {
        // Ignore
      }
    }

    try {
      // If targetSessionDir is already inside a symlinked .dna, we might be creating a link to itself
      // Resolve absolute physical paths to compare
      const realTargetParent = fs.realpathSync(dnaSessionsDir);
      const realMainParent = fs.realpathSync(mainDnaSessionsDir);

      if (realTargetParent !== realMainParent) {
        fs.symlinkSync(mainSessionDir, targetSessionDir, 'dir');
        mode = 'linked';
      } else {
        // We are already in the main repo's DNA (likely via a .dna symlink)
        mode = 'main';
      }
      targetSessionDir = mainSessionDir; // All subsequent writes go to the actual folder
    } catch (err: any) {
      throw new Error(`Failed to symlink to main session: ${err.message}`, { cause: err });
    }
  }

  // Ensure the physical session directory exists before writing files
  if (!fs.existsSync(targetSessionDir)) {
    fs.mkdirSync(targetSessionDir, { recursive: true });
  }

  const decisionsPath = path.join(targetSessionDir, 'decisions.md');
  const prPath = path.join(targetSessionDir, 'draft-pr.md');
  const manifestPath = path.join(targetSessionDir, 'session-manifest.v1.md');
  const discussionPath = path.join(targetSessionDir, 'discussion-log.v1.md');
  const metadataPath = path.join(targetSessionDir, 'metadata.json');

  const sessionMetadata = {
    sessionId,
    dnaVersion,
    startedAt: now.toISOString(),
    tool: metadata?.tool || 'dna-cli',
    externalId: metadata?.externalId,
  };

  fs.writeFileSync(metadataPath, JSON.stringify(sessionMetadata, null, 2));

  if (!fs.existsSync(decisionsPath)) {
    fs.writeFileSync(decisionsPath, `# DNA Session ADR: ${name}\n\n## Decisions\n- `);
  }

  if (!fs.existsSync(prPath)) {
    const template = getPRTemplate(cwd);
    let content = template || `## Summary\n\n## Validation Results\n- `;

    // Inject metadata into template
    content = content.replace(/\[SESSION_ID\]/g, sessionId);
    content = content.replace(/\[DNA_VERSION\]/g, dnaVersion);

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
    mode,
    mainPath: absoluteMainPath,
  };
}


export function listSessions(cwd: string) {
  const sessionsDir = path.join(cwd, '.dna', 'sessions');
  if (!fs.existsSync(sessionsDir)) return [];

  const sessions = fs.readdirSync(sessionsDir);
  const activeSessionId = getActiveSessionId(cwd);

  return sessions
    .filter((s) => fs.statSync(path.join(sessionsDir, s)).isDirectory())
    .map((id) => {
      const metadataPath = path.join(sessionsDir, id, 'metadata.json');
      let name = id;
      let startedAt = '';

      if (fs.existsSync(metadataPath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          startedAt = meta.startedAt;
          // Extract name from ID (timestamp-name)
          const parts = id.split('-');
          if (parts.length > 1) name = parts.slice(1).join('-');
        } catch {
          // Ignore
        }
      }

      return {
        id,
        name,
        startedAt,
        isActive: id === activeSessionId,
      };
    })
    .sort((a, b) => b.id.localeCompare(a.id));
}

export function getActiveSessionId(cwd: string): string | null {
  const activePath = path.join(cwd, '.dna', '.session');
  if (fs.existsSync(activePath)) {
    return fs.readFileSync(activePath, 'utf8').trim();
  }
  return null;
}

export function switchSession(cwd: string, sessionId: string) {
  const sessionDir = path.join(cwd, '.dna', 'sessions', sessionId);
  if (!fs.existsSync(sessionDir)) {
    throw new Error(`Session ${sessionId} not found.`);
  }
  fs.writeFileSync(path.join(cwd, '.dna', '.session'), sessionId);
  return `✅ Switched to session: ${sessionId}`;
}

export function getSessionStatus(cwd: string, sessionId?: string) {
  const id = sessionId || getActiveSessionId(cwd);
  if (!id) throw new Error('No active session found. Provide an ID or start one.');

  const sessionDir = path.join(cwd, '.dna', 'sessions', id);
  if (!fs.existsSync(sessionDir)) throw new Error(`Session ${id} not found.`);

  const manifestPath = path.join(sessionDir, 'session-manifest.v1.md');
  const decisionsPath = path.join(sessionDir, 'decisions.md');
  const metadataPath = path.join(sessionDir, 'metadata.json');

  const manifest = fs.existsSync(manifestPath)
    ? fs.readFileSync(manifestPath, 'utf8')
    : 'No manifest found.';
  const decisions = fs.existsSync(decisionsPath)
    ? fs.readFileSync(decisionsPath, 'utf8')
    : 'No decisions recorded.';
  const metadata = fs.existsSync(metadataPath)
    ? JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
    : {};

  return {
    id,
    metadata,
    manifestSummary: manifest.split('\n').slice(0, 15).join('\n'), // First 15 lines
    decisionCount: (decisions.match(/^- /gm) || []).length,
  };
}

export function writeSessionDoc(
  cwd: string,
  sessionId: string | undefined,
  filename: string,
  content: string,
) {
  const id = sessionId || getActiveSessionId(cwd);
  if (!id) throw new Error('No session ID provided and no active session found.');

  const sessionDir = path.join(cwd, '.dna', 'sessions', id);
  if (!fs.existsSync(sessionDir)) {
    throw new Error(`DNA Session ${id} not found.`);
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
    path: `.dna/sessions/${id}/${newFilename}`,
    version: nextVersion,
  };
}

export function cleanupSession(cwd: string, sessionId: string | undefined, keepLast: number = 3) {
  const id = sessionId || getActiveSessionId(cwd);
  if (!id) throw new Error('No active session found.');

  const sessionDir = path.join(cwd, '.dna', 'sessions', id);
  if (!fs.existsSync(sessionDir)) {
    throw new Error(`DNA Session ${id} not found.`);
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

export function recordDecision(cwd: string, sessionId: string | undefined, decision: string) {
  const id = sessionId || getActiveSessionId(cwd);
  if (!id) throw new Error('No active session found.');

  const sessionDir = path.join(cwd, '.dna', 'sessions', id);
  const decisionsPath = path.join(sessionDir, 'decisions.md');

  if (!fs.existsSync(decisionsPath)) {
    throw new Error(`DNA Session ${id} not found.`);
  }

  fs.appendFileSync(decisionsPath, `\n- ${decision}`);
  return `✅ Decision recorded in ${id}`;
}

export function saveSession(cwd: string, sessionId: string | undefined, brainDump: string) {
  const id = sessionId || getActiveSessionId(cwd);
  if (!id) throw new Error('No active session found.');

  const sessionDir = path.join(cwd, '.dna', 'sessions', id);
  if (!fs.existsSync(sessionDir)) {
    throw new Error(`DNA Session ${id} not found.`);
  }

  const metadataPath = path.join(sessionDir, 'metadata.json');
  const decisionsPath = path.join(sessionDir, 'decisions.md');
  const metadata = fs.existsSync(metadataPath)
    ? JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
    : {};
  const decisions = fs.existsSync(decisionsPath) ? fs.readFileSync(decisionsPath, 'utf8') : '';

  const handoffContent = `# DNA Session Handoff: ${id}

## 📊 Session Status
- **Tool**: ${metadata.tool || 'unknown'}
- **External ID**: ${metadata.externalId || 'none'}
- **DNA Version**: ${metadata.dnaVersion || 'unknown'}
- **Last Updated**: ${new Date().toISOString()}

## 🧠 Brain Dump (Current Context)
${brainDump}

## 🏗️ Decisions Recorded
${decisions}

## 🚀 How to Resume
1. Start a new AI chat window.
2. Run \`dna session switch ${id}\`.
3. Read this handoff file: \`.dna/sessions/${id}/handoff.vX.md\`.
4. **CRITICAL**: Before starting work, the AI MUST ask the user 2-3 targeted questions to clarify any ambiguities in this handoff and confirm understanding of the next immediate steps.
`;

  const doc = writeSessionDoc(cwd, id, 'handoff', handoffContent);
  return {
    message: `✅ Session ${id} saved. Handoff document created: ${doc.filename}`,
    handoffPath: doc.path,
  };
}

export function resumeSession(cwd: string, sessionId: string | undefined) {
  const id = sessionId || getActiveSessionId(cwd);
  if (!id) throw new Error('No active session found.');

  const sessionDir = path.join(cwd, '.dna', 'sessions', id);
  if (!fs.existsSync(sessionDir)) {
    throw new Error(`DNA Session ${id} not found.`);
  }

  // Switch to this session if it's not the active one
  const activeId = getActiveSessionId(cwd);
  if (id !== activeId) {
    switchSession(cwd, id);
  }

  const files = fs.readdirSync(sessionDir);

  const getLatestFile = (baseName: string) => {
    const escapedBase = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const versionRegex = new RegExp(`^${escapedBase}\\.v(\\d+)\\.md$`);
    let maxVersion = 0;
    let latestFile = '';

    files.forEach((f) => {
      const match = f.match(versionRegex);
      if (match) {
        const v = parseInt(match[1], 10);
        if (v > maxVersion) {
          maxVersion = v;
          latestFile = f;
        }
      }
    });

    return latestFile;
  };

  const handoffFile = getLatestFile('handoff');
  const manifestFile = getLatestFile('session-manifest');
  const decisionsFile = 'decisions.md';

  const handoff = handoffFile
    ? fs.readFileSync(path.join(sessionDir, handoffFile), 'utf8')
    : 'No handoff file found.';
  const manifest = manifestFile
    ? fs.readFileSync(path.join(sessionDir, manifestFile), 'utf8')
    : 'No manifest found.';
  const decisions = fs.existsSync(path.join(sessionDir, decisionsFile))
    ? fs.readFileSync(path.join(sessionDir, decisionsFile), 'utf8')
    : 'No decisions found.';

  return {
    id,
    handoff,
    manifest,
    decisions,
    message: `🔄 Resuming session: ${id}. 

### 🛑 Mandatory Resumption Protocol
1. **Analyze the Context**: Read the Handoff, Manifest, and Decisions provided below.
2. **Clarify Ambiguity**: Before executing any tools or modifying code, you MUST ask the user 2-3 specific questions to confirm your understanding of the current state and the goal of the next task.
3. **Wait for Confirmation**: Proceed only after the user has validated your understanding.`,
  };
}
