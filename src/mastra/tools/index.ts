import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

/**
 * File System Analyzer Tool
 * Reads and analyzes project files and directories
 */
export const fileSystemTool = createTool({
    id: 'fs-analyzer',
    description: 'Read and analyze project files and directory structure. Use this to scan project folders and read file contents.',
    inputSchema: z.object({
        projectPath: z.string().describe('The absolute path to the project directory'),
        maxDepth: z.number().optional().default(3).describe('Maximum directory depth to scan'),
    }),
    outputSchema: z.object({
        files: z.array(z.object({
            path: z.string(),
            name: z.string(),
            type: z.enum(['file', 'directory']),
            size: z.number().optional(),
        })),
        totalFiles: z.number(),
        totalDirectories: z.number(),
    }),
    execute: async ({ context }) => {
        const { projectPath, maxDepth = 3 } = context;

        const files: Array<{
            path: string;
            name: string;
            type: 'file' | 'directory';
            size?: number;
        }> = [];

        let totalFiles = 0;
        let totalDirectories = 0;

        async function scanDirectory(dirPath: string, depth: number = 0) {
            if (depth > maxDepth) return;

            try {
                const entries = await fs.readdir(dirPath, { withFileTypes: true });

                for (const entry of entries) {
                    // Skip node_modules, .git, and other common exclude patterns
                    if (
                        entry.name === 'node_modules' ||
                        entry.name === '.git' ||
                        entry.name === 'dist' ||
                        entry.name === 'build' ||
                        entry.name === '.next' ||
                        entry.name === 'coverage'
                    ) {
                        continue;
                    }

                    const fullPath = path.join(dirPath, entry.name);
                    const relativePath = path.relative(projectPath, fullPath);

                    if (entry.isDirectory()) {
                        totalDirectories++;
                        files.push({
                            path: relativePath,
                            name: entry.name,
                            type: 'directory',
                        });
                        await scanDirectory(fullPath, depth + 1);
                    } else {
                        totalFiles++;
                        try {
                            const stats = await fs.stat(fullPath);
                            files.push({
                                path: relativePath,
                                name: entry.name,
                                type: 'file',
                                size: stats.size,
                            });
                        } catch (error) {
                            // Skip files we can't stat
                        }
                    }
                }
            } catch (error) {
                // Skip directories we can't read
            }
        }

        await scanDirectory(projectPath);

        return {
            files,
            totalFiles,
            totalDirectories,
        };
    },
});

/**
 * File Reader Tool
 * Reads the contents of specific files
 */
