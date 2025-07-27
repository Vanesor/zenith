const { Pool } = require("pg");
require("dotenv").config({ path: ".env.local" });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function createEnhancedInteractionTables() {
  const client = await pool.connect();

  try {
    console.log("Creating enhanced interaction tables...");

    // Create post_views table
    await client.query(`
      CREATE TABLE IF NOT EXISTS post_views (
        id SERIAL PRIMARY KEY,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address INET,
        user_agent TEXT
      );
    `);

    // Create indexes for post_views
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON post_views(post_id);
      CREATE INDEX IF NOT EXISTS idx_post_views_user_id ON post_views(user_id);
      CREATE INDEX IF NOT EXISTS idx_post_views_viewed_at ON post_views(viewed_at);
    `);

    // Create post_likes table (if not exists)
    await client.query(`
      CREATE TABLE IF NOT EXISTS post_likes (
        id SERIAL PRIMARY KEY,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user_id)
      );
    `);

    // Create indexes for post_likes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
      CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
    `);

    // Create comment_likes table (if not exists)
    await client.query(`
      CREATE TABLE IF NOT EXISTS comment_likes (
        id SERIAL PRIMARY KEY,
        comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(comment_id, user_id)
      );
    `);

    // Create indexes for comment_likes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
      CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);
    `);

    // Update posts table to add view_count column if it doesn't exist
    await client.query(`
      ALTER TABLE posts 
      ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
    `);

    // Update comments table to add like_count column if it doesn't exist
    await client.query(`
      ALTER TABLE comments 
      ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;
    `);

    // Create function to update view counts
    await client.query(`
      CREATE OR REPLACE FUNCTION update_post_view_count()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE posts 
        SET view_count = (
          SELECT COUNT(*) 
          FROM post_views 
          WHERE post_id = NEW.post_id
        )
        WHERE id = NEW.post_id;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create trigger for post view count updates
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_post_view_count ON post_views;
      CREATE TRIGGER trigger_update_post_view_count
        AFTER INSERT ON post_views
        FOR EACH ROW
        EXECUTE FUNCTION update_post_view_count();
    `);

    // Create function to update comment like counts
    await client.query(`
      CREATE OR REPLACE FUNCTION update_comment_like_count()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE comments 
        SET like_count = (
          SELECT COUNT(*) 
          FROM comment_likes 
          WHERE comment_id = COALESCE(NEW.comment_id, OLD.comment_id)
        )
        WHERE id = COALESCE(NEW.comment_id, OLD.comment_id);
        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create triggers for comment like count updates
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_comment_like_count_insert ON comment_likes;
      CREATE TRIGGER trigger_update_comment_like_count_insert
        AFTER INSERT ON comment_likes
        FOR EACH ROW
        EXECUTE FUNCTION update_comment_like_count();

      DROP TRIGGER IF EXISTS trigger_update_comment_like_count_delete ON comment_likes;
      CREATE TRIGGER trigger_update_comment_like_count_delete
        AFTER DELETE ON comment_likes
        FOR EACH ROW
        EXECUTE FUNCTION update_comment_like_count();
    `);

    console.log("✅ Enhanced interaction tables created successfully!");
    console.log("- post_views table with triggers");
    console.log("- post_likes table with indexes");
    console.log("- comment_likes table with triggers");
    console.log("- View count and like count columns added");
    console.log("- Database triggers for automatic count updates");
  } catch (error) {
    console.error("❌ Error creating enhanced interaction tables:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

createEnhancedInteractionTables();
