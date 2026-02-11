# Agent-Cloud Architecture

## What It Is

A CLI tool that uses AI agents to analyze any software project and deploy it to AWS, GCP, or Azure. You point it at a codebase, it figures out what the project is, recommends the right cloud services, generates a deployment plan, asks for your approval, and executes real cloud commands.

```
User runs CLI command
        |
        v
  CLI Layer (Commander.js)
        |
        v
  Mastra AI Framework
   /       |       \
Agent 1  Agent 2  Agent 3
(Analyze) (Plan)  (Validate)
   |        |        |
  Tools    Tools    Tools
   |        |        |
   v        v        v
  Workflow Engine (suspend/resume)
        |
        v
  Cloud Providers (AWS / GCP / Azure)
        |
        v
  Real shell commands (aws, gcloud, az)
```

---

## System Layers

### Layer 1: CLI (`src/cli/`)

The entry point. Built with **Commander.js** for command parsing and **Inquirer.js** for interactive prompts.

**Entry:** `src/cli/index.ts`

Six commands:
| Command | What it does | Needs AI? |
|---------|-------------|-----------|
| `init` | Setup wizard - API keys, cloud CLI detection, preferences | No |
| `analyze` | Scan project, detect stack, recommend services | No (default) / Yes (`--ai`) |
| `analyze --ai` | Deep AI-powered analysis | Yes |
| `deploy` | Full deployment pipeline | Yes |
| `status` | Check environment readiness | Optional |
| `history` | Show past deployments | No |

**Key design decision:** The `analyze` command works without any API key by default. It scans `package.json`, `requirements.txt`, `go.mod`, and `Dockerfile` directly. The `--ai` flag opts into AI analysis. This means a user can install the tool and immediately get value without any setup.

**Files:**
- `index.ts` - Command registration and routing
- `commands.ts` - `init`, `analyze`, `history`, `info` implementations
- `workflow-commands.ts` - `deploy` and `status` (these interact with Mastra agents/workflows)
- `banner.ts` - Terminal UI (header, success/error/warning/info display helpers)
- `error-handler.ts` - Global error handling with actionable messages
- `prompts.ts` - Inquirer prompt definitions for interactive flows

---

### Layer 2: Mastra AI Framework (`src/mastra/`)

This is the brain. **Mastra** (`@mastra/core`) is an open-source TypeScript framework for building AI agent systems. It provides:
- Agent management (LLM + tools + instructions)
- Tool definitions (typed functions that agents can call)
- Workflow orchestration (multi-step pipelines with suspend/resume)
- State persistence (via LibSQL/SQLite)

**Central wiring:** `src/mastra/index.ts`

```typescript
export const mastra = new Mastra({
    agents: { analyzerAgent, deploymentAgent, validatorAgent },
    workflows: { deploymentWorkflow },
    storage: new LibSQLStore({ url: 'file:./agent-cloud.db' }),
});
```

Everything registers here. The CLI layer imports `mastra` and calls `mastra.getAgent('analyzerAgent')` or `mastra.getWorkflow('deploymentWorkflow')` to access components.

---

### Layer 3: AI Agents (`src/mastra/agents/`)

Three specialized agents, each with a focused role and its own set of tools:

#### 1. Analyzer Agent (`analyzer.ts`)
- **Job:** Understand what a project is
- **Model:** Google Gemini 2.0 Flash (free tier) or OpenAI GPT-4o Mini
- **Tools:** `fileSystemTool`, `fileReaderTool`, `dependencyAnalyzerTool`, `packageJsonParserTool`
- **Output:** JSON with `projectType`, `runtime`, `framework`, `databases`, `recommendedServices`, `estimatedCost`

The agent receives a prompt like "Analyze the project at /path/to/project" and autonomously decides which tools to call. It might scan the directory structure first, then read `package.json`, then analyze dependencies - the LLM decides the order.

