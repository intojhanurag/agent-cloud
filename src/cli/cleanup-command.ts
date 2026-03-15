import chalk from 'chalk';
import inquirer from 'inquirer';
import { displayHeader, displaySuccess, displayError, displayInfo, displayWarning } from './banner.js';
import type { CloudProvider } from '../types/index.js';
import { getConfigManager } from '../utils/config.js';

export async function cleanupCommand(options?: { cloud?: CloudProvider }): Promise<void> {
    try {
        displayHeader('Cleanup Deployed Resources');

        const config = getConfigManager();
        const deployments = config.getSuccessfulDeployments();

        if (deployments.length === 0) {
            displayWarning('No deployment records found.');
            console.log(chalk.gray('  Deploy something first with: cloud-agent deploy'));
            return;
        }

        // Filter by cloud if specified
        const filtered = options?.cloud
            ? deployments.filter(d => d.cloud === options.cloud)
            : deployments;

        if (filtered.length === 0) {
            displayWarning(`No deployments found for ${options?.cloud?.toUpperCase()}.`);
            return;
        }

        // Show deployments for selection
        const choices = filtered.map((d, i) => ({
            name: `${d.cloud.toUpperCase()} | ${d.deploymentUrl || 'No URL'} | ${new Date(d.timestamp).toLocaleDateString()} | Resources: ${Object.keys(d.resources).join(', ') || 'none'}`,
            value: i,
        }));

        const { selected } = await inquirer.prompt([{
            type: 'checkbox',
            name: 'selected',
            message: 'Select deployments to clean up:',
            choices,
        }]);

        if (selected.length === 0) {
            displayInfo('No deployments selected. Nothing to clean up.');
            return;
        }

        const { confirm } = await inquirer.prompt([{
            type: 'confirm',
            name: 'confirm',
            message: chalk.yellow(`Delete ${selected.length} deployment(s)? This cannot be undone.`),
            default: false,
        }]);

        if (!confirm) {
            displayInfo('Cleanup cancelled.');
            return;
        }

        for (const idx of selected) {
            const deployment = filtered[idx];
            console.log(chalk.cyan(`\n  Cleaning up ${deployment.cloud.toUpperCase()} deployment...`));

            try {
                if (deployment.cloud === 'aws') {
                    const { AWSProvider } = await import('../providers/aws/index.js');
                    const aws = new AWSProvider({ region: process.env.AWS_REGION || 'us-east-1' });
                    await aws.cleanup(deployment.resources as any);
                } else if (deployment.cloud === 'gcp') {
                    const { GCPProvider } = await import('../providers/gcp/index.js');
                    const gcp = new GCPProvider({
                        project: process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT,
                        region: process.env.GCLOUD_REGION || 'us-central1',
                    });
                    await gcp.cleanup(deployment.resources as any);
                } else if (deployment.cloud === 'azure') {
                    const { AzureProvider } = await import('../providers/azure/index.js');
                    const azure = new AzureProvider({
                        resourceGroup: process.env.AZURE_RESOURCE_GROUP || 'agent-cloud-rg',
                        location: process.env.AZURE_LOCATION || 'eastus',
                    });
                    await azure.cleanup(deployment.resources as any);
                }
            } catch (error) {
                displayError(`Failed to clean up: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        displaySuccess('Cleanup complete!');
        console.log();

    } catch (error) {
        displayError('Cleanup failed');
        if (error instanceof Error) {
            console.log(chalk.red(`  ${error.message}`));
        }
    }
}
