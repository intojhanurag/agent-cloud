# Simple Node.js API - Agent Cloud Demo

> 🚀 **A complete example application demonstrating agent-cloud deployment capabilities**

This is a simple REST API built with Node.js and Express that showcases how to deploy applications to AWS, GCP, or Azure using the **agent-cloud** CLI tool.

---

## What This Demo Shows

This example demonstrates:

- ✅ **AI-Powered Deployment** - Let AI analyze and deploy your application
- ✅ **Multi-Cloud Support** - Deploy to AWS, GCP, or Azure with one command
- ✅ **Container Deployment** - Automatically containerized and deployed
- ✅ **Production-Ready** - Complete with health checks, error handling, and logging
- ✅ **Zero Configuration** - No manual infrastructure setup required

---

## Features

This simple Task Management API includes:

- **CRUD Operations** - Create, Read, Update, Delete tasks
- **RESTful Design** - Standard HTTP methods and status codes
- **Health Checks** - Built-in health endpoint for monitoring
- **Statistics** - Track completed vs pending tasks
- **Error Handling** - Comprehensive error messages
- **Docker Support** - Ready for containerized deployment

---

## Quick Start

### Prerequisites

Before deploying, make sure you have:

1. **agent-cloud** installed ([see main README](../../README.md))
2. **Node.js** 18+ installed
3. Cloud provider CLI configured (AWS, GCP, or Azure)
4. AI API key (OpenAI or Gemini)

### Local Testing

```bash
# Navigate to this directory
cd examples/simple-nodejs-api

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start the server
npm start

# In another terminal, test the API
npm test
```

The API will be available at `http://localhost:3000`

---

## Deploying with Agent Cloud

### Deploy to AWS

```bash
# Make sure you're in the example directory
cd examples/simple-nodejs-api

# Deploy to AWS (ECS Fargate)
cloud-agent deploy --cloud aws

# Review the deployment plan
# The AI will show you:
# - Detected project type (Node.js API)
# - Deployment target (ECS Fargate)
# - Estimated costs
# - Required resources

# Approve when ready
# ✓ Confirm deployment

# Wait for deployment (~2-3 minutes)
# Your API will be deployed to:
# https://your-service.region.amazonaws.com
```

### Deploy to GCP

```bash
cd examples/simple-nodejs-api

# Deploy to Google Cloud Run
cloud-agent deploy --cloud gcp

# The AI will automatically:
# 1. Build your Docker container
# 2. Push to Google Container Registry
# 3. Deploy to Cloud Run
# 4. Configure health checks
# 5. Return your public URL

# Your API will be available at:
# https://simple-nodejs-api-xyz.run.app
```

### Deploy to Azure

```bash
cd examples/simple-nodejs-api

# Deploy to Azure Container Apps
cloud-agent deploy --cloud azure

# The AI handles:
# 1. Container registry setup
# 2. Container build and push
# 3. Container App creation
# 4. Environment configuration
# 5. Public endpoint setup

# Your API will be live at:
# https://simple-nodejs-api.azurecontainerapps.io
```

---

## API Documentation

Once deployed, your API will have the following endpoints:

### Health Check
```bash
GET /
```
Returns API status and available endpoints.

**Example:**
```bash
curl https://your-deployed-url.com/
```

### List All Tasks
```bash
GET /api/tasks
```
Returns all tasks in the system.

**Example Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 1,
      "title": "Learn Agent Cloud",
      "completed": false,
      "createdAt": "2026-01-20T08:00:00.000Z"
    }
  ]
}
```

### Get Single Task
```bash
GET /api/tasks/:id
```

**Example:**
```bash
curl https://your-deployed-url.com/api/tasks/1
```

### Create Task
```bash
POST /api/tasks
Content-Type: application/json

{
  "title": "Your task title"
}
```

**Example:**
```bash
curl -X POST https://your-deployed-url.com/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Deploy to production"}'
```

### Update Task
```bash
PUT /api/tasks/:id
Content-Type: application/json

{
  "title": "Updated title",
  "completed": true
}
```

**Example:**
```bash
curl -X PUT https://your-deployed-url.com/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

### Delete Task
```bash
DELETE /api/tasks/:id
```

**Example:**
```bash
curl -X DELETE https://your-deployed-url.com/api/tasks/1
```

### Get Statistics
```bash
GET /api/stats
```

Returns task completion statistics.

**Example Response:**
```json
{
  "success": true,
  "data": {
    "total": 5,
    "completed": 2,
    "pending": 3,
    "completionRate": "40.00%"
  }
}
```

---

## Testing Your Deployment

After deployment, test your live API:

```bash
# Set your deployment URL
export API_URL=https://your-deployed-url.com

# Test the API
npm test

# Or manually test endpoints
curl $API_URL
curl $API_URL/api/tasks
curl -X POST $API_URL/api/tasks -H "Content-Type: application/json" -d '{"title":"Test task"}'
```

---

## What Happens During Deployment?

