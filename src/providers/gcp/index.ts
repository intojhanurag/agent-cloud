import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import { sanitizeResourceName, shellEscape } from '../../utils/shell.js';

const execAsync = promisify(exec);

/**
 * GCP Provider Interface
 * Handles Google Cloud Platform deployments
 */

export interface GCPConfig {
    project?: string;
    region?: string;
}

export interface DeploymentResult {
    success: boolean;
    resources: {
        service?: string;
        function?: string;
        bucket?: string;
        database?: string;
    };
    url?: string;
    error?: string;
}

/**
 * GCP Provider Class
 * Implements GCP-specific deployment logic
 */
export class GCPProvider {
    private config: GCPConfig;

    constructor(config: GCPConfig = {}) {
        this.config = {
            project: config.project || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT,
            region: config.region || process.env.GCLOUD_REGION || 'us-central1',
        };
    }

    private get project(): string { return shellEscape(this.config.project || ''); }
    private get region(): string { return shellEscape(this.config.region || 'us-central1'); }

    /**
     * Authenticate with GCP
     * Verifies gcloud CLI is configured and user has access
     */
    async authenticate(): Promise<boolean> {
        try {
            const { stdout } = await execAsync('gcloud auth list --filter=status:ACTIVE --format="value(account)"');
            const activeAccount = stdout.trim();

            if (!activeAccount) {
                console.error('❌ No active GCP account found');
                console.error('Run: gcloud auth login');
                return false;
            }

            console.log(`✓ Authenticated as: ${activeAccount}`);

            // Verify project is set
            if (!this.config.project) {
                console.error('❌ No GCP project configured');
                console.error('Run: gcloud config set project YOUR_PROJECT_ID');
                return false;
            }

            console.log(`✓ Project: ${this.config.project}`);
            return true;
        } catch (error) {
            console.error('❌ GCP authentication failed');
            console.error('Run: gcloud auth login');
            return false;
        }
    }

