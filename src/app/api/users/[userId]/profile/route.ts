import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import db from '@/lib/database';
import { MediaService } from '@/lib/MediaService';

// Helper function to check if user has elevated access permissions
async function hasElevatedAccess(requestingUserId: string, targetUserId: string, role: string): Promise<boolean> {
  if (!role) return false;
  
  const userRole = role.toLowerCase();
  
  // Super admin access
  if (userRole === 'super_admin') return true;
  
  // System admin access
  if (userRole === 'admin') return true;
  
  // Zenith committee access
  const zenithRoles = [
    'president',
    'vice_president', 
    'innovation_head',
    'secretary',
    'treasurer',
    'outreach_coordinator',
    'media_coordinator',
    'zenith_committee'
  ];
  
  if (zenithRoles.includes(userRole)) return true;
  
  // Club coordinator/co_coordinator access - check if they're in the same club
  if (userRole === 'coordinator' || userRole === 'co_coordinator') {
    try {
      // Get the requesting user's club
      const requestingUserClubQuery = `
        SELECT cm.club_id 
        FROM club_members cm 
        WHERE cm.user_id = $1 AND cm.is_current_term = true
        AND cm.role IN ('coordinator', 'co_coordinator')
      `;
      const requestingUserResult = await db.query(requestingUserClubQuery, [requestingUserId]);
      
      if (requestingUserResult.rows.length === 0) return false;
      
      // Get the target user's club
      const targetUserClubQuery = `
        SELECT cm.club_id 
        FROM club_members cm 
        WHERE cm.user_id = $1 AND cm.is_current_term = true
      `;
      const targetUserResult = await db.query(targetUserClubQuery, [targetUserId]);
      
      if (targetUserResult.rows.length === 0) return false;
      
      // Check if they're in the same club
      return requestingUserResult.rows[0].club_id === targetUserResult.rows[0].club_id;
    } catch (error) {
      console.error('Error checking club membership:', error);
      return false;
    }
  }
  
  return false;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const resolvedParams = await params;
    const userId = resolvedParams.userId;
    
    // Get user profile from database
    const userQuery = `
      SELECT 
        id, 
        name, 
        username, 
        email, 
        role, 
        club_id, 
        bio, 
        profile_image_url, 
        social_links, 
        created_at,
        last_activity,
        github,
        linkedin,
        twitter,
        website,
        location
      FROM users 
      WHERE id = $1
    `;
    
    const userResult = await db.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const user = userResult.rows[0];
    
    // Get avatar URL from MediaService
    const avatarUrl = await MediaService.getUserAvatarUrl(userId);
    
    // Get club info if user belongs to a club
    let club = null;
    if (user.club_id) {
      const clubQuery = `
        SELECT id, name, type, description, logo_url 
        FROM clubs 
        WHERE id = $1
      `;
      const clubResult = await db.query(clubQuery, [user.club_id]);
      
      if (clubResult.rows.length > 0) {
        club = clubResult.rows[0];
      }
    }
    
    // Check if requesting user has access to full profile
    let includePrivateInfo = false;
    const authResult = await verifyAuth(request);
    if (authResult.success && authResult.user) {
      const hasElevated = await hasElevatedAccess(authResult.user.id, userId, authResult.user.role);
      if (authResult.user.id === userId || hasElevated) {
        includePrivateInfo = true;
      }
    }
    
    // Get user statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_submissions,
        COUNT(CASE WHEN status = 'graded' THEN 1 END) as graded_submissions,
        AVG(CASE WHEN status = 'graded' AND total_score IS NOT NULL THEN total_score END) as average_grade
      FROM assignment_submissions 
      WHERE user_id = $1
    `;
    
    const statsResult = await db.query(statsQuery, [userId]);
    const stats = statsResult.rows[0] || {
      total_submissions: 0,
      graded_submissions: 0,
      average_grade: null
    };

    // Build profile response
    const profile = {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      avatarUrl: avatarUrl || user.profile_image_url || '/images/default-avatar.png',
      bio: user.bio,
      club: club,
      socialLinks: user.social_links,
      github: user.github,
      linkedin: user.linkedin,
      twitter: user.twitter,
      website: user.website,
      location: user.location,
      lastActive: user.last_activity,
      joinedAt: user.created_at,
      stats: {
        totalSubmissions: parseInt(stats.total_submissions) || 0,
        gradedSubmissions: parseInt(stats.graded_submissions) || 0,
        averageGrade: stats.average_grade ? parseFloat(stats.average_grade) : null
      }
    };
    
    // Add private info if authorized
    if (includePrivateInfo) {
      Object.assign(profile, {
        email: user.email,
        // Add other private fields as needed
      });
    }
    
    return NextResponse.json({
      profile,
      success: true
    });
    
  } catch (error) {
    console.error('Error getting user profile:', error);
    return NextResponse.json({ 
      error: 'Failed to get user profile',
      success: false 
    }, { status: 500 });
  }
}
