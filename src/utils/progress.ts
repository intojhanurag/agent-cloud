import ora, { Ora } from 'ora';
import cliProgress from 'cli-progress';
import chalk from 'chalk';

/**
 * Spinner for loading states
 */
export class Spinner {
    private spinner: Ora;

    constructor(message: string) {
        this.spinner = ora({
            text: message,
            color: 'cyan',
            spinner: 'dots',
        });
    }

    start(message?: string): void {
        if (message) {
            this.spinner.text = message;
        }
        this.spinner.start();
    }

    update(message: string): void {
        this.spinner.text = message;
    }

    succeed(message?: string): void {
        this.spinner.succeed(message);
    }

    fail(message?: string): void {
        this.spinner.fail(message);
    }

    warn(message?: string): void {
        this.spinner.warn(message);
    }

    info(message?: string): void {
        this.spinner.info(message);
    }

    stop(): void {
        this.spinner.stop();
    }
}

/**
 * Progress bar for long-running operations
 */
export class ProgressBar {
    private bar: cliProgress.SingleBar;
    private total: number;

    constructor(total: number, format?: string) {
        this.total = total;
        this.bar = new cliProgress.SingleBar({
            format: format ||
                `  ${chalk.cyan('{bar}')} ${chalk.white('{percentage}%')} | {status}`,
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true,
        }, cliProgress.Presets.shades_classic);
    }

    start(status: string = 'Starting...'): void {
        this.bar.start(this.total, 0, { status });
    }

    update(current: number, status?: string): void {
        this.bar.update(current, status ? { status } : undefined);
    }

    increment(delta: number = 1, status?: string): void {
        this.bar.increment(delta, status ? { status } : undefined);
    }

    stop(status: string = 'Complete'): void {
        this.bar.update(this.total, { status });
        this.bar.stop();
    }
}

/**
 * Multi-step progress tracker
 */
export class ProgressTracker {
    private steps: Array<{ name: string; status: 'pending' | 'running' | 'completed' | 'failed' }>;
    private currentStep: number = -1;

    constructor(steps: string[]) {
        this.steps = steps.map(name => ({ name, status: 'pending' as const }));
    }

    start(): void {
        console.log(chalk.cyan('\n  📋 Progress:\n'));
        this.display();
    }

    nextStep(): void {
        if (this.currentStep >= 0 && this.currentStep < this.steps.length) {
            this.steps[this.currentStep].status = 'completed';
        }

        this.currentStep++;

        if (this.currentStep < this.steps.length) {
            this.steps[this.currentStep].status = 'running';
            this.display();
        }
    }

    failCurrentStep(): void {
        if (this.currentStep >= 0 && this.currentStep < this.steps.length) {
            this.steps[this.currentStep].status = 'failed';
            this.display();
        }
    }

    complete(): void {
        if (this.currentStep >= 0 && this.currentStep < this.steps.length) {
            this.steps[this.currentStep].status = 'completed';
        }
        this.display();
        console.log(chalk.green('\n  ✓ All steps completed!\n'));
    }

    private display(): void {
        // Clear previous output (simple version)
        console.log();

        this.steps.forEach((step, index) => {
            let icon: string;
            let color: typeof chalk.green;

            switch (step.status) {
                case 'completed':
                    icon = '✓';
                    color = chalk.green;
                    break;
                case 'running':
                    icon = '⟳';
                    color = chalk.cyan;
                    break;
                case 'failed':
                    icon = '✗';
                    color = chalk.red;
                    break;
                default:
                    icon = '○';
                    color = chalk.gray;
            }

            console.log(`  ${color(icon)} ${color(step.name)}`);
        });
    }

    getStatus(): 'completed' | 'failed' | 'in-progress' {
        if (this.steps.some(s => s.status === 'failed')) {
            return 'failed';
        }
        if (this.steps.every(s => s.status === 'completed')) {
            return 'completed';
        }
        return 'in-progress';
    }
}

/**
 * Simple delay utility
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute with progress spinner
 */
export async function withSpinner<T>(
    message: string,
    action: () => Promise<T>,
    successMessage?: string,
    failMessage?: string
): Promise<T> {
    const spinner = new Spinner(message);
    spinner.start();

    try {
        const result = await action();
        spinner.succeed(successMessage || message);
        return result;
    } catch (error) {
        spinner.fail(failMessage || `${message} failed`);
        throw error;
    }
}

/**
 * Execute with progress bar
 */
export async function withProgress<T>(
    total: number,
    action: (update: (current: number, status?: string) => void) => Promise<T>
): Promise<T> {
    const progress = new ProgressBar(total);
    progress.start();

    try {
        const result = await action((current, status) => {
            progress.update(current, status);
        });
        progress.stop();
        return result;
    } catch (error) {
        progress.stop('Failed');
        throw error;
    }
}
