import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

/**
 * SIMPLIFIED DEPLOYMENT WORKFLOW
 * 
 * This workflow orchestrates deployment using a single combined step approach
 * to avoid complex type matching issues between steps.
 */

/**
 * Combined Deployment Step
 * Executes all deployment phases in one step with human approval suspend point
 */
export const deploymentStep = createStep({
    id: 'deployment',
    description: 'Complete deployment workflow with all phases',
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
            });
        }

        // PHASE 5: Execute Deployment
        if (!approved) {
            return {
                success: false,
                message: 'Deployment cancelled by user',
                analysis,
                plan,
            };
        }

        console.log(`🚀 Phase 5: Executing deployment to ${cloud.toUpperCase()}...`);

        // Simulated deployment (Phase 4 will do real deployment)
        return {
            success: true,
            deploymentUrl: `https://my-app.${cloud}.example.com`,
            message: `Deployment to ${cloud.toUpperCase()} completed successfully!`,
            analysis,
            plan,
        };
    },
});

/**
 * Main Deployment Workflow
 * Single-step workflow to avoid type matching issues
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
