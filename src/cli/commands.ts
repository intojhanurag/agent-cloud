import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
    displayCloudProviders,
} from './prompts.js';
import { withSpinner, delay } from '../utils/progress.js';
import { displayHeader, displaySuccess, displayError, displayInfo, displayWarning } from './banner.js';
import type { CloudProvider } from '../types/index.js';
import { getConfigManager } from '../utils/config.js';

const execAsync = promisify(exec);

/**
 * Init command - guided setup wizard
 * Helps users configure API keys, detect cloud CLIs, and set preferences
 */
export async function initCommand(): Promise<void> {
    try {
        displayHeader('Setup Wizard');

        // Step 1: Check for existing .env
        const envPath = path.join(process.cwd(), '.env');
        let envExists = false;
        try {
            await fs.access(envPath);
            envExists = true;
        } catch {
            // no .env
        }

        if (envExists) {
            displayInfo('Found existing .env file');
        } else {
            displayInfo('No .env file found - creating one');
        }

        console.log();

        // Step 2: AI API Key setup
        displayInfo(chalk.bold('Step 1: AI API Key'));
        console.log(chalk.gray('    An AI API key powers the smart project analysis.'));
        console.log(chalk.gray('    Get a free key: https://aistudio.google.com/app/apikey'));
        console.log();

        const hasGeminiKey = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

        if (hasGeminiKey) {
            displaySuccess('Google Gemini API key detected');
        } else if (hasOpenAIKey) {
            displaySuccess('OpenAI API key detected');
        } else {
            const { setupKey } = await inquirer.prompt([{
                type: 'confirm',
                name: 'setupKey',
                message: chalk.cyan('Would you like to set up an AI API key now?'),
                default: true,
            }]);

            if (setupKey) {
                const { provider } = await inquirer.prompt([{
                    type: 'list',
                    name: 'provider',
                    message: chalk.cyan('Which AI provider?'),
                    choices: [
                        { name: 'Google Gemini (free tier available)', value: 'gemini' },
                        { name: 'OpenAI (paid)', value: 'openai' },
                        { name: 'Skip for now', value: 'skip' },
                    ],
                }]);

                if (provider !== 'skip') {
                    const keyName = provider === 'gemini' ? 'GOOGLE_GENERATIVE_AI_API_KEY' : 'OPENAI_API_KEY';
                    const { apiKey } = await inquirer.prompt([{
                        type: 'password',
                        name: 'apiKey',
                        message: chalk.cyan(`Enter your ${keyName}:`),
                        mask: '*',
                    }]);

                    if (apiKey && apiKey.trim()) {
                        let envContent = '';
                        try {
                            envContent = await fs.readFile(envPath, 'utf-8');
                        } catch {
                            // file doesn't exist yet
                        }

                        // Replace or append key
                        const keyLine = `${keyName}=${apiKey.trim()}`;
                        if (envContent.includes(keyName)) {
                            envContent = envContent.replace(new RegExp(`${keyName}=.*`), keyLine);
                        } else {
                            envContent += `\n${keyLine}\n`;
                        }

                        await fs.writeFile(envPath, envContent, 'utf-8');
                        displaySuccess(`API key saved to .env`);
                    }
                }
            }
        }

        // Step 3: Cloud CLI detection
        console.log();
        displayInfo(chalk.bold('Step 2: Cloud CLI Detection'));
        console.log();

        const clis = [
            { name: 'AWS CLI', cmd: 'aws --version', cloud: 'aws' },
            { name: 'Google Cloud SDK', cmd: 'gcloud --version', cloud: 'gcp' },
            { name: 'Azure CLI', cmd: 'az --version', cloud: 'azure' },
        ];

        const detectedClouds: string[] = [];

        for (const cli of clis) {
            try {
                const { stdout } = await execAsync(cli.cmd);
                const version = stdout.trim().split('\n')[0];
                console.log(chalk.green(`    ✓ ${cli.name}`) + chalk.gray(` (${version.substring(0, 50)})`));
                detectedClouds.push(cli.cloud);
            } catch {
                console.log(chalk.gray(`    ○ ${cli.name} - not installed`));
            }
        }

        console.log();

        if (detectedClouds.length === 0) {
            displayWarning('No cloud CLIs detected. Install one to deploy:');
            console.log(chalk.gray('    AWS:   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html'));
            console.log(chalk.gray('    GCP:   https://cloud.google.com/sdk/docs/install'));
            console.log(chalk.gray('    Azure: https://learn.microsoft.com/cli/azure/install-azure-cli'));
        } else {
            displaySuccess(`${detectedClouds.length} cloud CLI(s) detected`);
        }

        // Step 4: Set default cloud preference
        if (detectedClouds.length > 0) {
            console.log();
            displayInfo(chalk.bold('Step 3: Preferences'));
            console.log();

            const choices = detectedClouds.map(c => ({
                name: c.toUpperCase(),
                value: c,
            }));
            choices.push({ name: 'No default', value: 'none' });

            const { defaultCloud } = await inquirer.prompt([{
                type: 'list',
                name: 'defaultCloud',
                message: chalk.cyan('Set a default cloud provider?'),
                choices,
            }]);

            if (defaultCloud !== 'none') {
                const config = getConfigManager();
                config.setDefaultCloud(defaultCloud as CloudProvider);
                displayInfo(`Default cloud set to ${defaultCloud.toUpperCase()}`);
            }
        }

        // Done
        console.log();
        displaySuccess('Setup complete!');
        console.log(chalk.white('  Next steps:'));
        console.log(chalk.gray('    cloud-agent analyze') + chalk.white('    Analyze your project'));
        console.log(chalk.gray('    cloud-agent deploy') + chalk.white('     Deploy to the cloud'));
        console.log();

    } catch (error) {
        displayError('Setup failed');
        if (error instanceof Error) {
            console.error(chalk.red(`  ${error.message}`));
        }
    }
}

