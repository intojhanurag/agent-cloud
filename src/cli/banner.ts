import figlet from 'figlet';
import gradient from 'gradient-string';
import chalk from 'chalk';

/**
 * Display compact CLI banner
 */
export function displayBanner(): void {
    const banner = figlet.textSync('CLOUD AGENT', {
        font: 'Small',
        horizontalLayout: 'default',
    });

    const cloudGradient = gradient(['#00F5FF', '#0080FF', '#FF6B6B']);

    console.log();
    console.log(cloudGradient(banner));
    console.log(chalk.gray('  AI-Powered Cloud Deployment CLI  |  v1.0.0'));
    console.log();
}

/**
 * Display a simple header for sub-commands
 */
export function displayHeader(title: string): void {
    console.log();
    console.log(chalk.cyan('━'.repeat(60)));
    console.log(chalk.bold.white(`  ${title}`));
    console.log(chalk.cyan('━'.repeat(60)));
    console.log();
}

/**
 * Display a section divider
 */
export function displayDivider(): void {
    console.log(chalk.gray('─'.repeat(60)));
}

/**
 * Display a success box
 */
export function displaySuccess(message: string): void {
    console.log();
    console.log(chalk.green('  ✓ ') + chalk.bold.green(message));
    console.log();
}

/**
 * Display an error box
 */
export function displayError(message: string): void {
    console.log();
    console.log(chalk.red('  ✗ ') + chalk.bold.red(message));
    console.log();
}

/**
 * Display an info message
 */
export function displayInfo(message: string): void {
    console.log(chalk.blue('  ℹ ') + chalk.white(message));
}

/**
 * Display a warning message
 */
export function displayWarning(message: string): void {
    console.log(chalk.yellow('  ⚠ ') + chalk.white(message));
}
