import { describe, it, expect } from 'vitest';
import { shellEscape, sanitizeResourceName, sanitizePath } from '../shell.js';

describe('shellEscape', () => {
    it('wraps simple strings in single quotes', () => {
        expect(shellEscape('hello')).toBe("'hello'");
    });

    it('escapes embedded single quotes', () => {
        expect(shellEscape("it's")).toBe("'it'\\''s'");
    });

    it('removes null bytes', () => {
        expect(shellEscape('hello\0world')).toBe("'helloworld'");
    });

    it('handles empty string', () => {
        expect(shellEscape('')).toBe("''");
    });

    it('returns empty quotes for non-string input', () => {
        expect(shellEscape(undefined as any)).toBe("''");
        expect(shellEscape(null as any)).toBe("''");
    });

    it('preserves spaces and special chars inside quotes', () => {
        expect(shellEscape('hello world')).toBe("'hello world'");
        expect(shellEscape('a&b')).toBe("'a&b'");
    });
});

describe('shellEscape - injection vectors', () => {
    it('neutralizes semicolon injection', () => {
        const result = shellEscape('; rm -rf /');
        expect(result).toBe("'; rm -rf /'");
        // Inside single quotes, ; is literal
    });

    it('neutralizes backtick injection', () => {
        const result = shellEscape('`whoami`');
        expect(result).toBe("'`whoami`'");
    });

    it('neutralizes $() injection', () => {
        const result = shellEscape('$(cat /etc/passwd)');
        expect(result).toBe("'$(cat /etc/passwd)'");
    });

    it('neutralizes newline injection', () => {
        const result = shellEscape('hello\nrm -rf /');
        expect(result).toBe("'hello\nrm -rf /'");
    });

    it('neutralizes pipe injection', () => {
        const result = shellEscape('| cat /etc/passwd');
        expect(result).toBe("'| cat /etc/passwd'");
    });
});

describe('sanitizeResourceName', () => {
    it('lowercases and replaces invalid chars', () => {
        expect(sanitizeResourceName('My App!')).toBe('my-app');
    });

    it('collapses multiple hyphens', () => {
        expect(sanitizeResourceName('my--app')).toBe('my-app');
    });

    it('trims leading/trailing hyphens', () => {
        expect(sanitizeResourceName('-my-app-')).toBe('my-app');
    });

    it('truncates to 63 characters', () => {
        const long = 'a'.repeat(100);
        expect(sanitizeResourceName(long).length).toBeLessThanOrEqual(63);
    });
});

describe('sanitizePath', () => {
    it('resolves relative paths within base', () => {
        const result = sanitizePath('subdir/file.txt', '/home/user/project');
        expect(result).toBe('/home/user/project/subdir/file.txt');
    });

    it('throws on directory traversal', () => {
        expect(() => sanitizePath('../../etc/passwd', '/home/user/project')).toThrow('Path traversal detected');
    });

    it('throws on sneaky traversal with ..././', () => {
        expect(() => sanitizePath('../../../etc/passwd', '/home/user/project')).toThrow('Path traversal detected');
    });

    it('removes null bytes', () => {
        const result = sanitizePath('file\0.txt', '/home/user/project');
        expect(result).toBe('/home/user/project/file.txt');
    });

    it('allows absolute paths within base', () => {
        const result = sanitizePath('/home/user/project/file.txt', '/home/user/project');
        expect(result).toBe('/home/user/project/file.txt');
    });

    it('throws on absolute path outside base', () => {
        expect(() => sanitizePath('/etc/passwd', '/home/user/project')).toThrow('Path traversal detected');
    });
});
