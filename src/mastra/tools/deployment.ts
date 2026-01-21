import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Cloud Service Mappings
 * Maps project types to appropriate cloud services for each provider
 */

const AWS_SERVICE_MAPPING = {
    api: {
        compute: ['ECS Fargate', 'Lambda', 'Elastic Beanstalk'],
        database: ['RDS PostgreSQL', 'RDS MySQL', 'DynamoDB'],
        storage: ['S3'],
        networking: ['Application Load Balancer', 'API Gateway'],
        monitoring: ['CloudWatch'],
    },
    web: {
        compute: ['Amplify', 'S3 + CloudFront', 'ECS Fargate'],
        database: [],  // Web apps may not need database
        storage: ['S3'],
        networking: ['CloudFront CDN'],
        monitoring: ['CloudWatch'],
    },
    static: {
        compute: [],
        database: [],  // Static sites don't need database
        storage: ['S3'],
        networking: ['CloudFront CDN'],
        monitoring: ['CloudWatch'],
    },
    container: {
        compute: ['ECS Fargate', 'EKS'],
        database: ['RDS', 'DynamoDB'],
        storage: ['S3', 'EFS'],
        networking: ['Application Load Balancer'],
        monitoring: ['CloudWatch'],
    },
};

const GCP_SERVICE_MAPPING = {
    api: {
        compute: ['Cloud Run', 'Cloud Functions', 'GKE'],
        database: ['Cloud SQL', 'Firestore'],
        storage: ['Cloud Storage'],
        networking: ['Cloud Load Balancing'],
        monitoring: ['Cloud Monitoring'],
    },
    web: {
        compute: ['Cloud Run', 'App Engine', 'Firebase Hosting'],
        database: [],
        storage: ['Cloud Storage'],
        networking: ['Cloud CDN'],
        monitoring: ['Cloud Monitoring'],
    },
    static: {
        compute: [],
        database: [],
        storage: ['Cloud Storage', 'Firebase Hosting'],
        networking: ['Cloud CDN'],
        monitoring: ['Cloud Monitoring'],
    },
    container: {
        compute: ['Cloud Run', 'GKE'],
        database: ['Cloud SQL', 'Firestore'],
        storage: ['Cloud Storage'],
        networking: ['Cloud Load Balancing'],
        monitoring: ['Cloud Monitoring'],
    },
};

const AZURE_SERVICE_MAPPING = {
    api: {
        compute: ['App Service', 'Container Apps', 'Functions'],
        database: ['Azure Database for PostgreSQL', 'Azure SQL', 'Cosmos DB'],
        storage: ['Blob Storage'],
        networking: ['Application Gateway', 'API Management'],
        monitoring: ['Application Insights'],
    },
    web: {
        compute: ['App Service', 'Static Web Apps', 'Container Apps'],
        database: [],
        storage: ['Blob Storage'],
        networking: ['Azure CDN'],
        monitoring: ['Application Insights'],
    },
    static: {
        compute: [],
        database: [],
        storage: ['Blob Storage', 'Static Web Apps'],
        networking: ['Azure CDN'],
        monitoring: ['Application Insights'],
    },
    container: {
        compute: ['Container Apps', 'AKS'],
        database: ['Azure Database', 'Cosmos DB'],
        storage: ['Blob Storage'],
        networking: ['Application Gateway'],
        monitoring: ['Application Insights'],
    },
};

/**
 * Service Mapper Tool
 * Maps project analysis to appropriate cloud services
 */
