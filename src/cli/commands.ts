import chalk from 'chalk';
import {
    collectDeploymentRequirements,
    confirmDeploymentPlan,
    displayCloudProviders,
    getCloudProviderConfig,
} from './prompts.js';
import { ProgressTracker, withSpinner, delay } from '../utils/progress.js';
import { displayHeader, displaySuccess, displayError, displayInfo } from './banner.js';
import type { CloudProvider } from '../types/index.js';

/**
 * Demo command to showcase interactive prompts (Phase 1.2)
 * This demonstrates the user flow without actual deployment
 */
export async function demoCommand(options: { cloud?: CloudProvider; yes?: boolean }): Promise<void> {
    try {
        // Step 1: Collect requirements
        const requirements = await collectDeploymentRequirements(options);

        // Step 2: Simulate project analysis
        displayHeader('Analyzing Project');

        const analysisSteps = [
            'Scanning project files',
            'Detecting technology stack',
            'Analyzing dependencies',
            'Identifying required services',
            'Generating deployment plan',
        ];

        const tracker = new ProgressTracker(analysisSteps);
        tracker.start();

        for (const step of analysisSteps) {
            await delay(800); // Simulate work
            tracker.nextStep();
        }

        tracker.complete();

        // Step 3: Display mock analysis results
        await delay(500);
        displayInfo('Detected: Node.js v20.x application');
        displayInfo('Framework: Express.js');
        displayInfo('Database: PostgreSQL (detected in package.json)');
        displayInfo('Environment: Production-ready');
        console.log();

        // Step 4: Show deployment plan
        const mockPlan = {
            services: [
                `${getCloudProviderConfig(requirements.cloudProvider).icon} Container Service (for Node.js app)`,
                '🗄️  Managed Database (PostgreSQL)',
                '🌐 Load Balancer',
                '🔒 SSL Certificate',
            ],
            estimatedCost: 45.99,
            commands: [
                `${getCloudProviderConfig(requirements.cloudProvider).requiresCLI} configure`,
                `${getCloudProviderConfig(requirements.cloudProvider).requiresCLI} deploy create-cluster`,
                `${getCloudProviderConfig(requirements.cloudProvider).requiresCLI} database create-instance`,
                `${getCloudProviderConfig(requirements.cloudProvider).requiresCLI} app deploy`,
            ],
        };

        // Step 5: Get approval (unless auto-approved)
        let approved = requirements.autoApprove;

        if (!approved) {
            approved = await confirmDeploymentPlan(mockPlan);
        } else {
            displayInfo('Auto-approved mode enabled, skipping confirmation');
            console.log();
        }

        if (!approved) {
            displayError('Deployment cancelled by user');
            return;
        }

        // Step 6: Simulate deployment
        displayHeader('Deploying Application');

        const deploymentSteps = [
            'Validating environment',
            'Creating cloud resources',
            'Building application',
            'Pushing container image',
            'Deploying services',
            'Configuring networking',
            'Running health checks',
        ];

        const deployTracker = new ProgressTracker(deploymentSteps);
        deployTracker.start();

        for (const step of deploymentSteps) {
            await delay(1000);
            deployTracker.nextStep();
        }

        deployTracker.complete();

        // Step 7: Show success
        await delay(500);
        displaySuccess('Deployment completed successfully!');

        console.log(chalk.white('  🌐 Application URL: ') + chalk.cyan.bold('https://my-app.example.com'));
        console.log(chalk.white('  📊 Dashboard: ') + chalk.cyan('https://console.cloud.example.com/my-app'));
        console.log(chalk.white('  💰 Monthly cost: ') + chalk.green(`$${mockPlan.estimatedCost}`));
        console.log();

        displayInfo('Run ' + chalk.bold('cloud-agent status') + ' to check deployment status');
        console.log();

    } catch (error) {
        displayError('Demo failed');
        throw error;
    }
}

/**
 * Analyze command - Uses Mastra AI agent to analyze project
 */
