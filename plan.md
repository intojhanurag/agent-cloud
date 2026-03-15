# Agent-Cloud: Production-Ready Plan

## Previous Work (Completed)
All initial fixes are done: ESM imports, model config, banner, interactive approval, init/history commands, shell sanitization basics, error messages. The CLI runs and commands work.

## What's Still Broken / Missing

**Critical deployment bugs:**
1. `'agent-cloud-app'` hardcoded 8 times in workflow -- every deployment uses same resource name
2. `'./dist'` and ports (3000/8080) hardcoded -- ignores user's project
3. AWS ECS returns `http://<task-ip>:3000` placeholder -- not a real URL
4. Falls back to `nginx:latest` (AWS) / `containerapps-helloworld` (Azure) if no Docker image -- deploys wrong app
5. Azure defaults to `centralindia` location
6. No env var injection into deployed containers
7. No Dockerfile generation -- assumes Docker image exists

**No tests:** vitest in package.json but zero test files, no vitest.config

**Security gaps:** Shell injection still possible -- `shellEscape()` exists but isn't used in ~50 exec calls across providers

**Missing features:** No dry-run, no cleanup command, no logs command, no config file support, no --json output

**No documentation site:** Current website/ is static HTML, no search, no structured docs

**No CI/CD:** No GitHub Actions, no npm publish pipeline, package.json author is empty

---

## Phase 1: Fix Critical Deployment Bugs
> **URGENT | No dependencies**

### 1.1 Remove hardcoded `'agent-cloud-app'`
**File:** `src/mastra/workflows/deployment.ts`
- Expand `inputSchema` to accept `appName`, `containerPort?`, `buildDir?`, `dockerImage?`, `envVars?`
- Replace all 8 `'agent-cloud-app'` literals with `inputData.appName`
- Replace `'./dist'` with `inputData.buildDir || './dist'`
- Replace hardcoded ports with `inputData.containerPort || <provider-default>`
- Update workflow `inputSchema` at line 422 to match

**File:** `src/cli/workflow-commands.ts`
- Derive `appName` from `package.json` name or `path.basename(projectPath)` as fallback
- Pass `appName`, port, buildDir through `run.start({ inputData })`

### 1.2 Fix AWS ECS placeholder URL
**File:** `src/providers/aws/index.ts` (line 165)
- After creating ECS service, poll for running task with `aws ecs list-tasks` + `aws ecs describe-tasks`
- Extract ENI ID from task attachment, get public IP via `aws ec2 describe-network-interfaces`
- Return real `http://<publicIp>:<port>` (fallback: "check AWS console")

### 1.3 Fix nginx/hello-world fallback
**File:** `src/providers/aws/index.ts` (line 96) -- remove `|| 'nginx:latest'`
**File:** `src/providers/azure/index.ts` (line 128) -- remove `|| 'containerapps-helloworld:latest'`
- If no `dockerImage` and no Dockerfile exists, throw descriptive error

### 1.4 Add Dockerfile generation
**New file:** `src/utils/dockerfile-generator.ts`
- Templates for Node.js, Python, Go based on detected runtime/framework
- Called from workflow when no Dockerfile exists and target is container service

### 1.5 Fix Azure default location
**File:** `src/providers/azure/index.ts` (line 42) -- change `'centralindia'` to `'eastus'`

### 1.6 Environment variable injection
**File:** `src/providers/aws/index.ts` -- add `environment` array to ECS task definition
**File:** `src/providers/gcp/index.ts` -- add `--set-env-vars` to `gcloud run deploy`
**File:** `src/providers/azure/index.ts` -- add `--env-vars` to `az containerapp create`

---

## Phase 2: Testing Infrastructure
> **HIGH | After Phase 1**

### 2.1 Vitest config
**New file:** `vitest.config.ts` -- node environment, globals, v8 coverage, 30s timeout

### 2.2 Unit tests
| New file | Tests |
|----------|-------|
| `src/utils/__tests__/shell.test.ts` | sanitizeResourceName, shellEscape, sanitizePath |
| `src/utils/__tests__/config.test.ts` | ConfigManager CRUD, stats, 50-record limit |
| `src/utils/__tests__/error-handler.test.ts` | ErrorFactory methods, ErrorHandler dispatch |
| `src/utils/__tests__/dockerfile-generator.test.ts` | Template generation per runtime |