export const serviceMapperTool = createTool({
    id: 'service-mapper',
    description: 'Map project type and requirements to appropriate cloud services for AWS, GCP, or Azure.',
    inputSchema: z.object({
        projectType: z.enum(['api', 'web', 'static', 'container']),
        cloud: z.enum(['aws', 'gcp', 'azure']),
        runtime: z.string().optional(),
        databases: z.array(z.string()).optional(),
        hasDocker: z.boolean().optional(),
    }),
    outputSchema: z.object({
        services: z.object({
            compute: z.array(z.string()),
            database: z.array(z.string()),
            storage: z.array(z.string()),
            networking: z.array(z.string()),
            monitoring: z.array(z.string()),
        }),
        recommendations: z.array(z.string()),
    }),
    execute: async (inputData, context) => {
        const { projectType, cloud, runtime, databases, hasDocker } = inputData;

        let serviceMap;
        switch (cloud) {
            case 'aws':
                serviceMap = AWS_SERVICE_MAPPING[projectType];
                break;
            case 'gcp':
                serviceMap = GCP_SERVICE_MAPPING[projectType];
                break;
            case 'azure':
                serviceMap = AZURE_SERVICE_MAPPING[projectType];
                break;
        }

        const recommendations: string[] = [];

        // Add runtime-specific recommendations
        if (runtime === 'node' && cloud === 'aws') {
            recommendations.push('Use AWS Lambda with Node.js 20.x runtime for serverless');
            recommendations.push('Consider ECS Fargate for containerized Node.js apps');
        } else if (runtime === 'python' && cloud === 'gcp') {
            recommendations.push('Cloud Run works excellently with Python applications');
        }

        // Add database-specific recommendations
        if (databases && databases.length > 0) {
            if (databases.includes('PostgreSQL')) {
                recommendations.push(`Use managed PostgreSQL service for reliability`);
            }
            if (databases.includes('MongoDB')) {
                recommendations.push(`Consider using cloud-native NoSQL database`);
            }
        }

        // Docker recommendations
        if (hasDocker) {
            recommendations.push('Application is Docker-ready, container services recommended');
        }

        return {
            services: {
                compute: serviceMap.compute,
                database: serviceMap.database,
                storage: serviceMap.storage,
                networking: serviceMap.networking,
                monitoring: serviceMap.monitoring,
            },
            recommendations,
        };
    },
});

/**
 * Cost Estimator Tool
 * Estimates monthly cost for cloud deployment
 */
export const costEstimatorTool = createTool({
    id: 'cost-estimator',
    description: 'Estimate monthly costs for cloud deployment based on services and scale.',
    inputSchema: z.object({
        cloud: z.enum(['aws', 'gcp', 'azure']),
        services: z.object({
            compute: z.array(z.string()),
            database: z.array(z.string()),
            storage: z.array(z.string()),
            networking: z.array(z.string()),
        }),
        scale: z.enum(['small', 'medium', 'large']).optional().default('small'),
    }),
    outputSchema: z.object({
        estimatedCost: z.number(),
        breakdown: z.object({
            compute: z.number(),
            database: z.number(),
            storage: z.number(),
            networking: z.number(),
            other: z.number(),
        }),
    }),
    execute: async (inputData, context) => {
        const { cloud, services, scale } = inputData;

        // Base costs (monthly, USD)
        const costs = {
            compute: 0,
            database: 0,
            storage: 0,
            networking: 0,
            other: 0,
        };

        // Scale multipliers
        const scaleMultiplier = scale === 'small' ? 1 : scale === 'medium' ? 2.5 : 5;

        // Compute costs
        if (services.compute.length > 0) {
            const computeService = services.compute[0];
            if (cloud === 'aws') {
                if (computeService.includes('ECS')) costs.compute = 30 * scaleMultiplier;
                else if (computeService.includes('Lambda')) costs.compute = 15 * scaleMultiplier;
                else if (computeService.includes('Elastic Beanstalk')) costs.compute = 25 * scaleMultiplier;
            } else if (cloud === 'gcp') {
                if (computeService.includes('Cloud Run')) costs.compute = 20 * scaleMultiplier;
                else if (computeService.includes('Functions')) costs.compute = 12 * scaleMultiplier;
                else if (computeService.includes('GKE')) costs.compute = 75 * scaleMultiplier;
            } else if (cloud === 'azure') {
                if (computeService.includes('App Service')) costs.compute = 25 * scaleMultiplier;
                else if (computeService.includes('Functions')) costs.compute = 15 * scaleMultiplier;
                else if (computeService.includes('Container Apps')) costs.compute = 30 * scaleMultiplier;
            }
        }

        // Database costs
        if (services.database.length > 0) {
            if (cloud === 'aws') costs.database = 25 * scaleMultiplier;
            else if (cloud === 'gcp') costs.database = 22 * scaleMultiplier;
            else if (cloud === 'azure') costs.database = 28 * scaleMultiplier;
        }

        // Storage costs
        if (services.storage.length > 0) {
            costs.storage = 5 * scaleMultiplier;
        }

        // Networking costs
        if (services.networking.length > 0) {
            costs.networking = 10 * scaleMultiplier;
        }

        // Other (monitoring, logging, etc.)
        costs.other = 5 * scaleMultiplier;

        const estimatedCost = Number(
            (costs.compute + costs.database + costs.storage + costs.networking + costs.other).toFixed(2)
        );

        return {
            estimatedCost,
            breakdown: costs,
        };
    },
});

