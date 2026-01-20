#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { displayBanner } from './banner.js';
import { handleError, setupGlobalErrorHandlers } from './error-handler.js';
import { demoCommand, analyzeCommand, infoCommand } from './commands.js';
import { realStatusCommand, realDeployCommand } from './workflow-commands.js';
import type { CloudProvider } from '../types/index.js';

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

        // Demo command - showcases the interactive flow
        program
            .command('demo')
            .description('Interactive demo of deployment flow (Phase 1.2)')
            .option('-c, --cloud <provider>', 'Cloud provider (aws, gcp, azure)')
            .option('-y, --yes', 'Skip approval prompts (auto-approve)')
            .action(async (options) => {
                await demoCommand({
                    cloud: options.cloud as CloudProvider | undefined,
                    yes: options.yes
                });
            });

        // Deploy command - Real deployment workflow (Phase 3.2)
        program
            .command('deploy')
            .description('Deploy your application to the cloud')
            .option('-c, --cloud <provider>', 'Cloud provider (aws, gcp, azure)')
            .option('-y, --yes', 'Auto-approve deployment')
            .action(async (options) => {
                await realDeployCommand({
                    cloud: options.cloud as CloudProvider | undefined,
                    yes: options.yes
                });
            });

        // Analyze command - project analysis
        program
            .command('analyze')
            .description('Analyze current project structure (Coming in Phase 2)')
            .action(async () => {
                await analyzeCommand();
            });

        // Status command - Real environment validation (Phase 3.2)
        program
            .command('status')
            .description('Check environment readiness for deployment')
            .option('-c, --cloud <provider>', 'Cloud provider to check (aws, gcp, azure)')
            .action(async (options) => {
                await realStatusCommand({
                    cloud: options.cloud as CloudProvider | undefined
                });
            });

        // Info command - show cloud providers
        program
            .command('info')
            .description('Show available cloud providers and information')
            .action(async () => {
                await infoCommand();
            });

        // Parse arguments
        await program.parseAsync(process.argv);

        // Show help if no command provided
        if (!process.argv.slice(2).length) {
            program.outputHelp();
            console.log(chalk.cyan('\n💡 Tip: Try ') + chalk.bold('cloud-agent demo') + chalk.cyan(' to see the interactive deployment flow!\n'));
        }

    } catch (error) {
        handleError(error);
        process.exit(1);
    }
}

// Run the CLI
main();
