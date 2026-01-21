import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Azure Provider Interface
 * Handles Microsoft Azure deployments
 */

export interface AzureConfig {
    subscriptionId?: string;
    resourceGroup?: string;
    location?: string;
}

export interface DeploymentResult {
    success: boolean;
    resources: {
        app?: string;
        function?: string;
        storage?: string;
        containerApp?: string;
    };
    url?: string;
    error?: string;
}

/**
 * Azure Provider Class
 * Implements Azure-specific deployment logic
 */
export class AzureProvider {
    private config: AzureConfig;

    constructor(config: AzureConfig = {}) {
        this.config = {
            subscriptionId: config.subscriptionId || process.env.AZURE_SUBSCRIPTION_ID,
            resourceGroup: config.resourceGroup || process.env.AZURE_RESOURCE_GROUP || 'agent-cloud-rg',
            location: config.location || process.env.AZURE_LOCATION || 'centralindia',
        };
    }

    /**
     * Authenticate with Azure
     * Verifies Azure CLI is configured and user has access
     */
    async authenticate(): Promise<boolean> {
        try {
            const { stdout } = await execAsync('az account show');
            const account = JSON.parse(stdout);

            console.log(`✓ Authenticated as: ${account.user.name}`);
            console.log(`✓ Subscription: ${account.name}`);

            // Set subscription if configured
            if (this.config.subscriptionId) {
                await execAsync(`az account set --subscription ${this.config.subscriptionId}`);
            }

            return true;
        } catch (error) {
            console.error('❌ Azure authentication failed');
            console.error('Run: az login');
            return false;
        }
    }

    /**
     * Ensure resource group exists
     * Creates resource group if it doesn't exist
     */
    private async ensureResourceGroup(): Promise<void> {
        try {
            await execAsync(`az group show --name ${this.config.resourceGroup}`);
            console.log(`✓ Using resource group: ${this.config.resourceGroup}`);
        } catch {
            console.log(`📦 Creating resource group: ${this.config.resourceGroup}`);
            await execAsync(`
                az group create \
                    --name ${this.config.resourceGroup} \
                    --location ${this.config.location}
            `);
            console.log('✓ Resource group created');
        }
    }