### 2.3 Provider integration tests (mocked exec)
| New file | Tests |
|----------|-------|
| `src/providers/__tests__/aws.test.ts` | authenticate, deployToECS, deployStaticSite, cleanup |
| `src/providers/__tests__/gcp.test.ts` | authenticate, deployToCloudRun, deployToFirebase |
| `src/providers/__tests__/azure.test.ts` | authenticate, deployToContainerApps, deployStaticWebApp |

### 2.4 Workflow test
**New file:** `src/mastra/workflows/__tests__/deployment.test.ts` -- mock agents, test suspend/resume, rejection, errors

### 2.5 Package.json updates
- Scripts: `test:run`, `test:coverage`
- DevDep: `@vitest/coverage-v8`

---

## Phase 3: Security Hardening
> **HIGH | After Phase 1**

### 3.1 Shell escape all provider exec calls
**Files:** All 3 providers (`aws/index.ts`, `gcp/index.ts`, `azure/index.ts`)
- Import `shellEscape` and wrap every interpolated variable in ~50+ exec calls

### 3.2 Restrict command executor tool
**File:** `src/mastra/tools/executor.ts`
- Allowlist: only `aws`, `gcloud`, `az`, `docker`, `firebase`, `func`, `npx`, `curl` prefixes
- Escape parameter values in `awsCommandTool`

### 3.3 Strengthen path sanitization
**File:** `src/utils/shell.ts`
- Replace naive `../` removal with `path.resolve()` + cwd boundary check
- Prevent `..././` bypass

### 3.4 Security tests
**New file:** `src/utils/__tests__/shell-security.test.ts`
- Injection vectors: `; rm -rf /`, `` `whoami` ``, `$()`, newlines, path traversal

---

## Phase 4: New CLI Features
> **MEDIUM | After Phases 1-3**

### 4.1 `--dry-run` flag
**Files:** `src/cli/index.ts`, `src/cli/workflow-commands.ts`
- Run validation + analysis + planning, display plan, exit without deploying

### 4.2 `cleanup` command
**New file:** `src/cli/cleanup-command.ts`
- List deployments from config, let user select, call provider's `cleanup()` method
- Register in `src/cli/index.ts`

### 4.3 `logs` command
**New file:** `src/cli/logs-command.ts`
- AWS: `aws logs get-log-events`, GCP: `gcloud logging read`, Azure: `az containerapp logs show`
- Register in `src/cli/index.ts`

### 4.4 Deploy flags
**File:** `src/cli/index.ts`
- `--app-name <name>`, `--port <number>`, `--image <image>`, `--build-dir <dir>`

### 4.5 Project config file
**New file:** `src/utils/deploy-config.ts`
- Support `agent-cloud.config.json` in project root (appName, cloud, region, port, envVars, buildDir)
- CLI flags override config values

### 4.6 `--json` output mode
**File:** `src/cli/index.ts` -- global flag, suppress chalk/ora, emit structured JSON for CI/CD

---

## Phase 5: Documentation Site (Starlight / Astro)
> **MEDIUM | Independent -- runs in parallel**

### Why Starlight
- Ships **zero JavaScript** by default (Astro islands architecture)
- **Built-in Pagefind search** -- free, local, zero-config (no Algolia needed)
- Beautiful accessible default theme with dark/light mode
- Framework-agnostic -- supports React/Vue/Svelte components in MDX
- Used by Cloudflare, Microsoft, Vite ecosystem
- Fastest build times of any docs framework

### 5.1 Setup
- Remove current `website/` static HTML
- Create Starlight project in `docs/` directory
- Configure `astro.config.mjs` with sidebar, social links, search