/**
 * Command Generator Tool
 * Generates deployment commands for selected cloud provider
 */
export const commandGeneratorTool = createTool({
    id: 'command-generator',
    description: 'Generate deployment commands for the selected cloud provider and services.',
    inputSchema: z.object({
        cloud: z.enum(['aws', 'gcp', 'azure']),
        projectType: z.enum(['api', 'web', 'static', 'container']),
        projectName: z.string(),
        services: z.object({
            compute: z.array(z.string()),
            database: z.array(z.string()).optional(),
        }),
    }),
    outputSchema: z.object({
        commands: z.array(z.string()),
    }),
    execute: async (inputData, context) => {
        const { cloud, projectType, projectName, services } = inputData;
        const commands: string[] = [];

        if (cloud === 'aws') {
            commands.push('# Configure AWS CLI');
            commands.push('aws configure');
            commands.push('');

            if (services.compute[0]?.includes('ECS')) {
                commands.push('# Create ECS cluster');
                commands.push(`aws ecs create-cluster --cluster-name ${projectName}-cluster`);
                commands.push('# Register task definition');
                commands.push(`aws ecs register-task-definition --cli-input-json file://task-definition.json`);
                commands.push('# Create service');
                commands.push(`aws ecs create-service --cluster ${projectName}-cluster --service-name ${projectName}-service`);
            } else if (services.compute[0]?.includes('Lambda')) {
                commands.push('# Create Lambda function');
                commands.push(`aws lambda create-function --function-name ${projectName} --runtime nodejs20.x`);
            }

            if (services.database && services.database.length > 0) {
                commands.push('# Create RDS instance');
                commands.push(`aws rds create-db-instance --db-instance-identifier ${projectName}-db --db-instance-class db.t3.micro`);
            }
        } else if (cloud === 'gcp') {
            commands.push('# Authenticate with GCP');
            commands.push('gcloud auth login');
            commands.push('');

            if (services.compute[0]?.includes('Cloud Run')) {
                commands.push('# Deploy to Cloud Run');
                commands.push(`gcloud run deploy ${projectName} --source . --region us-central1`);
            } else if (services.compute[0]?.includes('Functions')) {
                commands.push('# Deploy Cloud Function');
                commands.push(`gcloud functions deploy ${projectName} --runtime nodejs20 --trigger-http`);
            }

            if (services.database && services.database.length > 0) {
                commands.push('# Create Cloud SQL instance');
                commands.push(`gcloud sql instances create ${projectName}-db --tier=db-f1-micro`);
            }
        } else if (cloud === 'azure') {
            commands.push('# Login to Azure');
            commands.push('az login');
            commands.push('');

            if (services.compute[0]?.includes('App Service')) {
                commands.push('# Create App Service plan');
                commands.push(`az appservice plan create --name ${projectName}-plan --sku B1`);
                commands.push('# Create web app');
                commands.push(`az webapp create --name ${projectName} --plan ${projectName}-plan`);
            }

            if (services.database && services.database.length > 0) {
                commands.push('# Create Azure Database');
                commands.push(`az postgres server create --name ${projectName}-db --sku-name B_Gen5_1`);
            }
        }

        return { commands };
    },
});