/**
 * Analyze command - project analysis
 * Default: local analysis (no API key needed)
 * --ai: AI-powered deep analysis
 */
export async function analyzeCommand(options: { local?: boolean; ai?: boolean } = {}): Promise<void> {
    try {
        const projectPath = process.cwd();
        const useAI = options.ai && !options.local;

        displayHeader('Project Analysis');
        displayInfo(`Project: ${chalk.bold(projectPath)}`);
        displayInfo(`Mode: ${chalk.bold(useAI ? 'AI-Powered' : 'Local')}`);
        console.log();

        // Always run local analysis first - it's instant and needs no API key
        await runLocalAnalysis(projectPath);

        // Run AI analysis if requested
        if (useAI) {
            console.log();
            displayHeader('AI Deep Analysis');

            // Check for API key
            const hasKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.OPENAI_API_KEY;
            if (!hasKey) {
                displayError('No AI API key configured');
                console.log(chalk.yellow('  To use AI analysis, you need an API key:'));
                console.log(chalk.white('    1. Run ') + chalk.bold('cloud-agent init') + chalk.white(' for guided setup'));
                console.log(chalk.white('    2. Or get a free key at ') + chalk.cyan('https://aistudio.google.com/app/apikey'));
                console.log(chalk.white('    3. Add to .env: ') + chalk.cyan('GOOGLE_GENERATIVE_AI_API_KEY=your-key'));
                console.log();
                console.log(chalk.gray('  Tip: ') + chalk.white('cloud-agent analyze') + chalk.gray(' works without AI for basic analysis'));
                return;
            }

            try {
                const { mastra } = await import('../mastra/index.js');
                const agent = mastra.getAgent('analyzerAgent');

                displayInfo('AI agent is analyzing your project...');
                console.log(chalk.gray('  This may take a moment.\n'));

                const analysisPrompt = `Analyze the project located at: ${projectPath}

Please provide a comprehensive analysis in JSON format:
1. Project type (api, web, static, container)
2. Runtime and framework detection
3. Database requirements
4. Recommended cloud services for AWS, GCP, and Azure
5. Estimated monthly costs per cloud provider
6. Deployment recommendations`;

                let fullResponse = '';
                const stream = await agent.stream([
                    { role: 'user', content: analysisPrompt },
                ]);

                for await (const chunk of stream.textStream) {
                    process.stdout.write(chalk.gray(chunk));
                    fullResponse += chunk;
                }

                console.log('\n');

                // Try to display structured results
                try {
                    let jsonStr = fullResponse;
                    const jsonMatch = fullResponse.match(/```json?\n?([\s\S]*?)\n?```/);
                    if (jsonMatch) {
                        jsonStr = jsonMatch[1];
                    }
                    const analysis = JSON.parse(jsonStr);

                    if (analysis.recommendedServices) {
                        displayHeader('Recommended Cloud Services');
                        for (const [cloud, services] of Object.entries(analysis.recommendedServices)) {
                            console.log(chalk.cyan(`  ${cloud.toUpperCase()}:`));
                            if (Array.isArray(services)) {
                                services.forEach((service: string) => {
                                    console.log(chalk.gray(`    - ${service}`));
                                });
                            }
                        }
                    }

                    if (analysis.estimatedCost) {
                        console.log();
                        displayInfo('Estimated Monthly Costs:');
                        for (const [cloud, cost] of Object.entries(analysis.estimatedCost)) {
                            console.log(chalk.white(`    ${cloud.toUpperCase()}: `) + chalk.green(`$${cost}`));
                        }
                    }
                } catch {
                    // Raw text already displayed above
                }

                console.log();
                displaySuccess('AI analysis complete');

            } catch (error) {
                displayError('AI analysis failed');
                if (error instanceof Error) {
                    if (error.message.includes('API') || error.message.includes('key') || error.message.includes('auth')) {
                        console.log(chalk.yellow('  Your API key may be invalid or expired.'));
                        console.log(chalk.white('  Run ') + chalk.bold('cloud-agent init') + chalk.white(' to reconfigure.'));
                    } else {
                        console.log(chalk.red(`  ${error.message}`));
                    }
                }
            }
        }

        if (!useAI) {
            console.log();
            displayInfo('Tip: Run ' + chalk.bold('cloud-agent analyze --ai') + ' for AI-powered deep analysis');
        }
        console.log();

    } catch (error) {
        displayError('Analysis failed');
        if (error instanceof Error) {
            console.error(chalk.red(`  ${error.message}`));
        }
    }
}