#### 2. Deployment Agent (`deployment.ts`)
- **Job:** Create a deployment plan
- **Model:** Same conditional model selection
- **Tools:** `serviceMapperTool`, `costEstimatorTool`, `commandGeneratorTool`
- **Output:** JSON with `services`, `estimatedCost`, `commands` (actual cloud CLI commands)

Takes the analysis output and maps it to specific cloud services. Uses lookup tables (e.g., Node.js API -> ECS Fargate on AWS, Cloud Run on GCP, Container Apps on Azure).

#### 3. Validator Agent (`validator.ts`)
- **Job:** Check if the environment is ready for deployment
- **Model:** Same conditional model selection
- **Tools:** `cliCheckerTool`, `authCheckerTool`, `envVarCheckerTool`, `networkCheckerTool`, `permissionsCheckerTool`
- **Output:** JSON with check results per category (CLI installed, authenticated, env vars set, network OK, permissions OK)

**How model selection works:**
```typescript
model: process.env.GOOGLE_GENERATIVE_AI_API_KEY
    ? 'google/gemini-2.0-flash'
    : 'openai/gpt-4o-mini',
```
Checks at module load time which API key is available and picks the model. Mastra handles the actual API calls to Google or OpenAI behind the scenes.

**How agents use tools:**
Agents don't call tools directly in code. The LLM receives the tool descriptions and schemas, decides when to call them, and Mastra executes the tool and feeds the result back to the LLM. This is the "agentic" pattern - the AI decides the execution flow.

---

### Layer 4: Tools (`src/mastra/tools/`)

Tools are typed functions that agents can invoke. Built with `createTool()` from Mastra, each has:
- `inputSchema` (Zod) - what the tool accepts
- `outputSchema` (Zod) - what it returns
- `execute` function - the actual logic

**Four tool files:**

#### `tools/index.ts` - Project Analysis Tools
| Tool | What it does |
|------|-------------|
| `fileSystemTool` | Recursively scans a directory (skips node_modules, .git, dist), returns file tree with sizes |
| `fileReaderTool` | Reads a single file's contents |
| `dependencyAnalyzerTool` | Parses package.json/requirements.txt, detects runtime, frameworks, databases, Docker |
| `packageJsonParserTool` | Extracts scripts, build/start commands, port detection from package.json |

#### `tools/deployment.ts` - Planning Tools
| Tool | What it does |
|------|-------------|
| `serviceMapperTool` | Maps project type (api/web/static/container) to cloud services using lookup tables |
| `costEstimatorTool` | Estimates monthly cost based on selected services and scale (small/medium/large) |
| `commandGeneratorTool` | Generates actual CLI commands for the selected cloud provider |

The service mapping is defined as constants:
```
api + aws -> ECS Fargate, Lambda, RDS, S3, ALB, CloudWatch
api + gcp -> Cloud Run, Cloud Functions, Cloud SQL, Cloud Storage
api + azure -> App Service, Container Apps, Functions, Cosmos DB
```

#### `tools/validator.ts` - Environment Check Tools
| Tool | What it does |
|------|-------------|
| `cliCheckerTool` | Runs `aws --version` / `gcloud --version` / `az --version` |
| `authCheckerTool` | Runs `aws sts get-caller-identity` / `gcloud auth list` / `az account show` |
| `envVarCheckerTool` | Checks if required env vars are set (AWS_ACCESS_KEY_ID, etc.) |
| `networkCheckerTool` | Curls cloud provider endpoints to test connectivity |
| `permissionsCheckerTool` | Tries basic operations (list S3 buckets, list GCP projects, list Azure resource groups) |

#### `tools/executor.ts` - Execution Tools
| Tool | What it does |
|------|-------------|
| `commandExecutorTool` | Generic shell command executor with timeout |
| `awsCommandTool` | AWS CLI wrapper that builds and runs `aws <service> <action>` commands |
| `dockerBuildTool` | Builds Docker images |

---

### Layer 5: Deployment Workflow (`src/mastra/workflows/deployment.ts`)

