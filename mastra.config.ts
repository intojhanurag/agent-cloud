import { defineConfig } from 'mastra';

export default defineConfig({
    name: 'agent-cloud',

    // Entry point for Mastra
    mastraPath: './src/mastra/index.ts',

    // Build output
    outDir: './dist',

    // Enable Mastra Studio
    studio: {
        enabled: true,
        port: 4111,
    },
});
