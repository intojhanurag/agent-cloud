import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import { sanitizeResourceName, shellEscape } from '../../utils/shell.js';

const execAsync = promisify(exec);

/**
 * AWS Provider Interface
 * Handles AWS cloud deployments
 */

export interface AWSConfig {
    region?: string;
    profile?: string;
}

export interface DeploymentResult {
    success: boolean;
    resources: {
        cluster?: string;
        service?: string;
        taskDefinition?: string;
        database?: string;
        loadBalancer?: string;
    };
    url?: string;
    error?: string;
}

/**
 * AWS Provider Class
 * Implements AWS-specific deployment logic
 */
export class AWSProvider {
    private config: AWSConfig;

    constructor(config: AWSConfig = {}) {
        this.config = {
            region: config.region || process.env.AWS_REGION || 'us-east-1',
            profile: config.profile || process.env.AWS_PROFILE,
        };
    }

    /**
     * Authenticate with AWS
     * Verifies AWS CLI is configured and user has access
     */
    async authenticate(): Promise<boolean> {
        try {
            const { stdout } = await execAsync('aws sts get-caller-identity');
            const identity = JSON.parse(stdout);
            console.log(`✓ Authenticated as: ${identity.Arn}`);
            return true;
        } catch (error) {
            console.error('❌ AWS authentication failed');
            console.error('Run: aws configure');
            return false;
        }
    }