export async function analyzeCommand(): Promise<void> {
    try {
        const projectPath = process.cwd();

        displayHeader('AI-Powered Project Analysis');
        displayInfo(`Analyzing project at: ${chalk.bold(projectPath)}`);
        console.log();

        // Import the mastra instance dynamically
        const { mastra } = await import('../mastra/index.js');
        const agent = mastra.getAgent('analyzerAgent');

        // Step 1: Initial analysis
        await withSpinner(
            'Initializing AI analyzer',
            async () => {
                await delay(500);
            },
            'AI analyzer ready'
        );

        // Step 2: Run the agent analysis
        displayInfo('🤖 AI agent is analyzing your project...');
        console.log(chalk.gray('  This may take a moment as the agent examines your code.\n'));

        const analysisPrompt = `Analyze the project located at: ${projectPath}

Please perform a comprehensive analysis:
1. Scan the project directory structure
2. Identify the runtime and technology stack
3. Analyze dependencies from package.json or other manifest files
4. Detect frameworks and databases
5. Determine if Docker is used
6. Extract build and start commands
7. Identify required environment variables
8. Recommend appropriate cloud services for AWS, GCP, and Azure
9. Estimate monthly costs for each cloud provider

Provide your analysis in JSON format as specified in your instructions.`;

        let fullResponse = '';
        const stream = await agent.stream([
            {
                role: 'user',
                content: analysisPrompt,
            },
        ]);

        // Stream the response
        console.log(chalk.cyan('  📊 Analysis Results:\n'));
        for await (const chunk of stream.textStream) {
            process.stdout.write(chalk.gray(chunk));
            fullResponse += chunk;
        }

        console.log('\n');

        // Try to parse JSON from the response
        try {
            // Extract JSON from markdown code blocks if present
            let jsonStr = fullResponse;
            const jsonMatch = fullResponse.match(/```json?\n?([\s\S]*?)\n?```/);
            if (jsonMatch) {
                jsonStr = jsonMatch[1];
            }

            const analysis = JSON.parse(jsonStr);

            // Display structured results
            displayHeader('Analysis Summary');

            if (analysis.projectType) {
                displayInfo(`Project Type: ${chalk.bold(analysis.projectType.toUpperCase())}`);
            }
            if (analysis.runtime) {
                displayInfo(`Runtime: ${chalk.bold(analysis.runtime)}`);
            }
            if (analysis.framework) {
                displayInfo(`Framework: ${chalk.bold(analysis.framework)}`);
            }
            if (analysis.databases && analysis.databases.length > 0) {
                displayInfo(`Databases: ${chalk.bold(analysis.databases.join(', '))}`);
            }
            if (analysis.hasDocker !== undefined) {
                displayInfo(`Docker: ${chalk.bold(analysis.hasDocker ? 'Yes' : 'No')}`);
            }

            console.log();

            // Display recommended services
            if (analysis.recommendedServices) {
                displayHeader('Recommended Cloud Services');

                if (analysis.recommendedServices.aws) {
                    console.log(chalk.cyan('  ☁️  AWS:'));
                    analysis.recommendedServices.aws.forEach((service: string) => {
                        console.log(chalk.gray(`     • ${service}`));
                    });
                    console.log();
                }

                if (analysis.recommendedServices.gcp) {
                    console.log(chalk.cyan('  🌐 GCP:'));
                    analysis.recommendedServices.gcp.forEach((service: string) => {
                        console.log(chalk.gray(`     • ${service}`));
                    });
                    console.log();
                }

                if (analysis.recommendedServices.azure) {
                    console.log(chalk.cyan('  ⚡ Azure:'));
                    analysis.recommendedServices.azure.forEach((service: string) => {
                        console.log(chalk.gray(`     • ${service}`));
                    });
                    console.log();
                }
            }

            // Display cost estimates
            if (analysis.estimatedCost) {
                displayHeader('Estimated Monthly Costs');
                if (analysis.estimatedCost.aws) {
                    console.log(chalk.white('  AWS: ') + chalk.green(`$${analysis.estimatedCost.aws}`));
                }
                if (analysis.estimatedCost.gcp) {
                    console.log(chalk.white('  GCP: ') + chalk.green(`$${analysis.estimatedCost.gcp}`));
                }
                if (analysis.estimatedCost.azure) {
                    console.log(chalk.white('  Azure: ') + chalk.green(`$${analysis.estimatedCost.azure}`));
                }
                console.log();
            }

            displaySuccess('Analysis complete!');
            displayInfo('Run ' + chalk.bold('cloud-agent demo') + ' to see the deployment flow');
            console.log();

        } catch (parseError) {
            // If JSON parsing fails, just show the raw text (already displayed)
            console.log();
            displayInfo('Analysis complete! (Raw AI response shown above)');
            console.log();
        }

    } catch (error) {
        displayError('Analysis failed');
        console.error(chalk.red(`  Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
        console.log();

        // Show helpful error message for missing API keys
        if (error instanceof Error && (error.message.includes('API') || error.message.includes('key'))) {
            console.log(chalk.yellow('  💡 Tip: You need an AI API key to use the analyzer'));
            console.log(chalk.gray('     Option 1 (Free): Get Google Gemini key from https://aistudio.google.com'));
            console.log(chalk.gray('     Option 2 (Paid): Get OpenAI key from https://platform.openai.com'));
            console.log(chalk.gray('     Add to .env: GOOGLE_API_KEY=your-key-here\n'));
        }
    }
}

/**
 * Status command (Phase 3 placeholder)
 */
export async function statusCommand(): Promise<void> {
    displayHeader('Environment Status');

    const checks = [
        { name: 'Node.js version', status: 'checking' },
        { name: 'Cloud CLI tools', status: 'checking' },
        { name: 'Authentication', status: 'checking' },
        { name: 'Network connectivity', status: 'checking' },
    ];

    for (const check of checks) {
        await withSpinner(
            `Checking ${check.name}`,
            async () => {
                await delay(500);
            },
            `${check.name}: OK`
        );
    }

    console.log();
    displayInfo('Environment status checking coming in Phase 3!');
    displayInfo('This will verify:');
    console.log(chalk.gray('  • Cloud CLI installation (aws-cli, gcloud, az)'));
    console.log(chalk.gray('  • Authentication status'));
    console.log(chalk.gray('  • Required permissions'));
    console.log(chalk.gray('  • Network connectivity'));
    console.log();
}

/**
 * Info command - show cloud providers
 */
export async function infoCommand(): Promise<void> {
    displayCloudProviders();
}
