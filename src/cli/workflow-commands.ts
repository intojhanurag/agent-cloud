import chalk from 'chalk';
import inquirer from 'inquirer';
import { displayHeader, displaySuccess, displayError, displayInfo, displayWarning } from './banner.js';
import { Spinner } from '../utils/progress.js';
import type { CloudProvider } from '../types/index.js';
import { getConfigManager } from '../utils/config.js';
import { collectDeploymentRequirements } from './prompts.js';

/**
 * Real Status Command - Uses Validator Agent
 */
export async function realStatusCommand(options?: { cloud?: CloudProvider }): Promise<void> {
    try {
        displayHeader('Environment Status Check');

        const cloud = options?.cloud || getConfigManager().getDefaultCloud() || 'aws';
        console.log(chalk.cyan(`  Checking ${chalk.bold(cloud.toUpperCase())} environment...\n`));

        // Check for API key first
        const hasKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.OPENAI_API_KEY;
        if (!hasKey) {
            displayWarning('No AI API key configured - running basic checks only');
            console.log();

            // Run basic checks without AI
            await runBasicStatusCheck(cloud);
            return;
        }

        const { mastra } = await import('../mastra/index.js');
        const validator = mastra.getAgent('validatorAgent');

        const spinner = new Spinner('Running environment checks...');
        spinner.start();

        const validationPrompt = `Validate my ${cloud.toUpperCase()} environment for deployment.

Check:
1. CLI tool installation (${cloud === 'aws' ? 'aws-cli' : cloud === 'gcp' ? 'gcloud' : 'az'})
2. Authentication status
3. Environment variables
4. Network connectivity
5. Basic permissions

Provide a comprehensive JSON report.`;

        let fullResponse = '';
        const stream = await validator.stream([{ role: 'user', content: validationPrompt }]);

        for await (const chunk of stream.textStream) {
            fullResponse += chunk;
        }

        spinner.succeed('Environment checks complete');
        console.log();

        // Parse and display results
        try {
            const jsonMatch = fullResponse.match(/```json?\n?([\s\S]*?)\n?```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : fullResponse;
            const validation = JSON.parse(jsonStr);

            displayInfo('Check Results:');
            console.log();

            const checks = validation.checks || {};

            if (checks.cli) {
                const icon = checks.cli.passed ? '✅' : '❌';
                console.log(`  ${icon} ${chalk.bold('CLI Tool')}: ${checks.cli.message || 'Checked'}`);
            }

            if (checks.authentication) {
                const icon = checks.authentication.passed ? '✅' : '❌';
                console.log(`  ${icon} ${chalk.bold('Authentication')}: ${checks.authentication.message || 'Checked'}`);
            }

            if (checks.envVars) {
                const icon = checks.envVars.passed ? '✅' : '❌';
                console.log(`  ${icon} ${chalk.bold('Env Variables')}: ${checks.envVars.message || 'Checked'}`);
            }

            if (checks.network) {
                const icon = checks.network.passed ? '✅' : '❌';
                console.log(`  ${icon} ${chalk.bold('Network')}: ${checks.network.message || 'Checked'}`);
            }

            if (checks.permissions) {
                const icon = checks.permissions.passed ? '✅' : '❌';
                console.log(`  ${icon} ${chalk.bold('Permissions')}: ${checks.permissions.message || 'Checked'}`);
            }

            console.log();

            // Show issues if any
            if (validation.issues && validation.issues.length > 0) {
                displayInfo('Issues found:');
                for (const issue of validation.issues) {
                    const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
                    console.log(`  ${icon} ${issue.message}`);
                    if (issue.solution) {
                        console.log(chalk.gray(`     Fix: ${issue.solution}`));
                    }
                }
                console.log();
            }

            if (validation.status === 'ready') {
                displaySuccess('Environment is ready for deployment!');
            } else if (validation.status === 'partially_ready') {
                displayWarning('Environment needs some configuration. See issues above.');
            } else {
                displayError('Environment needs setup. See issues above.');
            }

        } catch {
            // Display raw response if JSON parsing fails
            console.log(chalk.gray(fullResponse));
            displaySuccess('Environment checks completed');
        }

        console.log();

    } catch (error) {
        displayError('Status check failed');
        if (error instanceof Error) {
            if (error.message.includes('API') || error.message.includes('key')) {
                console.log(chalk.yellow('  Run ') + chalk.bold('cloud-agent init') + chalk.yellow(' to configure your API key.'));
            } else {
                console.log(chalk.red(`  ${error.message}`));
            }
        }
    }
}

/**
 * Basic status check without AI
 */
async function runBasicStatusCheck(cloud: string): Promise<void> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const checks = {
        aws: { cmd: 'aws --version', auth: 'aws sts get-caller-identity' },
        gcp: { cmd: 'gcloud --version', auth: 'gcloud auth list --filter=status:ACTIVE --format="value(account)"' },
        azure: { cmd: 'az --version', auth: 'az account show' },
    };

    const check = checks[cloud as keyof typeof checks];
    if (!check) {
        displayError(`Unknown cloud provider: ${cloud}`);
        return;
    }

    // Check CLI
    try {
        const { stdout } = await execAsync(check.cmd);
        const version = stdout.trim().split('\n')[0];
        console.log(chalk.green(`  ✓ CLI installed`) + chalk.gray(` (${version.substring(0, 50)})`));
    } catch {
        console.log(chalk.red(`  ✗ CLI not installed`));
        console.log(chalk.gray(`    Install: cloud-agent info for links`));
    }

    // Check auth
    try {
        await execAsync(check.auth);
        console.log(chalk.green(`  ✓ Authenticated`));
    } catch {
        console.log(chalk.red(`  ✗ Not authenticated`));
        const authCmds = { aws: 'aws configure', gcp: 'gcloud auth login', azure: 'az login' };
        console.log(chalk.gray(`    Run: ${authCmds[cloud as keyof typeof authCmds]}`));
    }

    console.log();
}

