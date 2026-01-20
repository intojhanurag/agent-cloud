#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { displayBanner } from './banner.js';
import { handleError, setupGlobalErrorHandlers } from './error-handler.js';

/**
 * Main CLI Entry Point
 * Initializes the cloud-agent CLI with beautiful UI and error handling
 */
async function main() {
    try {
        // Setup global error handlers for graceful shutdowns
        setupGlobalErrorHandlers();

        // Display beautiful banner
        displayBanner();

        // Initialize Commander.js
        const program = new Command();

        program
            .name('cloud-agent')
            .description(chalk.cyan('🤖 AI-Powered Cloud Deployment CLI'))
            .version('1.0.0', '-v, --version', 'Display version number')
            .helpOption('-h, --help', 'Display help information');

        // Deploy command (placeholder for now)
        program
            .command('deploy')
            .description('Deploy your application to the cloud')
            .option('-c, --cloud <provider>', 'Cloud provider (aws, gcp, azure)')
            .option('-y, --yes', 'Skip approval prompts (auto-approve)')
            .action(async (options) => {
                console.log(chalk.yellow('\n⚠️  Deploy command coming soon in Phase 2!'));
                console.log(chalk.gray(`Options: ${JSON.stringify(options, null, 2)}\n`));
            });

        // Analyze command (placeholder for now)
        program
            .command('analyze')
            .description('Analyze current project structure')
            .action(async () => {
                console.log(chalk.yellow('\n⚠️  Analyze command coming soon in Phase 2!'));
                console.log(chalk.gray('This will use the Analyzer Agent to scan your project.\n'));
            });

        // Status command (placeholder for now)
        program
            .command('status')
            .description('Check deployment status and environment')
            .action(async () => {
                console.log(chalk.yellow('\n⚠️  Status command coming soon in Phase 2!'));
                console.log(chalk.gray('This will check cloud CLI tools and authentication.\n'));
            });

        // Parse arguments
        await program.parseAsync(process.argv);

        // Show help if no command provided
        if (!process.argv.slice(2).length) {
            program.outputHelp();
            console.log(chalk.cyan('\n💡 Tip: Start with ') + chalk.bold('cloud-agent analyze') + chalk.cyan(' to scan your project!\n'));
        }

    } catch (error) {
        handleError(error);
        process.exit(1);
    }
}

// Run the CLI
main();
