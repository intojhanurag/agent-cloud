import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockExecAsync = vi.hoisted(() => vi.fn());

vi.mock('child_process', () => ({
    exec: vi.fn(),
}));
vi.mock('util', () => ({
    promisify: () => mockExecAsync,
}));

const { AWSProvider } = await import('../aws/index.js');

describe('AWSProvider', () => {
    let provider: InstanceType<typeof AWSProvider>;

    beforeEach(() => {
        vi.clearAllMocks();
        provider = new AWSProvider({ region: 'us-east-1' });
    });

    describe('authenticate', () => {
        it('returns true on successful authentication', async () => {
            mockExecAsync.mockResolvedValueOnce({
                stdout: JSON.stringify({ Arn: 'arn:aws:iam::123:user/test', Account: '123' }),
            });
            const result = await provider.authenticate();
            expect(result).toBe(true);
        });

        it('returns false on authentication failure', async () => {
            mockExecAsync.mockRejectedValueOnce(new Error('not configured'));
            const result = await provider.authenticate();
            expect(result).toBe(false);
        });
    });

    describe('deployToECS', () => {
        it('fails when no docker image provided', async () => {
            const result = await provider.deployToECS({
                appName: 'test-app',
                containerPort: 3000,
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('No Docker image provided');
        });

        it('creates cluster, task def, and service on success', async () => {
            // cluster create
            mockExecAsync.mockResolvedValueOnce({ stdout: '{}' });
            // task def register
            mockExecAsync.mockResolvedValueOnce({
                stdout: JSON.stringify({ taskDefinition: { taskDefinitionArn: 'arn:task' } }),
            });
            // VPC
            mockExecAsync.mockResolvedValueOnce({
                stdout: JSON.stringify({ Vpcs: [{ VpcId: 'vpc-123' }] }),
            });
            // Subnets
            mockExecAsync.mockResolvedValueOnce({
                stdout: JSON.stringify({ Subnets: [{ SubnetId: 'sub-1' }, { SubnetId: 'sub-2' }] }),
            });
            // SG create
            mockExecAsync.mockResolvedValueOnce({
                stdout: JSON.stringify({ GroupId: 'sg-123' }),
            });
            // SG ingress
            mockExecAsync.mockResolvedValueOnce({ stdout: '{}' });
            // service create
            mockExecAsync.mockResolvedValueOnce({ stdout: '{}' });
            // poll - task list
            mockExecAsync.mockResolvedValueOnce({
                stdout: JSON.stringify({ taskArns: ['arn:task:1'] }),
            });
            // describe tasks
            mockExecAsync.mockResolvedValueOnce({
                stdout: JSON.stringify({
                    tasks: [{
                        attachments: [{
                            type: 'ElasticNetworkInterface',
                            details: [{ name: 'networkInterfaceId', value: 'eni-123' }],
                        }],
                    }],
                }),
            });
            // describe network interfaces
            mockExecAsync.mockResolvedValueOnce({
                stdout: JSON.stringify({
                    NetworkInterfaces: [{ Association: { PublicIp: '1.2.3.4' } }],
                }),
            });

            const result = await provider.deployToECS({
                appName: 'test-app',
                dockerImage: 'myimage:latest',
                containerPort: 3000,
            });

            expect(result.success).toBe(true);
            expect(result.url).toBe('http://1.2.3.4:3000');
            expect(result.resources.cluster).toBe('test-app-cluster');
        });
    });

    describe('deployStaticSite', () => {
        it('creates S3 bucket and uploads files', async () => {
            mockExecAsync.mockResolvedValueOnce({ stdout: '' }); // mb
            mockExecAsync.mockResolvedValueOnce({ stdout: '' }); // website
            mockExecAsync.mockResolvedValueOnce({ stdout: '' }); // policy
            mockExecAsync.mockResolvedValueOnce({ stdout: '' }); // sync

            const result = await provider.deployStaticSite({
                siteName: 'my-site',
                buildDir: './dist',
            });

            expect(result.success).toBe(true);
            expect(result.url).toContain('s3-website');
        });
    });

    describe('cleanup', () => {
        it('deletes service and cluster', async () => {
            mockExecAsync.mockResolvedValueOnce({ stdout: '' });
            mockExecAsync.mockResolvedValueOnce({ stdout: '' });

            await provider.cleanup({
                cluster: 'test-cluster',
                service: 'test-service',
            });

            expect(mockExecAsync).toHaveBeenCalledTimes(2);
        });
    });
});
