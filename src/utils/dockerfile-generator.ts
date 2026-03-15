import fs from 'fs';
import path from 'path';

export type DetectedRuntime = 'node' | 'python' | 'go' | 'unknown';

export function detectRuntime(projectPath: string): DetectedRuntime {
    if (fs.existsSync(path.join(projectPath, 'package.json'))) return 'node';
    if (fs.existsSync(path.join(projectPath, 'requirements.txt')) || fs.existsSync(path.join(projectPath, 'pyproject.toml'))) return 'python';
    if (fs.existsSync(path.join(projectPath, 'go.mod'))) return 'go';
    return 'unknown';
}

function generateNodeDockerfile(projectPath: string, port: number): string {
    let pkg: any = {};
    try {
        pkg = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf-8'));
    } catch { /* empty */ }

    const hasYarn = fs.existsSync(path.join(projectPath, 'yarn.lock'));
    const hasPnpm = fs.existsSync(path.join(projectPath, 'pnpm-lock.yaml'));
    const installCmd = hasPnpm ? 'pnpm install --frozen-lockfile' : hasYarn ? 'yarn install --frozen-lockfile' : 'npm ci';
    const buildCmd = pkg.scripts?.build ? (hasPnpm ? 'pnpm run build' : hasYarn ? 'yarn build' : 'npm run build') : '';
    const startCmd = pkg.scripts?.start ? (hasPnpm ? 'pnpm start' : hasYarn ? 'yarn start' : 'npm start') : 'node dist/index.js';

    return `FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ${hasYarn ? 'yarn.lock' : hasPnpm ? 'pnpm-lock.yaml' : ''} ./
${hasPnpm ? 'RUN corepack enable && ' : ''}RUN ${installCmd}
COPY . .
${buildCmd ? `RUN ${buildCmd}` : ''}

FROM node:20-slim
WORKDIR /app
COPY --from=builder /app .
EXPOSE ${port}
CMD ["${startCmd.split(' ')[0]}", ${startCmd.split(' ').slice(1).map(s => `"${s}"`).join(', ')}]
`;
}

function generatePythonDockerfile(projectPath: string, port: number): string {
    const hasPyproject = fs.existsSync(path.join(projectPath, 'pyproject.toml'));
    const hasRequirements = fs.existsSync(path.join(projectPath, 'requirements.txt'));

    let installStep = '';
    if (hasRequirements) {
        installStep = 'COPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt';
    } else if (hasPyproject) {
        installStep = 'COPY pyproject.toml .\nRUN pip install --no-cache-dir .';
    }

    return `FROM python:3.12-slim
WORKDIR /app
${installStep}
COPY . .
EXPOSE ${port}
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "${port}"]
`;
}

function generateGoDockerfile(_projectPath: string, port: number): string {
    return `FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server .

FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE ${port}
CMD ["./server"]
`;
}

export function generateDockerfile(projectPath: string, port: number = 3000): string | null {
    const runtime = detectRuntime(projectPath);

    switch (runtime) {
        case 'node':
            return generateNodeDockerfile(projectPath, port);
        case 'python':
            return generatePythonDockerfile(projectPath, port);
        case 'go':
            return generateGoDockerfile(projectPath, port);
        default:
            return null;
    }
}

export function writeDockerfileIfNeeded(projectPath: string, port: number = 3000): boolean {
    const dockerfilePath = path.join(projectPath, 'Dockerfile');
    if (fs.existsSync(dockerfilePath)) return false;

    const content = generateDockerfile(projectPath, port);
    if (!content) return false;

    fs.writeFileSync(dockerfilePath, content, 'utf-8');
    console.log(`✓ Generated Dockerfile for ${detectRuntime(projectPath)} project`);
    return true;
}
