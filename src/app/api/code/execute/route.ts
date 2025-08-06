import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const EXECUTION_TIMEOUT = 5000; // 5 seconds
const MEMORY_LIMIT = 128 * 1024 * 1024; // 128MB

interface ExecutionResult {
  output: string;
  error: string;
  exitCode: number;
  executionTime: number;
  memoryUsed: number;
  status: 'success' | 'error' | 'timeout' | 'memory_limit_exceeded' | 'compilation_error';
}

interface CompilerConfig {
  extension: string;
  compileCommand?: (filePath: string, outputPath: string) => string[];
  executeCommand: (filePath: string, outputPath?: string) => string[];
  needsCompilation: boolean;
}

const LANGUAGE_CONFIGS: Record<string, CompilerConfig> = {
  javascript: {
    extension: 'js',
    executeCommand: (filePath: string) => ['node', filePath],
    needsCompilation: false,
  },
  python: {
    extension: 'py',
    executeCommand: (filePath: string) => ['python3', filePath],
    needsCompilation: false,
  },
  java: {
    extension: 'java',
    compileCommand: (filePath: string, outputPath: string) => ['javac', '-d', outputPath, filePath],
    executeCommand: (filePath: string, outputPath?: string) => {
      const className = filePath.split('/').pop()?.replace('.java', '') || 'Main';
      return ['java', '-cp', outputPath || '.', className];
    },
    needsCompilation: true,
  },
  cpp: {
    extension: 'cpp',
    compileCommand: (filePath: string, outputPath: string) => [
      'g++', '-std=c++17', '-O2', '-o', join(outputPath, 'solution'), filePath
    ],
    executeCommand: (filePath: string, outputPath?: string) => [join(outputPath || '.', 'solution')],
    needsCompilation: true,
  },
  c: {
    extension: 'c',
    compileCommand: (filePath: string, outputPath: string) => [
      'gcc', '-std=c99', '-O2', '-o', join(outputPath, 'solution'), filePath
    ],
    executeCommand: (filePath: string, outputPath?: string) => [join(outputPath || '.', 'solution')],
    needsCompilation: true,
  },
  typescript: {
    extension: 'ts',
    compileCommand: (filePath: string, outputPath: string) => ['tsc', filePath, '--outDir', outputPath],
    executeCommand: (filePath: string, outputPath?: string) => {
      const jsFile = filePath.replace('.ts', '.js').replace(/.*\//, (outputPath || '.') + '/');
      return ['node', jsFile];
    },
    needsCompilation: true,
  },
  go: {
    extension: 'go',
    executeCommand: (filePath: string) => ['go', 'run', filePath],
    needsCompilation: false,
  },
  rust: {
    extension: 'rs',
    compileCommand: (filePath: string, outputPath: string) => ['rustc', '-o', join(outputPath, 'solution'), filePath],
    executeCommand: (filePath: string, outputPath?: string) => [join(outputPath || '.', 'solution')],
    needsCompilation: true,
  }
};

async function executeWithTimeout(
  command: string,
  args: string[],
  input: string,
  timeoutMs: number,
  workingDir?: string
): Promise<ExecutionResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    console.log(`Executing: ${command} ${args.join(' ')}`);
    console.log(`Working directory: ${workingDir || 'default'}`);
    console.log(`Input: ${input || '(empty)'}`);
    
    const process = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: timeoutMs,
      cwd: workingDir,
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Write input to stdin if provided
    if (input.trim()) {
      process.stdin.write(input);
    }
    process.stdin.end();

    const timeout = setTimeout(() => {
      process.kill('SIGKILL');
      resolve({
        output: stdout,
        error: 'Time Limit Exceeded',
        exitCode: -1,
        executionTime: timeoutMs,
        memoryUsed: 0,
        status: 'timeout'
      });
    }, timeoutMs);

    process.on('close', (code) => {
      clearTimeout(timeout);
      const executionTime = Date.now() - startTime;
      
      console.log(`Process exited with code: ${code}`);
      console.log(`Stdout: ${stdout}`);
      console.log(`Stderr: ${stderr}`);
      
      resolve({
        output: stdout.trim(),
        error: stderr.trim(),
        exitCode: code || 0,
        executionTime,
        memoryUsed: 0, // TODO: implement memory tracking
        status: code === 0 ? 'success' : 'error'
      });
    });

    process.on('error', (error) => {
      clearTimeout(timeout);
      console.log(`Process error: ${error.message}`);
      resolve({
        output: '',
        error: error.message,
        exitCode: -1,
        executionTime: Date.now() - startTime,
        memoryUsed: 0,
        status: 'error'
      });
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    const { code, language, input = '', testCases = [] } = await request.json();

    console.log(`Code execution request - Language: ${language}, Test cases: ${testCases.length}`);

    if (!code || !language) {
      return NextResponse.json(
        { error: 'Code and language are required' },
        { status: 400 }
      );
    }

    const config = LANGUAGE_CONFIGS[language];
    if (!config) {
      return NextResponse.json(
        { error: `Unsupported language: ${language}` },
        { status: 400 }
      );
    }

    // Create temp directory
    const tempDir = join('/tmp', 'zenith-code-execution', uuidv4());
    mkdirSync(tempDir, { recursive: true });

    const fileName = `solution.${config.extension}`;
    const filePath = join(tempDir, fileName);
    const outputDir = join(tempDir, 'output');
    
    if (config.needsCompilation) {
      mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Temp directory: ${tempDir}`);
    console.log(`File path: ${filePath}`);

    try {
      // Write code to file
      writeFileSync(filePath, code);
      console.log('Code written to file successfully');

      // Compile if necessary
      if (config.needsCompilation && config.compileCommand) {
        console.log('Starting compilation...');
        const compileArgs = config.compileCommand(filePath, outputDir);
        const compileResult = await executeWithTimeout(
          compileArgs[0],
          compileArgs.slice(1),
          '',
          10000, // 10 seconds for compilation
          tempDir
        );

        if (compileResult.exitCode !== 0) {
          console.log('Compilation failed:', compileResult.error);
          return NextResponse.json({
            success: false,
            error: 'Compilation Error',
            details: compileResult.error || compileResult.output,
            executionTime: compileResult.executionTime
          });
        }
        console.log('Compilation successful');
      }

      // If no test cases provided, run with custom input
      if (testCases.length === 0) {
        console.log('Running with custom input...');
        const executeArgs = config.executeCommand(
          filePath,
          config.needsCompilation ? outputDir : undefined
        );
        
        const result = await executeWithTimeout(
          executeArgs[0],
          executeArgs.slice(1),
          input,
          EXECUTION_TIMEOUT,
          tempDir
        );

        return NextResponse.json({
          success: result.status === 'success',
          output: result.output,
          error: result.error,
          executionTime: result.executionTime,
          memoryUsed: result.memoryUsed,
          status: result.status
        });
      }

      // Run against test cases
      console.log(`Running ${testCases.length} test cases...`);
      const results = [];
      
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(`Running test case ${i + 1}/${testCases.length}`);
        
        const executeArgs = config.executeCommand(
          filePath,
          config.needsCompilation ? outputDir : undefined
        );

        const result = await executeWithTimeout(
          executeArgs[0],
          executeArgs.slice(1),
          testCase.input,
          EXECUTION_TIMEOUT,
          tempDir
        );

        const expectedOutput = testCase.expectedOutput.trim();
        const actualOutput = result.output.trim();
        const passed = result.status === 'success' && actualOutput === expectedOutput;

        console.log(`Test case ${i + 1}: ${passed ? 'PASSED' : 'FAILED'}`);
        console.log(`Expected: "${expectedOutput}"`);
        console.log(`Actual: "${actualOutput}"`);

        results.push({
          index: i,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: result.output,
          error: result.error,
          passed,
          executionTime: result.executionTime,
          memoryUsed: result.memoryUsed,
          status: result.status
        });
      }

      const passedTests = results.filter(r => r.passed).length;
      console.log(`Results: ${passedTests}/${results.length} tests passed`);

      return NextResponse.json({
        success: true,
        results,
        totalTests: results.length,
        passedTests,
        language
      });

    } finally {
      // Cleanup temp files
      try {
        if (existsSync(filePath)) {
          unlinkSync(filePath);
        }
        if (config.needsCompilation && existsSync(outputDir)) {
          // Clean up compiled files
          const compiledFiles = [
            join(outputDir, 'solution'),
            join(outputDir, 'solution.exe'),
            join(outputDir, 'solution.js'),
          ];
          
          compiledFiles.forEach(file => {
            if (existsSync(file)) {
              try {
                unlinkSync(file);
              } catch (e) {
                console.warn(`Failed to cleanup file: ${file}`);
              }
            }
          });
        }
      } catch (e) {
        console.warn('Cleanup error:', e);
      }
    }

  } catch (error) {
    console.error('Code execution error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
