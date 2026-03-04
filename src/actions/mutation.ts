import fs from 'fs';
import path from 'path';
import { getActiveSessionId } from './session';

export function proposeMutation(cwd: string, title: string, rationale: string, sessionId?: string) {
  const id = sessionId || getActiveSessionId(cwd);
  if (!id) throw new Error('No active session found.');

  const mutationsDir = path.join(cwd, '.dna', 'mutations', 'pending');
  if (!fs.existsSync(mutationsDir)) {
    fs.mkdirSync(mutationsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[-T:]/g, '').slice(0, 12);
  const mutationId = `${timestamp}-${title.toLowerCase().replace(/\s+/g, '-')}`;
  const mutationPath = path.join(mutationsDir, `${mutationId}.md`);

  const content = `# DNA Mutation Proposal: ${title}

- **Session ID**: ${id}
- **Proposed At**: ${new Date().toISOString()}
- **Rationale**: ${rationale}

## 📝 Description
(Agent: Describe the pattern improvement here)

## 🏗️ Affected Strands
(e.g., core/typescript-master.md)

## 🏁 Verification
(How was this validated in the local project?)
`;

  fs.writeFileSync(mutationPath, content);

  return {
    mutationId,
    path: `.dna/mutations/pending/${mutationId}.md`,
    message: `💡 Mutation proposed and added to queue: ${mutationId}\n📍 File: .dna/mutations/pending/${mutationId}.md\n⚠️ Note: This is a local proposal. Use a DNA Evolution Session to merge into the Global Hub.`,
  };
}