    /**
     * Deploy to Cloud Run
     * Deploys containerized applications
     */
    async deployToCloudRun(options: {
        serviceName: string;
        dockerImage?: string;
        containerPort?: number;
        allowUnauthenticated?: boolean;
        envVars?: Record<string, string>;
    }): Promise<DeploymentResult> {
        const {
            serviceName,
            containerPort = 8080,
            allowUnauthenticated = true
        } = options;
        const safeName = sanitizeResourceName(serviceName);

        try {
            console.log('\n🚀 Deploying to Google Cloud Run...\n');

            // Use provided image or build from source
            let imageUrl = options.dockerImage;

            if (!imageUrl) {
                // Build and push to Google Container Registry
                console.log('📦 Building container image...');
                imageUrl = `gcr.io/${this.config.project}/${safeName}:latest`;

                await execAsync(`gcloud builds submit --tag ${shellEscape(imageUrl)} --project ${this.project}`);
                console.log(`✓ Image built: ${imageUrl}`);
            }

            // Deploy to Cloud Run
            console.log('\n🎯 Deploying service...');
            const allowUnauthFlag = allowUnauthenticated ? '--allow-unauthenticated' : '';

            const envVarsFlag = options.envVars && Object.keys(options.envVars).length > 0
                ? `--set-env-vars ${shellEscape(Object.entries(options.envVars).map(([k, v]) => `${k}=${v}`).join(','))}`
                : '';

            const { stdout } = await execAsync(
                `gcloud run deploy ${shellEscape(safeName)} --image ${shellEscape(imageUrl)} --platform managed --region ${this.region} --port ${containerPort} ${allowUnauthFlag} ${envVarsFlag} --project ${this.project}`
            );

            // Extract service URL from output
            const urlMatch = stdout.match(/Service URL: (https:\/\/[^\s]+)/);
            const url = urlMatch ? urlMatch[1] : undefined;

            console.log(`✓ Service deployed: ${safeName}`);
            if (url) {
                console.log(`✓ URL: ${url}`);
            }

            return {
                success: true,
                resources: {
                    service: safeName,
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
     * Deploy Cloud Function
     * Deploys serverless functions
     */
    async deployCloudFunction(options: {
        functionName: string;
        runtime: string;
        entryPoint: string;
        sourceDir: string;
        trigger?: 'http' | 'topic' | 'bucket';
        allowUnauthenticated?: boolean;
    }): Promise<DeploymentResult> {
        const {
            functionName,
            runtime,
            entryPoint,
            sourceDir,
            trigger = 'http',
            allowUnauthenticated = true,
        } = options;

        try {
            console.log('\n🚀 Deploying to Google Cloud Functions...\n');

            const allowUnauthFlag = allowUnauthenticated ? '--allow-unauthenticated' : '';
            const triggerFlag = trigger === 'http' ? '--trigger-http' : `--trigger-${trigger}`;

            console.log('📦 Deploying function...');
            const { stdout } = await execAsync(
                `gcloud functions deploy ${shellEscape(functionName)} --runtime ${shellEscape(runtime)} --entry-point ${shellEscape(entryPoint)} --source ${shellEscape(sourceDir)} ${triggerFlag} ${allowUnauthFlag} --region ${this.region} --project ${this.project}`
            );

            // Extract function URL from output
            const urlMatch = stdout.match(/url: (https:\/\/[^\s]+)/);
            const url = urlMatch ? urlMatch[1] : undefined;

            console.log(`✓ Function deployed: ${functionName}`);
            if (url) {
                console.log(`✓ URL: ${url}`);
            }

            return {
                success: true,
                resources: {
                    function: functionName,
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
     * Deploy static site to Cloud Storage
     * Hosts static files with public access
     */
    async deployStaticSite(options: {
        siteName: string;
        buildDir: string;
        indexPage?: string;
        errorPage?: string;
    }): Promise<DeploymentResult> {
        const {
            siteName,
            buildDir,
            indexPage = 'index.html',
            errorPage = '404.html',
        } = options;

        const bucketName = sanitizeResourceName(`${siteName}-${Date.now()}`);

        try {
            console.log('\n🚀 Deploying to Google Cloud Storage...\n');

            // Create bucket
            console.log('📦 Creating storage bucket...');
            await execAsync(
                `gcloud storage buckets create gs://${shellEscape(bucketName)} --location ${this.region} --uniform-bucket-level-access --project ${this.project}`
            );
            console.log(`✓ Bucket created: ${bucketName}`);

            // Make bucket public
            console.log('\n🌐 Configuring public access...');
            await execAsync(
                `gcloud storage buckets add-iam-policy-binding gs://${shellEscape(bucketName)} --member=allUsers --role=roles/storage.objectViewer --project ${this.project}`
            );

            // Set website configuration
            await execAsync(
                `gcloud storage buckets update gs://${shellEscape(bucketName)} --web-main-page-suffix=${shellEscape(indexPage)} --web-error-page=${shellEscape(errorPage)} --project ${this.project}`
            );
            console.log('✓ Website configuration set');

            // Upload files
            console.log('\n📤 Uploading files...');
            await execAsync(
                `gcloud storage cp -r ${shellEscape(buildDir)}/* gs://${shellEscape(bucketName)}/ --project ${this.project}`
            );
            console.log('✓ Files uploaded');

            const url = `https://storage.googleapis.com/${bucketName}/${indexPage}`;

            return {
                success: true,
                resources: {
                    bucket: bucketName,
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
     * Deploy to App Engine
     * Platform-as-a-Service deployment
     */
    async deployToAppEngine(options: {
        appName: string;
        runtime: string;
        serviceConfig?: string;
    }): Promise<DeploymentResult> {
        const { appName, runtime, serviceConfig = 'app.yaml' } = options;

        try {
            console.log('\n🚀 Deploying to Google App Engine...\n');

            // Create app.yaml if it doesn't exist
            console.log('📝 Configuring App Engine...');
            const appYaml = `runtime: ${runtime}
env: standard
service: ${sanitizeResourceName(appName)}`;

            fs.writeFileSync(serviceConfig, appYaml);

            // Deploy
            console.log('\n🎯 Deploying application...');
            await execAsync(
                `gcloud app deploy ${shellEscape(serviceConfig)} --quiet --project ${this.project}`
            );

            const url = `https://${sanitizeResourceName(appName)}-dot-${this.config.project}.appspot.com`;

            console.log(`✓ Application deployed to App Engine`);
            console.log(`✓ URL: ${url}`);

            return {
                success: true,
                resources: {
                    service: appName,
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
     * Deploy to Firebase Hosting
     * Static site hosting with CDN
     */
    async deployToFirebase(options: {
        siteName: string;
        buildDir: string;
    }): Promise<DeploymentResult> {
        const { siteName, buildDir } = options;

        try {
            console.log('\n🚀 Deploying to Firebase Hosting...\n');

            // Initialize Firebase if needed
            console.log('🔧 Initializing Firebase...');

            // Create firebase.json
            const firebaseConfig = {
                hosting: {
                    public: buildDir,
                    ignore: ['firebase.json', '**/.*', '**/node_modules/**'],
                    rewrites: [
                        {
                            source: '**',
                            destination: '/index.html',
                        },
                    ],
                },
            };

            fs.writeFileSync('firebase.json', JSON.stringify(firebaseConfig, null, 2));

            // Deploy
            console.log('\n📤 Deploying to Firebase...');
            const { stdout } = await execAsync(`firebase deploy --only hosting --project ${this.project}`);

            // Extract URL
            const urlMatch = stdout.match(/Hosting URL: (https:\/\/[^\s]+)/);
            const url = urlMatch ? urlMatch[1] : `https://${this.config.project}.web.app`;

            console.log(`✓ Site deployed to Firebase Hosting`);
            console.log(`✓ URL: ${url}`);

            return {
                success: true,
                resources: {
                    service: siteName,
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
     * Deletes all created GCP resources
     */
    async cleanup(resources: { service?: string; function?: string; bucket?: string }): Promise<void> {
        try {
            console.log('\n🧹 Cleaning up resources...\n');

            if (resources.service) {
                console.log(`Deleting Cloud Run service: ${resources.service}`);
                await execAsync(
                    `gcloud run services delete ${shellEscape(resources.service)} --region ${this.region} --quiet --project ${this.project}`
                );
            }

            if (resources.function) {
                console.log(`Deleting Cloud Function: ${resources.function}`);
                await execAsync(
                    `gcloud functions delete ${shellEscape(resources.function)} --region ${this.region} --quiet --project ${this.project}`
                );
            }

            if (resources.bucket) {
                console.log(`Deleting Cloud Storage bucket: ${resources.bucket}`);
                await execAsync(
                    `gcloud storage rm -r gs://${shellEscape(resources.bucket)} --project ${this.project}`
                );
            }

            console.log('✓ Cleanup complete');
        } catch (error) {
            console.error('Cleanup failed:', error);
        }
    }
}
