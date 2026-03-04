import fs from 'fs';
import path from 'path';

export const STANDARDS_ROOT = path.resolve(__dirname, '..', '..');
export const CORE_DIR = path.join(STANDARDS_ROOT, 'core');
export const SKILLS_DIR = path.join(STANDARDS_ROOT, 'skills');
export const TEMPLATES_DIR = path.join(STANDARDS_ROOT, 'templates');

/**
 * Initializes a repository with Global Engineering DNA.
 * This includes symlinking core standards and setting up entry points for AI agents.
 */
export function initRepo(cwd: string) {
  const results: string[] = [];
  const dnaDir = path.join(cwd, '.dna');
  const dnaSkillsDir = path.join(dnaDir, 'skills');

  if (!fs.existsSync(dnaDir)) {
    fs.mkdirSync(dnaDir);
  }
  if (!fs.existsSync(dnaSkillsDir)) {
    fs.mkdirSync(dnaSkillsDir);
  }

  // Helper to safely remove an existing file/link/dir before symlinking
  const forceClear = (target: string) => {
    try {
      const stats = fs.lstatSync(target);
      if (stats.isDirectory() && !stats.isSymbolicLink()) {
        fs.rmSync(target, { recursive: true, force: true });
      } else {
        fs.unlinkSync(target);
      }
    } catch {
      // Doesn't exist, ignore
    }
  };

  // 1. Symlink Core files
  if (fs.existsSync(CORE_DIR)) {
    const coreFiles = fs.readdirSync(CORE_DIR);
    coreFiles.forEach((file) => {
      const src = path.join(CORE_DIR, file);
      const dest = path.join(dnaDir, file);

      forceClear(dest);

      try {
        fs.symlinkSync(src, dest);
        results.push(`🔗 Symlinked core/${file}`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        results.push(`❌ Failed to symlink core/${file}: ${message}`);
      }
    });
  }

  // 2. Symlink Skill directories
  if (fs.existsSync(SKILLS_DIR)) {
    const skills = fs.readdirSync(SKILLS_DIR);
    skills.forEach((skill) => {
      const src = path.join(SKILLS_DIR, skill);
      const dest = path.join(dnaSkillsDir, skill);
      if (skill.startsWith('.')) return;

      forceClear(dest);

      try {
        fs.symlinkSync(src, dest);
        results.push(`🔗 Symlinked skills/${skill}`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        results.push(`❌ Failed to symlink skills/${skill}: ${message}`);
      }
    });
  }

  // 3. Create Entry Points for AI Tools
  const getTemplate = (name: string) => {
    const p = path.join(TEMPLATES_DIR, `${name}.md.template`);
    return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
  };

  const residentArchitect = getTemplate('RESIDENT_ARCHITECT') || '# Resident Architect Template Not Found';
  const copilotContent = getTemplate('COPILOT') || residentArchitect;
  const cursorContent = getTemplate('CURSOR') || residentArchitect;
  const windsurfContent = getTemplate('WINDSURF') || residentArchitect;
  const codexContent = getTemplate('CODEX') || residentArchitect;
  const claudeContent = getTemplate('CLAUDE') || residentArchitect;

  // Gemini CLI Entry Point
  fs.writeFileSync(path.join(cwd, 'GEMINI.md'), residentArchitect);
  results.push('📄 Updated GEMINI.md');

  // GitHub Copilot Entry Point
  const copilotDir = path.join(cwd, '.github');
  if (!fs.existsSync(copilotDir)) fs.mkdirSync(copilotDir);
  fs.writeFileSync(path.join(copilotDir, 'copilot-instructions.md'), copilotContent);
  results.push('🐙 Updated .github/copilot-instructions.md');

  // Cursor Entry Point
  fs.writeFileSync(path.join(cwd, '.cursorrules'), cursorContent);
  results.push('🖱️ Updated .cursorrules');

  // Windsurf Entry Point
  fs.writeFileSync(path.join(cwd, '.windsurfrules'), windsurfContent);
  results.push('🏄 Updated .windsurfrules');

  // Codex Entry Point
  fs.writeFileSync(path.join(cwd, '.codexrules'), codexContent);
  results.push('📜 Updated .codexrules');

  // Claude Code Entry Point
  fs.writeFileSync(path.join(cwd, 'CLAUDE.md'), claudeContent);
  results.push('🤖 Updated CLAUDE.md');

  // 4. Git Hygiene: Add to .git/info/exclude
  const gitExclude = path.join(cwd, '.git', 'info', 'exclude');
  if (fs.existsSync(gitExclude)) {
    const content = fs.readFileSync(gitExclude, 'utf8');
    const linesToAdd = [
      '.dna/',
      'GEMINI.md',
      '.github/copilot-instructions.md',
      '.cursorrules',
      '.windsurfrules',
      '.codexrules',
      'CLAUDE.md',
      'AGENTS.md',
    ];

    let updatedContent = content;
    if (updatedContent.length > 0 && !updatedContent.endsWith('\n')) {
      updatedContent += '\n';
    }

    let added = false;
    linesToAdd.forEach((line) => {
      const escapedLine = line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`^${escapedLine}$`, 'm');

      if (!regex.test(updatedContent)) {
        updatedContent += `${line}\n`;
        added = true;
      }
    });

    if (added) {
      fs.writeFileSync(gitExclude, updatedContent);
      results.push('🛡️ Added Code DNA files to .git/info/exclude');
    }
  }

  return results.join('\n');
}
