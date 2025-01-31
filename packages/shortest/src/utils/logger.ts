import pc from 'picocolors';
import { AssertionError } from '../types';

export type TestStatus = 'pending' | 'running' | 'passed' | 'failed';

interface TestResult {
  name: string;
  status: TestStatus;
  error?: Error;
}

interface SuiteResult {
  name: string;
  tests: TestResult[];
}

export class Logger {
  private currentFile: string = '';
  private suiteResults: SuiteResult[] = [];
  private startTime: number = Date.now();

  startFile(file: string) {
    this.currentFile = file.split('/').pop() || file;
    this.startTime = Date.now();
    console.log(pc.blue(`\n📄 ${pc.bold(this.currentFile)}`));
  }

  startSuite(name: string) {
    this.suiteResults.push({ name, tests: [] });
  }

  reportTest(name: string, status: TestStatus = 'passed', error?: Error) {
    const icon = this.getStatusIcon(status);
    console.log(`    ${icon} ${name}`);
    
    const currentSuite = this.suiteResults[this.suiteResults.length - 1];
    if (currentSuite) {
      currentSuite.tests.push({ name, status, error });
    }
  }

  private getStatusIcon(status: TestStatus): string {
    switch (status) {
      case 'pending':
        return pc.yellow('○');
      case 'running':
        return pc.blue('●');
      case 'passed':
        return pc.green('✓');
      case 'failed':
        return pc.red('✗');
    }
  }

  summary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    const totalTests = this.suiteResults.reduce((sum, suite) => sum + suite.tests.length, 0);
    const failedTests = this.suiteResults.reduce(
      (sum, suite) => sum + suite.tests.filter(t => t.status === 'failed').length, 
      0
    );
    const passedTests = totalTests - failedTests;

    console.log(pc.dim('⎯'.repeat(50)));
    
    console.log(pc.bold('\n Test Files '), 
      failedTests ? pc.red(`${failedTests} failed`) : '',
      failedTests && passedTests ? ' | ' : '',
      pc.green(`${passedTests} passed`),
      pc.dim(`(${totalTests})`)
    );

    console.log(pc.bold(' Duration  '), pc.dim(`${duration}s`));

    const startTimeStr = new Date(this.startTime).toLocaleTimeString();
    console.log(pc.bold(' Start at  '), pc.dim(startTimeStr));

    console.log(pc.dim('\n' + '⎯'.repeat(50)));
  }

  allTestsPassed(): boolean {
    return !this.suiteResults.some(suite => 
      suite.tests.some(test => test.status === 'failed')
    );
  }

  reportStatus(message: string) {
    console.log(pc.blue(`\n${message}`));
  }

  error(context: string, message: string) {
    console.error(pc.red(`\n${context} Error: ${message}`));
  }

  reportError(context: string, message: string) {
    console.error(pc.red(`\n${context} Error: ${message}`));
  }

  reportAssertion(
    step: string, 
    status: 'passed' | 'failed', 
    error?: AssertionError
  ): void {
    const icon = status === 'passed' ? '✓' : '✗';
    const color = status === 'passed' ? 'green' : 'red';
    
    console.log(pc[color](`${icon} ${step}`));
    
    if (error && status === 'failed') {
      console.log(pc.red(`  Expected: ${error.matcherResult?.expected}`));
      console.log(pc.red(`  Received: ${error.matcherResult?.actual}`));
      console.log(pc.red(`  Message: ${error.message}`));
    }
  }
}
