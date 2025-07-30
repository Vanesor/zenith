import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Initialize PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://zenith_user:zenith_password@localhost:5432/zenith_db'
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = params.id;
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Get user from token (simplified - in production, verify JWT properly)
    const userQuery = 'SELECT id, email, name FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [1]); // Replace with actual token verification
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    // Get assignment details
    const assignmentQuery = `
      SELECT 
        id, title, description, max_points, passing_score,
        allow_review, show_results
      FROM assignments 
      WHERE id = $1
    `;
    
    const assignmentResult = await pool.query(assignmentQuery, [assignmentId]);
    
    if (assignmentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const assignment = assignmentResult.rows[0];

    // Get the user's latest completed attempt
    const attemptQuery = `
      SELECT 
        id, attempt_number, start_time, end_time, score, status, 
        answers, violations, submitted_at, time_spent
      FROM assignment_attempts 
      WHERE assignment_id = $1 AND user_id = $2 AND status IN ('completed', 'submitted', 'graded')
      ORDER BY attempt_number DESC
      LIMIT 1
    `;
    
    const attemptResult = await pool.query(attemptQuery, [assignmentId, user.id]);
    
    if (attemptResult.rows.length === 0) {
      return NextResponse.json({ error: 'No completed attempts found' }, { status: 404 });
    }

    const attempt = attemptResult.rows[0];

    // Get assignment questions and correct answers
    const questionsQuery = `
      SELECT 
        id, type, title, description, options, correct_answer, points,
        language, starter_code, test_cases
      FROM assignment_questions 
      WHERE assignment_id = $1
      ORDER BY question_order
    `;
    
    const questionsResult = await pool.query(questionsQuery, [assignmentId]);
    const questions = questionsResult.rows;

    // Safe JSON parsing with fallback
    const parseJsonSafely = (value: any, fallback: any) => {
      if (!value) return fallback;
      if (typeof value === 'object') return value;
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (e) {
          console.warn('Failed to parse JSON:', value);
          return fallback;
        }
      }
      return fallback;
    };

    // Get user answers
    const userAnswers = parseJsonSafely(attempt.answers, {});
    const violations = parseJsonSafely(attempt.violations, []);

    // Calculate results for each question
    const questionResults = questions.map(question => {
      const userAnswer = userAnswers[question.id];
      let isCorrect = false;
      let pointsAwarded = 0;

      // Check if answer is correct based on question type
      if (question.type === 'multiple-choice' || question.type === 'true-false') {
        isCorrect = userAnswer === question.correct_answer;
        pointsAwarded = isCorrect ? question.points : 0;
      } else if (question.type === 'short-answer') {
        // For short answers, we might need fuzzy matching or manual grading
        const correctAnswers = Array.isArray(question.correct_answer) 
          ? question.correct_answer 
          : [question.correct_answer];
        isCorrect = correctAnswers.some((answer: any) => 
          userAnswer?.toLowerCase()?.trim() === answer?.toLowerCase()?.trim()
        );
        pointsAwarded = isCorrect ? question.points : 0;
      } else if (question.type === 'coding') {
        // For coding questions, check test cases
        const testCases = JSON.parse(question.test_cases || '[]');
        const testCaseResults = testCases.map((testCase: any) => {
          // In a real implementation, you would execute the code and check outputs
          // For now, we'll simulate this
          const passed = Math.random() > 0.3; // Simulate test case results
          return {
            id: testCase.id,
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput: passed ? testCase.expectedOutput : 'Error or wrong output',
            passed
          };
        });
        
        const passedCount = testCaseResults.filter((tc: any) => tc.passed).length;
        const passPercentage = testCases.length > 0 ? passedCount / testCases.length : 0;
        pointsAwarded = Math.round(question.points * passPercentage);
        isCorrect = passPercentage === 1;

        return {
          id: question.id,
          type: question.type,
          title: question.title,
          description: question.description,
          userAnswer,
          correctAnswer: question.correct_answer,
          isCorrect,
          pointsAwarded,
          maxPoints: question.points,
          testCaseResults
        };
      } else {
        // For essay questions, assume manual grading
        pointsAwarded = attempt.score ? Math.round(question.points * 0.8) : 0; // Simulate partial credit
        isCorrect = pointsAwarded > 0;
      }

      return {
        id: question.id,
        type: question.type,
        title: question.title,
        description: question.description,
        userAnswer,
        correctAnswer: assignment.show_results ? question.correct_answer : undefined,
        isCorrect,
        pointsAwarded,
        maxPoints: question.points
      };
    });

    // Calculate total score
    const totalScore = questionResults.reduce((sum, q) => sum + q.pointsAwarded, 0);
    const maxScore = questions.reduce((sum, q) => sum + q.points, 0);
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const isPassing = percentage >= assignment.passing_score;

    // Get total attempts count
    const totalAttemptsQuery = `
      SELECT COUNT(*) as total_attempts
      FROM assignment_attempts 
      WHERE assignment_id = $1 AND user_id = $2
    `;
    
    const totalAttemptsResult = await pool.query(totalAttemptsQuery, [assignmentId, user.id]);
    const totalAttempts = parseInt(totalAttemptsResult.rows[0].total_attempts);

    // Get max attempts from assignment
    const maxAttemptsQuery = 'SELECT max_attempts FROM assignments WHERE id = $1';
    const maxAttemptsResult = await pool.query(maxAttemptsQuery, [assignmentId]);
    const maxAttempts = maxAttemptsResult.rows[0]?.max_attempts || 1;

    const results = {
      id: assignmentId,
      title: assignment.title,
      description: assignment.description,
      totalScore,
      maxScore,
      percentage: Math.round(percentage * 10) / 10,
      isPassing,
      passingScore: assignment.passing_score,
      timeSpent: attempt.time_spent || 0,
      timeLimit: 0, // Get from assignment if needed
      submittedAt: attempt.submitted_at?.toISOString() || attempt.end_time?.toISOString(),
      gradedAt: attempt.status === 'graded' ? new Date().toISOString() : undefined,
      status: attempt.status,
      attempt: attempt.attempt_number,
      totalAttempts: maxAttempts,
      questions: questionResults,
      violations: violations.map((v: any) => `${v.type}: ${v.message} (${new Date(v.timestamp).toLocaleTimeString()})`),
      feedback: null, // Add if you have instructor feedback
      allowReview: assignment.allow_review,
      showCorrectAnswers: assignment.show_results
    };

    return NextResponse.json(results);

  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
