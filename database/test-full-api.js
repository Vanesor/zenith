const { Client } = require("pg");

async function testFullAPI() {
  const client = new Client({
    user: "postgres",
    host: "localhost",
    database: "zenith",
    password: "1234",
    port: 5432,
  });

  try {
    await client.connect();
    console.log("🔗 Connected to PostgreSQL");

    console.log("🧪 Testing the exact queries from home stats API...");

    // Test basic stats
    const [clubsCount, usersCount, eventsCount, postsCount] = await Promise.all(
      [
        client.query("SELECT COUNT(*) as count FROM clubs"),
        client.query("SELECT COUNT(*) as count FROM users"),
        client.query(
          "SELECT COUNT(*) as count FROM events WHERE date >= CURRENT_DATE"
        ),
        client.query("SELECT COUNT(*) as count FROM posts"),
      ]
    );

    console.log("✅ Basic stats:");
    console.log(`  - Clubs: ${clubsCount.rows[0].count}`);
    console.log(`  - Users: ${usersCount.rows[0].count}`);
    console.log(`  - Upcoming Events: ${eventsCount.rows[0].count}`);
    console.log(`  - Posts: ${postsCount.rows[0].count}`);

    // Test club stats query
    const clubStatsResult = await client.query(`
      SELECT 
        c.id,
        c.name,
        c.type,
        c.description,
        c.color,
        c.icon,
        COUNT(u.id) as member_count,
        COUNT(CASE WHEN e.date >= CURRENT_DATE THEN 1 END) as upcoming_events
      FROM clubs c
      LEFT JOIN users u ON c.id = u.club_id
      LEFT JOIN events e ON c.id = e.club_id
      GROUP BY c.id, c.name, c.type, c.description, c.color, c.icon
      ORDER BY member_count DESC
    `);

    console.log("✅ Club stats:");
    clubStatsResult.rows.forEach((club) => {
      console.log(
        `  - ${club.name}: ${club.member_count} members, ${club.upcoming_events} upcoming events`
      );
    });

    // Test upcoming events query (fixed)
    const upcomingEventsResult = await client.query(`
      SELECT 
        e.id,
        e.title,
        e.description,
        e.date,
        e.time,
        e.location,
        c.name as club_name,
        c.color as club_color,
        u.name as organizer_name
      FROM events e
      JOIN clubs c ON e.club_id = c.id
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.date >= CURRENT_DATE
      ORDER BY e.date ASC, e.time ASC
      LIMIT 6
    `);

    console.log(
      `✅ Upcoming events: ${upcomingEventsResult.rows.length} found`
    );

    // Test recent posts query (without views)
    const recentPostsResult = await client.query(`
      SELECT 
        p.id,
        p.title,
        p.content,
        p.created_at,
        p.tags,
        c.name as club_name,
        c.color as club_color,
        u.name as author_name,
        u.avatar as author_avatar
      FROM posts p
      LEFT JOIN clubs c ON p.club_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 4
    `);

    console.log(`✅ Recent posts: ${recentPostsResult.rows.length} found`);
    recentPostsResult.rows.forEach((post) => {
      console.log(
        `  - "${post.title}" by ${post.author_name} in ${post.club_name}`
      );
    });

    console.log(
      "\n🎉 All API queries are working! The home page should load successfully."
    );
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await client.end();
  }
}

testFullAPI();
