import chalk from 'chalk';
import { displayError } from './banner.js';

/**
 * Global error handler for the CLI
 * Every error tells the user what to do next
 */
export function handleError(error: unknown): void {
    if (error instanceof Error) {
        const msg = error.message;

        // Provide actionable guidance based on error type
        if (msg.includes('API') || msg.includes('key') || msg.includes('GOOGLE_GENERATIVE_AI_API_KEY')) {
            displayError('AI API key not configured');
            console.log(chalk.yellow('  Fix: Run ') + chalk.bold('cloud-agent init') + chalk.yellow(' to set up your API key'));
            console.log(chalk.gray('  Or get a free key at https://aistudio.google.com/app/apikey'));
        } else if (msg.includes('ENOENT') || msg.includes('not found')) {
            displayError(msg);
            console.log(chalk.yellow('  A required file or command was not found.'));
        } else if (msg.includes('EACCES') || msg.includes('permission')) {
            displayError(msg);
            console.log(chalk.yellow('  Permission denied. Try running with appropriate permissions.'));
        } else if (msg.includes('ECONNREFUSED') || msg.includes('network') || msg.includes('fetch')) {
            displayError(msg);
            console.log(chalk.yellow('  Network error. Check your internet connection.'));
        } else {
            displayError(msg);
        }

        if (process.env.DEBUG === 'true') {
            console.log(chalk.gray('\n  Stack trace:'));
            console.log(chalk.gray(`  ${error.stack}`));
        }
    } else {
        displayError(String(error));
    }

    console.log(chalk.gray('\n  Tip: Set DEBUG=true for detailed error info\n'));
}

/**
 * Setup global error handlers for graceful shutdown
 */
export function setupGlobalErrorHandlers(): void {
    process.on('unhandledRejection', (reason) => {
        if (reason instanceof Error) {
            handleError(reason);
        } else {
            console.error(chalk.red('\n  Unexpected error: ') + String(reason));
        }
        process.exit(1);
    });

    process.on('uncaughtException', (error) => {
        handleError(error);
        process.exit(1);
    });

    process.on('SIGINT', () => {
        console.log(chalk.yellow('\n  Interrupted. Exiting...\n'));
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        process.exit(0);
    });
}

/**
 * Validate required environment variables
 */
export function validateEnvironment(required: string[]): void {
    const missing = required.filter(env => !process.env[env]);

    if (missing.length > 0) {
        displayError(`Missing: ${missing.join(', ')}`);
        console.log(chalk.yellow('  Run ') + chalk.bold('cloud-agent init') + chalk.yellow(' to configure.\n'));
        process.exit(1);
    }
}
