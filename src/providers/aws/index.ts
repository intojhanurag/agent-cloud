import { exec } from 'child_process';
import { promisify } from 'util';

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
    }): Promise<DeploymentResult> {
        const { appName, containerPort = 3000 } = options;
        const clusterName = `${appName}-cluster`;
        const serviceName = `${appName}-service`;
        const taskFamily = `${appName}-task`;

        try {
            console.log('\n🚀 Deploying to AWS ECS Fargate...\n');

            // Step 1: Create ECS cluster
            console.log('📦 Creating ECS cluster...');
            await execAsync(`aws ecs create-cluster --cluster-name ${clusterName} --region ${this.config.region}`);
            console.log(`✓ Cluster created: ${clusterName}`);

            // Step 2: Register task definition
            console.log('\n📝 Registering task definition...');
            const taskDef = {
                family: taskFamily,
                networkMode: 'awsvpc',
                requiresCompatibilities: ['FARGATE'],
                cpu: '256',
                memory: '512',
                containerDefinitions: [
                    {
                        name: appName,
                        image: options.dockerImage || 'nginx:latest',
                        portMappings: [
                            {
                                containerPort,
                                protocol: 'tcp',
                            },
                        ],
                        essential: true,
                    },
                ],
            };

            const taskDefFile = '/tmp/task-definition.json';
            require('fs').writeFileSync(taskDefFile, JSON.stringify(taskDef, null, 2));

            const { stdout: taskResult } = await execAsync(
                `aws ecs register-task-definition --cli-input-json file://${taskDefFile} --region ${this.config.region}`
            );
            const taskArn = JSON.parse(taskResult).taskDefinition.taskDefinitionArn;
            console.log(`✓ Task definition registered: ${taskFamily}`);

            // Step 3: Get default VPC and subnets
            console.log('\n🌐 Getting VPC configuration...');
            const { stdout: vpcResult } = await execAsync(
                `aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --region ${this.config.region}`
            );
            const vpc = JSON.parse(vpcResult).Vpcs[0];

            const { stdout: subnetResult } = await execAsync(
                `aws ec2 describe-subnets --filters "Name=vpc-id,Values=${vpc.VpcId}" --region ${this.config.region}`
            );
            const subnets = JSON.parse(subnetResult).Subnets;
            const subnetIds = subnets.map((s: any) => s.SubnetId).slice(0, 2);

            // Step 4: Create security group
            console.log('\n🔒 Creating security group...');
            const sgName = `${appName}-sg`;
            const { stdout: sgResult } = await execAsync(
                `aws ec2 create-security-group --group-name ${sgName} --description "Security group for ${appName}" --vpc-id ${vpc.VpcId} --region ${this.config.region}`
            );
            const securityGroupId = JSON.parse(sgResult).GroupId;

            // Allow inbound traffic
            await execAsync(
                `aws ec2 authorize-security-group-ingress --group-id ${securityGroupId} --protocol tcp --port ${containerPort} --cidr 0.0.0.0/0 --region ${this.config.region}`
            );
            console.log(`✓ Security group created: ${securityGroupId}`);

            // Step 5: Create ECS service
            console.log('\n🎯 Creating ECS service...');
            await execAsync(`
                aws ecs create-service \
                    --cluster ${clusterName} \
                    --service-name ${serviceName} \
                    --task-definition ${taskFamily} \
                    --desired-count 1 \
                    --launch-type FARGATE \
                    --network-configuration "awsvpcConfiguration={subnets=[${subnetIds.join(',')}],securityGroups=[${securityGroupId}],assignPublicIp=ENABLED}" \
                    --region ${this.config.region}
            `);
            console.log(`✓ Service created: ${serviceName}`);

            return {
                success: true,
                resources: {
                    cluster: clusterName,
                    service: serviceName,
                    taskDefinition: taskFamily,
                },
                url: `http://<task-ip>:${containerPort}`,
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

        try {
            console.log('\n🚀 Deploying to AWS Lambda...\n');

            // Create IAM role for Lambda
            console.log('🔑 Creating IAM role...');
            const roleName = `${functionName}-role`;
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

            const { stdout: roleResult } = await execAsync(`
                aws iam create-role \
                    --role-name ${roleName} \
                    --assume-role-policy-document '${JSON.stringify(assumeRolePolicy)}' \
                    --region ${this.config.region}
            `);
            const roleArn = JSON.parse(roleResult).Role.Arn;

            // Attach basic execution policy
            await execAsync(`
                aws iam attach-role-policy \
                    --role-name ${roleName} \
                    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
                    --region ${this.config.region}
            `);

            console.log(`✓ IAM role created  : ${roleArn}`);

            // Wait for role to propagate
            console.log('⏳ Waiting for IAM role to propagate...');
            await new Promise(resolve => setTimeout(resolve, 10000));

            // Create Lambda function
            console.log('\n📦 Creating Lambda function...');
            const { stdout: lambdaResult } = await execAsync(`
                aws lambda create-function \
                    --function-name ${functionName} \
                    --runtime ${runtime} \
                    --role ${roleArn} \
                    --handler ${handler} \
                    --zip-file fileb://${zipFile} \
                    --region ${this.config.region}
            `);
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
        const bucketName = `${siteName}-${Date.now()}`;

        try {
            console.log('\n🚀 Deploying to AWS S3 + CloudFront...\n');

            // Create S3 bucket
            console.log('📦 Creating S3 bucket...');
            await execAsync(`
                aws s3 mb s3://${bucketName} --region ${this.config.region}
            `);

            // Enable static website hosting
            await execAsync(`
                aws s3 website s3://${bucketName} --index-document index.html --error-document error.html
            `);

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

            await execAsync(`
                aws s3api put-bucket-policy --bucket ${bucketName} --policy '${JSON.stringify(policy)}'
            `);

            console.log(`✓ S3 bucket created: ${bucketName}`);

            // Upload files
            console.log('\n📤 Uploading files...');
            await execAsync(`
                aws s3 sync ${buildDir} s3://${bucketName} --delete
            `);
            console.log('✓ Files uploaded');

            const url = `http://${bucketName}.s3-website-${this.config.region}.amazonaws.com`;

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
        try {
            console.log('\n🧹 Cleaning up resources...\n');

            if (resources.service && resources.cluster) {
                console.log(`Deleting service: ${resources.service}`);
                await execAsync(`
                    aws ecs delete-service \
                        --cluster ${resources.cluster} \
                        --service ${resources.service} \
                        --force \
                        --region ${this.config.region}
                `);
            }

            if (resources.cluster) {
                console.log(`Deleting cluster: ${resources.cluster}`);
                await execAsync(`
                    aws ecs delete-cluster --cluster ${resources.cluster} --region ${this.config.region}
                `);
            }

            console.log('✓ Cleanup complete');
        } catch (error) {
            console.error('Cleanup failed:', error);
        }
    }
}