/**
 * Local analysis - scans project without AI, works offline
 */
async function runLocalAnalysis(projectPath: string): Promise<void> {
    let runtime: string | undefined;
    let packageManager: string | undefined;
    let framework: string | undefined;
    let projectType: string = 'unknown';
    let buildCommand: string | undefined;
    let startCommand: string | undefined;
    let port: number | undefined;
    const dependencies: string[] = [];
    const databases: string[] = [];
    let hasDocker = false;
    let hasDockerCompose = false;

    // Check Docker
    try {
        await fs.access(path.join(projectPath, 'Dockerfile'));
        hasDocker = true;
    } catch { /* no docker */ }

    try {
        await fs.access(path.join(projectPath, 'docker-compose.yml'));
        hasDockerCompose = true;
    } catch {
        try {
            await fs.access(path.join(projectPath, 'docker-compose.yaml'));
            hasDockerCompose = true;
        } catch { /* no compose */ }
    }

    // Check Node.js
    try {
        const pkgPath = path.join(projectPath, 'package.json');
        const pkgContent = await fs.readFile(pkgPath, 'utf-8');
        const pkg = JSON.parse(pkgContent);

        runtime = 'Node.js';
        packageManager = 'npm';

        // Detect package manager
        try { await fs.access(path.join(projectPath, 'pnpm-lock.yaml')); packageManager = 'pnpm'; } catch {
            try { await fs.access(path.join(projectPath, 'yarn.lock')); packageManager = 'yarn'; } catch { /* npm */ }
        }
        try { await fs.access(path.join(projectPath, 'bun.lockb')); packageManager = 'bun'; } catch { /* not bun */ }

        const allDeps = {
            ...pkg.dependencies,
            ...pkg.devDependencies,
        };
        const depNames = Object.keys(allDeps || {});
        dependencies.push(...Object.keys(pkg.dependencies || {}));

        // Detect framework
        if (depNames.includes('next')) { framework = 'Next.js'; projectType = 'web'; }
        else if (depNames.includes('express')) { framework = 'Express.js'; projectType = 'api'; }
        else if (depNames.includes('@nestjs/core')) { framework = 'NestJS'; projectType = 'api'; }
        else if (depNames.includes('fastify')) { framework = 'Fastify'; projectType = 'api'; }
        else if (depNames.includes('react')) { framework = 'React'; projectType = 'web'; }
        else if (depNames.includes('vue')) { framework = 'Vue.js'; projectType = 'web'; }
        else if (depNames.includes('svelte') || depNames.includes('@sveltejs/kit')) { framework = 'Svelte'; projectType = 'web'; }
        else if (depNames.includes('astro')) { framework = 'Astro'; projectType = 'web'; }
        else if (depNames.includes('hono')) { framework = 'Hono'; projectType = 'api'; }

        // Detect databases
        if (depNames.includes('pg') || depNames.includes('postgres') || depNames.includes('@prisma/client')) databases.push('PostgreSQL');
        if (depNames.includes('mysql') || depNames.includes('mysql2')) databases.push('MySQL');
        if (depNames.includes('mongodb') || depNames.includes('mongoose')) databases.push('MongoDB');
        if (depNames.includes('redis') || depNames.includes('ioredis')) databases.push('Redis');
        if (depNames.includes('sqlite3') || depNames.includes('better-sqlite3')) databases.push('SQLite');

        // Extract commands
        const scripts = pkg.scripts || {};
        buildCommand = scripts.build;
        startCommand = scripts.start || scripts.dev;

        // Detect port
        const scriptValues = Object.values(scripts).join(' ');
        const portMatch = (scriptValues as string).match(/PORT[=\s]+(\d+)/i);
        port = portMatch ? parseInt(portMatch[1]) : 3000;

    } catch {
        // Not Node.js
    }

    // Check Python
    if (!runtime) {
        try {
            const reqPath = path.join(projectPath, 'requirements.txt');
            const requirements = await fs.readFile(reqPath, 'utf-8');
            runtime = 'Python';
            packageManager = 'pip';

            const deps = requirements.split('\n').filter(l => l.trim() && !l.startsWith('#'));
            const depNames = deps.map(l => l.split('==')[0].split('>=')[0].split('<=')[0].trim().toLowerCase());

            if (depNames.includes('fastapi')) { framework = 'FastAPI'; projectType = 'api'; }
            else if (depNames.includes('flask')) { framework = 'Flask'; projectType = 'api'; }
            else if (depNames.includes('django')) { framework = 'Django'; projectType = 'web'; }

            if (depNames.includes('psycopg2') || depNames.includes('psycopg2-binary')) databases.push('PostgreSQL');
            if (depNames.includes('pymongo')) databases.push('MongoDB');
            if (depNames.includes('redis')) databases.push('Redis');

        } catch { /* not Python */ }
    }

    // Check Go
    if (!runtime) {
        try {
            await fs.access(path.join(projectPath, 'go.mod'));
            runtime = 'Go';
            projectType = 'api';
        } catch { /* not Go */ }
    }

    // Check for static site
    if (!runtime) {
        try {
            await fs.access(path.join(projectPath, 'index.html'));
            projectType = 'static';
            runtime = 'Static HTML';
        } catch { /* not static */ }
    }

    if (hasDocker && projectType === 'unknown') {
        projectType = 'container';
    }

    // Display results
    displayInfo(chalk.bold('Project Details:'));
    console.log();
    console.log(chalk.white('    Runtime:         ') + chalk.cyan(runtime || 'Unknown'));
    if (framework) {
        console.log(chalk.white('    Framework:       ') + chalk.cyan(framework));
    }
    console.log(chalk.white('    Project Type:    ') + chalk.cyan(projectType));
    if (packageManager) {
        console.log(chalk.white('    Package Manager: ') + chalk.cyan(packageManager));
    }
    if (buildCommand) {
        console.log(chalk.white('    Build Command:   ') + chalk.cyan(buildCommand));
    }
    if (startCommand) {
        console.log(chalk.white('    Start Command:   ') + chalk.cyan(startCommand));
    }
    if (port) {
        console.log(chalk.white('    Port:            ') + chalk.cyan(String(port)));
    }
    console.log(chalk.white('    Docker:          ') + chalk.cyan(hasDocker ? 'Yes' : 'No'));
    if (hasDockerCompose) {
        console.log(chalk.white('    Docker Compose:  ') + chalk.cyan('Yes'));
    }

    if (databases.length > 0) {
        console.log(chalk.white('    Databases:       ') + chalk.cyan(databases.join(', ')));
    }

    if (dependencies.length > 0) {
        console.log();
        displayInfo(chalk.bold(`Dependencies (${dependencies.length}):`));
        // Show top 10 deps
        const shown = dependencies.slice(0, 10);
        shown.forEach(dep => {
            console.log(chalk.gray(`    - ${dep}`));
        });
        if (dependencies.length > 10) {
            console.log(chalk.gray(`    ... and ${dependencies.length - 10} more`));
        }
    }

    // Quick cloud recommendations
    console.log();
    displayInfo(chalk.bold('Quick Recommendations:'));
    console.log();

    if (projectType === 'static') {
        console.log(chalk.white('    AWS:   ') + chalk.gray('S3 + CloudFront'));
        console.log(chalk.white('    GCP:   ') + chalk.gray('Firebase Hosting or Cloud Storage'));
        console.log(chalk.white('    Azure: ') + chalk.gray('Static Web Apps'));
    } else if (projectType === 'api') {
        console.log(chalk.white('    AWS:   ') + chalk.gray('ECS Fargate or Lambda'));
        console.log(chalk.white('    GCP:   ') + chalk.gray('Cloud Run'));
        console.log(chalk.white('    Azure: ') + chalk.gray('Container Apps or App Service'));
    } else if (projectType === 'web') {
        console.log(chalk.white('    AWS:   ') + chalk.gray('Amplify or ECS Fargate'));
        console.log(chalk.white('    GCP:   ') + chalk.gray('Cloud Run or App Engine'));
        console.log(chalk.white('    Azure: ') + chalk.gray('App Service or Static Web Apps'));
    } else if (hasDocker) {
        console.log(chalk.white('    AWS:   ') + chalk.gray('ECS Fargate'));
        console.log(chalk.white('    GCP:   ') + chalk.gray('Cloud Run'));
        console.log(chalk.white('    Azure: ') + chalk.gray('Container Apps'));
    } else {
        console.log(chalk.gray('    Could not determine project type. Add --ai for AI analysis.'));
    }

    displaySuccess('Local analysis complete');
}

