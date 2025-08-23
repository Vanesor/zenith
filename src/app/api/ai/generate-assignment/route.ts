import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const action = formData.get('action') as string || 'generate';
    const content = formData.get('content') as string;
    const difficulty = formData.get('difficulty') as string;
    const questionCount = formData.get('questionCount') as string;

    if (action === 'analyze') {
      // Analyze content to determine if question count is specified
      const analysis = await analyzeContentWithGemini(content);
      return NextResponse.json(analysis);
    } else {
      // Generate assignment
      const count = parseInt(questionCount || '5');
      const assignment = await generateAssignmentWithGemini(content, difficulty, count);
      return NextResponse.json(assignment);
    }
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: 'Failed to process request. Please try again.' },
      { status: 500 }
    );
  }
}

async function analyzeContentWithGemini(content: string): Promise<{ needsQuestionCount: boolean; detectedCount?: number }> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const analysisPrompt = `
Analyze the following content and determine if the number of questions is explicitly specified:

CONTENT TO ANALYZE:
"${content}"

TASK:
1. Look for any explicit mention of the number of questions (e.g., "3 questions", "generate 5", "make 10 problems", etc.)
2. If found, extract the number
3. Respond with ONLY a JSON object in this exact format:

For content WITH explicit question count:
{"needsQuestionCount": false, "detectedCount": NUMBER}

For content WITHOUT explicit question count:
{"needsQuestionCount": true}

Examples:
- "Give 3 coding questions about arrays" → {"needsQuestionCount": false, "detectedCount": 3}
- "Create questions about React hooks" → {"needsQuestionCount": true}
- "Generate 10 math problems" → {"needsQuestionCount": false, "detectedCount": 10}

Respond with ONLY the JSON object, no other text.`;

    const result = await model.generateContent(analysisPrompt);
    const response = result.response.text().trim();
    
    try {
      // Clean the response to remove any markdown formatting
      const cleanedResponse = response
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/^\s*[\r\n]/gm, '')
        .trim();
      
      console.log('Cleaned Gemini analysis response:', cleanedResponse);
      const analysis = JSON.parse(cleanedResponse);
      return analysis;
    } catch (parseError) {
      console.error('Failed to parse Gemini analysis response:', response);
      // Fallback to local analysis
      return localAnalyzeContent(content);
    }
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    // Fallback to local analysis
    return localAnalyzeContent(content);
  }
}

async function generateAssignmentWithGemini(content: string, difficulty: string, questionCount: number) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const generationPrompt = `
You are an expert educational content creator. Generate a comprehensive assignment based on the provided content.

CONTENT TO ANALYZE:
"${content}"

ASSIGNMENT REQUIREMENTS:
- Difficulty Level: ${difficulty}
- Number of Questions: ${questionCount}
- Create diverse question types appropriate for the content
- Focus on understanding, application, and critical thinking

RESPONSE FORMAT:
You MUST respond with a valid JSON object in this EXACT structure (no markdown, no additional text):

{
  "title": "Assignment Title",
  "description": "Detailed assignment description",
  "difficulty": "${difficulty}",
  "timeLimit": 60,
  "totalPoints": 100,
  "allowRetakes": true,
  "shuffleQuestions": false,
  "questions": [
    {
      "question_type": "single_choice|multiple_choice|multi_select|coding|essay|true_false|integer",
      "title": "Question title",
      "description": "Detailed question description/prompt",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correct_answer": 0,
      "points": 5,
      "ordering": 0,
      "explanation": "Detailed explanation of why this answer is correct"
    }
  ]
}

QUESTION TYPE GUIDELINES:
- single_choice: One correct answer from multiple options
- multiple_choice: One correct answer from multiple options (alias for single_choice)
- multi_select: Multiple correct answers from options (correct_answer as array [0,2])
- true_false: Boolean question (no options, correct_answer as true/false)
- coding: Programming question with starter_code, test_cases, expected_output
- essay: Open-ended question (no options, no correct_answer)
- integer: Numeric answer (correct_answer as number, include integer_min, integer_max)

FOR CODING QUESTIONS, include these additional fields:
- "code_language": "python|javascript|java|cpp|c"
- "starter_code": "initial code template"
- "test_cases": [{"input": "test input", "expected": "expected output", "hidden": false}]
- "expected_output": "sample expected output"

FOR INTEGER QUESTIONS, include:
- "integer_min": minimum_value
- "integer_max": maximum_value
- "integer_step": 1

CONTENT ANALYSIS:
- If content mentions programming/coding: Include coding questions with appropriate languages
- If content mentions mathematics: Include integer and calculation questions
- If content is conceptual: Include single_choice, essay, and true_false questions
- Always provide detailed explanations for learning purposes

QUALITY REQUIREMENTS:
- Questions should test real understanding, not just memorization
- Provide realistic and challenging scenarios
- Include proper explanations for educational value
- Ensure questions are directly related to the provided content
- Make the assignment title and description engaging and specific

Generate ${questionCount} high-quality questions now:`;

    const result = await model.generateContent(generationPrompt);
    const response = result.response.text().trim();
    
    try {
      // Clean the response in case it contains markdown formatting
      const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const assignment = JSON.parse(cleanedResponse);
      
      // Validate and ensure proper structure
      if (!assignment.questions || !Array.isArray(assignment.questions)) {
        throw new Error('Invalid assignment structure');
      }
      
      // Ensure questions have proper ordering and points
      assignment.questions = assignment.questions.map((q: any, index: number) => ({
        ...q,
        ordering: index,
        points: q.points || (difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : 7)
      }));
      
      // Calculate total points
      assignment.totalPoints = assignment.questions.reduce((sum: number, q: any) => sum + (q.points || 5), 0);
      
      return assignment;
    } catch (parseError) {
      console.error('Failed to parse Gemini generation response:', response);
      throw new Error('Failed to generate assignment. Please try again.');
    }
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    throw new Error('Failed to generate assignment. Please check your API key and try again.');
  }
}

// Fallback function for local content analysis
function localAnalyzeContent(content: string): { needsQuestionCount: boolean; detectedCount?: number } {
  const patterns = [
    /(\d+)\s*questions?/i,
    /generate\s*(\d+)/i,
    /create\s*(\d+)/i,
    /make\s*(\d+)/i,
    /(\d+)\s*items?/i,
    /(\d+)\s*problems?/i,
    /give\s*(\d+)/i,
    /(\d+)\s*coding/i,
    /(\d+)\s*math/i
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const count = parseInt(match[1]);
      if (count > 0 && count <= 50) {
        return { needsQuestionCount: false, detectedCount: count };
      }
    }
  }
  
  return { needsQuestionCount: true };
}


