import inquirer from 'inquirer';
import chalk from 'chalk';
import type { CloudProvider, DeploymentRequirements, CloudProviderConfig } from '../types/index.js';
import { displayHeader, displayInfo, displayDivider } from './banner.js';

/**
 * Cloud provider configurations
 */
const CLOUD_PROVIDERS: Record<CloudProvider, CloudProviderConfig> = {
    aws: {
        name: 'aws',
        displayName: 'Amazon Web Services (AWS)',
        description: 'Industry-leading cloud platform with extensive services',
        icon: '☁️',
        requiresCLI: 'aws-cli',
        docsUrl: 'https://aws.amazon.com/cli/',
    },
    gcp: {
        name: 'gcp',
        displayName: 'Google Cloud Platform (GCP)',
        description: 'Powerful infrastructure with advanced AI/ML capabilities',
        icon: '🌐',
        requiresCLI: 'gcloud',
        docsUrl: 'https://cloud.google.com/sdk/gcloud',
    },
    azure: {
        name: 'azure',
        displayName: 'Microsoft Azure',
        description: 'Enterprise-grade cloud with seamless Microsoft integration',
        icon: '⚡',
        requiresCLI: 'az',
        docsUrl: 'https://docs.microsoft.com/cli/azure/',
    },
};

/**
 * Welcome message for the interactive prompt
 */
function displayWelcome(): void {
    displayHeader('Welcome to Agent-Cloud Deployment');
    console.log(chalk.white('  I\'ll help you deploy your application to the cloud with AI-powered assistance.'));
    console.log(chalk.gray('  Let\'s start by understanding your requirements.\n'));
    displayDivider();
    console.log();
}

/**
 * Collect deployment requirements from user
 */
export async function collectDeploymentRequirements(
    options: { cloud?: CloudProvider; yes?: boolean } = {}
): Promise<DeploymentRequirements> {
    displayWelcome();

    const questions: any[] = [];

    // Ask for deployment description if not in auto-approve mode
    if (!options.yes) {
        questions.push({
            type: 'input',
            name: 'description',
            message: chalk.cyan('📝 Describe what you want to deploy:'),
            default: 'My application',
            validate: (input: string) => {
                if (!input || input.trim().length === 0) {
                    return 'Please provide a description';
                }
                if (input.trim().length < 3) {
                    return 'Description should be at least 3 characters';
                }
                return true;
            },
        });
    }

    // Ask for cloud provider if not specified
    if (!options.cloud) {
        questions.push({
            type: 'list',
            name: 'cloudProvider',
            message: chalk.cyan('☁️  Select your cloud provider:'),
            choices: [
                {
                    name: `${CLOUD_PROVIDERS.aws.icon}  ${CLOUD_PROVIDERS.aws.displayName}\n     ${chalk.gray(CLOUD_PROVIDERS.aws.description)}`,
                    value: 'aws',
                    short: 'AWS',
                },
                {
                    name: `${CLOUD_PROVIDERS.gcp.icon}  ${CLOUD_PROVIDERS.gcp.displayName}\n     ${chalk.gray(CLOUD_PROVIDERS.gcp.description)}`,
                    value: 'gcp',
                    short: 'GCP',
                },
                {
                    name: `${CLOUD_PROVIDERS.azure.icon}  ${CLOUD_PROVIDERS.azure.displayName}\n     ${chalk.gray(CLOUD_PROVIDERS.azure.description)}`,
                    value: 'azure',
                    short: 'Azure',
                },
            ],
            pageSize: 3,
        });
    }

    // Collect answers
    const answers = await inquirer.prompt(questions);

    const requirements: DeploymentRequirements = {
        description: options.yes ? 'Auto-approved deployment' : answers.description,
        cloudProvider: options.cloud || answers.cloudProvider,
        projectPath: process.cwd(),
        autoApprove: options.yes || false,
    };

    // Display selection summary
    console.log();
    displayDivider();
    displayInfo(`Selected provider: ${chalk.bold(CLOUD_PROVIDERS[requirements.cloudProvider].displayName)}`);
    displayInfo(`Project path: ${chalk.bold(requirements.projectPath)}`);
    console.log();

    return requirements;
}

/**
 * Confirm deployment plan with user
 */