When you run `cloud-agent deploy`, here's what the AI does:

### Phase 1: Analysis
```
✓ Detecting project type... Node.js API
✓ Found package.json
✓ Found Dockerfile
✓ Identifying framework... Express.js
✓ Analyzing dependencies... 1 dependency
```

### Phase 2: Planning
```
✓ Selected deployment target: ECS Fargate / Cloud Run / Container Apps
✓ Estimated cost: $20-45/month
✓ Required resources:
  - Container registry
  - Container orchestration
  - Load balancer
  - Public IP
```

### Phase 3: Deployment
```
✓ Building Docker image...
✓ Pushing to container registry...
✓ Creating cloud resources...
✓ Deploying container...
✓ Configuring health checks...
✓ Setting up networking...
```

### Phase 4: Verification
```
✓ Deployment successful!
✓ Health check passed
✓ Public URL: https://...
✓ Duration: 142.3s
✓ Estimated cost: $25.00/month
```

---

## Deployment Targets by Cloud

| Cloud | Service | Type | Description |
|-------|---------|------|-------------|
| **AWS** | ECS Fargate | Container | Serverless container platform |
| **GCP** | Cloud Run | Container | Fully managed container platform |
| **Azure** | Container Apps | Container | Serverless container service |

All these services automatically handle:
- ✅ Auto-scaling based on traffic
- ✅ Load balancing
- ✅ HTTPS/SSL certificates
- ✅ Health monitoring
- ✅ Zero-downtime deployments

---

## Project Structure

```
simple-nodejs-api/
├── src/
│   ├── index.js          # Main API server
│   └── test.js           # API tests
├── package.json          # Dependencies
├── Dockerfile            # Container configuration
├── .dockerignore         # Docker ignore rules
├── .gitignore           # Git ignore rules
├── .env.example         # Environment template
└── README.md            # This file
```

---

## Customizing This Example

Want to modify this example? Here are some ideas:

### Add Database Support
```javascript
// Add MongoDB, PostgreSQL, or DynamoDB
const mongoose = require('mongoose');
// Connect and use persistent storage
```

### Add Authentication
```javascript
// Add JWT or OAuth
const jwt = require('jsonwebtoken');
// Protect your endpoints
```

### Add More Endpoints
```javascript
// Add user management
app.post('/api/users', ...);
app.get('/api/users/:id', ...);
```

### Environment Variables
```bash
# Add to .env
DATABASE_URL=mongodb://...
JWT_SECRET=your-secret
REDIS_URL=redis://...
```

Then redeploy with `cloud-agent deploy --cloud <provider>`!

---

## Cost Estimates

Approximate monthly costs for this example:

| Cloud | Service | Estimated Cost |
|-------|---------|---------------|
| **AWS** | ECS Fargate (0.25 vCPU, 0.5 GB) | $15-25/month |
| **GCP** | Cloud Run (with request-based pricing) | $10-20/month |
| **Azure** | Container Apps (consumption plan) | $15-25/month |

**Note:** These are estimates for low-traffic applications. Costs scale with usage.

---

## Troubleshooting

### Local Issues

**Port already in use:**
```bash
# Change port in .env
PORT=3001
```

**Dependencies won't install:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Deployment Issues

**Authentication failed:**
```bash
# AWS
aws configure

# GCP
gcloud auth login

# Azure
az login
```

**Build failed:**
```bash
# Test Docker build locally
docker build -t test-api .
docker run -p 3000:3000 test-api
```

**Deployment timeout:**
- Check cloud provider quotas
- Verify network connectivity
- Review logs in `.agent-cloud/logs/`

---

## Next Steps

After successfully deploying this example:

1. **Try Other Cloud Providers** - Deploy the same app to different clouds
2. **Monitor Your Deployment** - Check logs and metrics in your cloud console
3. **Modify the App** - Add features and redeploy
4. **Deploy Your Own App** - Use agent-cloud with your real projects
5. **Share Feedback** - Help improve agent-cloud!

---

## Learning Resources

- **Main Documentation**: [../../README.md](../../README.md)
- **Express.js**: https://expressjs.com/
- **Docker**: https://docs.docker.com/
- **AWS ECS**: https://aws.amazon.com/ecs/
- **Google Cloud Run**: https://cloud.google.com/run
- **Azure Container Apps**: https://azure.microsoft.com/en-us/products/container-apps

---

## Support

Having issues? Check:

1. **Logs**: `.agent-cloud/logs/deployment-*.log`
2. **Main README**: [../../README.md](../../README.md)
3. **GitHub Issues**: https://github.com/intojhanurag/agent-cloud/issues

---

<div align="center">

**Built with ❤️ by [ojha_verse](https://x.com/ojhaverse23)**

**Star the project if you find it useful!** ⭐

[Main Project](../../README.md) • [Report Bug](https://github.com/intojhanurag/agent-cloud/issues) • [Request Feature](https://github.com/intojhanurag/agent-cloud/issues)

</div>
