import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Initialize PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://zenith_user:zenith_password@localhost:5432/zenith_db'
});

export async function POST(
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
    const body = await request.json();
    
    // Get user from token (simplified - in production, verify JWT properly)
    const userQuery = 'SELECT id, email, name FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [1]); // Replace with actual token verification
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];
    const { attemptId, answers, endTime } = body;

    // Validate attempt exists and belongs to user
    const attemptQuery = `
      SELECT 
        aa.id, aa.assignment_id, aa.user_id, aa.start_time, aa.status,
        a.max_points, a.passing_score, a.time_limit
      FROM assignment_attempts aa
      JOIN assignments a ON aa.assignment_id = a.id
      WHERE aa.id = $1 AND aa.user_id = $2 AND aa.status = 'in_progress'
    `;
    
    const attemptResult = await pool.query(attemptQuery, [attemptId, user.id]);
    
    if (attemptResult.rows.length === 0) {
      return NextResponse.json({ error: 'Attempt not found or already submitted' }, { status: 404 });
    }

    const attempt = attemptResult.rows[0];
    const startTime = new Date(attempt.start_time);
    const endDateTime = new Date(endTime);
    const timeSpentMinutes = Math.round((endDateTime.getTime() - startTime.getTime()) / (1000 * 60));

    // Get assignment questions for scoring
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

    // Calculate score for each question
    let totalScore = 0;
    const gradedAnswers: Record<string, any> = {};

    for (const question of questions) {
      const userAnswer = answers[question.id];
      let pointsAwarded = 0;
      let isCorrect = false;

      if (!userAnswer) {
        // No answer provided
        gradedAnswers[question.id] = {
          answer: null,
          pointsAwarded: 0,
          isCorrect: false
        };
        continue;
      }

      switch (question.type) {
        case 'multiple-choice':
        case 'true-false':
          if (userAnswer === question.correct_answer) {
            isCorrect = true;
            pointsAwarded = question.points;
          }
          break;

        case 'short-answer':
          // For short answers, we need fuzzy matching or exact matching
          const correctAnswers = Array.isArray(question.correct_answer) 
            ? question.correct_answer 
            : [question.correct_answer];
          
          isCorrect = correctAnswers.some((correctAnswer: string) => 
            userAnswer?.toLowerCase()?.trim() === correctAnswer?.toLowerCase()?.trim()
          );
          
          if (isCorrect) {
            pointsAwarded = question.points;
          }
          break;

        case 'coding':
          // For coding questions, we need to run test cases
          // For now, we'll simulate test case execution
          const testCases = JSON.parse(question.test_cases || '[]');
          let passedTestCases = 0;

          // In a real implementation, you would execute the code here
          // For demonstration, we'll simulate results
          for (const testCase of testCases) {
            // Simulate test execution - replace with actual code execution
            const passed = Math.random() > 0.3; // 70% chance of passing each test
            if (passed) passedTestCases++;
          }

          if (testCases.length > 0) {
            const passRate = passedTestCases / testCases.length;
            pointsAwarded = Math.round(question.points * passRate);
            isCorrect = passRate === 1; // All test cases must pass for fully correct
          }
          break;

        case 'essay':
          // Essays require manual grading
          // For now, assign partial credit and mark for manual review
          pointsAwarded = 0; // Will be graded manually
          isCorrect = false; // Unknown until manual grading
          break;

        default:
          // Unknown question type
          pointsAwarded = 0;
          isCorrect = false;
      }

      totalScore += pointsAwarded;
      gradedAnswers[question.id] = {
        answer: userAnswer,
        pointsAwarded,
        isCorrect,
        maxPoints: question.points
      };
    }

    const maxPossibleScore = questions.reduce((sum, q) => sum + q.points, 0);
    const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
    const isPassing = percentage >= attempt.passing_score;

    // Update attempt with final submission data
    const updateAttemptQuery = `
      UPDATE assignment_attempts 
      SET 
        end_time = $1,
        time_spent = $2,
        score = $3,
        max_score = $4,
        percentage = $5,
        is_passing = $6,
        answers = $7,
        graded_answers = $8,
        status = $9,
        submitted_at = $10,
        updated_at = $11
      WHERE id = $12
      RETURNING *
    `;
    
    const updateResult = await pool.query(updateAttemptQuery, [
      endDateTime,
      timeSpentMinutes,
      totalScore,
      maxPossibleScore,
      Math.round(percentage * 100) / 100, // Round to 2 decimal places
      isPassing,
      JSON.stringify(answers),
      JSON.stringify(gradedAnswers),
      'completed',
      endDateTime,
      new Date(),
      attemptId
    ]);

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ error: 'Failed to update attempt' }, { status: 500 });
    }

    const updatedAttempt = updateResult.rows[0];

    // Log the submission for auditing
    const auditQuery = `
      INSERT INTO assignment_audit_log (
        assignment_id, user_id, attempt_id, action, details, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `;
    
    try {
      await pool.query(auditQuery, [
        assignmentId,
        user.id,
        attemptId,
        'submit',
        JSON.stringify({
          score: totalScore,
          maxScore: maxPossibleScore,
          percentage: Math.round(percentage * 100) / 100,
          timeSpent: timeSpentMinutes,
          isPassing
        }),
        new Date()
      ]);
    } catch (auditError) {
      // Log audit error but don't fail the submission
      console.error('Failed to create audit log:', auditError);
    }

    // Return submission result
    return NextResponse.json({
      success: true,
      attemptId: updatedAttempt.id,
      score: totalScore,
      maxScore: maxPossibleScore,
      percentage: Math.round(percentage * 100) / 100,
      isPassing,
      timeSpent: timeSpentMinutes,
      submittedAt: endDateTime.toISOString(),
      gradedAnswers: gradedAnswers,
      message: isPassing 
        ? `Congratulations! You passed with ${Math.round(percentage * 100) / 100}%`
        : `Assignment completed. Score: ${Math.round(percentage * 100) / 100}% (Passing: ${attempt.passing_score}%)`
    });

  } catch (error) {
    console.error('Error submitting assignment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
