"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Calendar,
  FileText,
  BarChart2,
  ClipboardList,
  Settings,
  ChevronDown,
  Search,
  Bell,
  Mail,
  Menu,
  X,
  Home,
  Book,
  Award,
  UserPlus,
  CheckSquare,
  Activity,
  PieChart,
  TrendingUp,
  Grid,
  Layers,
  Shield,
  Zap,
  List,
  Eye,
  Loader2,
  MapPin,
  Building2
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import db from "@/lib/database";

// Types
interface AdminStatCard {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ElementType;
  color: string;
}

interface ClubData {
  id: string;
  name: string;
  memberCount: number;
  eventCount: number;
  assignmentCount: number;
  engagement: number;
}

interface RecentActivity {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  details?: string;
}

interface AssignmentData {
  id: string;
  title: string;
  club: string;
  dueDate: string;
  submitted: number;
  total: number;
  averageScore: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  club: string;
}

interface Club {
  id: string;
  name: string;
  memberCount: number;
  type: string;
  coordinator: string;
  engagement?: number;
  eventCount?: number;
  assignmentCount?: number;
}

export default function AdminDashboard() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<{
    stats: AdminStatCard[];
    clubs: ClubData[];
    activities: RecentActivity[];
    assignments: AssignmentData[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [userAccessLevel, setUserAccessLevel] = useState("");
  
  // Handle role-based redirection
  useEffect(() => {
    if (!isLoading && user) {
      // Check if user is a club coordinator (not Zenith committee)
      const isClubCoordinator = user.role === 'coordinator' || user.role === 'co_coordinator';
      
      // Check if user is Zenith committee member
      const isZenithCommittee = [
        'president', 'vice_president', 'innovation_head', 
        'secretary', 'treasurer', 'outreach_coordinator', 'media_coordinator'
      ].includes(user.role);

      // Redirect club coordinators to club management page
      if (isClubCoordinator && !isZenithCommittee) {
        router.push('/admin/club-management');
        return;
      }
    }
  }, [user, isLoading, router]);
  
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Determine user access level for permissions
        if (user) {
          if (user.role === "admin") {
            setUserAccessLevel("platform_admin");
          } else if (user.role === "coordinator") {
            setUserAccessLevel("coordinator");
          } else if (user.role === "co_coordinator") {
            setUserAccessLevel("co_coordinator");
          } else {
            setUserAccessLevel("committee_member");
          }

          // Fetch real data from database
          await fetchRealData();
        }
      } catch (error) {
        console.error("Error loading admin data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdminData();
  }, [user]);

  // Fetch real data from database using Prisma
  const fetchRealData = async () => {
    try {
      // Fetch total users count
      const totalUsersQuery = await fetch('/api/admin/stats/users');
      const totalUsersData = await totalUsersQuery.json();
      
      // Fetch active assignments
      const assignmentsQuery = await fetch('/api/admin/stats/assignments');
      const assignmentsData = await assignmentsQuery.json();
      
      // Fetch upcoming events
      const eventsQuery = await fetch('/api/admin/stats/events');
      const eventsData = await eventsQuery.json();
      
      // Fetch engagement data
      const engagementQuery = await fetch('/api/admin/stats/engagement');
      const engagementData = await engagementQuery.json();

      // Fetch clubs with statistics
      const clubsQuery = await fetch('/api/admin/stats/clubs');
      const clubsData = await clubsQuery.json();
      
      // Fetch recent activities
      const activitiesQuery = await fetch('/api/admin/stats/activities');
      const activitiesData = await activitiesQuery.json();
      
      // Fetch assignments data
      const assignmentDetailsQuery = await fetch('/api/admin/stats/assignmentDetails');
      const assignmentDetailsData = await assignmentDetailsQuery.json();
      
      // Create stats cards from real data
      const stats: AdminStatCard[] = [
        {
          title: "Total Users",
          value: totalUsersData.count || 0,
          change: totalUsersData.change || "+0%",
          trend: totalUsersData.trend || "neutral",
          icon: Users,
          color: "stat-members"
        },
        {
          title: "Active Assignments",
          value: assignmentsData.count || 0,
          change: assignmentsData.change || "+0%",
          trend: assignmentsData.trend || "neutral",
          icon: FileText,
          color: "stat-posts"
        },
        {
          title: "Upcoming Events",
          value: eventsData.count || 0,
          change: eventsData.change || "+0%",
          trend: eventsData.trend || "neutral",
          icon: Calendar,
          color: "stat-events"
        },
        {
          title: "Average Engagement",
          value: engagementData.percentage || "0%",
          change: engagementData.change || "+0%",
          trend: engagementData.trend || "neutral",
          icon: Activity,
          color: "stat-clubs"
        }
      ];
      
      setDashboardData({
        stats,
        clubs: clubsData.clubs || [],
        activities: activitiesData.activities || [],
        assignments: assignmentDetailsData.assignments || []
      });
    } catch (error) {
      console.error("Error fetching real data:", error);
      // Fallback to empty data structures
      setDashboardData({
        stats: [],
        clubs: [],
        activities: [],
        assignments: []
      });
    }
  };
  
  // Sidebar has been removed
  const renderTabNav = () => (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2 md:gap-4 border-b border-zenith-border pb-2">
        <TabButton 
          icon={Grid} 
          title="Dashboard" 
          active={activeTab === "dashboard"}
          onClick={() => setActiveTab("dashboard")}
        />
        <TabButton 
          icon={Users} 
          title="Members" 
          active={activeTab === "members"}
          onClick={() => setActiveTab("members")}
        />
        <TabButton 
          icon={Award} 
          title="Clubs" 
          active={false}
          onClick={() => router.push("/admin/club-management")}
        />
        <TabButton 
          icon={Building2} 
          title="Club Management" 
          active={false}
          onClick={() => router.push("/admin/club-management")}
        />
        <TabButton 
          icon={Book} 
          title="Assignments" 
          active={activeTab === "assignments"}
          onClick={() => setActiveTab("assignments")}
        />
        <TabButton 
          icon={Calendar} 
          title="Events" 
          active={activeTab === "events"}
          onClick={() => setActiveTab("events")}
        />
        <TabButton 
          icon={BarChart2} 
          title="Analytics" 
          active={activeTab === "analytics"}
          onClick={() => setActiveTab("analytics")}
        />
        <TabButton 
          icon={CheckSquare} 
          title="Reports" 
          active={activeTab === "reports"}
          onClick={() => setActiveTab("reports")}
        />
        
        {(userAccessLevel === "platform_admin" || userAccessLevel === "coordinator") && (
          <>
            <TabButton 
              icon={Settings} 
              title="Settings" 
              active={activeTab === "settings"}
              onClick={() => setActiveTab("settings")}
            />
            <TabButton 
              icon={Shield} 
              title="Access Control" 
              active={activeTab === "access"}
              onClick={() => setActiveTab("access")}
            />
          </>
        )}
        
        <TabButton 
          icon={Home} 
          title="Back to Main" 
          active={false}
          onClick={() => router.push("/dashboard")}
        />
      </div>
    </div>
  );
  
  if (loading) {
    return (
      <div className="min-h-screen bg-zenith-main flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin text-zenith-accent" />
          <span className="text-zenith-primary font-medium">Loading dashboard data...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-zenith-main">
      {/* Header with user info */}
      <header className="bg-zenith-card border-b border-zenith-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-zenith-accent" />
              <h1 className="ml-3 text-xl font-bold text-zenith-primary">
                Zenith Admin
              </h1>
              <span className="ml-4 text-sm text-zenith-muted px-3 py-1 bg-zenith-hover rounded-full">
                {userAccessLevel === "platform_admin" ? "Platform Administrator" : 
                userAccessLevel === "coordinator" ? "Club Coordinator" :
                userAccessLevel === "co_coordinator" ? "Club Co-Coordinator" :
                "Committee Member"}
              </span>
            </div>
            
            <div className="flex items-center">
              {user && (
                <div className="flex items-center">
                  <span className="text-sm text-zenith-primary mr-2">{user.name}</span>
                  <div className="h-8 w-8 rounded-full bg-zenith-accent/20 flex items-center justify-center text-zenith-accent">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                </div>
              )}
              <Link href="/dashboard" className="ml-4 text-zenith-muted hover:text-zenith-primary">
                <Home className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab navigation */}
        {renderTabNav()}
        
        {/* Content */}
        <main>
          {activeTab === "dashboard" && dashboardData && (
            <DashboardContent data={dashboardData} />
          )}
          {activeTab === "members" && (
            <MembersContent />
          )}
          {activeTab === "clubs" && (
            <ClubManagementContent />
          )}
          {activeTab === "assignments" && (
            <AssignmentsContent />
          )}
          {activeTab === "events" && (
            <EventsContent />
          )}
          {activeTab === "analytics" && (
            <AnalyticsContent />
          )}
          {activeTab === "reports" && (
            <ReportsContent />
          )}
          {activeTab === "settings" && (
            <SettingsContent />
          )}
          {activeTab === "access" && (
            <AccessControlContent />
          )}
          {activeTab === "users" && (
            <UserManagementContent />
          )}
        </main>
      </div>
    </div>
  );
}

