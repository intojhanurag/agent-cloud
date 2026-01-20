import chalk from 'chalk';
import { Logger, getLogger } from './logger.js';

/**
 * Custom Error Classes
 * Domain-specific errors for better error handling
 */

export class DeploymentError extends Error {
    constructor(
        message: string,
        public code: string,
        public cloud?: string,
        public recoverable: boolean = false,
        public suggestions: string[] = []
    ) {
        super(message);
        this.name = 'DeploymentError';
    }
}

export class AuthenticationError extends Error {
    constructor(
        message: string,
        public cloud: string,
        public suggestions: string[] = []
    ) {
        super(message);
        this.name = 'AuthenticationError';
    }
}

export class ValidationError extends Error {
    constructor(
        message: string,
        public field: string,
        public value?: any
    ) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class WorkflowError extends Error {
    constructor(
        message: string,
        public step: string,
        public recoverable: boolean = false
    ) {
        super(message);
        this.name = 'WorkflowError';
    }
}

/**
 * Error Handler Class
 * Centralized error handling with logging and user-friendly messages
 */
export class ErrorHandler {
    private logger: Logger;

    constructor(logger?: Logger) {
        this.logger = logger || getLogger();
    }

    /**
     * Handle deployment errors
     */
    handleDeploymentError(error: DeploymentError): void {
        this.logger.error(`Deployment failed: ${error.message}`, error, {
            code: error.code,
            cloud: error.cloud,
            recoverable: error.recoverable,
        });

        console.log(chalk.red(`\n❌ Deployment Error: ${error.message}\n`));

        if (error.cloud) {
            console.log(chalk.gray(`  Cloud: ${error.cloud.toUpperCase()}`));
        }

        if (error.code) {
            console.log(chalk.gray(`  Error Code: ${error.code}`));
        }

        if (error.suggestions.length > 0) {
            console.log(chalk.yellow('\n💡 Suggestions:'));
            error.suggestions.forEach((suggestion, index) => {
                console.log(chalk.yellow(`  ${index + 1}. ${suggestion}`));
            });
        }

        if (error.recoverable) {
            console.log(chalk.cyan('\n🔄 This error is recoverable. You can retry the deployment.'));
        }

        console.log();
    }

    /**
     * Handle authentication errors
     */
    handleAuthenticationError(error: AuthenticationError): void {
        this.logger.error(`Authentication failed: ${error.message}`, error, {
            cloud: error.cloud,
        });

        console.log(chalk.red(`\n❌ Authentication Error: ${error.message}\n`));
        console.log(chalk.gray(`  Cloud: ${error.cloud.toUpperCase()}`));

        if (error.suggestions.length > 0) {
            console.log(chalk.yellow('\n💡 How to fix:'));
            error.suggestions.forEach((suggestion, index) => {
                console.log(chalk.yellow(`  ${index + 1}. ${suggestion}`));
            });
        }

        console.log();
    }

    /**
     * Handle validation errors
     */
    handleValidationError(error: ValidationError): void {
        this.logger.error(`Validation failed: ${error.message}`, error, {
            field: error.field,
            value: error.value,
        });

        console.log(chalk.red(`\n❌ Validation Error: ${error.message}\n`));
        console.log(chalk.gray(`  Field: ${error.field}`));

        if (error.value !== undefined) {
            console.log(chalk.gray(`  Value: ${error.value}`));
        }

        console.log();
    }

    /**
     * Handle workflow errors
     */
    handleWorkflowError(error: WorkflowError): void {
        this.logger.error(`Workflow failed: ${error.message}`, error, {
            step: error.step,
            recoverable: error.recoverable,
        });

        console.log(chalk.red(`\n❌ Workflow Error: ${error.message}\n`));
        console.log(chalk.gray(`  Failed Step: ${error.step}`));

        if (error.recoverable) {
            console.log(chalk.cyan('\n🔄 You can resume the workflow from where it failed.'));
        }

        console.log();
    }

    /**
     * Handle generic errors
     */
    handleGenericError(error: Error): void {
        this.logger.error(`Unexpected error: ${error.message}`, error);

        console.log(chalk.red(`\n❌ Error: ${error.message}\n`));

        if (error.stack && process.env.DEBUG) {
            console.log(chalk.gray('Stack Trace:'));
            console.log(chalk.gray(error.stack));
        }

        console.log();
    }

