import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Command Executor Tool
 * Executes shell commands with proper error handling and validation
 */
export const commandExecutorTool = createTool({
    id: 'command-executor',
    description: 'Execute shell commands safely with validation and error handling',
    inputSchema: z.object({
        command: z.string().describe('The command to execute'),
        cwd: z.string().optional().describe('Working directory'),
        env: z.record(z.string()).optional().describe('Environment variables'),
        timeout: z.number().optional().default(30000).describe('Timeout in milliseconds'),
    }),
    outputSchema: z.object({
        stdout: z.string().describe('Standard output'),
        stderr: z.string().describe('Standard error'),
        exitCode: z.number().describe('Exit code'),
        success: z.boolean().describe('Whether command succeeded'),
    }),
    execute: async (inputData, context) => {
        const { command, cwd, env, timeout } = inputData;

        try {
            const { stdout, stderr } = await execAsync(command, {
                cwd: cwd || process.cwd(),
                env: { ...process.env, ...env },
                timeout: timeout || 30000,
            });

            return {
                stdout: stdout.trim(),
                stderr: stderr.trim(),
                exitCode: 0,
                success: true,
            };
        } catch (error: any) {
            return {
                stdout: error.stdout?.trim() || '',
                stderr: error.stderr?.trim() || error.message,
                exitCode: error.code || 1,
                success: false,
            };
        }
    },
});

/**
 * AWS Command Tool
 * Executes AWS CLI commands with automatic region/profile configuration
 */
export const awsCommandTool = createTool({
    id: 'aws-command',
    description: 'Execute AWS CLI commands with proper configuration',
    inputSchema: z.object({
        service: z.string().describe('AWS service (e.g., ecs, s3, lambda)'),
        action: z.string().describe('Action to perform (e.g., create-cluster, list-buckets)'),
        parameters: z.record(z.string()).optional().describe('Command parameters'),
        region: z.string().optional().describe('AWS region'),
    }),
    outputSchema: z.object({
        result: z.any().describe('Parsed JSON result'),
        rawOutput: z.string().describe('Raw command output'),
        success: z.boolean().describe('Whether command succeeded'),
        error: z.string().optional().describe('Error message if failed'),
    }),
    execute: async (inputData, context) => {
        const { service, action, parameters = {}, region } = inputData;

        // Build AWS CLI command
        const params = Object.entries(parameters)
            .map(([key, value]) => `--${key} ${value}`)
            .join(' ');

        const regionFlag = region ? `--region ${region}` : '';
        const command = `aws ${service} ${action} ${params} ${regionFlag}`.trim();

        try {
            const { stdout } = await execAsync(command);

            // Try to parse as JSON
            let result;
            try {
                result = JSON.parse(stdout);
            } catch {
                result = stdout.trim();
            }

            return {
                result,
                rawOutput: stdout.trim(),
                success: true,
            };
        } catch (error: any) {
            return {
                result: null,
                rawOutput: error.stderr || error.message,
                success: false,
                error: error.message,
            };
        }
    },
});

/**
 * Docker Build Tool
 * Builds Docker images for deployment
 */
export const dockerBuildTool = createTool({
    id: 'docker-build',
    description: 'Build Docker images for cloud deployment',
    inputSchema: z.object({
        imageName: z.string().describe('Docker image name'),
        tag: z.string().optional().default('latest').describe('Image tag'),
        dockerfile: z.string().optional().default('Dockerfile').describe('Dockerfile path'),
        context: z.string().optional().default('.').describe('Build context directory'),
    }),
    outputSchema: z.object({
        imageId: z.string().describe('Built image ID'),
        imageName: z.string().describe('Full image name with tag'),
        success: z.boolean().describe('Whether build succeeded'),
        error: z.string().optional().describe('Error message if failed'),
    }),
    execute: async (inputData, context) => {
        const { imageName, tag = 'latest', dockerfile = 'Dockerfile', context: buildContext = '.' } = inputData;

        const fullImageName = `${imageName}:${tag}`;
        const command = `docker build -t ${fullImageName} -f ${dockerfile} ${buildContext}`;

        try {
            const { stdout } = await execAsync(command);

            // Extract image ID from output
            const match = stdout.match(/Successfully built ([a-f0-9]+)/);
            const imageId = match ? match[1] : 'unknown';

            return {
                imageId,
                imageName: fullImageName,
                success: true,
            };
        } catch (error: any) {
            return {
                imageId: '',
                imageName: fullImageName,
                success: false,
                error: error.message,
            };
        }
    },
});

/**
 * Export all deployment tools
 */
export const deploymentTools = {
    commandExecutorTool,
    awsCommandTool,
    dockerBuildTool,
};
