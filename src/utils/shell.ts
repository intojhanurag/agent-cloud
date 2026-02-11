/**
 * Shell input sanitization utilities
 * Prevents command injection in exec() calls
 */

/**
 * Escape a string for safe use in shell commands
 * Removes or escapes characters that could be used for injection
 */
export function shellEscape(str: string): string {
    // Remove any null bytes
    str = str.replace(/\0/g, '');

    // Only allow alphanumeric, hyphens, underscores, dots, forward slashes, and spaces
    // Replace everything else
    return str.replace(/[^a-zA-Z0-9\-_.\/\s]/g, '');
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
        .substring(0, 63); // Most cloud providers limit to 63 chars
}

/**
 * Validate a file path is safe (no directory traversal, etc.)
 */
export function sanitizePath(filePath: string): string {
    // Remove null bytes and normalize
    return filePath
        .replace(/\0/g, '')
        .replace(/\.\.\//g, '')
        .replace(/\.\.\\/g, '');
}
