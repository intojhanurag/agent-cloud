import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockExecAsync = vi.hoisted(() => vi.fn());

vi.mock('child_process', () => ({
    exec: vi.fn(),
}));
vi.mock('util', () => ({
    promisify: () => mockExecAsync,
}));

const { AzureProvider } = await import('../azure/index.js');

describe('AzureProvider', () => {
    let provider: InstanceType<typeof AzureProvider>;

    beforeEach(() => {
        vi.clearAllMocks();
        provider = new AzureProvider({
            resourceGroup: 'test-rg',
            location: 'eastus',
        });
    });

    describe('authenticate', () => {
        it('returns true on success', async () => {
            mockExecAsync.mockResolvedValueOnce({
                stdout: JSON.stringify({
                    user: { name: 'test@example.com' },
                    name: 'Test Sub',
                }),
            });
            const result = await provider.authenticate();
            expect(result).toBe(true);
        });

        it('returns false on failure', async () => {
            mockExecAsync.mockRejectedValueOnce(new Error('not logged in'));
            const result = await provider.authenticate();
            expect(result).toBe(false);
        });
    });

    describe('deployToContainerApps', () => {
        it('fails when no docker image provided', async () => {
            // ensureResourceGroup
            mockExecAsync.mockResolvedValueOnce({ stdout: '{}' });
            // env create
            mockExecAsync.mockResolvedValueOnce({ stdout: '' });

            const result = await provider.deployToContainerApps({
                appName: 'test-app',
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('No Docker image provided');
        });

        it('deploys container app with image', async () => {
            mockExecAsync.mockResolvedValueOnce({ stdout: '{}' }); // rg
            mockExecAsync.mockResolvedValueOnce({ stdout: '' }); // env
            mockExecAsync.mockResolvedValueOnce({ stdout: 'test-app.region.azurecontainerapps.io\n' }); // create

            const result = await provider.deployToContainerApps({
                appName: 'test-app',
                dockerImage: 'myregistry.azurecr.io/app:latest',
                containerPort: 8080,
            });

            expect(result.success).toBe(true);
            expect(result.url).toBe('https://test-app.region.azurecontainerapps.io');
        });

        it('passes env vars', async () => {
            mockExecAsync.mockResolvedValueOnce({ stdout: '{}' }); // rg
            mockExecAsync.mockResolvedValueOnce({ stdout: '' }); // env
            mockExecAsync.mockResolvedValueOnce({ stdout: 'fqdn.io\n' }); // create

            await provider.deployToContainerApps({
                appName: 'test-app',
                dockerImage: 'img:latest',
                envVars: { KEY: 'value' },
            });

            const createCall = mockExecAsync.mock.calls[2][0];
            expect(createCall).toContain('--env-vars');
        });
    });

    describe('cleanup', () => {
        it('deletes container app', async () => {
            mockExecAsync.mockResolvedValueOnce({ stdout: '' });

            await provider.cleanup({ containerApp: 'test-app' });
            const callArg = mockExecAsync.mock.calls[0][0];
            expect(callArg).toContain('az containerapp delete');
        });

        it('deletes multiple resources', async () => {
            mockExecAsync.mockResolvedValue({ stdout: '' });

            await provider.cleanup({
                containerApp: 'app1',
                function: 'fn1',
                storage: 'storage1',
            });

            expect(mockExecAsync).toHaveBeenCalledTimes(3);
        });
    });

    describe('default location', () => {
        it('defaults to eastus not centralindia', () => {
            const p = new AzureProvider({});
            expect((p as any).config.location).toBe('eastus');
        });
    });
});
