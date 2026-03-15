# Changelog

## 1.0.0 (2025-03-15)

### Features

- **AI-powered deployment** -- Three specialized agents (analyzer, deployment planner, validator) using Mastra framework with Gemini or OpenAI models
- **Multi-cloud support** -- Deploy to AWS (ECS, Lambda, S3), GCP (Cloud Run, Functions, Firebase), Azure (Container Apps, Functions, Static Web Apps)
- **Human-in-the-loop approval** -- 5-phase workflow with plan review before any resources are created
- **CLI commands** -- `init`, `analyze`, `deploy`, `status`, `history`, `cleanup`, `logs`
- **Deploy flags** -- `--dry-run`, `--app-name`, `--port`, `--image`, `--build-dir`, `--yes`, `--json`
- **Dockerfile generation** -- Auto-generates multi-stage Dockerfiles for Node.js, Python, and Go
- **Environment variables** -- Reads `.env` files and passes vars to deployed containers
- **Deployment config file** -- `agent-cloud.config.json` for project-level settings
- **Cost estimation** -- Estimated monthly costs shown before deployment
- **Deployment history** -- Track all deployments with URLs, resources, costs, and durations

### Security

- Shell escape all exec calls across AWS, GCP, Azure providers
- Command allowlist on executor tool (aws, gcloud, az, docker, etc.)
- Path traversal protection with resolved path prefix checking
- Input sanitization on all user-provided values

### Testing

- 105 tests across 8 test files
- Unit tests for shell sanitization, config manager, error handler, Dockerfile generator
- Provider integration tests with mocked exec for AWS, GCP, Azure
- Security tests covering injection vectors and path traversal

### Documentation

- Starlight documentation site with 20 pages
- Guides, provider docs, command reference, architecture, contributing
- Pagefind search integration