    /**
     * Deploy to Azure Container Apps
     * Deploys containerized applications
     */
    async deployToContainerApps(options: {
        appName: string;
        dockerImage?: string;
        containerPort?: number;
        environmentName?: string;
    }): Promise<DeploymentResult> {
        const {
            appName,
            containerPort = 8080,
            environmentName = 'default-env',
        } = options;

        try {
            console.log('\n🚀 Deploying to Azure Container Apps...\n');

            await this.ensureResourceGroup();

            // Create Container Apps environment
            console.log('🌐 Creating Container Apps environment...');
            try {
                await execAsync(`az containerapp env create --name ${environmentName} --resource-group ${this.config.resourceGroup} --location ${this.config.location}`);
                console.log(`✓ Environment created: ${environmentName}`);
            } catch (envError) {
                // Try to use existing environment
                try {
                    await execAsync(`az containerapp env show --name ${environmentName} --resource-group ${this.config.resourceGroup}`);
                    console.log(`✓ Using existing environment: ${environmentName}`);
                } catch {
                    // Environment doesn't exist and creation failed
                    throw new Error(`Failed to create or find Container Apps environment: ${envError instanceof Error ? envError.message : 'Unknown error'}`);
                }
            }

            // Deploy container app
            console.log('\n📦 Deploying container app...');
            const image = options.dockerImage || 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest';

            const { stdout } = await execAsync(`az containerapp create --name ${appName} --resource-group ${this.config.resourceGroup} --environment ${environmentName} --image ${image} --target-port ${containerPort} --ingress external --query properties.configuration.ingress.fqdn --output tsv`);

            const fqdn = stdout.trim();
            const url = `https://${fqdn}`;

            console.log(`✓ Container app deployed: ${appName}`);
            console.log(`✓ URL: ${url}`);

            return {
                success: true,
                resources: {
                    containerApp: appName,
                },
                url,
            };
        } catch (error) {
            return {
                success: false,
                resources: {},
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Deploy to Azure Functions
     * Deploys serverless functions
     */
    async deployAzureFunctions(options: {
        functionAppName: string;
        runtime: string;
        sourceDir: string;
        storageAccount?: string;
    }): Promise<DeploymentResult> {
        const {
            functionAppName,
            runtime,
            sourceDir,
        } = options;

        const storageAccount = options.storageAccount || `${functionAppName}storage`.replace(/-/g, '').substring(0, 24);

        try {
            console.log('\n🚀 Deploying to Azure Functions...\n');

            await this.ensureResourceGroup();

            // Create storage account
            console.log('💾 Creating storage account...');
            try {
                await execAsync(`
                    az storage account create \
                        --name ${storageAccount} \
                        --resource-group ${this.config.resourceGroup} \
                        --location ${this.config.location} \
                        --sku Standard_LRS
                `);
                console.log(`✓ Storage account created: ${storageAccount}`);
            } catch {
                console.log(`✓ Using existing storage account: ${storageAccount}`);
            }

            // Create function app
            console.log('\n⚡ Creating function app...');
            const { stdout } = await execAsync(`
                az functionapp create \
                    --name ${functionAppName} \
                    --resource-group ${this.config.resourceGroup} \
                    --storage-account ${storageAccount} \
                    --runtime ${runtime} \
                    --functions-version 4 \
                    --consumption-plan-location ${this.config.location} \
                    --query defaultHostName \
                    --output tsv
            `);

            const hostname = stdout.trim();
            const url = `https://${hostname}`;

            console.log(`✓ Function app created: ${functionAppName}`);

            // Deploy function code
            console.log('\n📤 Deploying function code...');
            await execAsync(`
                cd ${sourceDir} && \
                func azure functionapp publish ${functionAppName}
            `);
            console.log('✓ Function code deployed');
            console.log(`✓ URL: ${url}`);

            return {
                success: true,
                resources: {
                    function: functionAppName,
                    storage: storageAccount,
                },
                url,
            };
        } catch (error) {
            return {
                success: false,
                resources: {},
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Deploy static site to Azure Static Web Apps
     * Hosts static files with global CDN
     */
    async deployStaticWebApp(options: {
        appName: string;
        buildDir: string;
        sku?: string;
    }): Promise<DeploymentResult> {
        const {
            appName,
            buildDir,
            sku = 'Free',
        } = options;

        try {
            console.log('\n🚀 Deploying to Azure Static Web Apps...\n');

            await this.ensureResourceGroup();

            // Create static web app
            console.log('🌐 Creating static web app...');
            const { stdout } = await execAsync(`
                az staticwebapp create \
                    --name ${appName} \
                    --resource-group ${this.config.resourceGroup} \
                    --location ${this.config.location} \
                    --sku ${sku} \
                    --query defaultHostname \
                    --output tsv
            `);

            const hostname = stdout.trim();
            const url = `https://${hostname}`;

            console.log(`✓ Static web app created: ${appName}`);

            // Deploy files
            console.log('\n📤 Deploying files...');
            // Get deployment token
            const { stdout: tokenOut } = await execAsync(`
                az staticwebapp secrets list \
                    --name ${appName} \
                    --resource-group ${this.config.resourceGroup} \
                    --query properties.apiKey \
                    --output tsv
            `);
            const deploymentToken = tokenOut.trim();

            // Upload files using SWA CLI
            await execAsync(`
                npx @azure/static-web-apps-cli deploy ${buildDir} \
                    --deployment-token ${deploymentToken}
            `);

            console.log('✓ Files deployed');
            console.log(`✓ URL: ${url}`);

            return {
                success: true,
                resources: {
                    app: appName,
                },
                url,
            };
        } catch (error) {
            return {
                success: false,
                resources: {},
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Deploy to Azure Blob Storage
     * Simple static file hosting
     */
    async deployBlobStorage(options: {
        storageName: string;
        buildDir: string;
        containerName?: string;
    }): Promise<DeploymentResult> {
        const {
            storageName,
            buildDir,
            containerName = '$web',
        } = options;

        const accountName = storageName.replace(/-/g, '').substring(0, 24);

        try {
            console.log('\n🚀 Deploying to Azure Blob Storage...\n');

            await this.ensureResourceGroup();

            // Create storage account
            console.log('💾 Creating storage account...');
            await execAsync(`
                az storage account create \
                    --name ${accountName} \
                    --resource-group ${this.config.resourceGroup} \
                    --location ${this.config.location} \
                    --sku Standard_LRS \
                    --kind StorageV2
            `);
            console.log(`✓ Storage account created: ${accountName}`);

            // Enable static website
            console.log('\n🌐 Enabling static website...');
            await execAsync(`
                az storage blob service-properties update \
                    --account-name ${accountName} \
                    --static-website \
                    --index-document index.html \
                    --404-document 404.html
            `);

            // Upload files
            console.log('\n📤 Uploading files...');
            await execAsync(`
                az storage blob upload-batch \
                    --account-name ${accountName} \
                    --source ${buildDir} \
                    --destination ${containerName} \
                    --overwrite
            `);

            const url = `https://${accountName}.z13.web.core.windows.net`;

            console.log('✓ Files uploaded');
            console.log(`✓ URL: ${url}`);

            return {
                success: true,
                resources: {
                    storage: accountName,
                },
                url,
            };
        } catch (error) {
            return {
                success: false,
                resources: {},
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Deploy to Azure App Service
     * Platform-as-a-Service deployment
     */
    async deployAppService(options: {
        appName: string;
        runtime: string;
        sku?: string;
    }): Promise<DeploymentResult> {
        const {
            appName,
            runtime,
            sku = 'F1', // Free tier
        } = options;

        const planName = `${appName}-plan`;

        try {
            console.log('\n🚀 Deploying to Azure App Service...\n');

            await this.ensureResourceGroup();

            // Create App Service plan
            console.log('📋 Creating App Service plan...');
            try {
                await execAsync(`
                    az appservice plan create \
                        --name ${planName} \
                        --resource-group ${this.config.resourceGroup} \
                        --sku ${sku} \
                        --is-linux
                `);
                console.log(`✓ App Service plan created: ${planName}`);
            } catch {
                console.log(`✓ Using existing plan: ${planName}`);
            }

            // Create web app
            console.log('\n🎯 Creating web app...');
            const { stdout } = await execAsync(`
                az webapp create \
                    --name ${appName} \
                    --resource-group ${this.config.resourceGroup} \
                    --plan ${planName} \
                    --runtime "${runtime}" \
                    --query defaultHostName \
                    --output tsv
            `);

            const hostname = stdout.trim();
            const url = `https://${hostname}`;

            console.log(`✓ Web app created: ${appName}`);
            console.log(`✓ URL: ${url}`);

            return {
                success: true,
                resources: {
                    app: appName,
                },
                url,
            };
        } catch (error) {
            return {
                success: false,
                resources: {},
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Cleanup resources
     * Deletes all created Azure resources
     */
    async cleanup(resources: {
        app?: string;
        function?: string;
        containerApp?: string;
        storage?: string;
    }): Promise<void> {
        try {
            console.log('\n🧹 Cleaning up resources...\n');

            if (resources.containerApp) {
                console.log(`Deleting container app: ${resources.containerApp}`);
                await execAsync(`
                    az containerapp delete \
                        --name ${resources.containerApp} \
                        --resource-group ${this.config.resourceGroup} \
                        --yes
                `);
            }

            if (resources.function) {
                console.log(`Deleting function app: ${resources.function}`);
                await execAsync(`
                    az functionapp delete \
                        --name ${resources.function} \
                        --resource-group ${this.config.resourceGroup}
                `);
            }

            if (resources.app) {
                console.log(`Deleting app service: ${resources.app}`);
                await execAsync(`
                    az webapp delete \
                        --name ${resources.app} \
                        --resource-group ${this.config.resourceGroup}
                `);
            }

            if (resources.storage) {
                console.log(`Deleting storage account: ${resources.storage}`);
                await execAsync(`
                    az storage account delete \
                        --name ${resources.storage} \
                        --resource-group ${this.config.resourceGroup} \
                        --yes
                `);
            }

            console.log('✓ Cleanup complete');
        } catch (error) {
            console.error('Cleanup failed:', error);
        }
    }

    /**
     * Delete entire resource group
     * Removes all resources at once
     */
    async cleanupResourceGroup(): Promise<void> {
        try {
            console.log(`\n🗑️  Deleting resource group: ${this.config.resourceGroup}...\n`);

            await execAsync(`
                az group delete \
                    --name ${this.config.resourceGroup} \
                    --yes \
                    --no-wait
            `);

            console.log('✓ Resource group deletion initiated');
        } catch (error) {
            console.error('Resource group deletion failed:', error);
        }
    }
}
