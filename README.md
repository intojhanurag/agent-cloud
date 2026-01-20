# 🚀 Agent-Cloud

> AI-Powered Cloud Deployment CLI using Mastra

**Agent-cloud** is an intelligent CLI tool that analyzes your project and deploys it to AWS, GCP, or Azure with human-in-the-loop validation, powered by Mastra AI agents.

## ✨ Features

- 🎨 **Beautiful CLI Interface** with colorful ASCII art and interactive prompts
- 🤖 **Intelligent Project Analysis** using AI agents to understand your codebase
- ☁️ **Multi-Cloud Support** for AWS, GCP, and Azure deployments
- 🔄 **Human-in-the-Loop** validation for safe, controlled deployments
- ✅ **Environment Verification** to ensure prerequisites are met automatically

## 🏗️ Current Status

**Phase 1: Foundation** ✅ **COMPLETED!**
- [x] **Module 1.1**: CLI framework setup (Commander + Chalk + Figlet)
- [x] **Module 1.2**: Interactive prompt system with cloud provider selection
- [x] Beautiful ASCII art banner with gradients
- [x] Progress tracking (spinners, progress bars, multi-step)
- [x] Full interactive demo command

**Next: Phase 2** - Mastra Agent System (Analyzer, Deployment, Validator)

## 📦 Installation

### Development

```bash
# Clone the repository
git clone https://github.com/yourusername/agent-cloud.git
cd agent-cloud

# Install dependencies
pnpm install

# Run in development mode
pnpm dev
```

### Usage (When Published)

```bash
# Install globally
npm install -g agent-cloud

# Run from anywhere
cloud-agent
```

## 🎯 Quick Start

```bash
# Display help and see available commands
cloud-agent --help

# 🌟 Try the interactive demo! (Phase 1.2 - NEW!)
cloud-agent demo

# Demo with specific cloud provider
cloud-agent demo --cloud aws

# Demo with auto-approve (skip confirmations)
cloud-agent demo --yes

# Show cloud provider information
cloud-agent info

# Other commands (coming soon)
cloud-agent analyze    # Project analysis (Phase 2)
cloud-agent deploy     # Actual deployment (Phase 4)
cloud-agent status     # Environment check (Phase 3)
```

## 🛠️ Development

```bash
# Run in development mode with auto-reload
pnpm dev

# Build for production
pnpm build

# Run built version
pnpm start

# Type check
pnpm type-check
```

## 📋 Commands

### `cloud-agent`
Display beautiful banner and help information

### `cloud-agent demo` ✨ **NEW!**
Interactive demo of the full deployment flow

Experience the complete user journey:
- Chat-like requirement collection
- Cloud provider selection (AWS/GCP/Azure)
- Simulated project analysis
- Deployment plan review
- Human-in-the-loop approval
- Progress tracking with visual feedback

Options:
- `-c, --cloud <provider>` - Preselect cloud provider (aws, gcp, azure)
- `-y, --yes` - Auto-approve mode (skip confirmations)

**Example:**
```bash
cloud-agent demo
cloud-agent demo --cloud gcp
cloud-agent demo --yes
```

### `cloud-agent info` ✨ **NEW!**
Show all available cloud providers with detailed information

### `cloud-agent analyze` (Coming in Phase 2)
Analyze current project structure and detect technology stack

### `cloud-agent deploy` (Coming in Phase 4)
Deploy your application to the cloud with AI assistance

Options:
- `-c, --cloud <provider>` - Cloud provider (aws, gcp, azure)
- `-y, --yes` - Skip approval prompts (auto-approve)

### `cloud-agent status` (Coming in Phase 3)
Check deployment status and environment setup

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLI Interface Layer                       │
│  (Commander.js + Chalk + Inquirer + ASCII Art)                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    Mastra Agent Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Analyzer    │  │  Deployment  │  │  Validator   │          │
│  │    Agent     │  │    Agent     │  │    Agent     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

## 📄 License

MIT

## 🙏 Acknowledgments

- Built with [Mastra](https://mastra.ai) - AI application framework
- Inspired by modern deployment tools

---

<div align="center">

**Made with ❤️ using Mastra**

[Documentation](./plan.md) • [Report Bug](https://github.com/yourusername/agent-cloud/issues) • [Request Feature](https://github.com/yourusername/agent-cloud/issues)

</div>
