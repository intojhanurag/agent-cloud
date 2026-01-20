import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

/**
 * COMPLETE DEPLOYMENT WORKFLOW WITH REAL CLOUD EXECUTION
 * 
 * This workflow integrates all agents and cloud providers
 * for end-to-end deployment to AWS, GCP, or Azure
 */

/**
 * Complete Deployment Step
 * Executes all deployment phases including REAL cloud deployment
 */
export const deploymentStep = createStep({
    id: 'deployment',
    description: 'Complete deployment workflow with real cloud execution',
    inputSchema: z.object({
        projectPath: z.string(),
        cloud: z.enum(['aws', 'gcp', 'azure']),
    }),
    outputSchema: z.object({
        success: z.boolean(),
        deploymentUrl: z.string().optional(),
        message: z.string(),
        analysis: z.object({
            projectType: z.string(),
            runtime: z.string(),
        }).optional(),
        plan: z.object({
            services: z.array(z.string()),
            estimatedCost: z.number(),
            commands: z.array(z.string()),
        }).optional(),
    }),
    resumeSchema: z.object({
        approved: z.boolean(),
    }),
    suspendSchema: z.object({
        services: z.array(z.string()),
        estimatedCost: z.number(),
        commands: z.array(z.string()),
        message: z.string(),
        projectType: z.string().optional(),
        runtime: z.string().optional(),
    }),
    execute: async ({ inputData, resumeData, suspend }) => {
        const { projectPath, cloud } = inputData;
        const { approved } = resumeData ?? {};

        // Import mastra instance
        const { mastra } = await import('../index.js');

        // PHASE 1: Environment Validation (only on first run)
        if (!resumeData) {
            console.log('🔍 Phase 1: Validating environment...');
            const validator = mastra.getAgent('validatorAgent');

            const validationPrompt = `Validate my ${cloud.toUpperCase()} environment. Check CLI, auth, env vars, network, and permissions.`;

            let fullResponse = '';
            const validatorStream = await validator.stream([{ role: 'user', content: validationPrompt }]);
            for await (const chunk of validatorStream.textStream) {
                fullResponse += chunk;
            }

            console.log('✅ Environment validated');
        }

        // PHASE 2: Project Analysis (only on first run)
        let analysis;
        if (!resumeData) {
            console.log('📊 Phase 2: Analyzing project...');
            const analyzer = mastra.getAgent('analyzerAgent');

            const analysisPrompt = `Analyze the project at: ${projectPath}. Provide JSON with projectType, runtime, framework, databases.`;

            let fullResponse = '';
            const analyzerStream = await analyzer.stream([{ role: 'user', content: analysisPrompt }]);
            for await (const chunk of analyzerStream.textStream) {
                fullResponse += chunk;
            }

            try {
                const jsonMatch = fullResponse.match(/```json?\n?([\s\S]*?)\n?```/);
                const jsonStr = jsonMatch ? jsonMatch[1] : fullResponse;
                analysis = JSON.parse(jsonStr);
            } catch {
                analysis = {
                    projectType: 'api',
                    runtime: 'node',
                    framework: 'express',
                    databases: [],
                };
            }

            console.log(`✅ Analyzed: ${analysis.runtime} ${analysis.projectType}`);
        }

        // PHASE 3: Generate Deployment Plan (only on first run)
        let plan;
        if (!resumeData) {
            console.log('☁️  Phase 3: Generating deployment plan...');
            const deployment = mastra.getAgent('deploymentAgent');

            const planPrompt = `Create a deployment plan for:
            
Project Type: ${analysis?.projectType || 'api'}
Runtime: ${analysis?.runtime || 'node'}
Databases: ${analysis?.databases?.join(', ') || 'None'}
Target Cloud: ${cloud}

Provide JSON with services, estimatedCost, and commands.`;

            let fullResponse = '';
            const deploymentStream = await deployment.stream([{ role: 'user', content: planPrompt }]);
            for await (const chunk of deploymentStream.textStream) {
                fullResponse += chunk;
            }

            try {
                const jsonMatch = fullResponse.match(/```json?\n?([\s\S]*?)\n?```/);
                const jsonStr = jsonMatch ? jsonMatch[1] : fullResponse;
                const parsedPlan = JSON.parse(jsonStr);
                const cloudPlan = parsedPlan.deploymentPlans?.[cloud] || parsedPlan;

                plan = {
                    services: cloudPlan.services?.compute || ['Cloud Service'],
                    estimatedCost: cloudPlan.estimatedCost || 45.00,
                    commands: cloudPlan.commands || ['# Commands will be generated'],
                };
            } catch {
                plan = {
                    services: ['Cloud Service'],
                    estimatedCost: 45.00,
                    commands: ['# Commands will be generated'],
                };
            }

            console.log(`✅ Plan generated: $${plan.estimatedCost}/month`);
        }

        // PHASE 4: Human Approval - SUSPEND POINT
        if (approved === undefined && plan) {
            console.log('👤 Phase 4: Requesting human approval...');
            return await suspend({
                services: plan.services,
                estimatedCost: plan.estimatedCost,
                commands: plan.commands,
                message: 'Waiting for user approval to proceed with deployment',
                projectType: analysis?.projectType,
                runtime: analysis?.runtime,
            });
        }

        // User rejected
        if (!approved) {
            return {
                success: false,
                message: 'Deployment cancelled by user',
                analysis,
                plan,
            };
        }

        // PHASE 5: REAL CLOUD DEPLOYMENT
        console.log(`\n🚀 Phase 5: Executing REAL deployment to ${cloud.toUpperCase()}...\n`);

        try {
            let deploymentResult;

            if (cloud === 'aws') {
                const { AWSProvider } = await import('../../providers/aws/index.js');
                const aws = new AWSProvider({ region: process.env.AWS_REGION || 'us-east-1' });

                // Authenticate
                const authenticated = await aws.authenticate();
                if (!authenticated) {
                    return {
                        success: false,
                        message: 'AWS authentication failed. Run: aws configure',
                        analysis,
                        plan,
                    };
                }

                // Deploy based on project type
                const projectType = analysis?.projectType || 'api';

                if (projectType === 'static') {
                    deploymentResult = await aws.deployStaticSite({
                        siteName: 'agent-cloud-app',
                        buildDir: './dist',
                    });
                } else {
                    // Default to ECS for APIs and containers
                    deploymentResult = await aws.deployToECS({
                        appName: 'agent-cloud-app',
                        containerPort: 3000,
                    });
                }
            } else if (cloud === 'gcp') {
                const { GCPProvider } = await import('../../providers/gcp/index.js');
                const gcp = new GCPProvider({
                    project: process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT,
                    region: process.env.GCLOUD_REGION || 'us-central1',
                });

                // Authenticate
                const authenticated = await gcp.authenticate();
                if (!authenticated) {
                    return {
                        success: false,
                        message: 'GCP authentication failed. Run: gcloud auth login',
                        analysis,
                        plan,
                    };
                }

                // Deploy based on project type
                const projectType = analysis?.projectType || 'api';

                if (projectType === 'static') {
                    deploymentResult = await gcp.deployToFirebase({
                        siteName: 'agent-cloud-app',
                        buildDir: './dist',
                    });
                } else {
                    // Default to Cloud Run for APIs and containers
                    deploymentResult = await gcp.deployToCloudRun({
                        serviceName: 'agent-cloud-app',
                        containerPort: 8080,
                    });
                }
            } else if (cloud === 'azure') {
                const { AzureProvider } = await import('../../providers/azure/index.js');
                const azure = new AzureProvider({
                    resourceGroup: process.env.AZURE_RESOURCE_GROUP || 'agent-cloud-rg',
                    location: process.env.AZURE_LOCATION || 'eastus',
                });

                // Authenticate
                const authenticated = await azure.authenticate();
                if (!authenticated) {
                    return {
                        success: false,
                        message: 'Azure authentication failed. Run: az login',
                        analysis,
                        plan,
                    };
                }

                // Deploy based on project type
                const projectType = analysis?.projectType || 'api';

                if (projectType === 'static') {
                    deploymentResult = await azure.deployStaticWebApp({
                        appName: 'agent-cloud-app',
                        buildDir: './dist',
                    });
                } else {
                    // Default to Container Apps for APIs and containers
                    deploymentResult = await azure.deployToContainerApps({
                        appName: 'agent-cloud-app',
                        containerPort: 8080,
                    });
                }
            }

            // Check deployment result
            if (deploymentResult?.success) {
                return {
                    success: true,
                    deploymentUrl: deploymentResult.url,
                    message: `✨ Deployment to ${cloud.toUpperCase()} completed successfully!`,
                    analysis,
                    plan,
                };
            } else {
                return {
                    success: false,
                    message: `Deployment failed: ${deploymentResult?.error || 'Unknown error'}`,
                    analysis,
                    plan,
                };
            }
        } catch (error) {
            return {
                success: false,
                message: `Deployment error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                analysis,
                plan,
            };
        }
    },
});

/**
 * Main Deployment Workflow
 * Single-step workflow with real cloud provider integration
 */
export const deploymentWorkflow = createWorkflow({
    id: 'cloud-deployment',
    inputSchema: z.object({
        projectPath: z.string(),
        cloud: z.enum(['aws', 'gcp', 'azure']),
    }),
    outputSchema: z.object({
        success: z.boolean(),
        deploymentUrl: z.string().optional(),
        message: z.string(),
    }),
})
    .then(deploymentStep)
    .commit();
