import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { language, code } = await request.json();

    if (!code || !language) {
      return NextResponse.json(
        { error: 'Code and language are required' },
        { status: 400 }
      );
    }

    // Mock execution for now - in a real implementation, you'd use a sandboxed environment
    // or external service like Judge0, Sphere Engine, etc.
    const mockResult = {
      output: `Mock output for ${language}:\n${getMockOutput(language, code)}`,
      status: 'success' as const,
      executionTime: Math.floor(Math.random() * 1000) + 100,
      memoryUsed: Math.floor(Math.random() * 1024) + 512,
    };

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json(mockResult);
  } catch (error) {
    console.error('Playground execution error:', error);
    return NextResponse.json(
      {
        output: '',
        error: 'Internal server error occurred during code execution',
        status: 'error',
      },
      { status: 500 }
    );
  }
}

function getMockOutput(language: string, code: string): string {
  switch (language) {
    case 'python':
      if (code.includes('print')) {
        return 'Hello, Zenith! 🌟\nOriginal: [1, 2, 3, 4, 5]\nSquared: [1, 4, 9, 16, 25]';
      }
      return 'Code executed successfully!';
    
    case 'javascript':
      if (code.includes('console.log')) {
        return 'Hello, Zenith! 🌟\nOriginal: [ 1, 2, 3, 4, 5 ]\nSquared: [ 1, 4, 9, 16, 25 ]';
      }
      return 'Code executed successfully!';
    
    case 'java':
      if (code.includes('System.out.println')) {
        return 'Hello, Zenith! 🌟\nOriginal: [1, 2, 3, 4, 5]\nSquared: [1, 4, 9, 16, 25]';
      }
      return 'Code executed successfully!';
    
    case 'cpp':
      if (code.includes('std::cout')) {
        return 'Hello, Zenith! 🌟\nOriginal: 1 2 3 4 5 \nSquared: 1 4 9 16 25';
      }
      return 'Code executed successfully!';
    
    default:
      return 'Code executed successfully!';
  }
}
