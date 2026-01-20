/**
 * Type definitions for Agent-Cloud CLI
 */

/**
 * Supported cloud providers
 */
export type CloudProvider = 'aws' | 'gcp' | 'azure';

/**
 * User deployment requirements
 */
export interface DeploymentRequirements {
    description: string;
    cloudProvider: CloudProvider;
    projectPath: string;
    autoApprove: boolean;
}

/**
 * Cloud provider configuration
 */
export interface CloudProviderConfig {
    name: string;
    displayName: string;
    description: string;
    icon: string;
    requiresCLI: string;
    docsUrl: string;
}

/**
 * Project analysis result (Phase 2)
 */
export interface ProjectAnalysis {
    projectType: 'api' | 'web' | 'static' | 'container' | 'unknown';
    runtime?: string;
    framework?: string;
    buildCommand?: string;
    startCommand?: string;
    port?: number;
    envVars: string[];
    databases: string[];
    services: string[];
    dockerized: boolean;
    confidence: number;
}

/**
 * Deployment plan (Phase 3)
 */
export interface DeploymentPlan {
    cloudProvider: CloudProvider;
    services: {
        name: string;
        type: string;
        config: Record<string, unknown>;
    }[];
    estimatedCost: number;
    commands: string[];
    warnings: string[];
}

/**
 * Progress step
 */
export interface ProgressStep {
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    message?: string;
}
