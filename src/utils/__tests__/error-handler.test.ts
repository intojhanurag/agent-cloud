import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    DeploymentError,
    AuthenticationError,
    ValidationError,
    WorkflowError,
    ErrorHandler,
    ErrorFactory,
} from '../error-handler.js';

describe('Custom Error Classes', () => {
    it('creates DeploymentError with all fields', () => {
        const err = new DeploymentError('test', 'CODE', 'aws', true, ['fix1']);
        expect(err.name).toBe('DeploymentError');
        expect(err.message).toBe('test');
        expect(err.code).toBe('CODE');
        expect(err.cloud).toBe('aws');
        expect(err.recoverable).toBe(true);
        expect(err.suggestions).toEqual(['fix1']);
    });

    it('creates AuthenticationError', () => {
        const err = new AuthenticationError('auth fail', 'gcp', ['login']);
        expect(err.name).toBe('AuthenticationError');
        expect(err.cloud).toBe('gcp');
    });

    it('creates ValidationError', () => {
        const err = new ValidationError('invalid', 'field', 'value');
        expect(err.name).toBe('ValidationError');
        expect(err.field).toBe('field');
        expect(err.value).toBe('value');
    });

    it('creates WorkflowError', () => {
        const err = new WorkflowError('step fail', 'deploy', true);
        expect(err.name).toBe('WorkflowError');
        expect(err.step).toBe('deploy');
        expect(err.recoverable).toBe(true);
    });
});

describe('ErrorHandler', () => {
    let handler: ErrorHandler;

    beforeEach(() => {
        handler = new ErrorHandler();
        vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('dispatches DeploymentError correctly', () => {
        const err = new DeploymentError('test', 'CODE', 'aws');
        expect(() => handler.handle(err)).not.toThrow();
    });

    it('dispatches AuthenticationError correctly', () => {
        const err = new AuthenticationError('test', 'gcp');
        expect(() => handler.handle(err)).not.toThrow();
    });

    it('dispatches ValidationError correctly', () => {
        const err = new ValidationError('test', 'field');
        expect(() => handler.handle(err)).not.toThrow();
    });

    it('dispatches WorkflowError correctly', () => {
        const err = new WorkflowError('test', 'step');
        expect(() => handler.handle(err)).not.toThrow();
    });

    it('handles generic errors', () => {
        expect(() => handler.handle(new Error('generic'))).not.toThrow();
    });

    it('wrap re-throws after handling', async () => {
        await expect(handler.wrap(async () => {
            throw new Error('wrapped error');
        })).rejects.toThrow('wrapped error');
    });
});

describe('ErrorFactory', () => {
    it('creates AWS deployment error', () => {
        const err = ErrorFactory.awsDeploymentFailed('test');
        expect(err).toBeInstanceOf(DeploymentError);
        expect(err.code).toBe('AWS_DEPLOYMENT_FAILED');
        expect(err.suggestions.length).toBeGreaterThan(0);
    });

    it('creates GCP deployment error', () => {
        const err = ErrorFactory.gcpDeploymentFailed('test');
        expect(err.code).toBe('GCP_DEPLOYMENT_FAILED');
    });

    it('creates Azure deployment error', () => {
        const err = ErrorFactory.azureDeploymentFailed('test');
        expect(err.code).toBe('AZURE_DEPLOYMENT_FAILED');
    });

    it('creates auth errors for each provider', () => {
        expect(ErrorFactory.awsAuthFailed()).toBeInstanceOf(AuthenticationError);
        expect(ErrorFactory.gcpAuthFailed()).toBeInstanceOf(AuthenticationError);
        expect(ErrorFactory.azureAuthFailed()).toBeInstanceOf(AuthenticationError);
    });

    it('creates workflow step error', () => {
        const err = ErrorFactory.workflowStepFailed('deploy', 'failed');
        expect(err).toBeInstanceOf(WorkflowError);
        expect(err.recoverable).toBe(true);
    });

    it('creates validation errors', () => {
        expect(ErrorFactory.invalidCloud('xyz')).toBeInstanceOf(ValidationError);
        expect(ErrorFactory.missingProjectPath()).toBeInstanceOf(ValidationError);
    });
});