### 5.2 Documentation pages (`docs/src/content/docs/`)
```
guides/
  introduction.mdx        What is agent-cloud, why, comparison with alternatives
  installation.mdx        Prerequisites, npm install, global linking
  quickstart.mdx          Deploy in 3 commands with terminal examples
  configuration.mdx       .env setup, agent-cloud.config.json, preferences

providers/
  aws.mdx                 AWS setup, IAM permissions, services used, pricing
  gcp.mdx                 GCP setup, APIs to enable, services used
  azure.mdx               Azure setup, resource groups, services used

reference/
  init.mdx                cloud-agent init
  analyze.mdx             cloud-agent analyze (--local, --ai, --path)
  deploy.mdx              cloud-agent deploy (all flags, workflow phases)
  status.mdx              cloud-agent status
  history.mdx             cloud-agent history
  cleanup.mdx             cloud-agent cleanup
  logs.mdx                cloud-agent logs

advanced/
  architecture.mdx        System layers, agent design, workflow engine
  how-agents-work.mdx     ReAct pattern, tool calling, model selection
  security.mdx            Shell sanitization, credential handling
  troubleshooting.mdx     Common errors and fixes

contributing.mdx          How to contribute, dev setup, testing
```

### 5.3 Theme customization
- Hero section on index with terminal animation / code block
- Provider comparison table component
- Copy-to-clipboard on all code blocks (built-in)

### 5.4 Scripts
- `"docs:dev": "cd docs && npm run dev"`
- `"docs:build": "cd docs && npm run build"`

---

## Phase 6: CI/CD & npm Publishing
> **MEDIUM | After Phases 1-3**

### 6.1 GitHub Actions CI
**New file:** `.github/workflows/ci.yml`
- Push to master + PRs, Node 18/20/22 matrix
- Steps: install, type-check, test, coverage upload (codecov)

### 6.2 npm publish
**New file:** `.github/workflows/publish.yml`
- Trigger: GitHub Release created
- Steps: test, build, `npm publish` with `NPM_TOKEN` secret

### 6.3 Docs deployment
**New file:** `.github/workflows/docs.yml`
- Trigger: push to master (docs/ changes)
- Build Starlight, deploy to GitHub Pages

### 6.4 Package.json metadata
```json
"author": "Anurag Ojha",
"repository": { "type": "git", "url": "https://github.com/intojhanurag/agent-cloud" },
"homepage": "https://intojhanurag.github.io/agent-cloud",
"bugs": { "url": "https://github.com/intojhanurag/agent-cloud/issues" },
"files": ["dist", "README.md", "LICENSE"],
"publishConfig": { "access": "public" },
"prepublishOnly": "npm run type-check && npm run test:run && npm run build"
```

### 6.5 `.npmignore`
Exclude: src/, docs/, website/, examples/, .github/, tests, images, .db files

---

## Phase 7: Polish & Advanced Features
> **LOW | After all above**

- 7.1 Lazy model selection -- move from import-time to runtime in all 3 agents
- 7.2 Progress spinners inside provider methods between exec calls
- 7.3 `update` command -- self-update via npm with version check
- 7.4 More languages in local analysis (Java/Spring, Ruby/Rails, Rust, .NET)
- 7.5 Multi-region deployment support
- 7.6 Terraform export -- generate `.tf` files from deployment plan
- 7.7 Cost optimization recommendations based on usage patterns

---

## Execution Order

```
Phase 1 (Bugs) ────> Phase 2 (Tests) ────> Phase 6 (CI/CD)
     |                     |
     +───> Phase 3 (Security) ──────────────┘
     |
     +───> Phase 4 (Features) ────> Phase 7 (Polish)

Phase 5 (Docs) ── independent, parallel with everything
```

## Verification

After each phase:
1. `npm run type-check` -- clean TypeScript compilation
2. `npm run test:run` -- all tests pass (Phase 2+)
3. `npm run build` -- production build succeeds
4. Smoke tests:
   - `cloud-agent init` -- setup wizard completes
   - `cloud-agent analyze` -- works without API key
   - `cloud-agent analyze --ai` -- AI analysis works
   - `cloud-agent deploy --cloud aws --dry-run` -- shows plan, no execution
   - `cloud-agent deploy --cloud aws` -- full flow with approval
   - `cloud-agent history` -- shows records
   - `cloud-agent cleanup` -- removes resources
5. `npm run docs:dev` -- docs site renders, search works, all pages load
