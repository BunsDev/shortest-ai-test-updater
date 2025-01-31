#!/usr/bin/env node

import { TestRunner } from '../core/runner';
import { GitHubTool } from '../browser/integrations/github';
import pc from 'picocolors';

const VALID_FLAGS = ['--headless', '--github-code', '--debug-ai', '--help', '-h'];
const VALID_PARAMS = ['--target', '--secret'];

function showHelp() {
  console.log(`
${pc.bold('Shortest')} - AI-powered end-to-end testing framework
${pc.dim('https://github.com/anti-work/shortest')}

${pc.bold('Usage:')}
  shortest [options] [test-pattern]

${pc.bold('Options:')}
  --headless          Run tests in headless browser mode
  --debug-ai          Show AI conversation and decision process
  --target=<url>      Set target URL for tests (default: http://localhost:3000)
  --github-code       Generate GitHub 2FA code for authentication

${pc.bold('Authentication:')}
  --secret=<key>      GitHub TOTP secret key (or use .env.local)

${pc.bold('Examples:')}
  ${pc.dim('# Run all tests')}
  shortest

  ${pc.dim('# Run specific test file')}
  shortest login.test.ts

  ${pc.dim('# Run tests in headless mode')}
  shortest --headless

  ${pc.dim('# Generate GitHub 2FA code')}
  shortest --github-code --secret=<OTP_SECRET>

${pc.bold('Environment Setup:')}
  Required variables in .env.local:
  - ANTHROPIC_API_KEY     Required for AI test execution
  - GITHUB_TOTP_SECRET    Required for GitHub authentication
  - GITHUB_USERNAME       GitHub login credentials
  - GITHUB_PASSWORD       GitHub login credentials

${pc.bold('Documentation:')}
  Visit ${pc.cyan('https://github.com/anti-work/shortest')} for detailed setup and usage
`);
}

async function handleGitHubCode(args: string[]) {
  try {
    const secret = args.find(arg => arg.startsWith('--secret='))?.split('=')[1];
    const github = new GitHubTool(secret);
    const { code, timeRemaining } = github.generateTOTPCode();
    
    console.log('\n' + pc.bgCyan(pc.black(' GitHub 2FA Code ')));
    console.log(pc.cyan('Code: ') + pc.bold(code));
    console.log(pc.cyan('Expires in: ') + pc.bold(`${timeRemaining}s`));
    console.log(pc.dim(`Using secret from: ${secret ? 'CLI flag' : '.env file'}\n`));
    
    process.exit(0);
  } catch (error) {
    console.error(pc.red('\n✖ Error:'), (error as Error).message, '\n');
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  // Check for help flag first
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }
  
  // Handle GitHub code generation
  if (args.includes('--github-code')) {
    await handleGitHubCode(args);
  }

  // Validate remaining flags
  const invalidFlags = args.filter(arg => arg.startsWith('--') && !VALID_FLAGS.includes(arg));
  
  if (invalidFlags.length > 0) {
    console.error(`Error: Invalid argument(s): ${invalidFlags.join(', ')}`);
    process.exit(1);
  }

  const headless = args.includes('--headless');
  const targetUrl = args.find(arg => arg.startsWith('--target='))?.split('=')[1];
  const testPattern = args.find(arg => !arg.startsWith('--'));
  
  const debugAI = args.includes('--debug-ai');

  const runner = new TestRunner(process.cwd(), true, headless, targetUrl, debugAI);
  
  try {
    if (testPattern) {
      await runner.runFile(testPattern);
    } else {
      await runner.runAll();
    }
  } catch (error) {
    console.error('Error: Invalid argument(s)');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}); 