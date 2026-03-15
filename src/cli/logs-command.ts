import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';
import { displayHeader, displayError, displayInfo, displayWarning } from './banner.js';
import type { CloudProvider } from '../types/index.js';
import { getConfigManager } from '../utils/config.js';
import { shellEscape } from '../utils/shell.js';

const execAsync = promisify(exec);

export async function logsCommand(options?: {
    cloud?: CloudProvider;
    service?: string;
    lines?: number;
}): Promise<void> {
    try {
        displayHeader('Deployment Logs');

        const config = getConfigManager();
        const lines = options?.lines || 50;

        // Determine cloud and service from last deployment if not specified
        let cloud = options?.cloud;
        let service = options?.service;

        if (!cloud || !service) {
            const lastDeploy = config.getLastDeployment();
            if (lastDeploy && lastDeploy.success) {
                cloud = cloud || lastDeploy.cloud;
                service = service || lastDeploy.resources.service || lastDeploy.resources.cluster || lastDeploy.resources.containerApp;
            }
        }

        if (!cloud) {
            displayError('No cloud provider specified and no recent deployment found.');
            console.log(chalk.gray('  Usage: cloud-agent logs --cloud aws --service my-app'));
            return;
        }

        if (!service) {
            displayWarning('No service name specified. Showing recent deployments:');
            const deployments = config.getDeploymentsByCloud(cloud);
            for (const d of deployments.slice(-5)) {
                const resources = Object.entries(d.resources).map(([k, v]) => `${k}=${v}`).join(', ');
                console.log(chalk.gray(`  ${d.timestamp} - ${resources}`));
            }
            console.log(chalk.gray('\n  Use: cloud-agent logs --cloud ' + cloud + ' --service <name>'));
            return;
        }

        displayInfo(`Fetching logs from ${cloud.toUpperCase()} for service "${service}"...`);
        console.log();

        try {
            let cmd = '';

            if (cloud === 'aws') {
                const region = shellEscape(process.env.AWS_REGION || 'us-east-1');
                cmd = `aws logs get-log-events --log-group-name /ecs/${shellEscape(service)} --log-stream-name $(aws logs describe-log-streams --log-group-name /ecs/${shellEscape(service)} --order-by LastEventTime --descending --limit 1 --query 'logStreams[0].logStreamName' --output text --region ${region}) --limit ${lines} --region ${region} --query 'events[].message' --output text`;
            } else if (cloud === 'gcp') {
                const project = shellEscape(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || '');
                cmd = `gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=${shellEscape(service)}" --limit ${lines} --project ${project} --format="value(textPayload)"`;
            } else if (cloud === 'azure') {
                cmd = `az containerapp logs show --name ${shellEscape(service)} --resource-group ${shellEscape(process.env.AZURE_RESOURCE_GROUP || 'agent-cloud-rg')} --type console --tail ${lines}`;
            }

            const { stdout, stderr } = await execAsync(cmd, { timeout: 30000 });
            if (stdout.trim()) {
                console.log(stdout);
            } else if (stderr.trim()) {
                console.log(chalk.gray(stderr));
            } else {
                displayWarning('No logs found. The service may not have produced any output yet.');
            }
        } catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('ResourceNotFoundException') || error.message.includes('NOT_FOUND')) {
                    displayWarning(`No log group found for "${service}". The service may not exist or hasn't produced logs yet.`);
                } else {
                    displayError(`Failed to fetch logs: ${error.message}`);
                }
            }
        }

        console.log();

    } catch (error) {
        displayError('Failed to fetch logs');
        if (error instanceof Error) {
            console.log(chalk.red(`  ${error.message}`));
        }
    }
}
