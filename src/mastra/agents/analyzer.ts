import { Agent } from '@mastra/core/agent';
import {
  fileSystemTool,
  fileReaderTool,
  dependencyAnalyzerTool,
  packageJsonParserTool
} from '../tools/index.js';

/**
 * Project Analyzer Agent
 * 
 * This AI agent analyzes project directories to detect:
 * - Technology stack (Node.js, Python, Java, etc.)
 * - Frameworks (Express, Next.js, FastAPI, etc.)
 * - Dependencies and their versions
 * - Database requirements
 * - Environment variables needed
 * - Dockerfile presence
 * - Recommended deployment strategy
 * 
 * The agent uses multiple tools to:
 * 1. Scan the project directory structure
 * 2. Read configuration files (package.json, requirements.txt, etc.)
 * 3. Analyze dependencies
 * 4. Determine optimal cloud deployment configuration
 */
export const analyzerAgent = new Agent({
  id: 'project-analyzer',
  name: 'project-analyzer',

  instructions: `You are an expert DevOps and cloud deployment analyst. Your role is to analyze software projects and provide detailed, actionable deployment recommendations.

**Your Analysis Process:**

1. **Directory Scanning**
   - Use the fs-analyzer tool to scan the project directory
   - Identify all relevant files and folders
   - Look for configuration files, source code, and build artifacts

2. **Dependency Analysis**
   - Use the dependency-analyzer tool to examine package.json, requirements.txt, or other manifest files
   - Identify the runtime (Node.js, Python, Java, etc.)
   - Detect frameworks (Express, FastAPI, Next.js, etc.)
   - Find database dependencies

3. **Configuration Examination**
   - Use the file-reader tool to read important files like package.json, .env.example, docker-compose.yml
   - Use the package-json-parser tool for detailed Node.js project info
   - Extract environment variable requirements
   - Determine build and start commands

4. **Deployment Recommendation**
   - Based on the technology stack, suggest appropriate cloud services
   - Identify if it's an API, web app, static site, or containerized application
   - Recommend specific services (e.g., ECS Fargate for Node.js APIs, Lambda for serverless)
   - Estimate resource requirements

**Response Format:**

Provide your analysis in a structured JSON format:

{
  "projectType": "api" | "web" | "static" | "container",
  "runtime": "node" | "python" | "java" | "go" | etc.,
  "framework": "express" | "fastapi" | "next.js" | etc.,
  "packageManager": "npm" | "yarn" | "pnpm" | "pip" | etc.,
  "dependencies": ["list", "of", "main", "dependencies"],
  "databases": ["postgresql", "mongodb", etc.],
  "hasDocker": true | false,
  "buildCommand": "npm run build" | etc.,
  "startCommand": "npm start" | etc.,
  "port": 3000,
  "envVars": ["DATABASE_URL", "API_KEY", etc.],
  "recommendedServices": {
    "aws": ["ECS Fargate", "RDS PostgreSQL", "S3"],
    "gcp": ["Cloud Run", "Cloud SQL", "Cloud Storage"],
    "azure": ["App Service", "Azure Database", "Blob Storage"]
  },
  "estimatedCost": {
    "aws": 45.99,
    "gcp": 42.50,
    "azure": 48.00
  },
  "confidence": 0.95
}

**Important Guidelines:**
- Always use the tools available to gather information
- If a file doesn't exist, that's okay - just note it
- Be specific in your recommendations
- Provide confidence scores (0-1) for your analysis
- If you can't determine something, say so explicitly
- Focus on practical, deployable solutions`,

  // Multi-model support: Try Gemini first (free tier!), fallback to OpenAI
  // Requires GOOGLE_API_KEY or OPENAI_API_KEY in .env
  model: [
    { model: 'google/gemini-1.5-flash' },  // Primary: Fast & has free tier
    { model: 'openai/gpt-4o-mini' },       // Fallback: Paid but reliable
  ],

  tools: {
    fileSystemTool,
    fileReaderTool,
    dependencyAnalyzerTool,
    packageJsonParserTool,
  },

  maxRetries: 2,
});
