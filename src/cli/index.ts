#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import chalk from 'chalk';
import { displayBanner } from './banner.js';
import { handleError, setupGlobalErrorHandlers } from './error-handler.js';
import { analyzeCommand, infoCommand, initCommand, historyCommand } from './commands.js';
import { realStatusCommand, realDeployCommand } from './workflow-commands.js';
import { cleanupCommand } from './cleanup-command.js';
import { logsCommand } from './logs-command.js';
import type { CloudProvider } from '../types/index.js';

async function main() {
    try {
        setupGlobalErrorHandlers();

        const program = new Command();

        program
            .name('cloud-agent')
            .description(chalk.cyan('AI-Powered Cloud Deployment CLI'))
            .version('1.0.0', '-v, --version', 'Display version number')
            .helpOption('-h, --help', 'Display help information')
            .option('--json', 'Output structured JSON instead of human-readable text');

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
            .option('-p, --path <directory>', 'Path to project directory (default: current directory)')
            .option('--local', 'Local-only analysis without AI (no API key needed)')
            .option('--ai', 'Use AI for deep analysis (requires API key)')
            .action(async (options) => {
                if (options.path) {
                    process.chdir(options.path);
                }
                await analyzeCommand({ local: options.local, ai: options.ai });
            });

        // Deploy command - real deployment
        program
            .command('deploy')
            .description('Deploy your application to the cloud')
            .option('-c, --cloud <provider>', 'Cloud provider (aws, gcp, azure)')
            .option('-p, --path <directory>', 'Path to project directory (default: current directory)')
            .option('-y, --yes', 'Auto-approve deployment')
            .option('--app-name <name>', 'Override auto-detected application name')
            .option('--port <number>', 'Container port', parseInt)
            .option('--image <image>', 'Pre-built Docker image to deploy')
            .option('--build-dir <dir>', 'Static site build output directory')
            .option('--dry-run', 'Show deployment plan without executing')
            .action(async (options) => {
                if (options.path) {
                    process.chdir(options.path);
                }
                const globalJson = program.opts().json;
                await realDeployCommand({
                    cloud: options.cloud as CloudProvider | undefined,
                    yes: options.yes,
                    appName: options.appName,
                    port: options.port,
                    image: options.image,
                    buildDir: options.buildDir,
                    dryRun: options.dryRun,
                    json: globalJson,
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

        // Cleanup command - remove deployed resources
        program
            .command('cleanup')
            .description('Remove previously deployed cloud resources')
            .option('-c, --cloud <provider>', 'Cloud provider (aws, gcp, azure)')
            .action(async (options) => {
                await cleanupCommand({
                    cloud: options.cloud as CloudProvider | undefined,
                });
            });

        // Logs command - view deployment logs
        program
            .command('logs')
            .description('View logs from deployed services')
            .option('-c, --cloud <provider>', 'Cloud provider (aws, gcp, azure)')
            .option('-s, --service <name>', 'Service name')
            .option('-n, --lines <number>', 'Number of log lines', parseInt)
            .action(async (options) => {
                await logsCommand({
                    cloud: options.cloud as CloudProvider | undefined,
                    service: options.service,
                    lines: options.lines,
                });
            });

        // Info command - cloud provider info
        program
            .command('info')
            .description('Show available cloud providers and their services')
            .action(async () => {
                await infoCommand();
            });

        // Show banner unless --json mode
        if (!process.argv.includes('--json')) {
            displayBanner();
        }

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
