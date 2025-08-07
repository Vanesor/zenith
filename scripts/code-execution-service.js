import express from 'express';
import { exec, execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import cors from 'cors';

const app = express();
const port = process.env.CODE_EXECUTION_PORT || 4000;
const TEMP_DIR = path.join(__dirname, 'temp');

// Create temp directory if it doesn't exist
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

app.use(express.json());
app.use(cors());

// Configuration for different languages
const languageConfig = {
  javascript: {
    extension: 'js',
    executeCommand: (filePath) => ['node', filePath],
    timeoutMs: 5000,
  },
  python: {
    extension: 'py',
    executeCommand: (filePath) => ['python3', filePath],
    timeoutMs: 5000,
  },
  c: {
    extension: 'c',
    compile: (filePath, outputPath) => 
      new Promise((resolve, reject) => {
        exec(`gcc "${filePath}" -o "${outputPath}" -lm`, (error, stdout, stderr) => {
          if (error) reject({ error, stderr });
          else resolve({ stdout });
        });
      }),
    executeCommand: (outputPath) => [outputPath],
    timeoutMs: 5000,
  },
  cpp: {
    extension: 'cpp',
    compile: (filePath, outputPath) => 
      new Promise((resolve, reject) => {
        exec(`g++ "${filePath}" -o "${outputPath}" -std=c++17`, (error, stdout, stderr) => {
          if (error) reject({ error, stderr });
          else resolve({ stdout });
        });
      }),
    executeCommand: (outputPath) => [outputPath],
    timeoutMs: 5000,
  },
  java: {
    extension: 'java',
    compile: (filePath) => 
      new Promise((resolve, reject) => {
        const dir = path.dirname(filePath);
        exec(`javac "${filePath}"`, { cwd: dir }, (error, stdout, stderr) => {
          if (error) reject({ error, stderr });
          else resolve({ stdout });
        });
      }),
    executeCommand: (filePath) => {
      const className = path.basename(filePath, '.java');
      const dir = path.dirname(filePath);
      return ['java', '-cp', dir, className];
    },
    timeoutMs: 5000,
  }
};

// Execute code with input
function executeCode(command, args, input, timeoutMs) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    try {
      const childProcess = execFile(command, args, {
        timeout: timeoutMs,
        maxBuffer: 1024 * 1024, // 1MB output limit
      }, (error, stdout, stderr) => {
        const executionTime = Date.now() - startTime;
        
        if (error && error.killed) {
          resolve({ 
            output: '', 
            error: 'Time Limit Exceeded', 
            executionTime,
            status: 'timeout'
          });
        } else if (error) {
          resolve({ 
            output: stdout, 
            error: stderr || error.message, 
            executionTime,
            status: 'error'
          });
        } else {
          resolve({ 
            output: stdout, 
            error: stderr, 
            executionTime,
            status: 'success'
          });
        }
      });
      
      if (input) {
        childProcess.stdin.write(input);
        childProcess.stdin.end();
      }
    } catch (err) {
      reject(err);
    }
  });
}

// API endpoint to execute code
app.post('/execute', async (req, res) => {
  const { code, language, input, testCases } = req.body;
  
  if (!code || !language) {
    return res.status(400).json({ error: 'Code and language are required' });
  }
  
  const config = languageConfig[language];
  if (!config) {
    return res.status(400).json({ error: `Unsupported language: ${language}` });
  }
  
  const id = uuid();
  const fileName = `solution_${id}.${config.extension}`;
  const filePath = path.join(TEMP_DIR, fileName);
  const outputPath = path.join(TEMP_DIR, `solution_${id}`);
  
  try {
    // Write code to file
    fs.writeFileSync(filePath, code);
    
    // Compile if necessary
    if (config.compile) {
      try {
        await config.compile(filePath, outputPath);
      } catch (compileError) {
        return res.json({
          success: false,
          error: 'Compilation Error',
          details: compileError.stderr || compileError.error?.message,
          language
        });
      }
    }
    
    // If test cases provided, run them
    if (testCases && testCases.length > 0) {
      const results = [];
      
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        const execPath = config.compile ? outputPath : filePath;
        const execCommand = config.executeCommand(execPath);
        
        try {
          const result = await executeCode(
            execCommand[0], 
            execCommand.slice(1), 
            testCase.input, 
            config.timeoutMs
          );
          
          // Compare output (trim to handle whitespace differences)
          const actualOutput = result.output.trim();
          const expectedOutput = testCase.expectedOutput.trim();
          const passed = result.status === 'success' && actualOutput === expectedOutput;
          
          results.push({
            index: i,
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput: result.output,
            error: result.error,
            passed,
            executionTime: result.executionTime,
            status: result.status
          });
        } catch (error) {
          results.push({
            index: i,
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput: '',
            error: error.message,
            passed: false,
            executionTime: 0,
            status: 'error'
          });
        }
      }
      
      return res.json({
        success: true,
        results,
        totalTests: results.length,
        passedTests: results.filter(r => r.passed).length,
        language
      });
    }
    
    // Otherwise run with custom input
    const execPath = config.compile ? outputPath : filePath;
    const execCommand = config.executeCommand(execPath);
    
    const result = await executeCode(
      execCommand[0], 
      execCommand.slice(1), 
      input, 
      config.timeoutMs
    );
    
    return res.json({
      success: result.status === 'success',
      output: result.output,
      error: result.error,
      executionTime: result.executionTime,
      status: result.status,
      language
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: 'Internal Server Error', 
      details: error.message
    });
  } finally {
    // Clean up temp files
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      if (config.compile && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      
      // For Java, also remove class files
      if (language === 'java') {
        const className = path.basename(filePath, '.java');
        const classFilePath = path.join(TEMP_DIR, `${className}.class`);
        if (fs.existsSync(classFilePath)) fs.unlinkSync(classFilePath);
      }
    } catch (e) {
      console.error('Error cleaning up files:', e);
    }
  }
});

app.listen(port, () => {
  console.log(`Code execution service listening at http://localhost:${port}`);
});