// Sidebar link component
function SidebarLink({ 
  icon: Icon, 
  title, 
  active, 
  onClick 
}: { 
  icon: React.ElementType;
  title: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
        active 
          ? "bg-zenith-accent text-white font-medium" 
          : "text-zenith-primary hover:bg-zenith-hover"
      }`}
    >
      <Icon size={18} className={active ? "text-white" : "text-zenith-muted"} />
      <span className="ml-3">{title}</span>
    </button>
  );
}

// TabButton Component for horizontal navigation
function TabButton({ 
  icon: Icon, 
  title, 
  active, 
  onClick 
}: { 
  icon: React.ElementType;
  title: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
        active 
          ? "bg-zenith-accent text-white font-medium" 
          : "text-zenith-primary hover:bg-zenith-hover"
      }`}
    >
      <Icon size={18} className={active ? "text-white" : "text-zenith-muted"} />
      <span className="ml-2">{title}</span>
    </button>
  );
}

// Dashboard content
function DashboardContent({ data }: { data: any }) {
  const { stats, clubs, activities, assignments } = data;
  
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zenith-primary">Admin Dashboard</h1>
          <p className="text-zenith-muted">Overview and summary of system activity</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
          <button className="px-4 py-2 bg-zenith-section text-zenith-primary rounded-lg hover:bg-zenith-hover flex items-center justify-center">
            <FileText size={18} className="mr-2" />
            Export Report
          </button>
          <button className="px-4 py-2 bg-zenith-accent text-white rounded-lg hover:bg-zenith-primary/90 flex items-center justify-center">
            <Zap size={18} className="mr-2" />
            Quick Actions
          </button>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat: AdminStatCard, index: number) => (
          <StatCard key={index} stat={stat} />
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Club Activity */}
        <div className="lg:col-span-2">
          <div className="bg-zenith-card rounded-xl shadow-sm p-6 h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-zenith-primary">Club Activity</h2>
              <button className="text-sm text-zenith-accent hover:text-zenith-primary">View All</button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zenith-border">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zenith-muted uppercase tracking-wider">Club</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zenith-muted uppercase tracking-wider">Members</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zenith-muted uppercase tracking-wider">Events</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zenith-muted uppercase tracking-wider">Assignments</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zenith-muted uppercase tracking-wider">Engagement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zenith-border">
                  {clubs.map((club: ClubData) => (
                    <tr key={club.id} className="hover:bg-zenith-hover/30">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-zenith-primary">{club.name}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-zenith-secondary">{club.memberCount}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-zenith-secondary">{club.eventCount}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-zenith-secondary">{club.assignmentCount}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center">
                          <div className="w-full bg-zenith-section rounded-full h-2 mr-2">
                            <div 
                              className="bg-zenith-accent h-2 rounded-full" 
                              style={{ width: `${club.engagement}%` }}
                            ></div>
                          </div>
                          <span className="text-zenith-secondary">{club.engagement}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div>
          <div className="bg-zenith-card rounded-xl shadow-sm p-6 h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-zenith-primary">Recent Activity</h2>
              <button className="text-sm text-zenith-accent hover:text-zenith-primary">View All</button>
            </div>
            
            <div className="space-y-4">
              {activities.map((activity: RecentActivity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-zenith-hover/30">
                  <div className="w-10 h-10 rounded-full bg-zenith-section flex items-center justify-center text-zenith-primary flex-shrink-0">
                    {activity.user.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm text-zenith-primary">
                      <span className="font-medium">{activity.user}</span> {activity.action} <span className="font-medium">{activity.target}</span>
                    </p>
                    {activity.details && (
                      <p className="text-xs text-zenith-muted mt-1">{activity.details}</p>
                    )}
                    <p className="text-xs text-zenith-muted mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Assignments */}
      <div className="mt-8">
        <div className="bg-zenith-card rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-zenith-primary">Recent Assignments</h2>
            <button className="text-sm text-zenith-accent hover:text-zenith-primary">View All</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zenith-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zenith-muted uppercase tracking-wider">Assignment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zenith-muted uppercase tracking-wider">Club</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zenith-muted uppercase tracking-wider">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zenith-muted uppercase tracking-wider">Submissions</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zenith-muted uppercase tracking-wider">Avg. Score</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zenith-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zenith-border">
                {assignments.map((assignment: AssignmentData) => (
                  <tr key={assignment.id} className="hover:bg-zenith-hover/30">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-zenith-primary">{assignment.title}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-zenith-secondary">{assignment.club}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-zenith-secondary">{assignment.dueDate}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-zenith-secondary">
                      {assignment.submitted}/{assignment.total}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        assignment.averageScore >= 80 ? "bg-green-100 text-green-800" :
                        assignment.averageScore >= 70 ? "bg-blue-100 text-blue-800" :
                        assignment.averageScore >= 60 ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {assignment.averageScore.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button className="p-1 rounded text-zenith-primary hover:bg-zenith-hover">
                          <Eye size={16} />
                        </button>
                        <button className="p-1 rounded text-zenith-primary hover:bg-zenith-hover">
                          <FileText size={16} />
                        </button>
                        <button className="p-1 rounded text-zenith-primary hover:bg-zenith-hover">
                          <BarChart2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

// Stat card component
function StatCard({ stat }: { stat: AdminStatCard }) {
  const { title, value, change, trend, icon: Icon, color } = stat;
  
  return (
    <div className="bg-zenith-card rounded-xl shadow-sm p-6">
      <div className="flex items-center">
        <div className={`w-12 h-12 rounded-lg bg-zenith-section/50 flex items-center justify-center ${color}`}>
          <Icon size={24} />
        </div>
        <div className="ml-4">
          <h2 className="text-xl font-bold text-zenith-primary">{value}</h2>
          <p className="text-sm text-zenith-muted">{title}</p>
        </div>
      </div>
      {change && (
        <div className="mt-4 flex items-center text-sm">
          {trend === "up" && (
            <TrendingUp size={16} className="text-green-500 mr-1" />
          )}
          {trend === "down" && (
            <TrendingUp size={16} className="text-red-500 mr-1 transform rotate-180" />
          )}
          <span className={
            trend === "up" ? "text-green-500" :
            trend === "down" ? "text-red-500" :
            "text-zenith-secondary"
          }>
            {change} from last month
          </span>
        </div>
      )}
    </div>
  );
}

// Integrated components for tabs
function MembersContent() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterRole, setFilterRole] = React.useState("all");
  const router = useRouter();
  
  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users');
        const data = await response.json();
        
        if (data.users && Array.isArray(data.users)) {
          setUsers(data.users);
        } else {
          console.error('Invalid data format received from API:', data);
          // Fallback data
          setUsers([
            { id: 1, name: 'John Doe', email: 'john@example.com', role: 'student', status: 'active', club: 'Aster Club' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'coordinator', status: 'active', club: 'Achievers Club' },
            { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'student', status: 'inactive', club: 'Altogether Club' },
            { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'co_coordinator', status: 'active', club: 'Aster Club' },
            { id: 5, name: 'Charlie Davis', email: 'charlie@example.com', role: 'student', status: 'active', club: 'Achievers Club' },
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
        // Fallback data
        setUsers([
          { id: 1, name: 'John Doe', email: 'john@example.com', role: 'student', status: 'active', club: 'Aster Club' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'coordinator', status: 'active', club: 'Achievers Club' },
          { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'student', status: 'inactive', club: 'Altogether Club' },
          { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'co_coordinator', status: 'active', club: 'Aster Club' },
          { id: 5, name: 'Charlie Davis', email: 'charlie@example.com', role: 'student', status: 'active', club: 'Achievers Club' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  const filteredUsers = users.filter(user => {
    // Search filter
    const matchesSearch = 
      searchTerm === "" || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.club.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Role filter
    const matchesRole = 
      filterRole === "all" || 
      user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });
  
  const handleViewProfile = (userId: number | string) => {
    router.push(`/profile?id=${userId}`);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zenith-primary">Members Management</h1>
          <p className="text-zenith-muted">Manage users across all clubs and departments</p>
        </div>
      </div>
      
      <div className="bg-zenith-card rounded-xl shadow-sm overflow-hidden p-6">
        {/* Search and Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="w-full md:w-1/2">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zenith-muted" />
              <input 
                type="text" 
                placeholder="Search by name, email, or club..." 
                className="pl-10 pr-4 py-2 w-full rounded-md border border-zenith-border bg-zenith-section text-sm focus:outline-none focus:ring-2 focus:ring-zenith-accent/30"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="w-full md:w-1/4">
            <select 
              className="w-full px-3 py-2 rounded-md border border-zenith-border bg-zenith-section text-sm focus:outline-none focus:ring-2 focus:ring-zenith-accent/30"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="coordinator">Coordinators</option>
              <option value="co_coordinator">Co-Coordinators</option>
              <option value="committee_member">Committee Members</option>
              <option value="admin">Administrators</option>
            </select>
          </div>
        </div>
        
        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zenith-border">
            <thead className="bg-zenith-section">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zenith-muted uppercase tracking-wider">
                  Name / Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zenith-muted uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zenith-muted uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zenith-muted uppercase tracking-wider">
                  Club
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-zenith-muted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-zenith-card divide-y divide-zenith-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="inline-flex animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-zenith-accent"></div>
                    <p className="mt-2 text-zenith-muted">Loading user data...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zenith-muted">
                    No users matching your search criteria
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-zenith-hover/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-zenith-accent/20 flex items-center justify-center text-zenith-primary font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-zenith-primary">{user.name}</div>
                          <div className="text-sm text-zenith-muted">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200' :
                        user.role === 'coordinator' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' :
                        user.role === 'co_coordinator' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                        user.role === 'committee_member' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}>
                        {user.role === 'co_coordinator' ? 'Co-Coordinator' : 
                         user.role === 'committee_member' ? 'Committee Member' :
                         user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 
                        user.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                      }`}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zenith-secondary">
                      {user.club}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        <button 
                          onClick={() => handleViewProfile(user.id)}
                          className="text-zenith-primary hover:text-zenith-accent"
                          title="View Profile"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          className="text-zenith-primary hover:text-zenith-accent"
                          title="Edit User"
                        >
                          <Settings size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && filteredUsers.length > 0 && (
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-zenith-muted">
              Showing <span className="font-medium text-zenith-primary">1</span> to <span className="font-medium text-zenith-primary">{Math.min(filteredUsers.length, 10)}</span> of <span className="font-medium text-zenith-primary">{filteredUsers.length}</span> users
            </div>
            <div className="flex space-x-1">
              <button className="px-3 py-1 rounded bg-zenith-section text-zenith-muted">Previous</button>
              <button className="px-3 py-1 rounded bg-zenith-accent text-white">1</button>
              <button className="px-3 py-1 rounded bg-zenith-section text-zenith-muted">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AssignmentsContent() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [assignments, setAssignments] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await fetch('/api/admin/stats/assignments');
        const data = await response.json();
        
        if (data && Array.isArray(data.assignments)) {
          setAssignments(data.assignments);
        } else {
          console.error('Invalid data format received from API');
          // Fallback data
          setAssignments([
            { id: 'a1', title: 'Technical Report on Cloud Computing', club: 'Achievers Club', dueDate: '2025-08-30', submitted: 42, total: 50, averageScore: 87 },
            { id: 'a2', title: 'Cultural Event Proposal', club: 'Aster Club', dueDate: '2025-08-25', submitted: 28, total: 35, averageScore: 92 },
            { id: 'a3', title: 'Sports Day Planning Document', club: 'Altogether Club', dueDate: '2025-09-10', submitted: 15, total: 25, averageScore: 78 },
            { id: 'a4', title: 'Book Review Assignment', club: 'Bookworms Club', dueDate: '2025-08-20', submitted: 30, total: 40, averageScore: 84 },
            { id: 'a5', title: 'Dance Performance Preparation', club: 'Dance Club', dueDate: '2025-09-05', submitted: 12, total: 20, averageScore: 89 },
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch assignments:', error);
        // Fallback data
        setAssignments([
          { id: 'a1', title: 'Technical Report on Cloud Computing', club: 'Achievers Club', dueDate: '2025-08-30', submitted: 42, total: 50, averageScore: 87 },
          { id: 'a2', title: 'Cultural Event Proposal', club: 'Aster Club', dueDate: '2025-08-25', submitted: 28, total: 35, averageScore: 92 },
          { id: 'a3', title: 'Sports Day Planning Document', club: 'Altogether Club', dueDate: '2025-09-10', submitted: 15, total: 25, averageScore: 78 },
          { id: 'a4', title: 'Book Review Assignment', club: 'Bookworms Club', dueDate: '2025-08-20', submitted: 30, total: 40, averageScore: 84 },
          { id: 'a5', title: 'Dance Performance Preparation', club: 'Dance Club', dueDate: '2025-09-05', submitted: 12, total: 20, averageScore: 89 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zenith-primary">Assignments Management</h1>
          <p className="text-zenith-muted">Track and manage all assignments across clubs</p>
        </div>
      </div>
      
      <div className="bg-zenith-card rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-zenith-accent"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zenith-border">
                <thead className="bg-zenith-section">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zenith-muted uppercase tracking-wider">
                      Title
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zenith-muted uppercase tracking-wider">
                      Club
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zenith-muted uppercase tracking-wider">
                      Due Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zenith-muted uppercase tracking-wider">
                      Submissions
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zenith-muted uppercase tracking-wider">
                      Average Score
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-zenith-card divide-y divide-zenith-border">
                  {assignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-zenith-hover/30 cursor-pointer" onClick={() => router.push(`/assignments/${assignment.id}`)}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-zenith-primary">{assignment.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-zenith-secondary">{assignment.club}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-zenith-secondary">
                          {new Date(assignment.dueDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-zenith-secondary">{assignment.submitted}/{assignment.total}</div>
                        <div className="w-full bg-zenith-section rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-zenith-accent h-1.5 rounded-full" 
                            style={{ width: `${(assignment.submitted / assignment.total) * 100}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-zenith-secondary">{assignment.averageScore}%</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EventsContent() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [events, setEvents] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/admin/stats/events');
        const data = await response.json();
        
        if (data && Array.isArray(data.events)) {
          setEvents(data.events);
        } else {
          console.error('Invalid data format received from API');
          // Fallback data
          setEvents([
            { id: 'e1', title: 'Tech Symposium 2025', club: 'Achievers Club', date: '2025-09-15', location: 'Main Auditorium', attendees: 120, status: 'upcoming' },
            { id: 'e2', title: 'Annual Cultural Festival', club: 'Aster Club', date: '2025-10-05', location: 'College Grounds', attendees: 350, status: 'upcoming' },
            { id: 'e3', title: 'Sports Meet 2025', club: 'Altogether Club', date: '2025-08-25', location: 'Sports Complex', attendees: 200, status: 'upcoming' },
            { id: 'e4', title: 'Book Fair', club: 'Bookworms Club', date: '2025-09-02', location: 'Library Hall', attendees: 85, status: 'upcoming' },
            { id: 'e5', title: 'Dance Competition', club: 'Dance Club', date: '2025-09-20', location: 'Cultural Center', attendees: 150, status: 'upcoming' },
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
        // Fallback data
        setEvents([
          { id: 'e1', title: 'Tech Symposium 2025', club: 'Achievers Club', date: '2025-09-15', location: 'Main Auditorium', attendees: 120, status: 'upcoming' },
          { id: 'e2', title: 'Annual Cultural Festival', club: 'Aster Club', date: '2025-10-05', location: 'College Grounds', attendees: 350, status: 'upcoming' },
          { id: 'e3', title: 'Sports Meet 2025', club: 'Altogether Club', date: '2025-08-25', location: 'Sports Complex', attendees: 200, status: 'upcoming' },
          { id: 'e4', title: 'Book Fair', club: 'Bookworms Club', date: '2025-09-02', location: 'Library Hall', attendees: 85, status: 'upcoming' },
          { id: 'e5', title: 'Dance Competition', club: 'Dance Club', date: '2025-09-20', location: 'Cultural Center', attendees: 150, status: 'upcoming' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zenith-primary">Events Management</h1>
          <p className="text-zenith-muted">Track and manage all events across clubs</p>
        </div>
      </div>
      
      <div className="bg-zenith-card rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-zenith-accent"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div 
                  key={event.id} 
                  className="bg-zenith-section rounded-xl overflow-hidden shadow-sm hover:shadow transition-shadow cursor-pointer"
                  onClick={() => router.push(`/events/${event.id}`)}
                >
                  <div className="p-6">
                    <h3 className="font-semibold text-lg text-zenith-primary mb-2">{event.title}</h3>
                    <p className="text-sm text-zenith-secondary">{event.club}</p>
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center text-sm">
                        <Calendar size={16} className="mr-2 text-zenith-muted" />
                        <span>{new Date(event.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <MapPin size={16} className="mr-2 text-zenith-muted" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Users size={16} className="mr-2 text-zenith-muted" />
                        <span>{event.attendees} registered attendees</span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        event.status === 'upcoming' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' : 
                        event.status === 'ongoing' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 
                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}>
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AnalyticsContent() {
  const [loading, setLoading] = React.useState(true);
  const [analyticsData, setAnalyticsData] = React.useState<any>(null);
  
  React.useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        // In a real application, this would be fetched from an API
        // Simulating API fetch with timeout
        setTimeout(() => {
          setAnalyticsData({
            userEngagement: {
              daily: [65, 72, 78, 69, 80, 82, 75],
              weekly: [420, 389, 410, 452, 476],
              monthly: [1250, 1380, 1420, 1390]
            },
            clubActivity: [
              { name: 'Achievers Club', value: 85 },
              { name: 'Aster Club', value: 72 },
              { name: 'Altogether Club', value: 92 },
              { name: 'Bookworms Club', value: 63 },
              { name: 'Dance Club', value: 78 }
            ],
            topPerforming: {
              clubs: ['Altogether Club', 'Achievers Club', 'Dance Club'],
              users: ['John Smith', 'Maria Garcia', 'David Chen']
            },
            submissionRates: {
              assignments: 76,
              events: 82
            }
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, []);
  
  if (loading) {
    return (
      <div className="bg-zenith-card rounded-xl shadow-sm p-6 flex justify-center items-center min-h-[300px]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-zenith-accent"></div>
          <p className="mt-4 text-zenith-muted">Loading analytics data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zenith-primary">Analytics Dashboard</h1>
          <p className="text-zenith-muted">Platform performance and user engagement metrics</p>
        </div>
      </div>
      
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-zenith-card rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-zenith-muted uppercase">User Engagement</h3>
          <div className="mt-2 flex items-center">
            <div className="text-2xl font-bold text-zenith-primary">{analyticsData.userEngagement.daily[6]}</div>
            <div className="ml-2 flex items-center text-xs">
              <span className="text-green-500 font-medium">+{analyticsData.userEngagement.daily[6] - analyticsData.userEngagement.daily[5]}</span>
              <TrendingUp size={12} className="ml-0.5 text-green-500" />
            </div>
          </div>
          <p className="mt-1 text-xs text-zenith-secondary">Active users today</p>
        </div>
        
        <div className="bg-zenith-card rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-zenith-muted uppercase">Club Activity</h3>
          <div className="mt-2 flex items-center">
            <div className="text-2xl font-bold text-zenith-primary">{Math.round(analyticsData.clubActivity.reduce((acc: number, club: any) => acc + club.value, 0) / analyticsData.clubActivity.length)}%</div>
          </div>
          <p className="mt-1 text-xs text-zenith-secondary">Average engagement rate</p>
        </div>
        
        <div className="bg-zenith-card rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-zenith-muted uppercase">Assignment Submissions</h3>
          <div className="mt-2 flex items-center">
            <div className="text-2xl font-bold text-zenith-primary">{analyticsData.submissionRates.assignments}%</div>
          </div>
          <p className="mt-1 text-xs text-zenith-secondary">Completion rate</p>
        </div>
        
        <div className="bg-zenith-card rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-zenith-muted uppercase">Event Participation</h3>
          <div className="mt-2 flex items-center">
            <div className="text-2xl font-bold text-zenith-primary">{analyticsData.submissionRates.events}%</div>
          </div>
          <p className="mt-1 text-xs text-zenith-secondary">Average attendance rate</p>
        </div>
      </div>
      
      {/* Top Performing Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zenith-card rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-zenith-primary mb-4">Top Performing Clubs</h3>
          <div className="space-y-4">
            {analyticsData.topPerforming.clubs.map((club: string, index: number) => (
              <div key={index} className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-zenith-accent/20 flex items-center justify-center text-zenith-accent font-bold mr-3">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-zenith-primary">{club}</div>
                  <div className="w-full bg-zenith-section rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-zenith-accent h-1.5 rounded-full" 
                      style={{ width: `${analyticsData.clubActivity.find((c: any) => c.name === club)?.value || 70}%` }}
                    ></div>
                  </div>
                </div>
                <div className="ml-2 text-sm font-medium text-zenith-primary">
                  {analyticsData.clubActivity.find((c: any) => c.name === club)?.value || 70}%
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-zenith-card rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-zenith-primary mb-4">User Engagement Trend</h3>
          <div className="flex items-end h-48">
            {analyticsData.userEngagement.daily.map((value: number, index: number) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full max-w-[30px] bg-zenith-accent rounded-t"
                  style={{ 
                    height: `${(value / Math.max(...analyticsData.userEngagement.daily)) * 100}%`,
                    opacity: 0.5 + (index / (analyticsData.userEngagement.daily.length * 2))
                  }}
                ></div>
                <div className="text-xs mt-1 text-zenith-muted">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportsContent() {
  return <div className="bg-zenith-card rounded-xl shadow-sm p-6">
    <h1 className="text-2xl font-bold text-zenith-primary mb-4">Reports</h1>
    <p className="text-zenith-muted">Generate and download comprehensive reports on platform activity and metrics.</p>
  </div>;
}

function SettingsContent() {
  return <div className="bg-zenith-card rounded-xl shadow-sm p-6">
    <h1 className="text-2xl font-bold text-zenith-primary mb-4">System Settings</h1>
    <p className="text-zenith-muted">Configure platform settings, notifications, and integration options.</p>
  </div>;
}

function AccessControlContent() {
  return <div className="bg-zenith-card rounded-xl shadow-sm p-6">
    <h1 className="text-2xl font-bold text-zenith-primary mb-4">Access Control</h1>
    <p className="text-zenith-muted">Manage user roles, permissions, and access levels across the platform.</p>
  </div>;
}

function UserManagementContent() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users');
        const data = await response.json();
        
        if (data.users && Array.isArray(data.users)) {
          setUsers(data.users);
        } else {
          console.error('Invalid data format received from API:', data);
          // Fallback data
          setUsers([
            { id: 1, name: 'John Doe', email: 'john@example.com', role: 'student', status: 'active', club: 'Aster Club' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'coordinator', status: 'active', club: 'Achievers Club' },
            { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'student', status: 'inactive', club: 'Altogether Club' },
            { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'co_coordinator', status: 'active', club: 'Aster Club' },
            { id: 5, name: 'Charlie Davis', email: 'charlie@example.com', role: 'student', status: 'active', club: 'Achievers Club' },
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
        // Fallback data
        setUsers([
          { id: 1, name: 'John Doe', email: 'john@example.com', role: 'student', status: 'active', club: 'Aster Club' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'coordinator', status: 'active', club: 'Achievers Club' },
          { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'student', status: 'inactive', club: 'Altogether Club' },
          { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'co_coordinator', status: 'active', club: 'Aster Club' },
          { id: 5, name: 'Charlie Davis', email: 'charlie@example.com', role: 'student', status: 'active', club: 'Achievers Club' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zenith-primary">User Management</h1>
          <p className="text-zenith-muted">Manage all users across the platform</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <button className="px-4 py-2 bg-zenith-accent text-white rounded-lg hover:bg-zenith-accent/90">
            <UserPlus size={16} className="inline mr-2" />
            Add New User
          </button>
        </div>
      </div>
      
      <div className="bg-zenith-card rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zenith-border flex justify-between items-center">
          <h2 className="font-semibold">All Users</h2>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zenith-muted" />
            <input 
              type="text" 
              placeholder="Search users..." 
              className="pl-10 pr-4 py-2 bg-zenith-section rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zenith-accent/30"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-zenith-accent"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-zenith-section">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zenith-muted uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zenith-muted uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zenith-muted uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zenith-muted uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zenith-muted uppercase tracking-wider">Club</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zenith-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zenith-border">
                {users.map((user: any) => (
                  <tr key={user.id} className="hover:bg-zenith-hover/30">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-zenith-primary">{user.name}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-zenith-secondary">{user.email}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'coordinator' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'co_coordinator' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'co_coordinator' ? 'Co-Coordinator' : 
                         user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-zenith-secondary">{user.club}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button className="p-1 rounded text-zenith-primary hover:bg-zenith-hover">
                          <Eye size={16} />
                        </button>
                        <button className="p-1 rounded text-zenith-primary hover:bg-zenith-hover">
                          <FileText size={16} />
                        </button>
                        <button className="p-1 rounded text-zenith-primary hover:bg-zenith-hover">
                          <Settings size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="p-4 border-t border-zenith-border flex justify-between items-center">
          <div className="text-sm text-zenith-muted">
            Showing <span className="font-medium text-zenith-primary">1</span> to <span className="font-medium text-zenith-primary">5</span> of <span className="font-medium text-zenith-primary">{users.length}</span> users
          </div>
          <div className="flex space-x-1">
            <button className="px-3 py-1 rounded bg-zenith-section text-zenith-muted">Previous</button>
            <button className="px-3 py-1 rounded bg-zenith-accent text-white">1</button>
            <button className="px-3 py-1 rounded bg-zenith-section text-zenith-muted">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClubManagementContent() {
  const [clubs, setClubs] = React.useState<Club[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeClubId, setActiveClubId] = React.useState<string | null>(null);
  const [view, setView] = React.useState<'list' | 'detail'>('list');
  const router = useRouter();
  
  React.useEffect(() => {
    const fetchClubs = async () => {
      try {
        const response = await fetch('/api/admin/stats/clubs');
        const data = await response.json();
        
        if (data.clubs && Array.isArray(data.clubs)) {
          setClubs(data.clubs);
        } else {
          console.error('Invalid data format received from API:', data);
          // Fallback data
          setClubs([
            { id: 'achievers', name: 'Achievers Club', memberCount: 145, type: 'Technical', coordinator: 'Jane Smith' },
            { id: 'aster', name: 'Aster Club', memberCount: 92, type: 'Cultural', coordinator: 'Mike Wilson' },
            { id: 'altogether', name: 'Altogether Club', memberCount: 118, type: 'Sports', coordinator: 'Sarah Adams' },
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch clubs:', error);
        // Fallback data
        setClubs([
          { id: 'achievers', name: 'Achievers Club', memberCount: 145, type: 'Technical', coordinator: 'Jane Smith' },
          { id: 'aster', name: 'Aster Club', memberCount: 92, type: 'Cultural', coordinator: 'Mike Wilson' },
          { id: 'altogether', name: 'Altogether Club', memberCount: 118, type: 'Sports', coordinator: 'Sarah Adams' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClubs();
  }, []);
  
  const handleViewClub = (clubId: string) => {
    // For real integration with club management pages, redirect to them
    router.push(`/club-management?id=${clubId}`);
  };

  const handleEditClub = (clubId: string) => {
    router.push(`/club-management?id=${clubId}&tab=settings`);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zenith-primary">Club Management</h1>
          <p className="text-zenith-muted">Manage all clubs and their activities</p>
        </div>
      </div>
      
      <div className="bg-zenith-card rounded-xl shadow-sm overflow-hidden p-6">
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto">
            <div className="py-2 align-middle inline-block min-w-full">
              <div className="shadow overflow-hidden border-b border-zenith-border sm:rounded-lg">
                <table className="min-w-full divide-y divide-zenith-border">
                  <thead className="bg-zenith-section">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zenith-muted uppercase tracking-wider">
                        Club Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zenith-muted uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zenith-muted uppercase tracking-wider">
                        Members
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zenith-muted uppercase tracking-wider">
                        Coordinator
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zenith-muted uppercase tracking-wider">
                        Activity
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-zenith-muted uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-zenith-card divide-y divide-zenith-border">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="inline-flex animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-zenith-accent"></div>
                          <p className="mt-2 text-zenith-muted">Loading club data...</p>
                        </td>
                      </tr>
                    ) : clubs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-zenith-muted">
                          No clubs found
                        </td>
                      </tr>
                    ) : (
                      clubs.map(club => (
                        <tr key={club.id} className="hover:bg-zenith-hover/30">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="ml-4">
                                <div className="text-sm font-medium text-zenith-primary">{club.name}</div>
                                <div className="text-sm text-zenith-muted">ID: {club.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-zenith-secondary">{club.type}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zenith-secondary">
                            {club.memberCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-zenith-secondary">{club.coordinator}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {club.engagement ? (
                              <div className="flex items-center">
                                <div className="w-full bg-zenith-section rounded-full h-2 mr-2">
                                  <div 
                                    className="bg-zenith-accent h-2 rounded-full" 
                                    style={{ width: `${club.engagement}%` }}
                                  ></div>
                                </div>
                                <span className="text-zenith-secondary text-sm">{club.engagement}%</span>
                              </div>
                            ) : (
                              <span className="text-zenith-muted text-sm">No data</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                            <div className="flex justify-center space-x-2">
                              <button 
                                onClick={() => handleViewClub(club.id)} 
                                className="text-zenith-primary hover:text-zenith-accent py-1 px-3 border border-zenith-border rounded-md hover:bg-zenith-hover/30"
                              >
                                Manage
                              </button>
                              <button 
                                onClick={() => handleEditClub(club.id)}
                                className="text-zenith-primary hover:text-zenith-accent py-1 px-3 border border-zenith-border rounded-md hover:bg-zenith-hover/30"
                              >
                                Settings
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
