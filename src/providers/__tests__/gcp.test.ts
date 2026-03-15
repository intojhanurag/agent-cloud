import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockExecAsync = vi.hoisted(() => vi.fn());

vi.mock('child_process', () => ({
    exec: vi.fn(),
}));
vi.mock('util', () => ({
    promisify: () => mockExecAsync,
}));

const { GCPProvider } = await import('../gcp/index.js');

describe('GCPProvider', () => {
    let provider: InstanceType<typeof GCPProvider>;

    beforeEach(() => {
        vi.clearAllMocks();
        provider = new GCPProvider({ project: 'test-project', region: 'us-central1' });
    });

    describe('authenticate', () => {
        it('returns true when active account exists', async () => {
            mockExecAsync.mockResolvedValueOnce({ stdout: 'user@example.com\n' });
            const result = await provider.authenticate();
            expect(result).toBe(true);
        });

        it('returns false when no active account', async () => {
            mockExecAsync.mockResolvedValueOnce({ stdout: '\n' });
            const result = await provider.authenticate();
            expect(result).toBe(false);
        });

        it('returns false on error', async () => {
            mockExecAsync.mockRejectedValueOnce(new Error('not installed'));
            const result = await provider.authenticate();
            expect(result).toBe(false);
        });
    });

    describe('deployToCloudRun', () => {
        it('builds and deploys when no image provided', async () => {
            mockExecAsync.mockResolvedValueOnce({ stdout: '' }); // build
            mockExecAsync.mockResolvedValueOnce({
                stdout: 'Service URL: https://test-svc-abc.run.app',
            });

            const result = await provider.deployToCloudRun({
                serviceName: 'test-svc',
                containerPort: 8080,
            });

            expect(result.success).toBe(true);
            expect(result.url).toBe('https://test-svc-abc.run.app');
        });

        it('uses provided docker image', async () => {
            mockExecAsync.mockResolvedValueOnce({
                stdout: 'Service URL: https://test.run.app',
            });

            const result = await provider.deployToCloudRun({
                serviceName: 'test-svc',
                dockerImage: 'gcr.io/proj/img:latest',
            });

            expect(result.success).toBe(true);
            expect(mockExecAsync).toHaveBeenCalledTimes(1);
        });

        it('passes env vars', async () => {
            mockExecAsync.mockResolvedValueOnce({
                stdout: 'Service URL: https://test.run.app',
            });

            await provider.deployToCloudRun({
                serviceName: 'test-svc',
                dockerImage: 'gcr.io/proj/img:latest',
                envVars: { DB_HOST: 'localhost', PORT: '8080' },
            });

            const callArg = mockExecAsync.mock.calls[0][0];
            expect(callArg).toContain('--set-env-vars');
        });
    });

    describe('cleanup', () => {
        it('deletes Cloud Run service', async () => {
            mockExecAsync.mockResolvedValueOnce({ stdout: '' });

            await provider.cleanup({ service: 'test-svc' });
            const callArg = mockExecAsync.mock.calls[0][0];
            expect(callArg).toContain('gcloud run services delete');
        });

        it('deletes Cloud Function', async () => {
            mockExecAsync.mockResolvedValueOnce({ stdout: '' });

            await provider.cleanup({ function: 'test-fn' });
            const callArg = mockExecAsync.mock.calls[0][0];
            expect(callArg).toContain('gcloud functions delete');
        });
    });
});