/**
 * Real Deploy Command - Uses Deployment Workflow with interactive approval
 */
export async function realDeployCommand(options?: { cloud?: CloudProvider; yes?: boolean }): Promise<void> {
    try {
        displayHeader('Cloud Deployment');

        // Use default cloud from config if not specified
        let cloud = options?.cloud;
        if (!cloud) {
            const defaultCloud = getConfigManager().getDefaultCloud();
            if (defaultCloud) {
                cloud = defaultCloud;
                displayInfo(`Using default cloud: ${cloud.toUpperCase()}`);
            }
        }

        // If still no cloud, ask user
        if (!cloud) {
            const requirements = await collectDeploymentRequirements({ yes: options?.yes });
            cloud = requirements.cloudProvider;
        }

        const projectPath = process.cwd();

        console.log(chalk.cyan(`  Target: ${chalk.bold(cloud.toUpperCase())}`));
        console.log(chalk.gray(`  Project: ${projectPath}\n`));

        // Check for API key
        const hasKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.OPENAI_API_KEY;
        if (!hasKey) {
            displayError('No AI API key configured');
            console.log(chalk.yellow('  The deploy command needs AI to analyze your project and generate a plan.'));
            console.log(chalk.white('  Run ') + chalk.bold('cloud-agent init') + chalk.white(' to set up your API key.'));
            console.log();
            return;
        }

        displayInfo('Starting deployment workflow...');
        console.log();

        const { mastra } = await import('../mastra/index.js');
        const workflow = mastra.getWorkflow('deploymentWorkflow');

        const run = await workflow.createRun();

        const spinner = new Spinner('Analyzing project and generating plan...');
        spinner.start();

        const result = await run.start({
            inputData: {
                projectPath,
                cloud,
            },
        });

        spinner.succeed('Plan generated');
        console.log();

        // Handle workflow suspension (approval gate)
        if (result.status === 'suspended') {
            const suspendData = result.suspendPayload as any;

            if (suspendData) {
                // Display the plan
                displayHeader('Deployment Plan');

                if (suspendData.services && Array.isArray(suspendData.services)) {
                    displayInfo('Services:');
                    suspendData.services.forEach((service: string) => {
                        console.log(chalk.gray(`    - ${service}`));
                    });
                    console.log();
                }

                console.log(chalk.bold(`  Estimated Cost: ${chalk.green(`$${suspendData.estimatedCost || 'TBD'}`)} /month`));
                console.log();

                if (suspendData.commands && suspendData.commands.length > 0) {
                    displayInfo('Commands to execute:');
                    const cmds = suspendData.commands.slice(0, 8);
                    cmds.forEach((cmd: string) => {
                        if (cmd.trim()) {
                            console.log(chalk.gray(`    ${cmd}`));
                        }
                    });
                    if (suspendData.commands.length > 8) {
                        console.log(chalk.gray(`    ... and ${suspendData.commands.length - 8} more`));
                    }
                    console.log();
                }

                // Interactive approval or auto-approve
                let approved = false;

                if (options?.yes) {
                    displayInfo('Auto-approving (--yes flag set)');
                    approved = true;
                } else {
                    // Ask for approval interactively
                    const { confirm } = await inquirer.prompt([{
                        type: 'confirm',
                        name: 'confirm',
                        message: chalk.yellow('Proceed with this deployment?'),
                        default: false,
                    }]);
                    approved = confirm;
                }

                if (!approved) {
                    displayError('Deployment cancelled');
                    return;
                }

                // Resume workflow with approval
                const resumeSpinner = new Spinner('Deploying to ' + cloud.toUpperCase() + '...');
                resumeSpinner.start();

                try {
                    const resumeResult = await run.resume({
                        step: 'deployment',
                        resumeData: { approved: true },
                    });

                    resumeSpinner.succeed('Deployment complete');

                    if (resumeResult.status === 'success') {
                        const deploymentResult = resumeResult.result as any;
                        displaySuccess('Deployment completed successfully!');
                        if (deploymentResult?.deploymentUrl) {
                            console.log(chalk.green(`  URL: ${deploymentResult.deploymentUrl}`));
                        }
                    } else {
                        displayError(`Deployment finished with status: ${resumeResult.status}`);
                    }
                } catch (resumeError) {
                    resumeSpinner.fail('Deployment failed');
                    displayError('Deployment failed during execution');
                    if (resumeError instanceof Error) {
                        console.log(chalk.red(`  ${resumeError.message}`));
                    }
                }
            }
        } else if (result.status === 'success') {
            displaySuccess('Deployment completed!');
            const finalResult = result.result as any;
            if (finalResult?.deploymentUrl) {
                console.log(chalk.green(`  URL: ${finalResult.deploymentUrl}`));
            }
        } else {
            displayError(`Workflow ended with status: ${result.status}`);
            if ('error' in result && result.error) {
                console.log(chalk.red(`  ${result.error.message}`));
            }
        }

        console.log();

    } catch (error) {
        displayError('Deployment failed');
        if (error instanceof Error) {
            if (error.message.includes('API') || error.message.includes('key')) {
                console.log(chalk.yellow('  Run ') + chalk.bold('cloud-agent init') + chalk.yellow(' to configure your API key.'));
            } else {
                console.log(chalk.red(`  ${error.message}`));
            }
        }
    }
}
