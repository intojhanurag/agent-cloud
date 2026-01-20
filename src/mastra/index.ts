import { Mastra } from '@mastra/core';
import { LibSQLStore } from '@mastra/libsql';
import { analyzerAgent } from './agents/analyzer.js';
import { deploymentAgent } from './agents/deployment.js';
import { validatorAgent } from './agents/validator.js';
import { deploymentWorkflow } from './workflows/deployment.js';

/**
 * Main Mastra instance for Agent-Cloud
 * Manages AI agents, tools, and workflows
 */
export const mastra = new Mastra({
    agents: {
        analyzerAgent,
        deploymentAgent,
        validatorAgent,
    },
    workflows: {
        deploymentWorkflow,
    },
    storage: new LibSQLStore({
        url: 'file:./agent-cloud.db',
    }),
});
