import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * CLI Checker Tool
 * Checks if cloud CLI tools are installed and their versions
 */
export const cliCheckerTool = createTool({
    id: 'cli-checker',
    description: 'Check if cloud CLI tools (aws-cli, gcloud, az) are installed and get their versions.',
    inputSchema: z.object({
        cloud: z.enum(['aws', 'gcp', 'azure']),
    }),
    outputSchema: z.object({
        installed: z.boolean(),
        version: z.string().optional(),
        command: z.string(),
        installUrl: z.string(),
        error: z.string().optional(),
    }),
    execute: async (inputData, context) => {
        const { cloud } = inputData;

        const cliCommands = {
            aws: {
                command: 'aws',
                versionFlag: '--version',
                installUrl: 'https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html',
            },
            gcp: {
                command: 'gcloud',
                versionFlag: '--version',
                installUrl: 'https://cloud.google.com/sdk/docs/install',
            },
            azure: {
                command: 'az',
                versionFlag: '--version',
                installUrl: 'https://learn.microsoft.com/en-us/cli/azure/install-azure-cli',
            },
        };

        const cli = cliCommands[cloud];

        try {
            const { stdout } = await execAsync(`${cli.command} ${cli.versionFlag}`);
            const version = stdout.trim().split('\n')[0];

            return {
                installed: true,
                version,
                command: cli.command,
                installUrl: cli.installUrl,
            };
        } catch (error) {
            return {
                installed: false,
                command: cli.command,
                installUrl: cli.installUrl,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    },
});

/**
 * Authentication Checker Tool
 * Verifies if user is authenticated with the cloud provider
 */
export const authCheckerTool = createTool({
    id: 'auth-checker',
    description: 'Check if the user is authenticated with the cloud provider.',
    inputSchema: z.object({
        cloud: z.enum(['aws', 'gcp', 'azure']),
    }),
    outputSchema: z.object({
        authenticated: z.boolean(),
        identity: z.string().optional(),
        region: z.string().optional(),
        account: z.string().optional(),
        error: z.string().optional(),
    }),
    execute: async (inputData, context) => {
        const { cloud } = inputData;

        try {
            if (cloud === 'aws') {
                // Check AWS authentication
                const { stdout } = await execAsync('aws sts get-caller-identity');
                const identity = JSON.parse(stdout);

                // Get default region
                let region: string | undefined;
                try {
                    const { stdout: regionOut } = await execAsync('aws configure get region');
                    region = regionOut.trim();
                } catch {
                    region = 'us-east-1';
                }

                return {
                    authenticated: true,
                    identity: identity.Arn,
                    account: identity.Account,
                    region,
                };
            } else if (cloud === 'gcp') {
                // Check GCP authentication
                const { stdout } = await execAsync('gcloud auth list --format=json');
                const accounts = JSON.parse(stdout);
                const activeAccount = accounts.find((acc: any) => acc.status === 'ACTIVE');

                if (!activeAccount) {
                    return {
                        authenticated: false,
                        error: 'No active account found',
                    };
                }

                // Get project
                let project: string | undefined;
                try {
                    const { stdout: projectOut } = await execAsync('gcloud config get-value project');
                    project = projectOut.trim();
                } catch {
                    project = undefined;
                }

                return {
                    authenticated: true,
                    identity: activeAccount.account,
                    account: project,
                };
            } else if (cloud === 'azure') {
                // Check Azure authentication
                const { stdout } = await execAsync('az account show');
                const account = JSON.parse(stdout);

                return {
                    authenticated: true,
                    identity: account.user.name,
                    account: account.name,
                    region: account.user.tenantId,
                };
            }

            return {
                authenticated: false,
                error: 'Unknown cloud provider',
            };
        } catch (error) {
            return {
                authenticated: false,
                error: error instanceof Error ? error.message : 'Authentication check failed',
            };
        }
    },
});

/**
 * Environment Variable Checker Tool
 * Checks if required environment variables are set
 */
export const envVarCheckerTool = createTool({
    id: 'env-var-checker',
    description: 'Check if required environment variables are set for the cloud provider.',
    inputSchema: z.object({
        cloud: z.enum(['aws', 'gcp', 'azure']),
    }),
    outputSchema: z.object({
        allSet: z.boolean(),
        missing: z.array(z.string()),
        present: z.array(z.string()),
        optional: z.array(z.string()),
    }),
    execute: async (inputData, context) => {
        const { cloud } = inputData;

        const requiredVars: Record<string, string[]> = {
            aws: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'],
            gcp: ['GOOGLE_APPLICATION_CREDENTIALS', 'GCLOUD_PROJECT'],
            azure: ['AZURE_SUBSCRIPTION_ID', 'AZURE_TENANT_ID'],
        };

        const optionalVars: Record<string, string[]> = {
            aws: ['AWS_REGION', 'AWS_DEFAULT_REGION'],
            gcp: ['GOOGLE_CLOUD_PROJECT'],
            azure: ['AZURE_RESOURCE_GROUP'],
        };

        const required = requiredVars[cloud] || [];
        const optional = optionalVars[cloud] || [];

        const missing: string[] = [];
        const present: string[] = [];

        for (const varName of required) {
            if (process.env[varName]) {
                present.push(varName);
            } else {
                missing.push(varName);
            }
        }

        return {
            allSet: missing.length === 0,
            missing,
            present,
            optional,
        };
    },
});

/**
 * Network Connectivity Checker Tool
 * Verifies network connectivity to cloud provider APIs
 */
export const networkCheckerTool = createTool({
    id: 'network-checker',
    description: 'Check network connectivity to cloud provider APIs.',
    inputSchema: z.object({
        cloud: z.enum(['aws', 'gcp', 'azure']),
    }),
    outputSchema: z.object({
        connected: z.boolean(),
        latency: z.number().optional(),
        endpoint: z.string(),
        error: z.string().optional(),
    }),
    execute: async (inputData, context) => {
        const { cloud } = inputData;

        const endpoints: Record<string, string> = {
            aws: 'aws.amazon.com',
            gcp: 'cloud.google.com',
            azure: 'azure.microsoft.com',
        };

        const endpoint = endpoints[cloud];

        try {
            const startTime = Date.now();

            // Simple ping using curl to check connectivity
            await execAsync(`curl -s -o /dev/null -w "%{http_code}" https://${endpoint} --max-time 5`);

            const latency = Date.now() - startTime;

            return {
                connected: true,
                latency,
                endpoint: `https://${endpoint}`,
            };
        } catch (error) {
            return {
                connected: false,
                endpoint: `https://${endpoint}`,
                error: error instanceof Error ? error.message : 'Connection failed',
            };
        }
    },
});

/**
 * Permissions Checker Tool
 * Attempts to verify basic permissions by running simple commands
 */
export const permissionsCheckerTool = createTool({
    id: 'permissions-checker',
    description: 'Check if user has basic permissions to perform cloud operations.',
    inputSchema: z.object({
        cloud: z.enum(['aws', 'gcp', 'azure']),
    }),
    outputSchema: z.object({
        hasBasicPermissions: z.boolean(),
        canList: z.boolean(),
        canCreate: z.boolean().optional(),
        suggestions: z.array(z.string()),
        error: z.string().optional(),
    }),
    execute: async (inputData, context) => {
        const { cloud } = inputData;
        const suggestions: string[] = [];

        try {
            if (cloud === 'aws') {
                // Try to list S3 buckets (basic read permission)
                try {
                    await execAsync('aws s3 ls');
                    return {
                        hasBasicPermissions: true,
                        canList: true,
                        suggestions: ['User has S3 list permissions'],
                    };
                } catch {
                    suggestions.push('User may need IAM permissions for S3');
                    suggestions.push('Required: s3:ListAllMyBuckets');
                    return {
                        hasBasicPermissions: false,
                        canList: false,
                        suggestions,
                    };
                }
            } else if (cloud === 'gcp') {
                // Try to list projects
                try {
                    await execAsync('gcloud projects list --limit=1');
                    return {
                        hasBasicPermissions: true,
                        canList: true,
                        suggestions: ['User has project list permissions'],
                    };
                } catch {
                    suggestions.push('User may need resourcemanager.projects.list permission');
                    return {
                        hasBasicPermissions: false,
                        canList: false,
                        suggestions,
                    };
                }
            } else if (cloud === 'azure') {
                // Try to list resource groups
                try {
                    await execAsync('az group list');
                    return {
                        hasBasicPermissions: true,
                        canList: true,
                        suggestions: ['User has resource group list permissions'],
                    };
                } catch {
                    suggestions.push('User may need Reader role on subscription');
                    return {
                        hasBasicPermissions: false,
                        canList: false,
                        suggestions,
                    };
                }
            }

            return {
                hasBasicPermissions: false,
                canList: false,
                suggestions: ['Unknown cloud provider'],
            };
        } catch (error) {
            return {
                hasBasicPermissions: false,
                canList: false,
                suggestions: ['Failed to check permissions'],
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    },
});