This is the most architecturally interesting part. It's a **single-step workflow with suspend/resume** that implements a human-in-the-loop approval pattern.

**Built with:** `createWorkflow()` and `createStep()` from `@mastra/core/workflows`

**The workflow has 5 phases inside one step:**

```
Phase 1: Environment Validation
    |  (validatorAgent checks CLI, auth, env vars, network)
    v
Phase 2: Project Analysis
    |  (analyzerAgent scans project, detects stack)
    v
Phase 3: Deployment Planning
    |  (deploymentAgent generates services, cost, commands)
    v
Phase 4: Human Approval  <-- SUSPEND POINT
    |  (workflow pauses, returns plan to CLI)
    |  (CLI shows plan to user, asks for confirmation)
    |  (user approves or rejects)
    |  (CLI resumes workflow with { approved: true/false })
    v
Phase 5: Real Cloud Deployment
    |  (imports cloud provider, authenticates, deploys)
    v
Done (records result to deployment history)
```

**The suspend/resume pattern in detail:**

```typescript
// Defined in the step schema:
resumeSchema: z.object({ approved: z.boolean() }),
suspendSchema: z.object({ services, estimatedCost, commands, message, ... }),

// In execute():
execute: async ({ inputData, resumeData, suspend }) => {
    const { approved } = resumeData ?? {};

    // Phases 1-3 only run if !resumeData (first execution)
    if (!resumeData) {
        // ... run analysis, generate plan ...
    }

    // Phase 4: Suspend for approval
    if (approved === undefined && plan) {
        return await suspend({
            services: plan.services,
            estimatedCost: plan.estimatedCost,
            commands: plan.commands,
            message: 'Waiting for user approval',
        });
    }

    // Phase 5: Only runs after resume with approved === true
    if (approved) {
        // ... execute real deployment ...
    }
}
```

When `suspend()` is called:
1. The workflow state is serialized and saved to LibSQL (local SQLite DB)
2. The `suspend` payload (plan details) is returned to the CLI
3. The CLI displays the plan and asks the user for confirmation
4. When user approves, CLI calls `run.resume({ step: 'deployment', resumeData: { approved: true } })`
5. The workflow re-executes with `resumeData` populated, skips phases 1-3, runs phase 5

**Why this matters:** The workflow can survive process restarts. The state is persisted. If the CLI crashes after showing the plan, the user could theoretically resume it.

---

### Layer 6: Cloud Providers (`src/providers/`)

Three provider classes that execute real cloud CLI commands via `child_process.exec`:

#### AWS Provider (`providers/aws/index.ts`)
- `authenticate()` - runs `aws sts get-caller-identity`
- `deployToECS()` - creates ECR repo, builds Docker image, pushes to ECR, creates ECS cluster/task/service
- `deployLambda()` - creates Lambda function, packages and deploys code
- `deployStaticSite()` - creates S3 bucket, enables static hosting, syncs files
- `cleanup()` - deletes created resources

#### GCP Provider (`providers/gcp/index.ts`)
- `authenticate()` - runs `gcloud auth print-access-token`
- `deployToCloudRun()` - submits Cloud Build, deploys to Cloud Run
- `deployCloudFunctions()` - deploys Google Cloud Functions
- `deployToFirebase()` - initializes and deploys to Firebase Hosting
- `cleanup()` - deletes created resources

#### Azure Provider (`providers/azure/index.ts`)
- `authenticate()` - runs `az account show`
- `deployToContainerApps()` - creates Container Apps environment and deploys
- `deployAzureFunctions()` - creates storage account, function app, deploys code
- `deployStaticWebApp()` - creates Static Web App, deploys files
- `deployAppService()` - creates App Service plan and web app
- `cleanup()` - deletes resources or entire resource group

**Shell injection protection:** All user-provided resource names pass through `sanitizeResourceName()` (from `src/utils/shell.ts`) which strips everything except lowercase alphanumeric and hyphens, max 63 characters.

---

### Layer 7: Utilities (`src/utils/`)

