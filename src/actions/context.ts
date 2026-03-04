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
  let archContent = fs.readFileSync(archPath, 'utf8');

  if (fs.existsSync(path.join(cwd, 'package.json'))) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
      archContent += `\n### Auto-discovered (NPM)\n- Name: ${
        pkg.name
      }\n- Dependencies: ${Object.keys(pkg.dependencies || {}).join(', ')}\n`;
    } catch {
      // Ignore parsing errors
    }
  }

  if (fs.existsSync(path.join(cwd, 'go.mod'))) {
    const mod = fs.readFileSync(path.join(cwd, 'go.mod'), 'utf8');
    const match = mod.match(/module\s+(.*)/);
    if (match) {
      archContent += `\n### Auto-discovered (Go)\n- Module: ${match[1]}\n`;
    }
  }

  fs.writeFileSync(archPath, archContent);

  return results.join('\n');
}
