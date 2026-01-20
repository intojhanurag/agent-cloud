import figlet from 'figlet';
import gradient from 'gradient-string';
import chalk from 'chalk';

/**
 * Display beautiful ASCII art banner with gradient colors
 */
export function displayBanner(): void {
    console.clear();

    // Generate ASCII art
    const banner = figlet.textSync('CLOUD', {
        font: 'ANSI Shadow',
        horizontalLayout: 'default',
        verticalLayout: 'default',
        width: 80,
        whitespaceBreak: true
    });

    const subBanner = figlet.textSync('AGENT', {
        font: 'ANSI Shadow',
        horizontalLayout: 'default',
        verticalLayout: 'default',
        width: 80,
        whitespaceBreak: true
    });

    // Create beautiful gradient
    const cloudGradient = gradient(['#00F5FF', '#0080FF', '#0040FF']);
    const agentGradient = gradient(['#FF6B6B', '#FF8E53', '#FFA500']);

    // Display with box
    console.log('\n');
    console.log(chalk.cyan('  ╔═══════════════════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('  ║') + ' '.repeat(75) + chalk.cyan('║'));

    // Display CLOUD banner
    banner.split('\n').forEach(line => {
        const paddedLine = line.padEnd(73);
        console.log(chalk.cyan('  ║') + ' ' + cloudGradient(paddedLine) + chalk.cyan('║'));
    });

    console.log(chalk.cyan('  ║') + ' '.repeat(75) + chalk.cyan('║'));

    // Display AGENT banner
    subBanner.split('\n').forEach(line => {
        const paddedLine = line.padEnd(73);
        console.log(chalk.cyan('  ║') + ' ' + agentGradient(paddedLine) + chalk.cyan('║'));
    });

    console.log(chalk.cyan('  ║') + ' '.repeat(75) + chalk.cyan('║'));

    // Subtitle
    const subtitle = 'AI-Powered Cloud Deployment';
    const subtitlePadding = Math.floor((75 - subtitle.length) / 2);
    console.log(
        chalk.cyan('  ║') +
        ' '.repeat(subtitlePadding) +
        chalk.bold.white(subtitle) +
        ' '.repeat(75 - subtitlePadding - subtitle.length) +
        chalk.cyan('║')
    );

    // Version
    const version = 'v1.0.0';
    const versionPadding = Math.floor((75 - version.length) / 2);
    console.log(
        chalk.cyan('  ║') +
        ' '.repeat(versionPadding) +
        chalk.gray(version) +
        ' '.repeat(75 - versionPadding - version.length) +
        chalk.cyan('║')
    );

    console.log(chalk.cyan('  ║') + ' '.repeat(75) + chalk.cyan('║'));
    console.log(chalk.cyan('  ╚═══════════════════════════════════════════════════════════════════════════╝'));

    // Powered by
    const poweredBy = '🤖 Powered by Mastra AI';
    const poweredPadding = Math.floor((79 - poweredBy.length) / 2);
    console.log(' '.repeat(poweredPadding) + chalk.magenta(poweredBy));
    console.log('\n');
}

/**
 * Display a simple header for sub-commands
 */
export function displayHeader(title: string): void {
    console.log('\n');
    console.log(chalk.cyan('═'.repeat(80)));
    console.log(chalk.bold.white(`  ${title}`));
    console.log(chalk.cyan('═'.repeat(80)));
    console.log('\n');
}

/**
 * Display a section divider
 */
export function displayDivider(): void {
    console.log(chalk.gray('─'.repeat(80)));
}

/**
 * Display a success box
 */
export function displaySuccess(message: string): void {
    console.log('\n');
    console.log(chalk.green('  ✓ ') + chalk.bold.green(message));
    console.log('\n');
}

/**
 * Display an error box
 */
export function displayError(message: string): void {
    console.log('\n');
    console.log(chalk.red('  ✗ ') + chalk.bold.red(message));
    console.log('\n');
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
