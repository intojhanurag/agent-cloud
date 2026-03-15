import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { ConfigManager } from '../config.js';

describe('ConfigManager', () => {
    let tmpDir: string;
    let config: ConfigManager;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-cloud-test-'));
        config = new ConfigManager(tmpDir);
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('starts with default config', () => {
        const cfg = config.getConfig();
        expect(cfg.version).toBe('1.0.0');
        expect(cfg.deployments).toEqual([]);
    });

    it('sets and gets default cloud', () => {
        config.setDefaultCloud('gcp');
        expect(config.getDefaultCloud()).toBe('gcp');
    });

    it('persists config to disk', () => {
        config.setDefaultCloud('azure');
        const reloaded = new ConfigManager(tmpDir);
        expect(reloaded.getDefaultCloud()).toBe('azure');
    });

    it('adds deployment records', () => {
        config.addDeployment({
            cloud: 'aws',
            projectPath: '/test',
            success: true,
            resources: { cluster: 'test-cluster' },
            duration: 5000,
        });
        const deployments = config.getDeployments();
        expect(deployments).toHaveLength(1);
        expect(deployments[0].cloud).toBe('aws');
        expect(deployments[0].success).toBe(true);
    });

    it('limits to 50 deployments', () => {
        for (let i = 0; i < 55; i++) {
            config.addDeployment({
                cloud: 'aws',
                projectPath: '/test',
                success: true,
                resources: {},
                duration: 1000,
            });
        }
        expect(config.getDeployments()).toHaveLength(50);
    });

    it('gets last deployment', () => {
        config.addDeployment({ cloud: 'aws', projectPath: '/a', success: true, resources: {} });
        config.addDeployment({ cloud: 'gcp', projectPath: '/b', success: false, resources: {} });
        expect(config.getLastDeployment()?.cloud).toBe('gcp');
    });

    it('filters by cloud provider', () => {
        config.addDeployment({ cloud: 'aws', projectPath: '/a', success: true, resources: {} });
        config.addDeployment({ cloud: 'gcp', projectPath: '/b', success: true, resources: {} });
        config.addDeployment({ cloud: 'aws', projectPath: '/c', success: false, resources: {} });
        expect(config.getDeploymentsByCloud('aws')).toHaveLength(2);
        expect(config.getDeploymentsByCloud('gcp')).toHaveLength(1);
    });

    it('computes stats correctly', () => {
        config.addDeployment({ cloud: 'aws', projectPath: '/a', success: true, resources: {}, cost: 10, duration: 2000 });
        config.addDeployment({ cloud: 'gcp', projectPath: '/b', success: false, resources: {}, cost: 5, duration: 3000 });
        const stats = config.getStats();
        expect(stats.total).toBe(2);
        expect(stats.successful).toBe(1);
        expect(stats.failed).toBe(1);
        expect(stats.totalCost).toBe(15);
        expect(stats.averageDuration).toBe(2500);
    });

    it('clears history', () => {
        config.addDeployment({ cloud: 'aws', projectPath: '/a', success: true, resources: {} });
        config.clearHistory();
        expect(config.getDeployments()).toHaveLength(0);
    });

    it('exports and imports config', () => {
        config.setDefaultCloud('aws');
        const exported = config.export();
        const newConfig = new ConfigManager(tmpDir);
        newConfig.import(exported);
        expect(newConfig.getDefaultCloud()).toBe('aws');
    });

    it('throws on invalid import', () => {
        expect(() => config.import('not json')).toThrow('Invalid configuration JSON');
    });

    it('sets and gets preferred region', () => {
        config.setPreferredRegion('aws', 'eu-west-1');
        expect(config.getPreferredRegion('aws')).toBe('eu-west-1');
    });

    it('sets and gets auto-approve', () => {
        config.setAutoApprove(true);
        expect(config.getAutoApprove()).toBe(true);
    });
});
