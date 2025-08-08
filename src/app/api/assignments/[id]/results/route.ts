import { NextRequest, NextResponse } from 'next/server';
import Database from '@/lib/database';
import { verifyAuth } from '@/lib/AuthMiddleware';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');



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
    console.error('Error generating code analysis:', error);
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
    const userResult = await Database.query(
      'SELECT id, email, name FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    // Get assignment details
    const assignmentResult = await Database.query(
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
    const submissionResult = await Database.query(
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
      const attemptResult = await Database.query(
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
    const questionsResult = await Database.query(
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
    const responsesResult = await Database.query(
      `SELECT 
        qr.question_id, qr.selected_options, qr.code_answer,
        qr.essay_answer, qr.is_correct, qr.score, qr.time_spent,
        qr.test_results
      FROM question_responses qr
      WHERE qr.submission_id = $1`,
      [submission.id]
    );
    
    const responses = responsesResult.rows;
    
    // Process question results
    const questionResultsPromises = questions.map(async (question: any) => {
      // Find the user's response for this question
      const response = responses.find((r: any) => r.question_id === question.id) || {
        selected_options: [],
        code_answer: null,
        essay_answer: null,
        is_correct: false,
        score: 0,
        time_spent: 0,
        test_results: null
      };

      let userAnswer: any;
      let correctAnswer: any;
      let analysisContent: string | null = null;
      let testCaseResults: any[] = [];
      
      // Format answers based on question type
      if (question.question_type === 'multiple-choice' || question.question_type === 'single_choice') {
        userAnswer = response.selected_options;
        correctAnswer = question.correct_answer ? JSON.parse(question.correct_answer) : [];
      } 
      else if (question.question_type === 'multi-select' || question.question_type === 'multi_select') {
        userAnswer = response.selected_options;
        correctAnswer = question.correct_answer ? JSON.parse(question.correct_answer) : [];
      }
      else if (question.question_type === 'true-false') {
        userAnswer = response.essay_answer === 'true';
        correctAnswer = question.correct_answer === 'true';
      }
      else if (question.question_type === 'short-answer' || question.question_type === 'essay') {
        userAnswer = response.essay_answer;
        correctAnswer = question.correct_answer;
      }
      else if (question.question_type === 'coding') {
        try {
          const codeData = response.code_answer ? JSON.parse(response.code_answer) : { code: '', language: '' };
          userAnswer = codeData;
          correctAnswer = null; // No single correct answer for coding questions
          
          // Parse test results if available
          if (response.test_results) {
            try {
              testCaseResults = JSON.parse(response.test_results);
            } catch (e) {
              console.error('Error parsing test results', e);
              testCaseResults = [];
            }
          } else if (question.test_cases) {
            // If no test results are available, but we have test cases, create placeholder results
            try {
              const testCases = JSON.parse(question.test_cases);
              testCaseResults = testCases.map((testCase: any) => ({
                id: testCase.id,
                input: testCase.input,
                expectedOutput: testCase.expectedOutput,
                actualOutput: "No result available",
                passed: false
              }));
            } catch (e) {
              console.error('Error parsing test cases', e);
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
        }
      }
      else if (question.question_type === 'integer') {
        userAnswer = response.essay_answer ? parseInt(response.essay_answer) : null;
        correctAnswer = question.correct_answer ? parseInt(question.correct_answer) : null;
      }

      return {
        id: question.id,
        type: question.question_type.replace('_', '-'), // Normalize for frontend
        title: question.title,
        description: question.description,
        userAnswer,
        correctAnswer: assignment.show_results ? correctAnswer : undefined,
        isCorrect: response.is_correct,
        pointsAwarded: response.score || 0,
        maxPoints: question.marks || 0,
        timeSpent: response.time_spent || 0,
        options: question.options ? JSON.parse(question.options) : [],
        analysisContent,
        testCaseResults
      };
    });

    const questionResults = await Promise.all(questionResultsPromises);
    
    // Calculate total score and percentage
    const totalScore = questionResults.reduce((sum: number, q: any) => sum + q.pointsAwarded, 0);
    const maxScore = questions.reduce((sum: number, q: any) => sum + (q.marks || 0), 0);
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const isPassing = percentage >= (assignment.passing_score || 60);
    
    // Get submission count
    const submissionCountResult = await Database.query(
      `SELECT COUNT(*) as count FROM assignment_submissions
      WHERE assignment_id = $1 AND user_id = $2`,
      [assignmentId, userId]
    );
    
    const submissionCount = submissionCountResult.rows[0]?.count || 1;
    
    // Format violations if they exist
    let violations: any[] = [];
    if (submission.violation_count > 0) {
      const violationsResult = await Database.query(
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
    console.error('Error fetching results:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
