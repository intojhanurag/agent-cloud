# Examples Directory

This directory contains complete, working example applications that demonstrate how to use **agent-cloud** to deploy to AWS, GCP, and Azure.

## Available Examples

### 1. Simple Node.js API

**Location:** [`simple-nodejs-api/`](./simple-nodejs-api/)

A complete REST API built with Express.js that shows:
- ✅ CRUD operations for task management
- ✅ Docker containerization
- ✅ Multi-cloud deployment
- ✅ Health checks and monitoring
- ✅ API testing scripts

**Technologies:** Node.js, Express.js, Docker

**Deployable to:** AWS ECS Fargate, GCP Cloud Run, Azure Container Apps

**[View Full Documentation →](./simple-nodejs-api/README.md)**

---

## Quick Start

### Try the Node.js API Example

```bash
# Navigate to the example
cd examples/simple-nodejs-api

# Install dependencies
npm install

# Test locally
npm start

# Deploy to your preferred cloud
cloud-agent deploy --cloud aws   # or gcp, or azure
```

---

## What You'll Learn

By working through these examples, you'll learn:

1. **Project Structure** - How to organize your application for deployment
2. **Docker Configuration** - Creating optimal Dockerfiles for cloud deployment
3. **Environment Variables** - Managing configuration across environments
4. **Health Checks** - Implementing monitoring for production apps
5. **Cloud-Specific Optimizations** - Best practices for each cloud provider
6. **CI/CD Integration** - Preparing for automated deployments

---

## Coming Soon

We're working on additional examples:

- [ ] **React Static Site** - Deploy a static website to S3, Firebase, or Azure Static Web Apps
- [ ] **Full-Stack App** - Next.js application with API routes
- [ ] **Microservices** - Multiple services deployed together
- [ ] **Database Integration** - Apps with PostgreSQL, MongoDB, or DynamoDB
- [ ] **Serverless Functions** - AWS Lambda, Cloud Functions, Azure Functions
- [ ] **Python Flask API** - Python-based REST API

Want to contribute an example? [Open a PR](https://github.com/intojhanurag/agent-cloud/pulls)!

---

## Contributing Examples

Want to add your own example? Here's the structure we follow:

```
your-example-name/
├── src/                    # Application source code
├── package.json            # Dependencies (or requirements.txt, etc.)
├── Dockerfile              # Container configuration
├── .dockerignore          # Docker ignore rules
├── .gitignore             # Git ignore rules
├── .env.example           # Environment template
└── README.md              # Comprehensive documentation
```

**Your README should include:**
- Overview of what the app does
- Quick start instructions
- Deployment guide for all 3 clouds
- API/Usage documentation
- Troubleshooting tips

---

## Support

Need help with the examples?

- **Documentation**: Check each example's README
- **Main Docs**: [../README.md](../README.md)
- **Issues**: [GitHub Issues](https://github.com/intojhanurag/agent-cloud/issues)
- **Discussions**: [GitHub Discussions](https://github.com/intojhanurag/agent-cloud/discussions)

---

<div align="center">

**Built with ❤️ by [ojha_verse](https://x.com/ojhaverse23)**

[Main Project](../README.md) • [Report Bug](https://github.com/intojhanurag/agent-cloud/issues) • [Request Feature](https://github.com/intojhanurag/agent-cloud/issues)

</div>
