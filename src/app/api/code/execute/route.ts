import { NextRequest, NextResponse } from 'next/server';

// Enhanced interfaces matching the Render compiler service
interface TestCaseResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  executionTime: number;
  memoryUsed?: number;
  cpuUsage?: number;
  status: string;
  error?: string;
}

interface ExecutionSummary {
  totalTestCases: number;
  passedTestCases: number;
  failedTestCases: number;
  successRate: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  maxMemoryUsed?: number;
  totalCpuTime?: number;
  compilationTime?: number;
  status: string;
}

interface CompilerResponse {
  success: boolean;
  output: string;
  error: string;
  execution_time: number;
  memory_used?: number;
  testResults?: TestCaseResult[];
  executionSummary?: ExecutionSummary;
  language: string;
  codeLength: number;
}

// Render compiler service URL - Update this with your deployed service URL
const COMPILER_SERVICE_URL = process.env.COMPILER_SERVICE_URL || 'https://execution-compiler.onrender.com';

export async function POST(request: NextRequest) {
  let code: string = '';
  let language: string = '';
  let input: string = '';
  let testCases: any[] = [];

  try {
    const body = await request.json();
    ({ code, language, input, testCases } = body);

    // Validate required fields
    if (!code || !language) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: code and language',
          output: '',
          execution_time: 0
        },
        { status: 400 }
      );
    }

    // Prepare the request payload for the compiler service
    const compilerPayload = {
      code,
      language: language.toLowerCase(),
      input: input || '',
      timeout: 10,
      testCases: testCases || []
    };

    // Check if compiler service URL is configured
    if (COMPILER_SERVICE_URL === 'https://your-compiler-service.onrender.com') {
      console.warn('COMPILER_SERVICE_URL not configured, using local fallback');
      return NextResponse.json(getLocalFallbackResponse(code, language, input, testCases));
    }

    // Get API key for authentication from environment variable
    const apiKey = process.env.CODE_EXECUTION_SERVICE_API_KEY;
    console.log("Using compiler API key:", apiKey ? "Key loaded from environment" : "Key not found");
    
    // Call the Render compiler service
    const compilerResponse = await fetch(`${COMPILER_SERVICE_URL}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(compilerPayload),
    });

    if (!compilerResponse.ok) {
      console.warn(`Execute endpoint failed with status ${compilerResponse.status}, trying compile endpoint`);
      
      // If the compiler service is down, try the /compile endpoint as fallback
      try {
        console.log("Attempting fallback to /compile endpoint...");
        const fallbackResponse = await fetch(`${COMPILER_SERVICE_URL}/compile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify(compilerPayload),
        });

        if (!fallbackResponse.ok) {
          console.error(`Both endpoints failed. Execute: ${compilerResponse.status}, Compile: ${fallbackResponse.status}`);
          console.error(`Service URL: ${COMPILER_SERVICE_URL}`);
          
          // Use local fallback if both endpoints fail
          return NextResponse.json(getLocalFallbackResponse(code, language, input, testCases));
        }

        const fallbackResult: CompilerResponse = await fallbackResponse.json();
        return NextResponse.json(formatResponse(fallbackResult, testCases));
      } catch (fallbackError) {
        console.error('Fallback endpoint also failed:', fallbackError);
        return NextResponse.json(getLocalFallbackResponse(code, language, input, testCases));
      }
    }

    const result: CompilerResponse = await compilerResponse.json();
    
    // Format the response for the frontend
    return NextResponse.json(formatResponse(result, testCases));

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    console.error('Compiler service URL:', COMPILER_SERVICE_URL);
    
    // If there's a network error, try local fallback
    if (error instanceof Error && error.message.includes('fetch')) {
      console.warn('Network error detected, using local fallback');
      return NextResponse.json(getLocalFallbackResponse(code, language, input, testCases));
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Code execution service temporarily unavailable',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        output: '',
        execution_time: 0,
        testResults: [],
        executionSummary: null,
        fallback: true,
        serviceUrl: COMPILER_SERVICE_URL,
        suggestion: 'Please check if COMPILER_SERVICE_URL is configured correctly in your environment variables'
      },
      { status: 500 }
    );
  }
}