export const fileReaderTool = createTool({
    id: 'file-reader',
    description: 'Read the contents of a specific file. Use this to examine package.json, requirements.txt, or other configuration files.',
    inputSchema: z.object({
        filePath: z.string().describe('The absolute path to the file to read'),
    }),
    outputSchema: z.object({
        content: z.string(),
        exists: z.boolean(),
        error: z.string().optional(),
    }),
    execute: async ({ context }) => {
        const { filePath } = context;

        try {
            const content = await fs.readFile(filePath, 'utf-8');
            return {
                content,
                exists: true,
            };
        } catch (error) {
            return {
                content: '',
                exists: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    },
});

/**
 * Dependency Analyzer Tool
 * Analyzes project dependencies from manifest files
 */
export const dependencyAnalyzerTool = createTool({
    id: 'dependency-analyzer',
    description: 'Analyze project dependencies from package.json, requirements.txt, or other manifest files. Returns the runtime, dependencies, and framework information.',
    inputSchema: z.object({
        projectPath: z.string().describe('The absolute path to the project directory'),
    }),
    outputSchema: z.object({
        runtime: z.string().optional(),
        packageManager: z.string().optional(),
        dependencies: z.array(z.string()),
        devDependencies: z.array(z.string()),
        frameworks: z.array(z.string()),
        databases: z.array(z.string()),
        hasDocker: z.boolean(),
    }),
    execute: async ({ context }) => {
        const { projectPath } = context;

        let runtime: string | undefined;
        let packageManager: string | undefined;
        const dependencies: string[] = [];
        const devDependencies: string[] = [];
        const frameworks: string[] = [];
        const databases: string[] = [];
        let hasDocker = false;

        // Check for Docker
        try {
            await fs.access(path.join(projectPath, 'Dockerfile'));
            hasDocker = true;
        } catch {
            // No Docker
        }

        // Check for Node.js
        try {
            const packageJsonPath = path.join(projectPath, 'package.json');
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

            runtime = 'node';
            packageManager = 'npm';

            // Check for pnpm
            try {
                await fs.access(path.join(projectPath, 'pnpm-lock.yaml'));
                packageManager = 'pnpm';
            } catch {
                // Check for yarn
                try {
                    await fs.access(path.join(projectPath, 'yarn.lock'));
                    packageManager = 'yarn';
                } catch {
                    // npm
                }
            }

            // Extract dependencies
            if (packageJson.dependencies) {
                dependencies.push(...Object.keys(packageJson.dependencies));
            }
            if (packageJson.devDependencies) {
                devDependencies.push(...Object.keys(packageJson.devDependencies));
            }

            // Detect frameworks
            const allDeps = [...dependencies, ...devDependencies];
            if (allDeps.includes('express')) frameworks.push('Express.js');
            if (allDeps.includes('next')) frameworks.push('Next.js');
            if (allDeps.includes('react')) frameworks.push('React');
            if (allDeps.includes('vue')) frameworks.push('Vue.js');
            if (allDeps.includes('@nestjs/core')) frameworks.push('NestJS');
            if (allDeps.includes('fastify')) frameworks.push('Fastify');

            // Detect databases
            if (allDeps.includes('pg') || allDeps.includes('postgres')) databases.push('PostgreSQL');
            if (allDeps.includes('mysql') || allDeps.includes('mysql2')) databases.push('MySQL');
            if (allDeps.includes('mongodb') || allDeps.includes('mongoose')) databases.push('MongoDB');
            if (allDeps.includes('redis')) databases.push('Redis');
            if (allDeps.includes('sqlite3') || allDeps.includes('better-sqlite3')) databases.push('SQLite');

        } catch {
            // Not a Node.js project
        }

        // Check for Python
        if (!runtime) {
            try {
                const requirementsPath = path.join(projectPath, 'requirements.txt');
                const requirements = await fs.readFile(requirementsPath, 'utf-8');

                runtime = 'python';
                packageManager = 'pip';

                const lines = requirements.split('\n').filter(l => l.trim() && !l.startsWith('#'));
                dependencies.push(...lines.map(l => l.split('==')[0].split('>=')[0].split('<=')[0].trim()));

                // Detect Python frameworks
                if (dependencies.includes('fastapi')) frameworks.push('FastAPI');
                if (dependencies.includes('flask')) frameworks.push('Flask');
                if (dependencies.includes('django')) frameworks.push('Django');

                // Detect databases
                if (dependencies.includes('psycopg2') || dependencies.includes('psycopg2-binary')) databases.push('PostgreSQL');
                if (dependencies.includes('pymongo')) databases.push('MongoDB');
                if (dependencies.includes('redis')) databases.push('Redis');

            } catch {
                // Not a Python project
            }
        }

        return {
            runtime,
            packageManager,
            dependencies,
            devDependencies,
            frameworks,
            databases,
            hasDocker,
        };
    },
});

/**
 * Package JSON Parser Tool
 * Specifically parses package.json for detailed Node.js project info
 */
export const packageJsonParserTool = createTool({
    id: 'package-json-parser',
    description: 'Parse package.json to extract detailed Node.js project information including scripts, version, and configuration.',
    inputSchema: z.object({
        projectPath: z.string().describe('The absolute path to the project directory'),
    }),
    outputSchema: z.object({
        name: z.string().optional(),
        version: z.string().optional(),
        description: z.string().optional(),
        scripts: z.record(z.string()).optional(),
        port: z.number().optional(),
        startCommand: z.string().optional(),
        buildCommand: z.string().optional(),
    }),
    execute: async ({ context }) => {
        const { projectPath } = context;

        try {
            const packageJsonPath = path.join(projectPath, 'package.json');
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

            const scripts = packageJson.scripts || {};

            // Determine start command
            let startCommand = scripts.start || scripts.dev;

            // Determine build command
            let buildCommand = scripts.build;

            // Try to detect port from common environment variables or scripts
            let port: number | undefined;
            const scriptValues = Object.values(scripts).join(' ');
            const portMatch = scriptValues.match(/PORT[=\s]+(\d+)/i);
            if (portMatch) {
                port = parseInt(portMatch[1]);
            } else {
                // Default ports for common frameworks
                port = 3000; // Common default
            }

            return {
                name: packageJson.name,
                version: packageJson.version,
                description: packageJson.description,
                scripts,
                port,
                startCommand,
                buildCommand,
            };
        } catch {
            return {};
        }
    },
});
