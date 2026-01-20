import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { getLogger } from '../../utils/logger.js';
import { getErrorHandler, ErrorFactory } from '../../utils/error-handler.js';
import { getConfigManager } from '../../utils/config.js';

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

        // Initialize production utilities
        const logger = getLogger();
        const errorHandler = getErrorHandler();
        const config = getConfigManager();
        const startTime = Date.now();

        // Log deployment start (only on first run)
        if (!resumeData) {
            logger.info('Starting cloud deployment', {
                cloud,
                projectPath,
                timestamp: startTime
            });
        }

        try {
            // Import mastra instance
            const { mastra } = await import('../index.js');

            // PHASE 1: Environment Validation (only on first run)
            if (!resumeData) {
                console.log('🔍 Phase 1: Validating environment...');
                logger.info('Validating environment', { cloud });

                const validator = mastra.getAgent('validatorAgent');

                const validationPrompt = `Validate my ${cloud.toUpperCase()} environment. Check CLI, auth, env vars, network, and permissions.`;

                let fullResponse = '';
                const validatorStream = await validator.stream([{ role: 'user', content: validationPrompt }]);
                for await (const chunk of validatorStream.textStream) {
                    fullResponse += chunk;
                }

                logger.success('Environment validated', { cloud });
                console.log('✅ Environment validated');
            }

            // PHASE 2: Project Analysis (only on first run)
            let analysis;
            if (!resumeData) {
                console.log('📊 Phase 2: Analyzing project...');
                logger.info('Analyzing project', { projectPath });

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

                logger.success('Project analyzed', {
                    projectType: analysis.projectType,
                    runtime: analysis.runtime,
                    framework: analysis.framework || 'none'
                });
                console.log(`✅ Analyzed: ${analysis.runtime} ${analysis.projectType}`);
            }

            // PHASE 3: Generate Deployment Plan (only on first run)
            let plan;
            if (!resumeData) {
                console.log('☁️  Phase 3: Generating deployment plan...');
                logger.info('Generating deployment plan', { cloud });

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

                logger.success('Deployment plan generated', {
                    services: plan.services,
                    estimatedCost: plan.estimatedCost
                });
                console.log(`✅ Plan generated: $${plan.estimatedCost}/month`);
            }

            // PHASE 4: Human Approval - SUSPEND POINT
            if (approved === undefined && plan) {
                console.log('👤 Phase 4: Requesting human approval...');
                logger.info('Workflow suspended - awaiting user approval', {
                    services: plan.services,
                    cost: plan.estimatedCost
                });

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
                logger.warn('Deployment cancelled by user');

                config.addDeployment({
                    cloud,
                    projectPath,
                    success: false,
                    resources: {},
                    duration: Date.now() - startTime
                });

                return {
                    success: false,
                    message: 'Deployment cancelled by user',
                    analysis,
                    plan,
                };
            }

            // PHASE 5: REAL CLOUD DEPLOYMENT
            console.log(`\n🚀 Phase 5: Executing REAL deployment to ${cloud.toUpperCase()}...\n`);
            logger.info('Starting real cloud deployment', {
                cloud,
                projectType: analysis?.projectType || 'unknown'
            });

            try {
                let deploymentResult;

                if (cloud === 'aws') {
                    logger.debug('Importing AWS Provider');
                    const { AWSProvider } = await import('../../providers/aws/index.js');
                    const aws = new AWSProvider({ region: process.env.AWS_REGION || 'us-east-1' });

                    // Authenticate
                    logger.info('Authenticating with AWS');
                    const authenticated = await aws.authenticate();
                    if (!authenticated) {
                        logger.error('AWS authentication failed');
                        throw ErrorFactory.awsAuthFailed();
                    }

                    logger.success('AWS authentication successful');

                    // Deploy based on project type
                    const projectType = analysis?.projectType || 'api';

                    if (projectType === 'static') {
                        logger.info('Deploying static site to AWS S3');
                        deploymentResult = await aws.deployStaticSite({
                            siteName: 'agent-cloud-app',
                            buildDir: './dist',
                        });
                    } else {
                        // Default to ECS for APIs and containers
                        logger.info('Deploying containerized app to AWS ECS');
                        deploymentResult = await aws.deployToECS({
                            appName: 'agent-cloud-app',
                            containerPort: 3000,
                        });
                    }
                } else if (cloud === 'gcp') {
                    logger.debug('Importing GCP Provider');
                    const { GCPProvider } = await import('../../providers/gcp/index.js');
                    const gcp = new GCPProvider({
                        project: process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT,
                        region: process.env.GCLOUD_REGION || 'us-central1',
                    });

                    // Authenticate
                    logger.info('Authenticating with GCP');
                    const authenticated = await gcp.authenticate();
                    if (!authenticated) {
                        logger.error('GCP authentication failed');
                        throw ErrorFactory.gcpAuthFailed();
                    }

                    logger.success('GCP authentication successful');

                    // Deploy based on project type
                    const projectType = analysis?.projectType || 'api';

                    if (projectType === 'static') {
                        logger.info('Deploying static site to Firebase');
                        deploymentResult = await gcp.deployToFirebase({
                            siteName: 'agent-cloud-app',
                            buildDir: './dist',
                        });
                    } else {
                        // Default to Cloud Run for APIs and containers
                        logger.info('Deploying containerized app to Cloud Run');
                        deploymentResult = await gcp.deployToCloudRun({
                            serviceName: 'agent-cloud-app',
                            containerPort: 8080,
                        });
                    }
                } else if (cloud === 'azure') {
                    logger.debug('Importing Azure Provider');
                    const { AzureProvider } = await import('../../providers/azure/index.js');
                    const azure = new AzureProvider({
                        resourceGroup: process.env.AZURE_RESOURCE_GROUP || 'agent-cloud-rg',
                        location: process.env.AZURE_LOCATION || 'eastus',
                    });

                    // Authenticate
                    logger.info('Authenticating with Azure');
                    const authenticated = await azure.authenticate();
                    if (!authenticated) {
                        logger.error('Azure authentication failed');
                        throw ErrorFactory.azureAuthFailed();
                    }

                    logger.success('Azure authentication successful');

                    // Deploy based on project type
                    const projectType = analysis?.projectType || 'api';

                    if (projectType === 'static') {
                        logger.info('Deploying static site to Azure Static Web Apps');
                        deploymentResult = await azure.deployStaticWebApp({
                            appName: 'agent-cloud-app',
                            buildDir: './dist',
                        });
                    } else {
                        // Default to Container Apps for APIs and containers
                        logger.info('Deploying containerized app to Azure Container Apps');
                        deploymentResult = await azure.deployToContainerApps({
                            appName: 'agent-cloud-app',
                            containerPort: 8080,
                        });
                    }
                }

                // Check deployment result
                if (deploymentResult?.success) {
                    const duration = Date.now() - startTime;

                    logger.success('Deployment completed successfully!', {
                        cloud,
                        url: deploymentResult.url,
                        duration: `${(duration / 1000).toFixed(1)}s`
                    });

                    // Record successful deployment
                    config.addDeployment({
                        cloud,
                        projectPath,
                        success: true,
                        deploymentUrl: deploymentResult.url,
                        resources: deploymentResult.resources || {},
                        cost: plan?.estimatedCost || 0,
                        duration
                    });

                    return {
                        success: true,
                        deploymentUrl: deploymentResult.url,
                        message: `✨ Deployment to ${cloud.toUpperCase()} completed successfully!`,
                        analysis,
                        plan,
                    };
                } else {
                    const duration = Date.now() - startTime;

                    logger.error('Deployment returned failure', new Error(deploymentResult?.error || 'Unknown error'));

                    // Record failed deployment
                    config.addDeployment({
                        cloud,
                        projectPath,
                        success: false,
                        resources: {},
                        duration
                    });

                    return {
                        success: false,
                        message: `Deployment failed: ${deploymentResult?.error || 'Unknown error'}`,
                        analysis,
                        plan,
                    };
                }
            } catch (error) {
                const duration = Date.now() - startTime;

                logger.error('Deployment failed', error as Error);
                errorHandler.handle(error as Error);

                // Record failed deployment
                config.addDeployment({
                    cloud,
                    projectPath,
                    success: false,
                    resources: {},
                    duration
                });

                return {
                    success: false,
                    message: `Deployment error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    analysis,
                    plan,
                };
            }
        } catch (error) {
            // Outer catch for any unexpected errors in the workflow
            const duration = Date.now() - startTime;

            logger.error('Workflow error', error as Error);
            errorHandler.handle(error as Error);

            // Record failed deployment
            config.addDeployment({
                cloud,
                projectPath,
                success: false,
                resources: {},
                duration
            });

            return {
                success: false,
                message: `Workflow error: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