/**
 * History command - show deployment records
 */
export async function historyCommand(): Promise<void> {
    try {
        displayHeader('Deployment History');

        const config = getConfigManager();
        const deployments = config.getDeployments();

        if (deployments.length === 0) {
            displayInfo('No deployments yet.');
            console.log(chalk.gray('  Run ') + chalk.bold('cloud-agent deploy') + chalk.gray(' to deploy your first project.'));
            console.log();
            return;
        }

        // Show stats
        const stats = config.getStats();
        displayInfo(chalk.bold('Summary:'));
        console.log(chalk.white(`    Total:      ${stats.total}`));
        console.log(chalk.green(`    Successful: ${stats.successful}`));
        if (stats.failed > 0) {
            console.log(chalk.red(`    Failed:     ${stats.failed}`));
        }
        if (stats.totalCost > 0) {
            console.log(chalk.white(`    Total Cost: `) + chalk.green(`$${stats.totalCost.toFixed(2)}`));
        }
        console.log();

        // Show recent deployments
        displayInfo(chalk.bold('Recent Deployments:'));
        console.log();

        const recent = deployments.slice(-10).reverse();
        for (const dep of recent) {
            const icon = dep.success ? chalk.green('✓') : chalk.red('✗');
            const cloud = dep.cloud.toUpperCase().padEnd(5);
            const date = new Date(dep.timestamp).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
            });

            console.log(`    ${icon} ${chalk.cyan(cloud)} ${chalk.gray(date)}`);
            if (dep.deploymentUrl) {
                console.log(chalk.gray(`      URL: ${dep.deploymentUrl}`));
            }
            if (dep.duration) {
                console.log(chalk.gray(`      Duration: ${(dep.duration / 1000).toFixed(1)}s`));
            }
        }

        console.log();

    } catch (error) {
        displayError('Failed to load history');
        if (error instanceof Error) {
            console.error(chalk.red(`  ${error.message}`));
        }
    }
}

/**
 * Info command - show cloud providers
 */
export async function infoCommand(): Promise<void> {
    displayCloudProviders();
}