    /**
     * Handle any error with auto-detection
     */
    handle(error: Error): void {
        if (error instanceof DeploymentError) {
            this.handleDeploymentError(error);
        } else if (error instanceof AuthenticationError) {
            this.handleAuthenticationError(error);
        } else if (error instanceof ValidationError) {
            this.handleValidationError(error);
        } else if (error instanceof WorkflowError) {
            this.handleWorkflowError(error);
        } else {
            this.handleGenericError(error);
        }
    }

    /**
     * Wrap async function with error handling
     */
    async wrap<T>(fn: () => Promise<T>): Promise<T> {
        try {
            return await fn();
        } catch (error) {
            this.handle(error as Error);
            throw error;
        }
    }
}

/**
 * Global error handler instance
 */
let globalErrorHandler: ErrorHandler | null = null;

export function getErrorHandler(): ErrorHandler {
    if (!globalErrorHandler) {
        globalErrorHandler = new ErrorHandler();
    }
    return globalErrorHandler;
}

/**
 * Common error factory functions
 */
export const ErrorFactory = {
    /**
     * AWS deployment errors
     */
    awsDeploymentFailed(message: string, recoverable: boolean = false): DeploymentError {
        return new DeploymentError(
            message,
            'AWS_DEPLOYMENT_FAILED',
            'aws',
            recoverable,
            [
                'Check AWS CLI is installed: aws --version',
                'Verify authentication: aws sts get-caller-identity',
                'Ensure you have necessary permissions',
                'Check AWS service quotas',
            ]
        );
    },

    /**
     * GCP deployment errors
     */
    gcpDeploymentFailed(message: string, recoverable: boolean = false): DeploymentError {
        return new DeploymentError(
            message,
            'GCP_DEPLOYMENT_FAILED',
            'gcp',
            recoverable,
            [
                'Check gcloud CLI is installed: gcloud --version',
                'Verify authentication: gcloud auth list',
                'Set project: gcloud config set project YOUR_PROJECT',
                'Enable required APIs in GCP Console',
            ]
        );
    },

    /**
     * Azure deployment errors
     */
    azureDeploymentFailed(message: string, recoverable: boolean = false): DeploymentError {
        return new DeploymentError(
            message,
            'AZURE_DEPLOYMENT_FAILED',
            'azure',
            recoverable,
            [
                'Check Azure CLI is installed: az --version',
                'Verify authentication: az account show',
                'Set subscription: az account set --subscription YOUR_SUBSCRIPTION',
                'Check resource provider registration',
            ]
        );
    },

    /**
     * Authentication errors
     */
    awsAuthFailed(): AuthenticationError {
        return new AuthenticationError(
            'AWS authentication failed',
            'aws',
            [
                'Run: aws configure',
                'Set access key and secret key',
                'Or use environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY',
            ]
        );
    },

    gcpAuthFailed(): AuthenticationError {
        return new AuthenticationError(
            'GCP authentication failed',
            'gcp',
            [
                'Run: gcloud auth login',
                'Or use service account: export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json',
                'Set project: gcloud config set project YOUR_PROJECT',
            ]
        );
    },

    azureAuthFailed(): AuthenticationError {
        return new AuthenticationError(
            'Azure authentication failed',
            'azure',
            [
                'Run: az login',
                'Or use service principal with environment variables',
                'Set subscription: az account set --subscription YOUR_SUBSCRIPTION',
            ]
        );
    },

    /**
     * Workflow errors
     */
    workflowStepFailed(step: string, message: string): WorkflowError {
        return new WorkflowError(
            message,
            step,
            true  // Most workflow errors are recoverable
        );
    },

    /**
     * Validation errors
     */
    invalidCloud(cloud: string): ValidationError {
        return new ValidationError(
            `Invalid cloud provider: ${cloud}. Must be one of: aws, gcp, azure`,
            'cloud',
            cloud
        );
    },

    missingProjectPath(): ValidationError {
        return new ValidationError(
            'Project path is required',
            'projectPath'
        );
    },
};