| File | What it does |
|------|-------------|
| `config.ts` | `ConfigManager` - persists settings and deployment history to `.agent-cloud/config.json` |
| `logger.ts` | File-based logging to `.agent-cloud/logs/` with 5 levels |
| `error-handler.ts` | Custom error classes (`DeploymentError`, `AuthenticationError`, `ValidationError`) with `ErrorFactory` for common errors |
| `progress.ts` | Terminal spinners (`ora`), progress bars (`cli-progress`), multi-step trackers |
| `shell.ts` | `shellEscape()`, `sanitizeResourceName()`, `sanitizePath()` for safe command construction |

---

## Data Flow: Full Deployment

Here's what happens when a user runs `cloud-agent deploy --cloud aws`:

```
1. CLI parses command, resolves cloud provider to "aws"

2. CLI checks for AI API key in env
   - No key? Show error + how to fix, exit

3. CLI calls mastra.getWorkflow('deploymentWorkflow')
   - Creates a workflow run: workflow.createRun()

4. CLI calls run.start({ inputData: { projectPath, cloud: 'aws' } })

5. WORKFLOW PHASE 1 (inside the step):
   - Calls validatorAgent.stream() with validation prompt
   - Agent autonomously calls tools: cliCheckerTool, authCheckerTool, etc.
   - Returns validation results

6. WORKFLOW PHASE 2:
   - Calls analyzerAgent.stream() with analysis prompt
   - Agent calls: fileSystemTool -> dependencyAnalyzerTool -> packageJsonParserTool
   - Returns: { projectType: 'api', runtime: 'node', framework: 'express', databases: ['PostgreSQL'] }

7. WORKFLOW PHASE 3:
   - Calls deploymentAgent.stream() with planning prompt
   - Agent calls: serviceMapperTool -> costEstimatorTool -> commandGeneratorTool
   - Returns: { services: ['ECS Fargate', 'RDS'], cost: 55, commands: ['aws ecs create-cluster ...'] }

8. WORKFLOW PHASE 4 - SUSPEND:
   - Calls suspend({ services, estimatedCost, commands })
   - State saved to LibSQL
   - Returns to CLI with status: 'suspended', suspendPayload: { ... }

9. CLI receives suspended result:
   - Displays plan (services, cost, commands)
   - Prompts: "Proceed with this deployment?" (inquirer confirm)
   - User types 'y'

10. CLI calls run.resume({ step: 'deployment', resumeData: { approved: true } })

11. WORKFLOW PHASE 5 - REAL DEPLOYMENT:
    - Dynamically imports AWSProvider
    - Calls aws.authenticate() -> runs `aws sts get-caller-identity`
    - Determines project type -> deploys accordingly
    - For API: aws.deployToECS({ appName, containerPort: 3000 })
      - Creates ECR repo
      - Builds and pushes Docker image
      - Creates ECS cluster, task definition, service
    - Returns: { success: true, url: 'http://...', resources: { ... } }

12. WORKFLOW records deployment to ConfigManager (deployment history)

13. CLI displays success message + deployment URL
```

---

## How AI Agents Work (Interview Explanation)

The agents use a pattern called **ReAct (Reasoning + Acting)**:

1. The agent receives a prompt (e.g., "Analyze the project at /path")
2. The LLM sees the prompt + available tool descriptions + schemas
3. The LLM decides: "I should scan the directory first" -> calls `fileSystemTool`
4. Mastra executes the tool, returns results to the LLM
5. The LLM sees the results, decides next step: "I see a package.json, let me read it" -> calls `dependencyAnalyzerTool`
6. This loop continues until the LLM has enough info to respond
7. The LLM generates a final structured response (JSON)

**The code uses streaming:**
```typescript
const stream = await agent.stream([{ role: 'user', content: prompt }]);
for await (const chunk of stream.textStream) {
    fullResponse += chunk;
}
```
This lets us show progress in real-time while the agent thinks.

---

## Key Architectural Decisions