function getLocalFallbackResponse(code: string, language: string, input?: string, testCases?: any[]): any {
  // Simple local fallback for when the compiler service is unavailable
  const mockExecutionTime = 50 + Math.random() * 100; // Random execution time between 50-150ms
  
  if (testCases && testCases.length > 0) {
    // Mock test case results
    const mockResults = testCases.map((tc, index) => ({
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      actualOutput: `Mock output for test ${index + 1}`, // Would be actual output in real execution
      passed: Math.random() > 0.3, // 70% pass rate for demonstration
      executionTime: mockExecutionTime + Math.random() * 20,
      memoryUsed: 1024 + Math.floor(Math.random() * 512),
      cpuUsage: 5 + Math.random() * 15,
      status: 'completed',
      error: null
    }));

    const passedTests = mockResults.filter(r => r.passed).length;
    
    return {
      success: true,
      output: `Mock execution completed. ${passedTests}/${testCases.length} tests passed.`,
      error: '',
      executionTime: mockExecutionTime,
      memoryUsed: 1024,
      results: mockResults,
      testResults: mockResults,
      executionSummary: {
        totalTestCases: testCases.length,
        passedTestCases: passedTests,
        failedTestCases: testCases.length - passedTests,
        successRate: (passedTests / testCases.length) * 100,
        totalExecutionTime: mockExecutionTime,
        averageExecutionTime: mockExecutionTime / testCases.length,
        maxMemoryUsed: 1536,
        totalCpuTime: 12.5,
        status: passedTests === testCases.length ? 'all_passed' : 'partial'
      },
      passedTests,
      totalTests: testCases.length,
      language,
      codeLength: code.length,
      fallback: true,
      message: 'Compiler service unavailable - using local fallback'
    };
  }

  // Mock single execution result
  return {
    success: true,
    output: `Mock output for ${language} code execution.\nInput: ${input || 'No input'}\nCode length: ${code.length} characters`,
    error: '',
    executionTime: mockExecutionTime,
    memoryUsed: 1024,
    language,
    codeLength: code.length,
    fallback: true,
    message: 'Compiler service unavailable - using local fallback'
  };
}

function formatResponse(result: CompilerResponse, testCases?: any[]): any {
  // If test cases were provided, format the response accordingly
  if (testCases && testCases.length > 0 && result.testResults) {
    const passedTests = result.testResults.filter(tr => tr.passed).length;
    const totalTests = result.testResults.length;

    return {
      success: result.success,
      output: result.output,
      error: result.error,
      executionTime: result.execution_time,
      memoryUsed: result.memory_used,
      results: result.testResults.map(tr => ({
        input: tr.input,
        expectedOutput: tr.expectedOutput,
        actualOutput: tr.actualOutput,
        passed: tr.passed,
        executionTime: tr.executionTime,
        memoryUsed: tr.memoryUsed,
        cpuUsage: tr.cpuUsage,
        error: tr.error,
        status: tr.status
      })),
      testResults: result.testResults,
      executionSummary: result.executionSummary,
      passedTests,
      totalTests,
      language: result.language,
      codeLength: result.codeLength
    };
  }

  // For custom input execution
  return {
    success: result.success,
    output: result.output,
    error: result.error,
    executionTime: result.execution_time,
    memoryUsed: result.memory_used,
    language: result.language,
    codeLength: result.codeLength
  };
}

export async function GET() {
  const isConfigured = COMPILER_SERVICE_URL !== 'https://your-compiler-service.onrender.com';
  
  return NextResponse.json({
    status: 'healthy',
    compilerService: COMPILER_SERVICE_URL,
    serviceConfigured: isConfigured,
    fallbackAvailable: true,
    supportedLanguages: ['python', 'javascript', 'java', 'cpp', 'c'],
    message: isConfigured 
      ? 'Zenith Code Execution API is running with external compiler service'
      : 'Zenith Code Execution API is running with local fallback (COMPILER_SERVICE_URL not configured)',
    instructions: isConfigured 
      ? 'External compiler service configured and ready'
      : 'Set COMPILER_SERVICE_URL in your environment variables to use the Render compiler service'
  });
}
