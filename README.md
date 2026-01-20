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

**Phase 1: Foundation** ✅ (Completed)
- [x] Project initialization
- [x] CLI framework setup (Commander + Chalk + Figlet)
- [x] Beautiful ASCII art banner
- [x] Interactive prompt system (Coming in 1.2)
- [ ] Basic Mastra agent setup (Phase 2)
- [ ] File system analysis tool (Phase 2)

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
# Display help
cloud-agent --help

# Analyze your project (Coming soon)
cloud-agent analyze

# Deploy to cloud (Coming soon)
cloud-agent deploy --cloud aws

# Check deployment status (Coming soon)
cloud-agent status
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
