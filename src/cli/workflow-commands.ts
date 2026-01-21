import chalk from 'chalk';
import { displayHeader, displaySuccess, displayError, displayInfo } from './banner.js';
import { Spinner } from '../utils/progress.js';
import type { CloudProvider } from '../types/index.js';

/**
 * Real Status Command - Uses Validator Agent
 * Phase 3.2 Integration
 */
export async function realStatusCommand(options?: { cloud?: CloudProvider }): Promise<void> {
    try {
        displayHeader('Environment Status Check');

        // Determine which cloud to check
        const cloud = options?.cloud || 'aws';
        console.log(chalk.cyan(`  Checking ${chalk.bold(cloud.toUpperCase())} environment...\n`));

        // Import Mastra instance
        const { mastra } = await import('../mastra/index.js');
        const validator = mastra.getAgent('validatorAgent');

        // Run validation with spinner
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

            if (checks.network) {
                const icon = checks.network.passed ? '✅' : '❌';
                console.log(`  ${icon} ${chalk.bold('Network')}: ${checks.network.message || 'Checked'}`);
            }

            console.log();
            if (validation.status === 'ready') {
                displaySuccess('Environment is ready for deployment! 🚀');
            } else {
                displayError('Environment needs configuration');
            }

        } catch {
            displaySuccess('Environment checks completed');
        }

        console.log();

    } catch (error) {
        displayError('Status check failed');
        console.error(chalk.red(`  Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
}

/**
 * Real Deploy Command - Uses Deployment Workflow
 * Phase 3.2 Integration
 */
export async function realDeployCommand(options?: { cloud?: CloudProvider; yes?: boolean }): Promise<void> {
    try {
        displayHeader('Cloud Deployment');

        const cloud = options?.cloud || 'aws';
        const projectPath = process.cwd();

        console.log(chalk.cyan(`  Target: ${chalk.bold(cloud.toUpperCase())}`));
        console.log(chalk.gray(`  Project: ${projectPath}\n`));

        // Start workflow
        displayInfo('Starting deployment workflow...');
        console.log();

        const { mastra } = await import('../mastra/index.js');
        const workflow = mastra.getWorkflow('deploymentWorkflow');

        const run = await workflow.createRun();

        // Start the workflow with spinner
        const spinner = new Spinner('Running deployment phases...');
        spinner.start();

        const result = await run.start({
            inputData: {
                projectPath,
                cloud,
            },
        });

        spinner.succeed('Workflow initiated');
        console.log();

        // Check if workflow suspended for approval
        if (result.status === 'suspended') {
            // Access suspend data - Mastra provides suspendPayload
            const suspendData = result.suspendPayload as any;

            if (suspendData) {
                displayInfo('Deployment Plan:');
                console.log();
                console.log(chalk.bold('  Services:'));
                if (suspendData.services && Array.isArray(suspendData.services)) {
                    suspendData.services.forEach((service: string) => {
                        console.log(chalk.gray(`    • ${service}`));
                    });
                }
                console.log();
                console.log(chalk.bold(`  Estimated Cost: ${chalk.green(`$${suspendData.estimatedCost || 'TBD'}`)} /month`));
                console.log();
                console.log(chalk.bold('  Commands to execute:'));
                const commands = suspendData.commands || [];
                commands.slice(0, 5).forEach((cmd: string) => {
                    console.log(chalk.gray(`    ${cmd}`));
                });
                console.log();

                // Auto-approve if --yes flag
                if (options?.yes) {
                    displayInfo('Auto-approving deployment (--yes flag set)...');

                    const resumeSpinner = new Spinner('Resuming deployment...');
                    resumeSpinner.start();

                    const resumeResult = await run.resume({
                        step: 'deployment',
                        resumeData: { approved: true },
                    });

                    resumeSpinner.succeed('Deployment resumed');

                    if (resumeResult.status === 'success') {
                        // Mastra provides result property for success
                        const deploymentResult = resumeResult.result as any;
                        displaySuccess('✨ Deployment completed successfully!');
                        if (deploymentResult?.deploymentUrl) {
                            console.log(chalk.green(`\n  🌐 URL: ${deploymentResult.deploymentUrl}\n`));
                        }
                    }
                } else {
                    displayInfo('Workflow suspended - waiting for approval');
                    console.log(chalk.gray('\n  To approve and continue deployment:'));
                    console.log(chalk.gray('  1. The workflow is saved'));
                    console.log(chalk.gray('  2. In Phase 4, you\'ll be able to approve/reject'));
                    console.log(chalk.gray('  3. For now, use --yes flag to auto-approve\n'));
                }
            }
        } else if (result.status === 'success') {
            displaySuccess('✨ Deployment completed!');
            // Access result for final output
            const finalResult = result.result as any;
            if (finalResult?.deploymentUrl) {
                console.log(chalk.green(`\n  🌐 URL: ${finalResult.deploymentUrl}\n`));
            }
        } else {
            displayError(`Workflow status: ${result.status}`);
        }

    } catch (error) {
        displayError('Deployment failed');
        console.error(chalk.red(`  Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
}
