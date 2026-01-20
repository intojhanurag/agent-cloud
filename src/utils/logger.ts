import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

/**
 * Logger Class
 * Production-grade logging system with file output and log levels
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    metadata?: Record<string, any>;
    error?: Error;
}

export class Logger {
    private logDir: string;
    private logFile: string;
    private sessionId: string;
    private minLevel: LogLevel;

    private levelPriority: Record<LogLevel, number> = {
        debug: 0,
        info: 1,
        success: 2,
        warn: 3,
        error: 4,
    };

    constructor(options: {
        logDir?: string;
        minLevel?: LogLevel;
        sessionId?: string;
    } = {}) {
        this.logDir = options.logDir || path.join(process.cwd(), '.agent-cloud', 'logs');
        this.sessionId = options.sessionId || Date.now().toString();
        this.minLevel = options.minLevel || 'info';
        this.logFile = path.join(this.logDir, `deployment-${this.sessionId}.log`);

        // Ensure log directory exists
        this.ensureLogDir();
    }

    private ensureLogDir(): void {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    private shouldLog(level: LogLevel): boolean {
        return this.levelPriority[level] >= this.levelPriority[this.minLevel];
    }

    private formatMessage(level: LogLevel, message: string): string {
        const timestamp = new Date().toISOString();
        const levelStr = level.toUpperCase().padEnd(7);
        return `[${timestamp}] ${levelStr} ${message}`;
    }

    private writeToFile(entry: LogEntry): void {
        try {
            const logLine = JSON.stringify(entry) + '\n';
            fs.appendFileSync(this.logFile, logLine, 'utf-8');
        } catch (error) {
            // Silent fail to avoid infinite loops
            console.error('Failed to write to log file:', error);
        }
    }

    private log(level: LogLevel, message: string, metadata?: Record<string, any>, error?: Error): void {
        if (!this.shouldLog(level)) {
            return;
        }

        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            metadata,
            error: error ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
            } as any : undefined,
        };

        // Write to file
        this.writeToFile(entry);

        // Console output with colors
        const formattedMsg = this.formatMessage(level, message);

        switch (level) {
            case 'debug':
                console.log(chalk.gray(formattedMsg));
                break;
            case 'info':
                console.log(chalk.cyan(formattedMsg));
                break;
            case 'success':
                console.log(chalk.green(formattedMsg));
                break;
            case 'warn':
                console.log(chalk.yellow(formattedMsg));
                break;
            case 'error':
                console.log(chalk.red(formattedMsg));
                if (error?.stack) {
                    console.log(chalk.red(error.stack));
                }
                break;
        }

        // Print metadata if present
        if (metadata && Object.keys(metadata).length > 0) {
            console.log(chalk.gray(`  Metadata: ${JSON.stringify(metadata, null, 2)}`));
        }
    }

    debug(message: string, metadata?: Record<string, any>): void {
        this.log('debug', message, metadata);
    }

    info(message: string, metadata?: Record<string, any>): void {
        this.log('info', message, metadata);
    }

    success(message: string, metadata?: Record<string, any>): void {
        this.log('success', message, metadata);
    }

    warn(message: string, metadata?: Record<string, any>): void {
        this.log('warn', message, metadata);
    }

    error(message: string, error?: Error, metadata?: Record<string, any>): void {
        this.log('error', message, metadata, error);
    }

    /**
     * Get log file path for current session
     */
    getLogFile(): string {
        return this.logFile;
    }

    /**
     * Get all log entries from current session
     */
    getLogEntries(): LogEntry[] {
        try {
            if (!fs.existsSync(this.logFile)) {
                return [];
            }

            const content = fs.readFileSync(this.logFile, 'utf-8');
            return content
                .split('\n')
                .filter(line => line.trim())
                .map(line => JSON.parse(line));
        } catch (error) {
            console.error('Failed to read log file:', error);
            return [];
        }
    }

    /**
     * Clear old log files (keep last N days)
     */
    static cleanupOldLogs(logDir: string, keepDays: number = 7): void {
        try {
            if (!fs.existsSync(logDir)) {
                return;
            }

            const now = Date.now();
            const maxAge = keepDays * 24 * 60 * 60 * 1000;

            const files = fs.readdirSync(logDir);
            files.forEach(file => {
                const filePath = path.join(logDir, file);
                const stats = fs.statSync(filePath);

                if (now - stats.mtime.getTime() > maxAge) {
                    fs.unlinkSync(filePath);
                    console.log(`Deleted old log file: ${file}`);
                }
            });
        } catch (error) {
            console.error('Failed to cleanup old logs:', error);
        }
    }
}

/**
 * Global logger instance
 */
let globalLogger: Logger | null = null;

export function getLogger(): Logger {
    if (!globalLogger) {
        globalLogger = new Logger({
            minLevel: process.env.LOG_LEVEL as LogLevel || 'info',
        });
    }
    return globalLogger;
}

/**
 * Reset logger (useful for testing)
 */
export function resetLogger(): void {
    globalLogger = null;
}
