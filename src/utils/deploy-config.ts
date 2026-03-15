import fs from 'fs';
import path from 'path';
import type { CloudProvider } from '../types/index.js';

export interface DeployConfig {
    appName?: string;
    cloud?: CloudProvider;
    region?: string;
    port?: number;
    buildDir?: string;
    image?: string;
    envVars?: Record<string, string>;
}

const CONFIG_FILENAME = 'agent-cloud.config.json';

export function loadDeployConfig(projectPath: string = process.cwd()): DeployConfig | null {
    const configPath = path.join(projectPath, CONFIG_FILENAME);
    try {
        if (fs.existsSync(configPath)) {
            const content = fs.readFileSync(configPath, 'utf-8');
            return JSON.parse(content) as DeployConfig;
        }
    } catch {
        // Invalid config file, ignore
    }
    return null;
}

export function mergeWithCliOptions(
    fileConfig: DeployConfig | null,
    cliOptions: Partial<DeployConfig>
): DeployConfig {
    if (!fileConfig) return cliOptions;

    return {
        appName: cliOptions.appName || fileConfig.appName,
        cloud: cliOptions.cloud || fileConfig.cloud,
        region: cliOptions.region || fileConfig.region,
        port: cliOptions.port || fileConfig.port,
        buildDir: cliOptions.buildDir || fileConfig.buildDir,
        image: cliOptions.image || fileConfig.image,
        envVars: { ...fileConfig.envVars, ...cliOptions.envVars },
    };
}
