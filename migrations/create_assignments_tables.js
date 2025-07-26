const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "zenith",
  user: "postgres",
  password: "1234",
});

async function createAssignmentsTables() {
  try {
    // Check if assignments table exists
    const checkAssignments = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'assignments'
      );
    `);

    if (!checkAssignments.rows[0].exists) {
      console.log("Creating assignments table...");
      await pool.query(`
        CREATE TABLE assignments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
          created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          due_date TIMESTAMP WITH TIME ZONE NOT NULL,
          max_points INTEGER DEFAULT 100,
          instructions TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      await pool.query(`
        CREATE INDEX idx_assignments_club_id ON assignments(club_id);
        CREATE INDEX idx_assignments_due_date ON assignments(due_date);
        CREATE INDEX idx_assignments_created_by ON assignments(created_by);
      `);

      console.log("Assignments table created successfully!");
    } else {
      console.log("Assignments table already exists");
    }

    // Check if assignment_submissions table exists
    const checkSubmissions = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'assignment_submissions'
      );
    `);

    if (!checkSubmissions.rows[0].exists) {
      console.log("Creating assignment_submissions table...");
      await pool.query(`
        CREATE TABLE assignment_submissions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          attachments TEXT[],
          submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          grade VARCHAR(10),
          feedback TEXT,
          graded_by UUID REFERENCES users(id),
          graded_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(assignment_id, user_id)
        );
      `);

      await pool.query(`
        CREATE INDEX idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);
        CREATE INDEX idx_assignment_submissions_user_id ON assignment_submissions(user_id);
        CREATE INDEX idx_assignment_submissions_submitted_at ON assignment_submissions(submitted_at);
      `);

      console.log("Assignment submissions table created successfully!");
    } else {
      console.log("Assignment submissions table already exists");
    }

    // Insert some sample assignments for testing
    const clubCheck = await pool.query("SELECT id FROM clubs LIMIT 1");
    const userCheck = await pool.query("SELECT id FROM users LIMIT 1");

    if (clubCheck.rows.length > 0 && userCheck.rows.length > 0) {
      const clubId = clubCheck.rows[0].id;
      const userId = userCheck.rows[0].id;

      console.log("Inserting sample assignments...");

      await pool.query(
        `
        INSERT INTO assignments (title, description, club_id, created_by, due_date, max_points, instructions) VALUES
        ('React Component Challenge', 'Create a reusable React component library with comprehensive documentation.', $1, $2, NOW() + INTERVAL '7 days', 100, 'Build a component library with at least 5 reusable components including proper TypeScript definitions and Storybook documentation.'),
        ('Database Design Project', 'Design and implement a database schema for a college management system.', $1, $2, NOW() + INTERVAL '14 days', 150, 'Create an ER diagram and implement the database with proper normalization, indexes, and sample data.'),
        ('API Development Task', 'Build a RESTful API with authentication and CRUD operations.', $1, $2, NOW() + INTERVAL '10 days', 120, 'Implement user authentication, error handling, and comprehensive API documentation using Swagger.')
        ON CONFLICT DO NOTHING;
      `,
        [clubId, userId]
      );

      console.log("Sample assignments inserted!");
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

createAssignmentsTables();
