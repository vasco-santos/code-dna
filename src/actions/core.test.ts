import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { updateGitHygiene } from './core';

describe('updateGitHygiene', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dna-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should create .gitignore if it does not exist', () => {
    updateGitHygiene(tmpDir);
    const gitIgnorePath = path.join(tmpDir, '.gitignore');
    expect(fs.existsSync(gitIgnorePath)).toBe(true);
    const content = fs.readFileSync(gitIgnorePath, 'utf8');
    expect(content).toContain('.dna/');
    expect(content).toContain('AGENTS.md');
  });

  it('should update existing .gitignore', () => {
    const gitIgnorePath = path.join(tmpDir, '.gitignore');
    fs.writeFileSync(gitIgnorePath, 'node_modules/\n');
    updateGitHygiene(tmpDir);
    const content = fs.readFileSync(gitIgnorePath, 'utf8');
    expect(content).toContain('node_modules/');
    expect(content).toContain('.dna/');
    expect(content).toContain('AGENTS.md');
  });

  it('should find and update .git/info/exclude in parent directory', () => {
    const subDir = path.join(tmpDir, 'sub', 'dir');
    fs.mkdirSync(subDir, { recursive: true });

    const gitInfoDir = path.join(tmpDir, '.git', 'info');
    fs.mkdirSync(gitInfoDir, { recursive: true });
    const excludePath = path.join(gitInfoDir, 'exclude');
    fs.writeFileSync(excludePath, '# initial\n');

    updateGitHygiene(subDir);

    // Should have created .gitignore in subDir
    expect(fs.existsSync(path.join(subDir, '.gitignore'))).toBe(true);

    // Should have updated .git/info/exclude in root
    const excludeContent = fs.readFileSync(excludePath, 'utf8');
    expect(excludeContent).toContain('.dna/');
    expect(excludeContent).toContain('AGENTS.md');
  });
});
