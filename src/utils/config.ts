import fs from 'fs';
import path from 'path';
import { CloudProvider } from '../types/index.js';

/**
 * Configuration Manager
 * Manages project configuration and deployment history
 */

export interface DeploymentRecord {
    id: string;
    timestamp: string;
    cloud: CloudProvider;
    projectPath: string;
    success: boolean;
    deploymentUrl?: string;
    resources: Record<string, string>;
    cost?: number;
    duration?: number;
}

export interface ProjectConfig {
    version: string;
    projectName?: string;
    defaultCloud?: CloudProvider;
    autoApprove?: boolean;
    deployments: DeploymentRecord[];
    preferences: {
        logLevel?: string;
        region?: {
            aws?: string;
            gcp?: string;
            azure?: string;
        };
    };
}

export class ConfigManager {
    private configDir: string;
    private configFile: string;
    private config: ProjectConfig;

    constructor(projectPath: string = process.cwd()) {
        this.configDir = path.join(projectPath, '.agent-cloud');
        this.configFile = path.join(this.configDir, 'config.json');
        this.config = this.loadConfig();
    }

    /**
     * Load configuration from file
     */
    private loadConfig(): ProjectConfig {
        try {
            if (fs.existsSync(this.configFile)) {
                const content = fs.readFileSync(this.configFile, 'utf-8');
                return JSON.parse(content);
            }
        } catch (error) {
            console.warn('Failed to load config, using defaults');
        }

        // Default configuration
        return {
            version: '1.0.0',
            deployments: [],
            preferences: {},
        };
    }

    /**
     * Save configuration to file
     */
    private saveConfig(): void {
        try {
            // Ensure directory exists
            if (!fs.existsSync(this.configDir)) {
                fs.mkdirSync(this.configDir, { recursive: true });
            }

            fs.writeFileSync(
                this.configFile,
                JSON.stringify(this.config, null, 2),
                'utf-8'
            );
        } catch (error) {
            console.error('Failed to save config:', error);
        }
    }

    /**
     * Get current configuration
     */
    getConfig(): ProjectConfig {
        return { ...this.config };
    }

    /**
     * Update configuration
     */
    updateConfig(updates: Partial<ProjectConfig>): void {
        this.config = {
            ...this.config,
            ...updates,
        };
        this.saveConfig();
    }

    /**
     * Set default cloud provider
     */
    setDefaultCloud(cloud: CloudProvider): void {
        this.config.defaultCloud = cloud;
        this.saveConfig();
    }

    /**
     * Get default cloud provider
     */
    getDefaultCloud(): CloudProvider | undefined {
        return this.config.defaultCloud;
    }

    /**
     * Set auto-approve preference
     */
    setAutoApprove(autoApprove: boolean): void {
        this.config.autoApprove = autoApprove;
        this.saveConfig();
    }

    /**
     * Get auto-approve preference
     */
    getAutoApprove(): boolean {
        return this.config.autoApprove || false;
    }

    /**
     * Add deployment record
     */
    addDeployment(deployment: Omit<DeploymentRecord, 'id' | 'timestamp'>): void {
        const record: DeploymentRecord = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            ...deployment,
        };

        this.config.deployments.push(record);

        // Keep only last 50 deployments
        if (this.config.deployments.length > 50) {
            this.config.deployments = this.config.deployments.slice(-50);
        }

        this.saveConfig();
    }

    /**
     * Get all deployments
     */
    getDeployments(): DeploymentRecord[] {
        return [...this.config.deployments];
    }

    /**
     * Get last deployment
     */
    getLastDeployment(): DeploymentRecord | undefined {
        return this.config.deployments[this.config.deployments.length - 1];
    }

    /**
     * Get deployments by cloud
     */
    getDeploymentsByCloud(cloud: CloudProvider): DeploymentRecord[] {
        return this.config.deployments.filter(d => d.cloud === cloud);
    }

    /**
     * Get successful deployments
     */
    getSuccessfulDeployments(): DeploymentRecord[] {
        return this.config.deployments.filter(d => d.success);
    }

    /**
     * Get failed deployments
     */
    getFailedDeployments(): DeploymentRecord[] {
        return this.config.deployments.filter(d => !d.success);
    }

    /**
     * Get deployment statistics
     */
    getStats(): {
        total: number;
        successful: number;
        failed: number;
        byCloud: Record<CloudProvider, number>;
        totalCost: number;
        averageDuration: number;
    } {
        const total = this.config.deployments.length;
        const successful = this.getSuccessfulDeployments().length;
        const failed = this.getFailedDeployments().length;

        const byCloud = {
            aws: this.getDeploymentsByCloud('aws').length,
            gcp: this.getDeploymentsByCloud('gcp').length,
            azure: this.getDeploymentsByCloud('azure').length,
        };

        const totalCost = this.config.deployments
            .filter(d => d.cost)
            .reduce((sum, d) => sum + (d.cost || 0), 0);

        const durationsCount = this.config.deployments.filter(d => d.duration).length;
        const averageDuration = durationsCount > 0
            ? this.config.deployments
                .filter(d => d.duration)
                .reduce((sum, d) => sum + (d.duration || 0), 0) / durationsCount
            : 0;

        return {
            total,
            successful,
            failed,
            byCloud,
            totalCost,
            averageDuration,
        };
    }

    /**
     * Set preferred region for a cloud
     */
    setPreferredRegion(cloud: CloudProvider, region: string): void {
        if (!this.config.preferences.region) {
            this.config.preferences.region = {};
        }
        this.config.preferences.region[cloud] = region;
        this.saveConfig();
    }

    /**
     * Get preferred region for a cloud
     */
    getPreferredRegion(cloud: CloudProvider): string | undefined {
        return this.config.preferences.region?.[cloud];
    }

    /**
     * Clear all deployment history
     */
    clearHistory(): void {
        this.config.deployments = [];
        this.saveConfig();
    }

    /**
     * Export configuration
     */
    export(): string {
        return JSON.stringify(this.config, null, 2);
    }

    /**
     * Import configuration
     */
    import(configJson: string): void {
        try {
            const imported = JSON.parse(configJson);
            this.config = imported;
            this.saveConfig();
        } catch (error) {
            throw new Error('Invalid configuration JSON');
        }
    }

    /**
     * Get config file path
     */
    getConfigPath(): string {
        return this.configFile;
    }
}

/**
 * Global config manager instance
 */
let globalConfigManager: ConfigManager | null = null;

export function getConfigManager(projectPath?: string): ConfigManager {
    if (!globalConfigManager || projectPath) {
        globalConfigManager = new ConfigManager(projectPath);
    }
    return globalConfigManager;
}
