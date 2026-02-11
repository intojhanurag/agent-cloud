#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { displayBanner } from './banner.js';
import { handleError, setupGlobalErrorHandlers } from './error-handler.js';
import { analyzeCommand, infoCommand, initCommand, historyCommand } from './commands.js';
import { realStatusCommand, realDeployCommand } from './workflow-commands.js';
import type { CloudProvider } from '../types/index.js';

async function main() {
    try {
        setupGlobalErrorHandlers();
        displayBanner();

        const program = new Command();

        program
            .name('cloud-agent')
            .description(chalk.cyan('AI-Powered Cloud Deployment CLI'))
            .version('1.0.0', '-v, --version', 'Display version number')
            .helpOption('-h, --help', 'Display help information');

        // Init command - setup wizard
        program
            .command('init')
            .description('Set up cloud-agent (API keys, cloud CLI detection, preferences)')
            .action(async () => {
                await initCommand();
            });

        // Analyze command - project analysis
        program
            .command('analyze')
            .description('Analyze your project structure and recommend cloud services')
            .option('--local', 'Local-only analysis without AI (no API key needed)')
            .option('--ai', 'Use AI for deep analysis (requires API key)')
            .action(async (options) => {
                await analyzeCommand({ local: options.local, ai: options.ai });
            });

        // Deploy command - real deployment
        program
            .command('deploy')
            .description('Deploy your application to the cloud')
            .option('-c, --cloud <provider>', 'Cloud provider (aws, gcp, azure)')
            .option('-p, --path <directory>', 'Path to project directory (default: current directory)')
            .option('-y, --yes', 'Auto-approve deployment')
            .action(async (options) => {
                if (options.path) {
                    process.chdir(options.path);
                }
                await realDeployCommand({
                    cloud: options.cloud as CloudProvider | undefined,
                    yes: options.yes,
                });
            });

        // Status command - environment check
        program
            .command('status')
            .description('Check if your environment is ready for deployment')
            .option('-c, --cloud <provider>', 'Cloud provider to check (aws, gcp, azure)')
            .action(async (options) => {
                await realStatusCommand({
                    cloud: options.cloud as CloudProvider | undefined,
                });
            });

        // History command - deployment history
        program
            .command('history')
            .description('Show your deployment history')
            .action(async () => {
                await historyCommand();
            });

        // Info command - cloud provider info
        program
            .command('info')
            .description('Show available cloud providers and their services')
            .action(async () => {
                await infoCommand();
            });

        await program.parseAsync(process.argv);

        // Show help if no command provided
        if (!process.argv.slice(2).length) {
            console.log(chalk.cyan('  Quick start:'));
            console.log(chalk.white('    cloud-agent init') + chalk.gray('       Set up API keys and preferences'));
            console.log(chalk.white('    cloud-agent analyze') + chalk.gray('    Analyze your project (works without API keys)'));
            console.log(chalk.white('    cloud-agent deploy') + chalk.gray('     Deploy to AWS, GCP, or Azure'));
            console.log();
        }

    } catch (error) {
        // Don't show error for missing command - help was already shown
        if (error instanceof Error && error.message.includes('commander')) {
            process.exit(0);
        }
        handleError(error);
        process.exit(1);
    }
}

main();
