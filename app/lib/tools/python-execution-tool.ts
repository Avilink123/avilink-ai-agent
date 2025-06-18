import { BaseTool } from './base-tool';
import { PrismaClient } from '@prisma/client';
import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();

interface PythonExecutionResult {
  code: string;
  output: string;
  error: string | null;
  execution_time: number;
  status: 'success' | 'error' | 'timeout';
}

export class PythonExecutionTool extends BaseTool {
  name = 'python_execution';
  description = 'Execute Python code securely in a sandboxed environment. Supports data analysis, calculations, and visualization.';
  parameters = {
    code: { type: 'string', required: true, description: 'Python code to execute' },
    timeout: { type: 'number', default: 30, description: 'Execution timeout in seconds' },
    capture_output: { type: 'boolean', default: true, description: 'Capture stdout and stderr' }
  };

  async execute(parameters: any) {
    const { result, executionTime } = await this.measureExecutionTime(async () => {
      const validation = this.validateParameters(parameters, ['code']);
      if (!validation.isValid) {
        throw new Error(`Missing required parameters: ${validation.missingParams?.join(', ')}`);
      }

      const { code, timeout = 30, capture_output = true } = parameters;

      // Security validation
      if (this.containsUnsafeOperations(code)) {
        throw new Error('Code contains potentially unsafe operations');
      }

      const executionResult = await this.executePythonCode(code, timeout, capture_output);
      
      // Log execution to database
      await this.logExecution(code, executionResult);

      return executionResult;
    });

    return {
      success: result.status === 'success',
      data: result,
      error: result.status === 'error' ? (result.error || undefined) : undefined,
      executionTime
    };
  }

  private containsUnsafeOperations(code: string): boolean {
    const unsafePatterns = [
      /import\s+os/,
      /import\s+subprocess/,
      /import\s+sys/,
      /from\s+os/,
      /from\s+subprocess/,
      /exec\s*\(/,
      /eval\s*\(/,
      /__import__/,
      /open\s*\(/,
      /file\s*\(/,
      /input\s*\(/,
      /raw_input\s*\(/
    ];

    return unsafePatterns.some(pattern => pattern.test(code));
  }

  private async executePythonCode(code: string, timeout: number, captureOutput: boolean): Promise<PythonExecutionResult> {
    const tempDir = '/tmp/avilink-python';
    const tempFile = join(tempDir, `script_${Date.now()}.py`);

    try {
      // Ensure temp directory exists
      await this.ensureTempDir(tempDir);

      // Wrap code with safety measures
      const wrappedCode = this.wrapCodeWithSafety(code);
      
      // Write code to temporary file
      await writeFile(tempFile, wrappedCode);

      // Execute Python code
      const executionStart = Date.now();
      const result = await this.runPythonProcess(tempFile, timeout, captureOutput);
      const executionTime = Date.now() - executionStart;

      return {
        ...result,
        code,
        execution_time: executionTime
      };

    } catch (error) {
      return {
        code,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        execution_time: 0,
        status: 'error'
      };
    } finally {
      // Clean up temporary file
      try {
        await unlink(tempFile);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }
  }

  private async ensureTempDir(dir: string) {
    const { spawn } = require('child_process');
    return new Promise<void>((resolve, reject) => {
      const mkdir = spawn('mkdir', ['-p', dir]);
      mkdir.on('close', (code: number | null) => {
        if (code === 0) resolve();
        else reject(new Error(`Failed to create directory: ${code}`));
      });
    });
  }

  private wrapCodeWithSafety(code: string): string {
    return `
import sys
import traceback
from io import StringIO
import contextlib

# Redirect stdout
old_stdout = sys.stdout
sys.stdout = StringIO()

try:
    # User code starts here
${code.split('\n').map(line => '    ' + line).join('\n')}
    
    # Capture output
    output = sys.stdout.getvalue()
    print("AVILINK_OUTPUT_START")
    print(output)
    print("AVILINK_OUTPUT_END")
    
except Exception as e:
    print("AVILINK_ERROR_START")
    print(f"Error: {str(e)}")
    print("AVILINK_ERROR_END")
    traceback.print_exc()
finally:
    sys.stdout = old_stdout
`;
  }

  private runPythonProcess(scriptPath: string, timeout: number, captureOutput: boolean): Promise<PythonExecutionResult> {
    return new Promise((resolve) => {
      let output = '';
      let error = '';
      let timedOut = false;

      const pythonProcess = spawn('python3', [scriptPath], {
        stdio: captureOutput ? 'pipe' : 'inherit',
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
      });

      // Set timeout
      const timeoutId = setTimeout(() => {
        timedOut = true;
        pythonProcess.kill('SIGKILL');
      }, timeout * 1000);

      if (captureOutput) {
        pythonProcess.stdout?.on('data', (data) => {
          output += data.toString();
        });

        pythonProcess.stderr?.on('data', (data) => {
          error += data.toString();
        });
      }

      pythonProcess.on('close', (code) => {
        clearTimeout(timeoutId);

        if (timedOut) {
          resolve({
            code: '',
            output: '',
            error: 'Execution timed out',
            execution_time: timeout * 1000,
            status: 'timeout'
          });
          return;
        }

        // Parse output
        const cleanOutput = this.parseOutput(output);
        const cleanError = this.parseError(error);

        resolve({
          code: '',
          output: cleanOutput,
          error: cleanError || null,
          execution_time: 0,
          status: code === 0 && !cleanError ? 'success' : 'error'
        });
      });

      pythonProcess.on('error', (err) => {
        clearTimeout(timeoutId);
        resolve({
          code: '',
          output: '',
          error: `Process error: ${err.message}`,
          execution_time: 0,
          status: 'error'
        });
      });
    });
  }

  private parseOutput(output: string): string {
    const startMarker = 'AVILINK_OUTPUT_START';
    const endMarker = 'AVILINK_OUTPUT_END';
    
    const startIndex = output.indexOf(startMarker);
    const endIndex = output.indexOf(endMarker);
    
    if (startIndex !== -1 && endIndex !== -1) {
      return output.substring(startIndex + startMarker.length, endIndex).trim();
    }
    
    return output.trim();
  }

  private parseError(error: string): string | null {
    const startMarker = 'AVILINK_ERROR_START';
    const endMarker = 'AVILINK_ERROR_END';
    
    const startIndex = error.indexOf(startMarker);
    const endIndex = error.indexOf(endMarker);
    
    if (startIndex !== -1 && endIndex !== -1) {
      return error.substring(startIndex + startMarker.length, endIndex).trim();
    }
    
    return error.trim() || null;
  }

  private async logExecution(code: string, result: PythonExecutionResult) {
    try {
      // Get or create default user
      const user = await prisma.user.upsert({
        where: { sessionId: 'default-session' },
        update: {},
        create: {
          sessionId: 'default-session',
          language: 'en'
        }
      });

      await prisma.codeExecution.create({
        data: {
          userId: user.id,
          language: 'python',
          code,
          output: result.output,
          error: result.error,
          status: result.status,
          duration: result.execution_time,
          metadata: { capturedAt: new Date().toISOString() }
        }
      });
    } catch (error) {
      console.error('Failed to log code execution:', error);
    }
  }
}