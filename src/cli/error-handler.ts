import chalk from 'chalk';
import { displayError } from './banner.js';

/**
 * Global error handler for the CLI
 */
export function handleError(error: unknown): void {
    if (error instanceof Error) {
        displayError(`Error: ${error.message}`);

        // Show stack trace in debug mode
        if (process.env.DEBUG) {
            console.log(chalk.gray('\nStack trace:'));
            console.log(chalk.gray(error.stack));
        }
    } else {
        displayError(`An unknown error occurred: ${String(error)}`);
    }

    console.log(chalk.gray('\n💡 Tip: Run with DEBUG=true for more details\n'));
}

/**
 * Setup global error handlers for graceful shutdown
 */
export function setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        console.error(chalk.red('\n✗ Unhandled Promise Rejection:'));
        console.error(chalk.red(reason));

        if (process.env.DEBUG) {
            console.error(chalk.gray('\nPromise:'), promise);
        }

        process.exit(1);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        console.error(chalk.red('\n✗ Uncaught Exception:'));
        console.error(chalk.red(error.message));

        if (process.env.DEBUG) {
            console.error(chalk.gray('\nStack:'), error.stack);
        }

        process.exit(1);
    });

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
        console.log(chalk.yellow('\n\n⚠️  Process interrupted by user'));
        console.log(chalk.gray('Exiting gracefully...\n'));
        process.exit(0);
    });

    // Handle SIGTERM
    process.on('SIGTERM', () => {
        console.log(chalk.yellow('\n\n⚠️  Process terminated'));
        console.log(chalk.gray('Exiting gracefully...\n'));
        process.exit(0);
    });
}

/**
 * Validate required environment variables
 */
export function validateEnvironment(required: string[]): void {
    const missing = required.filter(env => !process.env[env]);

    if (missing.length > 0) {
        displayError(`Missing required environment variables: ${missing.join(', ')}`);
        console.log(chalk.gray('\n💡 Create a .env file with the required variables\n'));
        process.exit(1);
    }
}
