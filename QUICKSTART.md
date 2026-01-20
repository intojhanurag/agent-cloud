# Quick Start Guide

## Installation Steps

1. **Install Dependencies** (run from PowerShell or CMD):
   ```bash
   npm install
   ```

2. **Test the CLI in Development Mode**:
   ```bash
   npm run dev
   ```
   This will show the beautiful banner and help text!

3. **Build for Production**:
   ```bash
   npm run build
   ```

4. **(Optional) Make it globally available**:
   ```bash
   npm link
   cloud-agent --help
   ```

## What You Should See

When you run `npm run dev`, you'll see:

```
  ╔═══════════════════════════════════════════════════════════════════════════╗
  ║                                                                           ║
  ║   [Colorful CLOUD gradient text in blue]                                 ║
  ║   [Colorful AGENT gradient text in orange]                               ║
  ║                                                                           ║
  ║                    AI-Powered Cloud Deployment                           ║
  ║                            v1.0.0                                         ║
  ║                                                                           ║
  ╚═══════════════════════════════════════════════════════════════════════════╝
                              🤖 Powered by Mastra AI

Usage: cloud-agent [options] [command]

Commands:
  deploy [options]   Deploy your application to the cloud
  analyze            Analyze current project structure
  status             Check deployment status and environment

💡 Tip: Start with cloud-agent analyze to scan your project!
```

## Available Commands (Currently Placeholders)

```bash
# Show help
npm run dev

# Deploy command (coming in Phase 4)
npm run dev deploy --cloud aws

# Analyze command (coming in Phase 2)
npm run dev analyze

# Status command (coming in Phase 3)
npm run dev status
```

## Troubleshooting

### "Cannot find module" errors
Make sure you ran `npm install` first.

### WSL errors
Run commands from PowerShell or CMD, not WSL bash.

### TypeScript errors
Check `tsconfig.json` is present and run `npm run type-check`.

## Next Development Steps

See `MODULE-1.1-COMPLETE.md` for detailed completion report and next steps!
