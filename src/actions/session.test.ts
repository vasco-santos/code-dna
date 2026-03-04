import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { writeSessionDoc, cleanupSession } from './session';

vi.mock('fs');

describe('Session Actions', () => {
  const cwd = '/test/repo';
  const sessionId = '20260304-test';
  const sessionDir = path.join(cwd, '.dna', 'sessions', sessionId);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('writeSessionDoc', () => {
    it('should create v1 of a document if none exists', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([]);

      const result = writeSessionDoc(cwd, sessionId, 'plan.md', 'content');

      expect(result.version).toBe(1);
      expect(result.filename).toBe('plan.v1.md');
      expect(fs.writeFileSync).toHaveBeenCalledWith(path.join(sessionDir, 'plan.v1.md'), 'content');
    });

    it('should increment version correctly', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['plan.v1.md', 'plan.v2.md'] as any);

      const result = writeSessionDoc(cwd, sessionId, 'plan', 'new content');

      expect(result.version).toBe(3);
      expect(result.filename).toBe('plan.v3.md');
    });
  });

  describe('cleanupSession', () => {
    it('should delete old versions and keep requested count', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([
        'rfc.v1.md',
        'rfc.v2.md',
        'rfc.v3.md',
        'rfc.v4.md',
      ] as any);

      const result = cleanupSession(cwd, sessionId, 2);

      expect(result.deleted).toContain('rfc.v1.md');
      expect(result.deleted).toContain('rfc.v2.md');
      expect(fs.unlinkSync).toHaveBeenCalledTimes(2);
    });

    it('should do nothing if version count is below limit', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['rfc.v1.md', 'rfc.v2.md'] as any);

      const result = cleanupSession(cwd, sessionId, 3);

      expect(result.deleted.length).toBe(0);
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
  });
});
