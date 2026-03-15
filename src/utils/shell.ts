import path from 'path';

/**
 * Shell input sanitization utilities
 * Prevents command injection in exec() calls
 */

/**
 * Escape a string for safe use in shell commands.
 * Wraps in single quotes with proper escaping of embedded single quotes.
 */
export function shellEscape(str: string): string {
    if (typeof str !== 'string') return "''";
    // Remove null bytes
    str = str.replace(/\0/g, '');
    // Single-quote wrapping: replace ' with '\''
    return "'" + str.replace(/'/g, "'\\''") + "'";
}

/**
 * Validate and sanitize a resource name for cloud services
 * Cloud resource names typically allow: lowercase alphanumeric, hyphens
 */
export function sanitizeResourceName(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 63);
}

/**
 * Validate a file path is safe (no directory traversal).
 * Resolves the path and ensures it stays within the allowed base directory.
 */
export function sanitizePath(filePath: string, basePath?: string): string {
    // Remove null bytes
    const cleaned = filePath.replace(/\0/g, '');
    const base = basePath || process.cwd();
    const resolved = path.resolve(base, cleaned);

    if (!resolved.startsWith(path.resolve(base))) {
        throw new Error(`Path traversal detected: "${filePath}" escapes base directory "${base}"`);
    }

    return resolved;
}
