import { NextRequest, NextResponse } from 'next/server';
import db from "@/lib/database";
import { verifyAuth, withAuth } from "@/lib/auth-unified";
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Helper function to safely parse JSON
function safeJsonParse(jsonString: string, defaultValue: unknown = null) {
  try {
    // Handle already parsed objects
    if (typeof jsonString === 'object' && jsonString !== null) {
      return jsonString;
    }
    
    // Make sure it's a string before parsing
    if (typeof jsonString === 'string') {
      return JSON.parse(jsonString);
    }
    
    // If it's neither an object nor a string, return default
    return defaultValue;
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return defaultValue;
  }
}



// Helper function to generate code analysis using AI
async function generateCodeAnalysis(code: string, language: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = `
      Analyze the following ${language} code and provide a concise assessment of:
      1. Code quality (structure, organization, readability)
      2. Algorithm efficiency
      3. Potential improvements or optimizations
      4. Any bugs or issues
      5. Overall score (out of 10)
      
      Code:
      \`\`\`${language}
      ${code}
      \`\`\`
      
      Keep your analysis professional and educational. Aim for around 150-200 words.
    `;
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return "Unable to generate code analysis at this time.";
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params;
    
    // Verify authentication
    const authResult = await verifyAuth(request);
    const userId = authResult.user!.id;
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" }, 
        { status: 401 }
      );
    }

    // Get user details
    const userResult = await db.query(
      'SELECT id, email, name FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    // Get assignment details
    const assignmentResult = await db.query(
      `SELECT 
        id, title, description, max_points, passing_score,
        show_results, time_limit, max_attempts, allow_review,
        assignment_type
      FROM assignments 
      WHERE id = $1`,
      [assignmentId]
    );
    
    if (assignmentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const assignment = assignmentResult.rows[0];

    // Check if this is a subjective assignment (essay/writing)
    const isSubjectiveAssignment = ['essay', 'writing'].includes(assignment.assignment_type?.toLowerCase());

    // Check if the user is allowed to see results
    if (!assignment.show_results) {
      return NextResponse.json({ error: 'Results are not available for this assignment' }, { status: 403 });
    }

    // Get both submission data and attempt data
    const submissionResult = await db.query(
      `SELECT 
        s.id, s.started_at, s.completed_at, s.time_spent, 
        s.total_score, s.violation_count, s.auto_submitted, s.status,
        s.grade, s.feedback, s.submitted_at,
        COUNT(DISTINCT a.id) as attempt_count
      FROM assignment_submissions s
      LEFT JOIN assignment_attempts a ON s.assignment_id = a.assignment_id AND s.user_id = a.user_id
      WHERE s.assignment_id = $1 AND s.user_id = $2
      GROUP BY s.id
      ORDER BY s.completed_at DESC
      LIMIT 1`,
      [assignmentId, userId]
    );
    
    if (submissionResult.rows.length === 0) {
      // Try to find attempt data even if there's no submission
      const attemptResult = await db.query(
        `SELECT 
          id, start_time, end_time, time_spent, score,
          max_score, attempt_number, status, submitted_at
        FROM assignment_attempts
        WHERE assignment_id = $1 AND user_id = $2
        ORDER BY end_time DESC
        LIMIT 1`,
        [assignmentId, userId]
      );

      if (attemptResult.rows.length === 0) {
        return NextResponse.json({ error: 'No submission or attempt found' }, { status: 404 });
      }

      // Use attempt data
      const attempt = attemptResult.rows[0];
      return NextResponse.json({ 
        error: 'No final submission found, but attempt data is available',
        attemptData: attempt
      }, { status: 404 });
    }

    const submission = submissionResult.rows[0];

    // Get the assignment questions
    const questionsResult = await db.query(
      `SELECT 
        id, title, description, question_type, marks,
        options, correct_answer, code_language, test_cases
      FROM assignment_questions
      WHERE assignment_id = $1
      ORDER BY question_order`,
      [assignmentId]
    );
    
    const questions = questionsResult.rows;
    
    // Get the user's answers to these questions
    const responsesResult = await db.query(
      `SELECT 
        qr.question_id, qr.selected_options, qr.code_answer,
        qr.essay_answer, qr.is_correct, qr.score, qr.time_spent,
        qr.feedback
      FROM question_responses qr
      WHERE qr.submission_id = $1`,
      [submission.id]
    );
    
    const responses = responsesResult.rows;
    
    // Process question results
    const questionResultsPromises = questions.map(async (question: any) => {
      // Find the user's response for this question
      const response = responses.find((r: any) => (r as any).question_id === (question as any).id) || {
        selected_options: [],
        code_answer: null,
        essay_answer: null,
        is_correct: false,
        score: 0,
        time_spent: 0,
        feedback: null
      };

      let userAnswer: any;
      let correctAnswer: any;
      let analysisContent: string | null = null;
      let testCaseResults: any[] = [];
      
      // Format answers based on question type
      if ((question as any).question_type === 'multiple-choice' || (question as any).question_type === 'single_choice') {
        userAnswer = (response as any).selected_options;
        correctAnswer = (question as any).correct_answer ? 
          (typeof (question as any).correct_answer === 'string' ? 
            safeJsonParse((question as any).correct_answer, []) : 
            (question as any).correct_answer) : 
          [];
      } 
      else if ((question as any).question_type === 'multi-select' || (question as any).question_type === 'multi_select') {
        userAnswer = (response as any).selected_options;
        correctAnswer = (question as any).correct_answer ? 
          (typeof (question as any).correct_answer === 'string' ? 
            safeJsonParse((question as any).correct_answer, []) : 
            (question as any).correct_answer) : 
          [];
      }
      else if ((question as any).question_type === 'true-false') {
        userAnswer = (response as any).essay_answer === 'true';
        correctAnswer = (question as any).correct_answer === 'true';
      }
      else if ((question as any).question_type === 'short-answer' || (question as any).question_type === 'essay') {
        userAnswer = (response as any).essay_answer;
        correctAnswer = (question as any).correct_answer;
      }
      else if ((question as any).question_type === 'coding') {
        try {
          const codeData = (response as any).code_answer ? safeJsonParse((response as any).code_answer, { code: '', language: '' }) : { code: '', language: '' };
          userAnswer = codeData;
          correctAnswer = null; // No single correct answer for coding questions
          
          // Reset test case results for this question
          testCaseResults.length = 0;
          
          // Get test results from code_results table if response has an ID
          if ((response as any).id) {
            try {
              // Fetch test results from the code_results table
              const codeResultsQuery = await db.query(
                `SELECT 
                  test_case_index, passed, stdout, stderr, execution_time, memory_used 
                FROM code_results 
                WHERE response_id = $1 
                ORDER BY test_case_index`,
                [(response as any).id]
              );
              
              if (codeResultsQuery.rows.length > 0) {
                testCaseResults.push(...codeResultsQuery.rows);
              }
            } catch (e) {
              console.error('Error fetching test results', e);
            }
          }
          
          // If no test results are available from database, but we have test cases, create placeholder results
          if (testCaseResults.length === 0 && (question as any).test_cases) {
            try {
              // Use safe parsing for test cases
              const testCases = typeof (question as any).test_cases === 'string' 
                ? safeJsonParse((question as any).test_cases, []) 
                : (question as any).test_cases;
                
              if (Array.isArray(testCases)) {
                testCaseResults.push(...testCases.map((testCase: any) => ({
                  id: testCase.id || Math.random().toString(36).substring(7),
                  input: testCase.input || "Unknown input",
                  expectedOutput: testCase.expectedOutput || "Unknown expected output",
                  actualOutput: "No result available",
                  passed: false
                })));
              } else {
                testCaseResults = [];
                console.error('Test cases are not in array format:', testCases);
              }
            } catch (e) {
              console.error('Error handling test cases', e);
              testCaseResults = [];
            }
          }
          
          // Generate AI analysis for coding questions if we have code
          if (codeData.code && codeData.code.trim() !== '') {
            analysisContent = await generateCodeAnalysis(codeData.code, codeData.language || 'javascript');
          } else {
            analysisContent = "No code was submitted for analysis.";
          }
        } catch (error) {
          userAnswer = { code: '', language: '' };
          correctAnswer = null;
          analysisContent = "Error analyzing code submission.";
          console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
        }
      }
      else if ((question as any).question_type === 'integer') {
        userAnswer = (response as any).essay_answer ? parseInt((response as any).essay_answer) : null;
        correctAnswer = (question as any).correct_answer ? parseInt((question as any).correct_answer) : null;
      }

      return {
        id: (question as any).id,
        type: (question as any).question_type.replace('_', '-'), // Normalize for frontend
        title: (question as any).title,
        description: (question as any).description,
        userAnswer,
        correctAnswer: (assignment as any).show_results ? correctAnswer : undefined,
        isCorrect: (response as any).is_correct,
        pointsAwarded: (response as any).score || 0,
        maxPoints: (question as any).marks || 0,
        timeSpent: (response as any).time_spent || 0,
        options: (question as any).options ? (typeof (question as any).options === 'string' ? safeJsonParse((question as any).options, []) : (question as any).options) : [],
        analysisContent,
        testCaseResults
      };
    });

    const questionResults = await Promise.all(questionResultsPromises);
    
    // Calculate total score and percentage
    const totalScore = questionResults.reduce((sum: number, q: any) => sum + q.pointsAwarded, 0);
    const maxScore = questions.reduce((sum: number, q: any) => sum + (q.marks || 0), 0);
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const isPassing = percentage >= ((assignment as any).passing_score || 60);
    
    // Get submission count
    const submissionCountResult = await db.query(
      `SELECT COUNT(*) as count FROM assignment_submissions
      WHERE assignment_id = $1 AND user_id = $2`,
      [assignmentId, userId]
    );
    
    const submissionCount = submissionCountResult.rows[0]?.count || 1;
    
    // Format violations if they exist
    let violations: unknown[] = [];
    if (submission.violation_count > 0) {
      const violationsResult = await db.query(
        `SELECT violation_type, details, occurred_at
         FROM assignment_violations
         WHERE submission_id = $1
         ORDER BY occurred_at`,
        [submission.id]
      );
      
      violations = violationsResult.rows.map((v: any) => {
        const details = v.details ? JSON.stringify(v.details) : '';
        return `${v.violation_type}: ${details} (${new Date(v.occurred_at).toLocaleTimeString()})`;
      });
    }
    
    // Format the response based on assignment type
    if (isSubjectiveAssignment) {
      // For subjective assignments (essay/writing), return a simplified response without detailed results
      const subjectiveResult = {
        id: assignmentId,
        title: assignment.title,
        description: assignment.description,
        isSubjective: true,
        message: 'Detailed results are not available for subjective assignments.',
        submittedAt: submission.submitted_at || submission.completed_at,
        status: submission.status,
        grade: submission.grade,
        feedback: submission.feedback || null,
        timeSpent: submission.time_spent || 0,
        attempt: parseInt(submission.attempt_count) || submissionCount,
        totalAttempts: assignment.max_attempts || 1,
        viewMyResponses: true, // Allow viewing their own responses
        userId: userId
      };
      
      return NextResponse.json(subjectiveResult);
    }
    
    // For non-subjective assignments, return the full result with question details
    const result = {
      id: assignmentId,
      title: assignment.title,
      description: assignment.description,
      totalScore,
      maxScore,
      percentage,
      isPassing,
      passingScore: assignment.passing_score || 60,
      timeSpent: submission.time_spent || 0,
      timeLimit: assignment.time_limit * 60, // Convert to seconds
      submittedAt: submission.submitted_at || submission.completed_at,
      gradedAt: submission.status === 'graded' ? new Date().toISOString() : undefined,
      status: submission.status,
      attempt: parseInt(submission.attempt_count) || submissionCount,
      totalAttempts: assignment.max_attempts || 1,
      questions: questionResults,
      violations,
      feedback: submission.feedback || null,
      allowReview: assignment.allow_review || false,
      showCorrectAnswers: assignment.show_results,
      grade: submission.grade,
      userId: userId,
      isSubjective: false
    };
    
    return NextResponse.json(result);

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
