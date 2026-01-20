# Module 2.3: Environment Validator Agent - COMPLETED ✅

## Summary

Successfully implemented the **Environment Validator Agent** with comprehensive environment checking! This agent validates CLI tools, authentication, environment variables, network connectivity, and permissions.

---

## ✅ Deliverables Completed

### 1. New Files Created (2 files)

```
src/mastra/
├── agents/
│   └── validator.ts          # ✅ Environment Validator Agent
└── tools/
    └── validator.ts          # ✅ 5 validation tools
```

### 2. Updated Files (1 file)

```
src/mastra/index.ts           # ✅ Registered validator agent
```

---

## 🔍 Validator Agent Features

### **Agent Capabilities**

The Validator Agent is an expert DevOps engineer that:

- 🔧 **Checks CLI Tools** - Verifies aws-cli, gcloud, az are installed
- 🔐 **Validates Auth** - Confirms user is authenticated
- 📝 **Checks Env Vars** - Ensures required variables are set
- 🌐 **Tests Network** - Verifies connectivity to cloud APIs
- ✅ **Validates Permissions** - Tests basic cloud permissions

### **Configuration**

```typescript
model: [
  { model: 'google/gemini-1.5-flash' },  // Primary (free!)
  { model: 'openai/gpt-4o-mini' },       // Fallback
],

tools: {
  cliCheckerTool,          // Check CLI installation
  authCheckerTool,         // Verify authentication
  envVarCheckerTool,       // Check environment variables
  networkCheckerTool,      // Test connectivity
  permissionsCheckerTool,  // Validate permissions
}
```

---

## 🛠️ Tools Implemented (5 Tools)

### **1. CLI Checker Tool** (`cliCheckerTool`)

Verifies cloud CLI tools are installed.

**Input:**
- `cloud`: aws | gcp | azure

**Output:**
```typescript
{
  installed: true,
  version: "aws-cli/2.13.0 Python/3.11.5",
  command: "aws",
  installUrl: "https://docs.aws.amazon.com/cli/...",
  error: undefined
}
```

**For Each Cloud:**
- **AWS**: Checks `aws --version`
- **GCP**: Checks `gcloud --version`
- **Azure**: Checks `az --version`

### **2. Authentication Checker Tool** (`authCheckerTool`)

Verifies user authentication status.

**Input:**
- `cloud`: aws | gcp | azure

**Output:**
```typescript
{
  authenticated: true,
  identity: "arn:aws:iam::123456789012:user/admin",
  account: "123456789012",
  region: "us-east-1",
  error: undefined
}
```

**How It Works:**
- **AWS**: Runs `aws sts get-caller-identity`
- **GCP**: Runs `gcloud auth list`
- **Azure**: Runs `az account show`

### **3. Environment Variable Checker Tool** (`envVarCheckerTool`)

Checks required environment variables.

**Input:**
- `cloud`: aws | gcp | azure

**Output:**
```typescript
{
  allSet: false,
  missing: ["AWS_SECRET_ACCESS_KEY"],
  present: ["AWS_ACCESS_KEY_ID"],
  optional: ["AWS_REGION", "AWS_DEFAULT_REGION"]
}
```

**Required Variables:**

| Cloud | Required | Optional |
|-------|----------|----------|
| **AWS** | AWS_ACCESS_KEY_ID<br>AWS_SECRET_ACCESS_KEY | AWS_REGION<br>AWS_DEFAULT_REGION |
| **GCP** | GOOGLE_APPLICATION_CREDENTIALS<br>GCLOUD_PROJECT | GOOGLE_CLOUD_PROJECT |
| **Azure** | AZURE_SUBSCRIPTION_ID<br>AZURE_TENANT_ID | AZURE_RESOURCE_GROUP |

### **4. Network Checker Tool** (`networkCheckerTool`)

Tests network connectivity to cloud APIs.

**Input:**
- `cloud`: aws | gcp | azure

**Output:**
```typescript
{
  connected: true,
  latency: 120,
  endpoint: "https://aws.amazon.com",
  error: undefined
}
```

**Endpoints Tested:**
- **AWS**: https://aws.amazon.com
- **GCP**: https://cloud.google.com
- **Azure**: https://azure.microsoft.com

### **5. Permissions Checker Tool** (`permissionsCheckerTool`)

Validates basic cloud permissions.

**Input:**
- `cloud`: aws | gcp | azure

**Output:**
```typescript
{
  hasBasicPermissions: true,
  canList: true,
  canCreate: undefined,
  suggestions: ["User has S3 list permissions"],
  error: undefined
}
```

**Permission Tests:**
- **AWS**: `aws s3 ls` (tests S3 list permissions)
- **GCP**: `gcloud projects list` (tests project list)
- **Azure**: `az group list` (tests resource group list)

---

## 📋 Agent Output Format

The validator agent returns comprehensive validation reports:

```json
{
  "status": "ready",
  "cloud": "aws",
  "checks": {
    "cli": {
      "passed": true,
      "installed": true,
      "version": "aws-cli/2.13.0",
      "message": "AWS CLI is installed and up to date"
    },
    "authentication": {
      "passed": true,
      "authenticated": true,
      "identity": "arn:aws:iam::123456789012:user/admin",
      "message": "Authenticated as admin user"
    },
    "envVars": {
      "passed": true,
      "allSet": true,
      "missing": [],
      "message": "All required environment variables are set"
    },
    "network": {
      "passed": true,
      "connected": true,
      "latency": 120,
      "message": "Connection to AWS APIs successful (120ms)"
    },
    "permissions": {
      "passed": true,
      "hasBasicPermissions": true,
      "message": "User has basic permissions"
    }
  },
  "summary": "Environment is ready for AWS deployment ✅",
  "issues": [],
  "nextSteps": [
    "1. Run project analysis",
    "2. Generate deployment plan",
    "3. Deploy application"
  ]
}
```

### **With Issues:**

```json
{
  "status": "needs_setup",
  "cloud": "aws",
  "checks": { ... },
  "summary": "Environment needs configuration",
  "issues": [
    {
      "severity": "error",
      "check": "authentication",
      "message": "Not authenticated with AWS",
      "solution": "Run: aws configure"
    },
    {
      "severity": "warning",
      "check": "envVars",
      "message": "Optional variable AWS_REGION not set",
      "solution": "Set AWS_REGION in .env file"
    }
  ],
  "nextSteps": [
    "1. Run: aws configure",
    "2. Set environment variables",
    "3. Re-run validation"
  ]
}
```

---

## 🎯 Usage Example

```typescript
// Validate AWS environment
const validationResult = await validatorAgent.stream([
  {
    role: 'user',
    content: `Validate my environment for AWS deployment.
    
    Check:
    1. AWS CLI installation
    2. Authentication status
    3. Environment variables
    4. Network connectivity
    5. Basic permissions
    
    Provide a comprehensive report with solutions for any issues.`
  }
]);

// Stream the response
for await (const chunk of validationResult.textStream) {
  console.log(chunk);
}
```

---

## 📊 Validation Scenarios

### **Scenario 1: Fully Configured** ✅

```
✅ CLI: AWS CLI 2.13.0 installed
✅ Auth: Authenticated as arn:aws:iam::123456789012:user/admin
✅ Env Vars: All required variables set
✅ Network: Connected (120ms latency)
✅ Permissions: Has S3 list permissions

Status: READY FOR DEPLOYMENT 🚀
```

### **Scenario 2: Not Authenticated** ❌

```
✅ CLI: AWS CLI 2.13.0 installed
❌ Auth: Not authenticated
⚠️  Env Vars: Missing AWS_SECRET_ACCESS_KEY
✅ Network: Connected (150ms latency)
❓ Permissions: Cannot verify (not authenticated)

Status: NEEDS SETUP

Solutions:
1. Run: aws configure
2. Enter AWS_ACCESS_KEY_ID
3. Enter AWS_SECRET_ACCESS_KEY
4. Set default region
```

### **Scenario 3: CLI Not Installed** ❌

```
❌ CLI: AWS CLI not installed
❌ Auth: Cannot check (CLI not installed)
❌ Env Vars: Cannot verify auth without CLI
✅ Network: Connected (100ms latency)
❌ Permissions: Cannot check (CLI not installed)

Status: NEEDS SETUP

Solutions:
1. Install AWS CLI from: https://docs.aws.amazon.com/cli/...
2. Run: aws configure
3. Re-run validation
```

---

## ✅ Requirements Met

From Plan Module 2.3:

- [x] Check installed CLI tools (aws-cli, gcloud, az) ✅
- [x] Verify authentication status ✅
- [x] Validate credentials and permissions ✅
- [x] Check required environment variables ✅
- [x] Verify network connectivity ✅
- [x] Provide helpful error messages ✅
- [x] Suggest solutions for issues ✅

**Bonus Features:**
- [x] Version checking for CLI tools
- [x] Latency measurement for network
- [x] Permission testing with actual cloud commands
- [x] Severity levels for issues (error/warning/info)
- [x] Installation URLs for missing tools
- [x] Multi-model AI support (Gemini + OpenAI)

---

## 🚀 Integration Ready

This agent can be used in:

1. **Status Command** - `cloud-agent status`
2. **Pre-Deployment Checks** - Before running deploy
3. **Troubleshooting** - Help users fix env issues
4. **CI/CD Pipelines** - Validate build environments

---

## 📈 Stats

- **New files**: 2
- **Updated files**: 1
- **Tools created**: 5
- **Validation checks**: 5 categories
- **Lines of code**: ~450
- **Clouds supported**: AWS, GCP, Azure
- **AI Agent**: 1 comprehensive validator

---

## 🎉 Phase 2 Complete!

With Module 2.3 done, we've completed **ALL of Phase 2**:

✅ **Module 2.1**: Analyzer Agent (project analysis)  
✅ **Module 2.2**: Deployment Agent (cloud planning)  
✅ **Module 2.3**: Validator Agent (environment checking)

**We now have 3 powerful AI agents:**
1. 🔍 Analyzer - Understands your project
2. ☁️ Deployment - Plans cloud deployment
3. ✅ Validator - Checks environment readiness

---

## 🔜 Next: Phase 3

**Workflow Orchestration** - Connect all agents together!
- Main deployment workflow
- Human-in-the-loop steps
- Suspend/Resume functionality
- Complete end-to-end automation

---

**Completed**: January 20, 2026  
**Module**: 2.3 Environment Validator Agent  
**Status**: ✅ DONE  
**Phase 2**: ✅ COMPLETE!  
**Next**: Phase 3 - Workflow Orchestration
