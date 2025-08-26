import { NextRequest, NextResponse } from "next/server";
import { Client } from 'pg';

export async function GET() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'zenith',
    user: 'zenithpostgres',
    password: 'AtharvaAyush',
  });

  try {
    await client.connect();
    
    // Get all founding team members with proper ordering
    const foundingTeamQuery = `
      WITH committee_members_filtered AS (
        SELECT 
          u.id,
          u.name,
          u.email,
          cm.position,
          'committee' as club_id,
          'Committee' as club_name,
          'purple' as club_color,
          u.bio,
          u.profile_image_url
        FROM committee_members cm
        JOIN users u ON cm.user_id = u.id
        WHERE cm.year = '2024-2025'
          AND u.id NOT IN (
            'e75ebfdc-b1e8-440c-a987-c77306ab8348',
            'c088cdf3-11ff-408d-b95a-1f50bb794c27',
            'febf3dd5-655c-4e18-86a9-2abbf245cb16',
            'bf2e2e4c-0b91-4e49-b748-3e244b9e5bc4',
            '4635dcba-7c4b-4c7e-a3d3-6a7f48ebf2f2',
            '49e7bb7b-a9cd-41df-a59e-5bfed3e9b97e'
          )
      ),
      replacement_secretaries AS (
        SELECT 
          u.id,
          u.name,
          u.email,
          'secretary' as position,
          'ascend' as club_id,
          'ASCEND' as club_name,
          'blue' as club_color,
          u.bio,
          u.profile_image_url
        FROM users u
        WHERE u.id = 'a758760c-468e-4185-b84c-374ec2168a4a'
        
        UNION ALL
        
        SELECT 
          u.id,
          u.name,
          u.email,
          'secretary' as position,
          'aster' as club_id,
          'ASTER' as club_name,
          'green' as club_color,
          u.bio,
          u.profile_image_url
        FROM users u
        WHERE u.id = '59c443c7-2e5e-41ec-96bb-0b33ca557948'
      ),
      artovert_members AS (
        SELECT 
          u.id,
          u.name,
          u.email,
          'member' as position,
          c.id as club_id,
          c.name as club_name,
          c.color as club_color,
          u.bio,
          u.profile_image_url
        FROM club_members cm
        JOIN users u ON cm.user_id = u.id
        JOIN clubs c ON cm.club_id = c.id
        WHERE cm.year = '2024-2025'
          AND c.id = 'artovert'
          AND u.id IN (
            'e75ebfdc-b1e8-440c-a987-c77306ab8348',
            'c088cdf3-11ff-408d-b95a-1f50bb794c27',
            'febf3dd5-655c-4e18-86a9-2abbf245cb16'
          )
      )
      SELECT id, name, email, position, club_id, club_name, club_color, bio, profile_image_url
      FROM committee_members_filtered
      UNION ALL
      SELECT id, name, email, position, club_id, club_name, club_color, bio, profile_image_url
      FROM replacement_secretaries
      UNION ALL
      SELECT id, name, email, position, club_id, club_name, club_color, bio, profile_image_url
      FROM artovert_members
      ORDER BY 
        CASE 
          WHEN position = 'president' THEN 1
          WHEN position = 'vice-president' THEN 2
          WHEN position = 'secretary' THEN 3
          WHEN position = 'treasurer' THEN 4
          WHEN position = 'member' THEN 6
          ELSE 5
        END,
        name
    `;

    const result = await client.query(foundingTeamQuery);
    
    await client.end();
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching founding team:', error);
    return NextResponse.json(
      { error: 'Failed to fetch founding team' },
      { status: 500 }
    );
  }
}
