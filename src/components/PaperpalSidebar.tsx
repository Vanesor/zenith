"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,  
  Users,
  Calendar,
  BookOpen,
  MessageSquare,
  Settings,
  User,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Shield,
  BarChart3,
  Search,
  Plus,
  Sun,
  Moon,
  Monitor,
  Zap,
  Target,
  Award,
  Code2,
  FolderOpen,
  UserPlus,
  Key
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from 'next-themes';
import JoinProjectModal from '@/components/projects/JoinProjectModal';

interface PaperpalSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onCollapseChange?: (isCollapsed: boolean) => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  description: string;
  requiresRole?: string[];
}

export function PaperpalSidebar({ isOpen, onToggle, onCollapseChange }: PaperpalSidebarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Notify parent when collapse state changes
  useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(isCollapsed);
    }
  }, [isCollapsed, onCollapseChange]);

  const mainNavigation: NavigationItem[] = [
    { 
      name: "Dashboard", 
      href: "/dashboard", 
      icon: Home,
      description: "Overview & insights"
    },
    { 
      name: "Projects", 
      href: "/projects", 
      icon: Target,
      description: "Manage your projects"
    },
    { 
      name: "Clubs", 
      href: "/clubs", 
      icon: Users,
      description: "Explore & join clubs"
    },
    { 
      name: "Events", 
      href: "/events", 
      icon: Calendar,
      description: "Upcoming activities"
    },
    { 
      name: "Assignments", 
      href: "/assignments", 
      icon: BookOpen,
      description: "Tasks & projects"
    },
    { 
      name: "Analytics", 
      href: "/analytics", 
      icon: BarChart3,
      description: "Performance insights",
      requiresRole: ['coordinator', 'co_coordinator', 'president', 'vice_president', 'innovation_head', 'treasurer', 'outreach', 'zenith_committee']
    },
    { 
      name: "Chat", 
      href: "/chat", 
      icon: MessageSquare,
      description: "Connect with peers"
    },
    { 
      name: "Playground", 
      href: "/playground", 
      icon: Code2,
      description: "Code & experiment"
    },
  ];

  const quickActions = [
    { 
      name: "New Post", 
      href: "/posts/create", 
      icon: Plus,
      color: "text-blue-600"
    },
    { 
      name: "Join Club", 
      href: "/clubs", 
      icon: Users,
      color: "text-green-600"
    },
    { 
      name: "Analytics", 
      href: "/analytics", 
      icon: BarChart3,
      color: "text-purple-600"
    },
  ];

  // Enhanced role-based access for admin features
  const userRole = user?.role?.toLowerCase() || '';
  
  // Zenith Committee Members - can see admin panel for all clubs
  const isZenithCommittee = user && [
    'president',
    'vice_president', 
    'innovation_head',
    'secretary',
    'treasurer',
    'outreach_coordinator',
    'media_coordinator',
    'zenith_committee'
  ].includes(userRole);

  // Club Coordinators - can see club management
  const isClubCoordinator = user && [
    'coordinator',
    'co_coordinator',
    'club_coordinator',
    'co-coordinator'
  ].includes(userRole);

  // System Admin - full access
  const isSystemAdmin = userRole === 'admin';

  // Any admin access (either club or system level)
  const hasAdminAccess = isZenithCommittee || isClubCoordinator || isSystemAdmin;

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const sidebarVariants = {
    open: {
      width: isCollapsed ? "80px" : "320px",
      x: 0
    },
    closed: {
      width: isCollapsed ? "80px" : "320px",
      x: isDesktop ? 0 : "-100%" // On desktop, always visible; on mobile, slide out
    }
  };

  const contentVariants = {
    open: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3, delay: 0.1 }
    },
    closed: {
      opacity: 0,
      x: -20,
      transition: { duration: 0.2 }
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        animate={isOpen ? "open" : "closed"}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }} // Smoother cubic-bezier
        className="fixed left-0 top-0 h-full zenith-bg-card zenith-border border-r z-50 lg:z-30 shadow-2xl lg:shadow-lg overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              variants={contentVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="flex flex-col h-full"
            >
              {/* Header */}
              <div className="p-4 border-b zenith-border">
                <div className="flex items-center justify-between">
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center space-x-3"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold zenith-text-primary">Zenith</h2>
                        <p className="text-xs zenith-text-muted">CS Department</p>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Collapse Toggle (Desktop) */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsCollapsed(!isCollapsed)}
                      className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg hover:zenith-bg-hover transition-colors"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 zenith-text-muted" />
                      ) : (
                        <ChevronLeft className="w-4 h-4 zenith-text-muted" />
                      )}
                    </button>
                    
                    {/* Close Button (Mobile) */}
                    <button
                      onClick={onToggle}
                      className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:zenith-bg-hover transition-colors"
                    >
                      <X className="w-4 h-4 zenith-text-muted" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Search */}
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-4"
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 zenith-text-muted" />
                    <input
                      type="text"
                      placeholder="Search anything..."
                      className="w-full pl-10 pr-4 py-2.5 zenith-bg-section zenith-border border rounded-lg text-sm zenith-text-primary placeholder:zenith-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </motion.div>
              )}

              {/* Navigation */}
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                <div className="space-y-6">
                  {/* Main Navigation */}
                  <div>
                    {!isCollapsed && (
                      <motion.h3
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xs font-semibold zenith-text-muted uppercase tracking-wider mb-3"
                      >
                        Navigation
                      </motion.h3>
                    )}
                    <nav className="space-y-1">
                      {mainNavigation
                        .filter(item => {
                          // Check if item requires specific roles
                          if (item.requiresRole && Array.isArray(item.requiresRole)) {
                            return user && item.requiresRole.includes(user.role);
                          }
                          return true; // Show item if no role requirement
                        })
                        .map((item, index) => {
                        const IconComponent = item.icon;
                        const active = isActive(item.href);
                        return (
                          <motion.div
                            key={item.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + index * 0.05 }}
                          >
                            <Link
                              href={item.href}
                              className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                                active
                                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-sm'
                                  : 'zenith-text-secondary hover:zenith-bg-hover hover:zenith-text-primary'
                              }`}
                            >
                              <IconComponent className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : 'mr-3'} ${
                                active ? 'text-blue-600 dark:text-blue-400' : 'zenith-text-muted group-hover:zenith-text-secondary'
                              }`} />
                              {!isCollapsed && (
                                <div className="flex-1">
                                  <div className="font-medium">{item.name}</div>
                                  <div className="text-xs zenith-text-muted group-hover:zenith-text-secondary">
                                    {item.description}
                                  </div>
                                </div>
                              )}
                              {!isCollapsed && active && (
                                <motion.div
                                  layoutId="activeIndicator"
                                  className="w-2 h-2 bg-blue-600 rounded-full"
                                />
                              )}
                            </Link>
                          </motion.div>
                        );
                      })}
                    </nav>
                  </div>

                  {/* Quick Actions */}
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <h3 className="text-xs font-semibold zenith-text-muted uppercase tracking-wider mb-3">
                        Quick Actions
                      </h3>
                      <div className="space-y-2">
                        {quickActions.map((action, index) => {
                          const IconComponent = action.icon;
                          return (
                            <motion.div
                              key={action.name}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.4 + index * 0.05 }}
                            >
                              <Link
                                href={action.href}
                                className="flex items-center px-3 py-2 text-sm font-medium zenith-text-secondary rounded-lg hover:zenith-bg-hover transition-colors group"
                              >
                                <IconComponent className={`w-4 h-4 mr-3 ${action.color}`} />
                                <span className="group-hover:zenith-text-primary">
                                  {action.name}
                                </span>
                              </Link>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Workspace Section */}
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 }}
                    >
                      <h3 className="text-xs font-semibold zenith-text-muted uppercase tracking-wider mb-3">
                        Workspace
                      </h3>
                      <div className="space-y-2">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.45 }}
                        >
                          <Link
                            href="/projects"
                            className="flex items-center px-3 py-2 text-sm font-medium zenith-text-secondary rounded-lg hover:zenith-bg-hover transition-colors group"
                          >
                            <FolderOpen className="w-4 h-4 mr-3 text-blue-600" />
                            <span className="group-hover:zenith-text-primary">
                              My Projects
                            </span>
                          </Link>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 }}
                        >
                          <button
                            onClick={() => setShowJoinModal(true)}
                            className="w-full flex items-center px-3 py-2 text-sm font-medium zenith-text-secondary rounded-lg hover:zenith-bg-hover transition-colors group"
                          >
                            <UserPlus className="w-4 h-4 mr-3 text-green-600" />
                            <span className="group-hover:zenith-text-primary">
                              Join Project
                            </span>
                          </button>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}

                  {/* Admin Section */}
                  {hasAdminAccess && !isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <h3 className="text-xs font-semibold zenith-text-muted uppercase tracking-wider mb-3">
                        Administration
                      </h3>
                      <div className="space-y-1">
                        {(isZenithCommittee || isSystemAdmin) ? (
                          // Zenith committee members and system admins see "Admin Panel" (all clubs)
                          <Link
                            href="/admin"
                            className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                              isActive('/admin')
                                ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                                : 'zenith-text-secondary hover:zenith-bg-hover hover:zenith-text-primary'
                            }`}
                          >
                            <Shield className={`w-5 h-5 mr-3 ${
                              isActive('/admin') ? 'text-purple-600' : 'zenith-text-muted'
                            }`} />
                            <div className="flex-1">
                              <div className="font-medium">Admin Panel</div>
                              <div className="text-xs zenith-text-muted">Manage all clubs</div>
                            </div>
                          </Link>
                        ) : (
                          // Club coordinators see "Club Management" (their specific club)
                          <Link
                            href="/club-management"
                            className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                              isActive('/club-management')
                                ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                                : 'zenith-text-secondary hover:zenith-bg-hover hover:zenith-text-primary'
                            }`}
                          >
                            <Shield className={`w-5 h-5 mr-3 ${
                              isActive('/club-management') ? 'text-purple-600' : 'zenith-text-muted'
                            }`} />
                            <div className="flex-1">
                              <div className="font-medium">Club Management</div>
                              <div className="text-xs zenith-text-muted">Manage your club</div>
                            </div>
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Collapsed Admin Portal Icon */}
                  {hasAdminAccess && isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="mt-4"
                    >
                      {(isZenithCommittee || isSystemAdmin) ? (
                        // Zenith committee members and system admins see "Admin Panel" icon
                        <Link
                          href="/admin"
                          className={`flex items-center justify-center w-12 h-12 mx-auto rounded-lg transition-colors ${
                            isActive('/admin')
                              ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                              : 'zenith-text-secondary hover:zenith-bg-hover hover:zenith-text-primary'
                          }`}
                          title="Admin Panel"
                        >
                          <Shield className={`w-6 h-6 ${
                            isActive('/admin') ? 'text-purple-600' : 'zenith-text-muted'
                          }`} />
                        </Link>
                      ) : (
                        // Club coordinators see "Club Management" icon
                        <Link
                          href="/club-management"
                          className={`flex items-center justify-center w-12 h-12 mx-auto rounded-lg transition-colors ${
                            isActive('/club-management')
                              ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                              : 'zenith-text-secondary hover:zenith-bg-hover hover:zenith-text-primary'
                          }`}
                          title="Club Management"
                        >
                          <Shield className={`w-6 h-6 ${
                            isActive('/club-management') ? 'text-purple-600' : 'zenith-text-muted'
                          }`} />
                        </Link>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Theme Toggle */}
              {!isCollapsed && mounted && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="p-4 border-t zenith-border"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium zenith-text-secondary">Theme</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { name: 'Light', value: 'light', icon: Sun },
                      { name: 'Dark', value: 'dark', icon: Moon },
                      { name: 'System', value: 'system', icon: Monitor }
                    ].map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setTheme(option.value)}
                          className={`flex flex-col items-center p-2 rounded-lg text-xs transition-colors ${
                            theme === option.value
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                              : 'hover:zenith-bg-hover zenith-text-muted'
                          }`}
                        >
                          <IconComponent className="w-4 h-4 mb-1" />
                          <span>{option.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* User Profile */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="p-4 border-t zenith-border"
              >
                {user && (
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user.name?.charAt(0) || user.email?.charAt(0)}
                      </span>
                    </div>
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium zenith-text-primary truncate">
                          {user.name || user.email}
                        </p>
                        <p className="text-xs zenith-text-muted capitalize">
                          {user.role?.replace('_', ' ')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <Link
                    href="/profile"
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive('/profile')
                        ? 'zenith-bg-hover zenith-text-primary'
                        : 'zenith-text-secondary hover:zenith-bg-hover hover:zenith-text-primary'
                    }`}
                  >
                    <User className={`w-4 h-4 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
                    {!isCollapsed && <span>View Profile</span>}
                  </Link>
                  
                  <Link
                    href="/settings"
                    className="flex items-center px-3 py-2 text-sm font-medium zenith-text-secondary rounded-lg hover:zenith-bg-hover hover:zenith-text-primary transition-colors"
                  >
                    <Settings className={`w-4 h-4 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
                    {!isCollapsed && <span>Settings</span>}
                  </Link>
                  
                  <Link
                    href="/notifications"
                    className="flex items-center px-3 py-2 text-sm font-medium zenith-text-secondary rounded-lg hover:zenith-bg-hover hover:zenith-text-primary transition-colors"
                  >
                    <Bell className={`w-4 h-4 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
                    {!isCollapsed && <span>Notifications</span>}
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className={`w-4 h-4 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
                    {!isCollapsed && <span>Sign Out</span>}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>

      {/* Join Project Modal */}
      <JoinProjectModal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} />
    </>
  );
}
