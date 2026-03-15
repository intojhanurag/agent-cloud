import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { detectRuntime, generateDockerfile, writeDockerfileIfNeeded } from '../dockerfile-generator.js';

describe('detectRuntime', () => {
    let tmpDir: string;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-cloud-df-'));
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('detects Node.js from package.json', () => {
        fs.writeFileSync(path.join(tmpDir, 'package.json'), '{}');
        expect(detectRuntime(tmpDir)).toBe('node');
    });

    it('detects Python from requirements.txt', () => {
        fs.writeFileSync(path.join(tmpDir, 'requirements.txt'), 'flask');
        expect(detectRuntime(tmpDir)).toBe('python');
    });

    it('detects Python from pyproject.toml', () => {
        fs.writeFileSync(path.join(tmpDir, 'pyproject.toml'), '[project]');
        expect(detectRuntime(tmpDir)).toBe('python');
    });

    it('detects Go from go.mod', () => {
        fs.writeFileSync(path.join(tmpDir, 'go.mod'), 'module test');
        expect(detectRuntime(tmpDir)).toBe('go');
    });

    it('returns unknown for empty directory', () => {
        expect(detectRuntime(tmpDir)).toBe('unknown');
    });
});

describe('generateDockerfile', () => {
    let tmpDir: string;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-cloud-df-'));
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('generates Node.js Dockerfile', () => {
        fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
            name: 'test-app',
            scripts: { build: 'tsc', start: 'node dist/index.js' },
        }));
        const result = generateDockerfile(tmpDir, 3000);
        expect(result).toContain('FROM node:20-slim');
        expect(result).toContain('EXPOSE 3000');
        expect(result).toContain('npm run build');
    });

    it('generates Python Dockerfile', () => {
        fs.writeFileSync(path.join(tmpDir, 'requirements.txt'), 'flask\nuvicorn');
        const result = generateDockerfile(tmpDir, 8000);
        expect(result).toContain('FROM python:3.12-slim');
        expect(result).toContain('EXPOSE 8000');
        expect(result).toContain('requirements.txt');
    });

    it('generates Go Dockerfile', () => {
        fs.writeFileSync(path.join(tmpDir, 'go.mod'), 'module test');
        const result = generateDockerfile(tmpDir, 8080);
        expect(result).toContain('FROM golang:1.22-alpine');
        expect(result).toContain('EXPOSE 8080');
        expect(result).toContain('go build');
    });

    it('returns null for unknown runtime', () => {
        expect(generateDockerfile(tmpDir)).toBeNull();
    });
});

describe('writeDockerfileIfNeeded', () => {
    let tmpDir: string;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-cloud-df-'));
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('writes Dockerfile when missing', () => {
        fs.writeFileSync(path.join(tmpDir, 'package.json'), '{}');
        const written = writeDockerfileIfNeeded(tmpDir, 3000);
        expect(written).toBe(true);
        expect(fs.existsSync(path.join(tmpDir, 'Dockerfile'))).toBe(true);
    });

    it('does not overwrite existing Dockerfile', () => {
        fs.writeFileSync(path.join(tmpDir, 'package.json'), '{}');
        fs.writeFileSync(path.join(tmpDir, 'Dockerfile'), 'FROM custom');
        const written = writeDockerfileIfNeeded(tmpDir, 3000);
        expect(written).toBe(false);
        expect(fs.readFileSync(path.join(tmpDir, 'Dockerfile'), 'utf-8')).toBe('FROM custom');
    });

    it('returns false for unknown runtime', () => {
        expect(writeDockerfileIfNeeded(tmpDir)).toBe(false);
    });
});