export async function confirmDeploymentPlan(
    plan: {
        services: string[];
        estimatedCost: number;
        commands: string[];
    }
): Promise<boolean> {
    displayHeader('Deployment Plan Review');

    console.log(chalk.white('  📋 Services to deploy:'));
    plan.services.forEach((service, index) => {
        console.log(chalk.gray(`     ${index + 1}. ${service}`));
    });
    console.log();

    console.log(chalk.white(`  💰 Estimated monthly cost: ${chalk.bold.green(`$${plan.estimatedCost}`)}`));
    console.log();

    console.log(chalk.white('  🔧 Commands to execute:'));
    plan.commands.forEach((cmd, index) => {
        console.log(chalk.gray(`     ${index + 1}. ${cmd}`));
    });
    console.log();

    displayDivider();
    console.log();

    const { confirm } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirm',
            message: chalk.yellow('❓ Do you want to proceed with this deployment plan?'),
            default: false,
        },
    ]);

    return confirm;
}

/**
 * Ask for environment variables
 */
export async function collectEnvironmentVariables(
    requiredVars: string[]
): Promise<Record<string, string>> {
    if (requiredVars.length === 0) {
        return {};
    }

    displayHeader('Environment Variables');
    console.log(chalk.white('  🔐 The following environment variables are required:\n'));

    const questions: any[] = requiredVars.map(varName => ({
        type: 'password',
        name: varName,
        message: chalk.cyan(`Enter value for ${chalk.bold(varName)}:`),
        mask: '*',
        validate: (input: string) => {
            if (!input || input.trim().length === 0) {
                return `${varName} is required`;
            }
            return true;
        },
    }));

    const envVars = await inquirer.prompt(questions);
    console.log();
    displayInfo(`Collected ${Object.keys(envVars).length} environment variable(s)`);
    console.log();

    return envVars;
}

/**
 * Show loading state while performing an action
 */
export async function withLoadingMessage<T>(
    message: string,
    action: () => Promise<T>
): Promise<T> {
    console.log(chalk.cyan(`\n  ⏳ ${message}...`));

    try {
        const result = await action();
        console.log(chalk.green(`  ✓ ${message} - Done`));
        return result;
    } catch (error) {
        console.log(chalk.red(`  ✗ ${message} - Failed`));
        throw error;
    }
}

/**
 * Select from a list of options
 */
export async function selectFromList<T extends string>(
    message: string,
    choices: { name: string; value: T; description?: string }[]
): Promise<T> {
    const { selected } = await inquirer.prompt([
        {
            type: 'list',
            name: 'selected',
            message: chalk.cyan(message),
            choices: choices.map(choice => ({
                name: choice.description
                    ? `${choice.name}\n     ${chalk.gray(choice.description)}`
                    : choice.name,
                value: choice.value,
                short: choice.name,
            })),
            pageSize: Math.min(choices.length, 10),
        },
    ]);

    return selected;
}

/**
 * Get text input from user
 */
export async function getTextInput(
    message: string,
    defaultValue?: string,
    validator?: (input: string) => boolean | string
): Promise<string> {
    const { input } = await inquirer.prompt([
        {
            type: 'input',
            name: 'input',
            message: chalk.cyan(message),
            default: defaultValue,
            validate: validator,
        },
    ]);

    return input;
}

/**
 * Get yes/no confirmation
 */
export async function getConfirmation(
    message: string,
    defaultValue: boolean = false
): Promise<boolean> {
    const { confirmed } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirmed',
            message: chalk.cyan(message),
            default: defaultValue,
        },
    ]);

    return confirmed;
}

/**
 * Get cloud provider configuration
 */
export function getCloudProviderConfig(provider: CloudProvider): CloudProviderConfig {
    return CLOUD_PROVIDERS[provider];
}

/**
 * Display all available cloud providers
 */
export function displayCloudProviders(): void {
    displayHeader('Available Cloud Providers');

    Object.values(CLOUD_PROVIDERS).forEach(provider => {
        console.log(`  ${provider.icon}  ${chalk.bold(provider.displayName)}`);
        console.log(`     ${chalk.gray(provider.description)}`);
        console.log(`     ${chalk.gray(`CLI: ${provider.requiresCLI}`)}`);
        console.log(`     ${chalk.gray(`Docs: ${provider.docsUrl}`)}`);
        console.log();
    });
}