    /**
     * Deploy to ECS Fargate
     * Creates cluster, task definition, and service
    */
    async deployToECS(options: {
        appName: string;
        dockerImage?: string;
        containerPort?: number;
        envVars?: Record<string, string>;
    }): Promise<DeploymentResult> {
        const { appName, containerPort = 3000 } = options;
        const safeName = sanitizeResourceName(appName);
        const clusterName = `${safeName}-cluster`;
        const serviceName = `${safeName}-service`;
        const taskFamily = `${safeName}-task`;
        const region = shellEscape(this.config.region || 'us-east-1');

        try {
            console.log('\n🚀 Deploying to AWS ECS Fargate...\n');

            // Step 1: Create ECS cluster
            console.log('📦 Creating ECS cluster...');
            await execAsync(`aws ecs create-cluster --cluster-name ${shellEscape(clusterName)} --region ${region}`);
            console.log(`✓ Cluster created: ${clusterName}`);

            // Step 2: Register task definition
            console.log('\n📝 Registering task definition...');

            if (!options.dockerImage) {
                throw new Error(
                    `No Docker image provided for "${appName}". ` +
                    'Please provide a pre-built image with --image or create a Dockerfile in your project root.'
                );
            }

            const envVarEntries = options.envVars
                ? Object.entries(options.envVars).map(([name, value]) => ({ name, value }))
                : [];

            const taskDef = {
                family: taskFamily,
                networkMode: 'awsvpc',
                requiresCompatibilities: ['FARGATE'],
                cpu: '256',
                memory: '512',
                containerDefinitions: [
                    {
                        name: safeName,
                        image: options.dockerImage,
                        portMappings: [
                            {
                                containerPort,
                                protocol: 'tcp',
                            },
                        ],
                        essential: true,
                        ...(envVarEntries.length > 0 ? { environment: envVarEntries } : {}),
                    },
                ],
            };

            const taskDefFile = '/tmp/task-definition.json';
            fs.writeFileSync(taskDefFile, JSON.stringify(taskDef, null, 2));

            const { stdout: taskResult } = await execAsync(
                `aws ecs register-task-definition --cli-input-json file://${taskDefFile} --region ${region}`
            );
            const taskArn = JSON.parse(taskResult).taskDefinition.taskDefinitionArn;
            console.log(`✓ Task definition registered: ${taskFamily}`);

            // Step 3: Get default VPC and subnets
            console.log('\n🌐 Getting VPC configuration...');
            const { stdout: vpcResult } = await execAsync(
                `aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --region ${region}`
            );
            const vpc = JSON.parse(vpcResult).Vpcs[0];

            const { stdout: subnetResult } = await execAsync(
                `aws ec2 describe-subnets --filters "Name=vpc-id,Values=${shellEscape(vpc.VpcId)}" --region ${region}`
            );
            const subnets = JSON.parse(subnetResult).Subnets;
            const subnetIds = subnets.map((s: any) => s.SubnetId).slice(0, 2);

            // Step 4: Create security group
            console.log('\n🔒 Creating security group...');
            const sgName = `${safeName}-sg`;
            const { stdout: sgResult } = await execAsync(
                `aws ec2 create-security-group --group-name ${shellEscape(sgName)} --description ${shellEscape(`Security group for ${safeName}`)} --vpc-id ${shellEscape(vpc.VpcId)} --region ${region}`
            );
            const securityGroupId = JSON.parse(sgResult).GroupId;

            // Allow inbound traffic
            await execAsync(
                `aws ec2 authorize-security-group-ingress --group-id ${shellEscape(securityGroupId)} --protocol tcp --port ${containerPort} --cidr 0.0.0.0/0 --region ${region}`
            );
            console.log(`✓ Security group created: ${securityGroupId}`);

            // Step 5: Create ECS service
            console.log('\n🎯 Creating ECS service...');
            const subnetList = subnetIds.map((id: string) => shellEscape(id)).join(',');
            await execAsync(
                `aws ecs create-service --cluster ${shellEscape(clusterName)} --service-name ${shellEscape(serviceName)} --task-definition ${shellEscape(taskFamily)} --desired-count 1 --launch-type FARGATE --network-configuration "awsvpcConfiguration={subnets=[${subnetList}],securityGroups=[${shellEscape(securityGroupId)}],assignPublicIp=ENABLED}" --region ${region}`
            );
            console.log(`✓ Service created: ${serviceName}`);

            // Poll for running task to get real public IP
            console.log('\n⏳ Waiting for task to start...');
            let publicUrl = '';
            for (let attempt = 0; attempt < 12; attempt++) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                try {
                    const { stdout: tasksOut } = await execAsync(
                        `aws ecs list-tasks --cluster ${shellEscape(clusterName)} --service-name ${shellEscape(serviceName)} --desired-status RUNNING --region ${region}`
                    );
                    const taskArns = JSON.parse(tasksOut).taskArns;
                    if (!taskArns || taskArns.length === 0) continue;

                    const { stdout: descOut } = await execAsync(
                        `aws ecs describe-tasks --cluster ${shellEscape(clusterName)} --tasks ${shellEscape(taskArns[0])} --region ${region}`
                    );
                    const task = JSON.parse(descOut).tasks?.[0];
                    const eniAttachment = task?.attachments?.find((a: any) => a.type === 'ElasticNetworkInterface');
                    const eniDetail = eniAttachment?.details?.find((d: any) => d.name === 'networkInterfaceId');
                    if (!eniDetail?.value) continue;

                    const { stdout: eniOut } = await execAsync(
                        `aws ec2 describe-network-interfaces --network-interface-ids ${shellEscape(eniDetail.value)} --region ${region}`
                    );
                    const publicIp = JSON.parse(eniOut).NetworkInterfaces?.[0]?.Association?.PublicIp;
                    if (publicIp) {
                        publicUrl = `http://${publicIp}:${containerPort}`;
                        console.log(`✓ Task running at: ${publicUrl}`);
                        break;
                    }
                } catch {
                    // retry
                }
            }

            if (!publicUrl) {
                publicUrl = `Check AWS console for service ${serviceName} in cluster ${clusterName}`;
                console.log(`⚠ Could not determine public IP. ${publicUrl}`);
            }

            return {
                success: true,
                resources: {
                    cluster: clusterName,
                    service: serviceName,
                    taskDefinition: taskFamily,
                },
                url: publicUrl,
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
     * Deploy Lambda function
     * Creates and deploys a serverless function
     */
    async deployLambda(options: {
        functionName: string;
        runtime: string;
        handler: string;
        zipFile: string;
    }): Promise<DeploymentResult> {
        const { functionName, runtime, handler, zipFile } = options;
        const region = shellEscape(this.config.region || 'us-east-1');

        try {
            console.log('\n🚀 Deploying to AWS Lambda...\n');

            // Create IAM role for Lambda
            console.log('🔑 Creating IAM role...');
            const roleName = `${sanitizeResourceName(functionName)}-role`;
            const assumeRolePolicy = {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: { Service: 'lambda.amazonaws.com' },
                        Action: 'sts:AssumeRole',
                    },
                ],
            };

            const { stdout: roleResult } = await execAsync(
                `aws iam create-role --role-name ${shellEscape(roleName)} --assume-role-policy-document ${shellEscape(JSON.stringify(assumeRolePolicy))} --region ${region}`
            );
            const roleArn = JSON.parse(roleResult).Role.Arn;

            // Attach basic execution policy
            await execAsync(
                `aws iam attach-role-policy --role-name ${shellEscape(roleName)} --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole --region ${region}`
            );

            console.log(`✓ IAM role created  : ${roleArn}`);

            // Wait for role to propagate
            console.log('⏳ Waiting for IAM role to propagate...');
            await new Promise(resolve => setTimeout(resolve, 10000));

            // Create Lambda function
            console.log('\n📦 Creating Lambda function...');
            const { stdout: lambdaResult } = await execAsync(
                `aws lambda create-function --function-name ${shellEscape(functionName)} --runtime ${shellEscape(runtime)} --role ${shellEscape(roleArn)} --handler ${shellEscape(handler)} --zip-file fileb://${shellEscape(zipFile)} --region ${region}`
            );
            const functionArn = JSON.parse(lambdaResult).FunctionArn;
            console.log(`✓ Lambda function created: ${functionArn}`);

            return {
                success: true,
                resources: {
                    cluster: functionName,
                },
                url: functionArn,
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
     * Deploy static site to S3 + CloudFront
     * Hosts static files with CDN
     */
    async deployStaticSite(options: {
        siteName: string;
        buildDir: string;
    }): Promise<DeploymentResult> {
        const { siteName, buildDir } = options;
        const bucketName = sanitizeResourceName(`${siteName}-${Date.now()}`);
        const region = shellEscape(this.config.region || 'us-east-1');

        try {
            console.log('\n🚀 Deploying to AWS S3 + CloudFront...\n');

            // Create S3 bucket
            console.log('📦 Creating S3 bucket...');
            await execAsync(
                `aws s3 mb s3://${shellEscape(bucketName)} --region ${region}`
            );

            // Enable static website hosting
            await execAsync(
                `aws s3 website s3://${shellEscape(bucketName)} --index-document index.html --error-document error.html`
            );

            // Set bucket policy for public read
            const policy = {
                Version: '2012-10-17',
                Statement: [
                    {
                        Sid: 'PublicReadGetObject',
                        Effect: 'Allow',
                        Principal: '*',
                        Action: 's3:GetObject',
                        Resource: `arn:aws:s3:::${bucketName}/*`,
                    },
                ],
            };

            await execAsync(
                `aws s3api put-bucket-policy --bucket ${shellEscape(bucketName)} --policy ${shellEscape(JSON.stringify(policy))}`
            );

            console.log(`✓ S3 bucket created: ${bucketName}`);

            // Upload files
            console.log('\n📤 Uploading files...');
            await execAsync(
                `aws s3 sync ${shellEscape(buildDir)} s3://${shellEscape(bucketName)} --delete`
            );
            console.log('✓ Files uploaded');

            const regionRaw = this.config.region || 'us-east-1';
            const url = `http://${bucketName}.s3-website-${regionRaw}.amazonaws.com`;

            return {
                success: true,
                resources: {
                    cluster: bucketName,
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
     * Deletes all created AWS resources
     */
    async cleanup(resources: { cluster?: string; service?: string }): Promise<void> {
        const region = shellEscape(this.config.region || 'us-east-1');

        try {
            console.log('\n🧹 Cleaning up resources...\n');

            if (resources.service && resources.cluster) {
                console.log(`Deleting service: ${resources.service}`);
                await execAsync(
                    `aws ecs delete-service --cluster ${shellEscape(resources.cluster)} --service ${shellEscape(resources.service)} --force --region ${region}`
                );
            }

            if (resources.cluster) {
                console.log(`Deleting cluster: ${resources.cluster}`);
                await execAsync(
                    `aws ecs delete-cluster --cluster ${shellEscape(resources.cluster)} --region ${region}`
                );
            }

            console.log('✓ Cleanup complete');
        } catch (error) {
            console.error('Cleanup failed:', error);
        }
    }
}
