import { NextResponse } from 'next/server';
import PrismaDB from '@/lib/database-consolidated';

export async function GET() {
  try {
    const prisma = PrismaDB.getClient();
    
    // Raw SQL query to fetch users with their primary club
    const rawUsers = await prisma.$queryRaw`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role,
        c.name as club_name
      FROM 
        users u
      LEFT JOIN 
        club_members cm ON u.id = cm.user_id
      LEFT JOIN 
        clubs c ON cm.club_id = c.id
      ORDER BY 
        u.name ASC
    `;
    
    // Format the data to match what the UI expects
    const formattedUsers = Array.isArray(rawUsers) ? rawUsers.map((user: any) => ({
      id: user.id,
      name: user.name || 'Unnamed User',
      email: user.email || 'No Email',
      role: user.role || 'student',
      status: 'active', // Assuming default status is active
      club: user.club_name || 'No Club'
    })) : [];
    
    return NextResponse.json({ 
      users: formattedUsers,
      success: true
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    
    // Fallback data in case of database error
    const fallbackUsers = [
      { id: 1, name: 'John Doe', email: 'john@example.com', role: 'student', status: 'active', club: 'Aster Club' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'coordinator', status: 'active', club: 'Achievers Club' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'student', status: 'inactive', club: 'Altogether Club' },
      { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'co_coordinator', status: 'active', club: 'Aster Club' },
      { id: 5, name: 'Charlie Davis', email: 'charlie@example.com', role: 'student', status: 'active', club: 'Achievers Club' },
      { id: 6, name: 'Emma Wilson', email: 'emma@example.com', role: 'student', status: 'active', club: 'Dance Club' },
      { id: 7, name: 'David Lee', email: 'david@example.com', role: 'student', status: 'pending', club: 'Bookworms Club' }
    ];
    
    return NextResponse.json({ 
      users: fallbackUsers,
      success: false,
      message: "Using fallback data due to database error",
      error: (error as Error).message
    });
  }
}
