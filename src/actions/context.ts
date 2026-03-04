import fs from 'fs';
import path from 'path';

export function initContext(cwd: string) {
  const contextDir = path.join(cwd, '.dna', 'context');
  if (!fs.existsSync(contextDir)) {
    fs.mkdirSync(contextDir, { recursive: true });
  }

  const results: string[] = [];
  const templates = {
    'architecture.md':
      '# Project Architecture\n\n## Overview\n\n## Main Entry Points\n\n## Key Dependencies\n',
    'idioms.md':
      '# Project Idioms & Patterns\n\n## Coding Style\n\n## Test Patterns\n\n## Naming Conventions\n',
    'devops.md': '# DevOps & CI/CD\n\n## Build Process\n\n## Deployment\n\n## Infrastructure\n',
  };

  for (const [filename, content] of Object.entries(templates)) {
    const filePath = path.join(contextDir, filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, content);
      results.push(`📝 Created .dna/context/${filename}`);
    } else {
      results.push(`ℹ️ .dna/context/${filename} already exists`);
    }
  }

  // Basic auto-discovery
  const archPath = path.join(contextDir, 'architecture.md');
  const idiomsPath = path.join(contextDir, 'idioms.md');
  const devopsPath = path.join(contextDir, 'devops.md');

  let archContent = fs.readFileSync(archPath, 'utf8');
  let idiomsContent = fs.readFileSync(idiomsPath, 'utf8');
  let devopsContent = fs.readFileSync(devopsPath, 'utf8');

  // 1. Language & Framework Detection
  if (fs.existsSync(path.join(cwd, 'package.json'))) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

      archContent += `\n### Auto-discovered (NPM)\n- Name: ${pkg.name}\n`;

      if (deps['express']) archContent += `- Framework: Express.js\n`;
      if (deps['fastify']) archContent += `- Framework: Fastify\n`;
      if (deps['next']) archContent += `- Framework: Next.js\n`;
      if (deps['prisma']) archContent += `- Database: Prisma ORM\n`;
      if (deps['mongoose']) archContent += `- Database: Mongoose (MongoDB)\n`;
      if (deps['typeorm']) archContent += `- Database: TypeORM\n`;

      if (deps['vitest']) idiomsContent += `\n### Auto-discovered\n- Test Runner: Vitest\n`;
      else if (deps['jest']) idiomsContent += `\n### Auto-discovered\n- Test Runner: Jest\n`;

      if (deps['eslint']) idiomsContent += `- Linter: ESLint\n`;
      if (deps['prettier']) idiomsContent += `- Formatter: Prettier\n`;

      archContent += `- Dependencies: ${Object.keys(pkg.dependencies || {}).join(', ')}\n`;
    } catch {
      // Ignore
    }
  }

  // 2. CI/CD Detection
  const githubWorkflows = path.join(cwd, '.github', 'workflows');
  if (fs.existsSync(githubWorkflows)) {
    const workflows = fs.readdirSync(githubWorkflows);
    if (workflows.length > 0) {
      devopsContent += `\n### Auto-discovered\n- CI/CD: GitHub Actions (${workflows.join(', ')})\n`;
    }
  }
  if (fs.existsSync(path.join(cwd, 'Dockerfile'))) {
    devopsContent += `- Containerization: Docker (Dockerfile found)\n`;
  }

  // 3. Write updates
  fs.writeFileSync(archPath, archContent);
  fs.writeFileSync(idiomsPath, idiomsContent);
  fs.writeFileSync(devopsPath, devopsContent);

  // 4. Generate AGENTS.md (README for AIs)
  const agentsPath = path.join(cwd, 'AGENTS.md');
  if (!fs.existsSync(agentsPath)) {
    const agentsContent = `# Resident Architect: Repository Guide

You are an AI Resident Architect in this repository. Follow the Code DNA standards symlinked in \`.dna/\`.

## 🏗️ Technical Stack
(Auto-populated by dna init_context)
- **Primary Language**: ${fs.existsSync(path.join(cwd, 'go.mod')) ? 'Go' : 'TypeScript/JavaScript'}
- **Architecture**: See \`.dna/context/architecture.md\`
- **Idioms**: See \`.dna/context/idioms.md\`

## 🛠️ Commands
- **Test**: \`npm test\` or \`go test ./...\`
- **Lint**: \`npm run lint\` or \`golangci-lint run\`

## 🧬 Engineering DNA
Maintain the session log in \`.dna/sessions/\` for every task. Before writing code, propose a strategy and record ADRs via \`dna session record\`.
`;
    fs.writeFileSync(agentsPath, agentsContent);
    results.push(`📝 Created AGENTS.md (AI Entry Point)`);
  }

  return results.join('\n');
}