### 1. Why Mastra instead of LangChain/CrewAI?
Mastra is TypeScript-native with first-class workflow support (suspend/resume). It provides typed tool definitions with Zod schemas, which gives compile-time safety. The workflow persistence via LibSQL means deployment state survives crashes.

### 2. Why a single workflow step with phases instead of multiple steps?
The phases share context (analysis output feeds into planning). Using a single step avoids serialization boundaries between phases and makes the suspend/resume logic cleaner - there's exactly one suspend point.

### 3. Why dynamic imports for providers?
```typescript
const { AWSProvider } = await import('../../providers/aws/index.js');
```
Providers are heavy (they import child_process, have large classes). Dynamic imports mean we only load the provider we need at deployment time, not at startup.

### 4. Why local analysis by default?
Most of what `analyze` does (reading package.json, detecting frameworks) doesn't need AI. Running locally is instant, free, and works offline. AI is opt-in for deeper insights.

### 5. Why LibSQL for workflow state?
Mastra supports pluggable storage. LibSQL is an embedded SQLite fork that works locally without any database server. The workflow state (suspend payload, run metadata) is persisted to `agent-cloud.db` in the project root.

---

## Tech Stack Summary

| Component | Technology |
|-----------|-----------|
| Language | TypeScript (ES2022, ESM modules) |
| CLI Framework | Commander.js |
| Interactive Prompts | Inquirer.js |
| AI Framework | Mastra (`@mastra/core` v1.0.1) |
| AI Models | Google Gemini 2.0 Flash / OpenAI GPT-4o Mini |
| Schema Validation | Zod |
| Workflow Persistence | LibSQL (embedded SQLite) |
| Terminal UI | chalk, ora, figlet, cli-progress |
| Shell Execution | Node.js `child_process.exec` (promisified) |
| Build | TypeScript compiler (`tsc`) |
| Module System | ESM (`"type": "module"` in package.json) |

---

## Project Structure

```
agent-cloud/
├── src/
│   ├── cli/                    # CLI layer (user-facing)
│   │   ├── index.ts            # Entry point, command definitions
│   │   ├── commands.ts         # init, analyze, history, info
│   │   ├── workflow-commands.ts # deploy, status (uses Mastra)
│   │   ├── banner.ts           # Terminal UI helpers
│   │   ├── error-handler.ts    # Global error handling
│   │   └── prompts.ts          # Inquirer prompt definitions
│   │
│   ├── mastra/                 # AI layer (the brain)
│   │   ├── index.ts            # Mastra instance (wires everything)
│   │   ├── agents/
│   │   │   ├── analyzer.ts     # Project analysis agent
│   │   │   ├── deployment.ts   # Deployment planning agent
│   │   │   ├── validator.ts    # Environment validation agent
│   │   │   └── index.ts        # Re-exports
│   │   ├── tools/
│   │   │   ├── index.ts        # File system & dependency tools
│   │   │   ├── deployment.ts   # Service mapping, cost, commands
│   │   │   ├── validator.ts    # CLI, auth, env, network checks
│   │   │   └── executor.ts     # Shell command execution
│   │   └── workflows/
│   │       └── deployment.ts   # 5-phase deployment workflow
│   │
│   ├── providers/              # Cloud execution layer
│   │   ├── aws/index.ts        # AWS (ECS, Lambda, S3)
│   │   ├── gcp/index.ts        # GCP (Cloud Run, Functions, Firebase)
│   │   └── azure/index.ts      # Azure (Container Apps, Functions, App Service)
│   │
│   ├── types/
│   │   └── index.ts            # Shared TypeScript types
│   │
│   └── utils/
│       ├── config.ts           # Settings & deployment history
│       ├── logger.ts           # File-based logging
│       ├── error-handler.ts    # Custom error classes
│       ├── progress.ts         # Spinners & progress bars
│       └── shell.ts            # Input sanitization
│
├── package.json
├── tsconfig.json
├── mastra.config.ts            # Mastra framework config
└── .env                        # API keys (not committed)
```
