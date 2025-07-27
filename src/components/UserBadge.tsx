"use client";

import { useState, useEffect, useCallback } from "react";

interface Badge {
  id: string;
  badge_type: string;
  badge_name: string;
  description: string;
  icon: string;
  color: string;
  earned_at: string;
}

interface UserBadgeProps {
  userId: string;
  role?: string;
  className?: string;
  showTooltip?: boolean;
}

const getRoleColor = (role: string): string => {
  const roleColors: { [key: string]: string } = {
    coordinator: "bg-yellow-500 text-yellow-900",
    co_coordinator: "bg-blue-500 text-blue-900",
    secretary: "bg-green-500 text-green-900",
    media: "bg-purple-500 text-purple-900",
    president: "bg-red-500 text-red-900",
    vice_president: "bg-orange-500 text-orange-900",
    innovation_head: "bg-pink-500 text-pink-900",
    treasurer: "bg-indigo-500 text-indigo-900",
    outreach: "bg-teal-500 text-teal-900",
    student: "bg-gray-500 text-gray-900",
  };
  return roleColors[role] || roleColors.student;
};

const getRoleDisplay = (role: string): string => {
  const roleDisplays: { [key: string]: string } = {
    coordinator: "Coordinator",
    co_coordinator: "Co-Coordinator",
    secretary: "Secretary",
    media: "Media Head",
    president: "President",
    vice_president: "Vice President",
    innovation_head: "Innovation Head",
    treasurer: "Treasurer",
    outreach: "Outreach",
    student: "Student",
  };
  return roleDisplays[role] || "Student";
};

export default function UserBadge({
  userId,
  role,
  className = "",
  showTooltip = true,
}: UserBadgeProps) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserBadges = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/badges?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setBadges(data.badges);
      }
    } catch (error) {
      console.error("Error fetching user badges:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserBadges();
  }, [fetchUserBadges]);

  if (loading) {
    return (
      <div
        className={`animate-pulse bg-gray-300 h-6 w-20 rounded-full ${className}`}
      />
    );
  }

  const roleColor = role ? getRoleColor(role) : "bg-gray-500 text-gray-900";
  const roleDisplay = role ? getRoleDisplay(role) : "Student";

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Role Badge */}
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${roleColor}`}
        title={showTooltip ? `Role: ${roleDisplay}` : undefined}
      >
        {roleDisplay}
      </span>

      {/* Additional Badges */}
      {badges.slice(0, 2).map((badge) => (
        <span
          key={badge.id}
          className={`px-2 py-1 text-xs font-medium rounded-full border`}
          style={{
            backgroundColor: `${badge.color}20`,
            borderColor: badge.color,
            color: badge.color,
          }}
          title={showTooltip ? badge.description : undefined}
        >
          {badge.badge_name}
        </span>
      ))}

      {badges.length > 2 && (
        <span
          className="px-2 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-700"
          title={showTooltip ? `+${badges.length - 2} more badges` : undefined}
        >
          +{badges.length - 2}
        </span>
      )}
    </div>
  );
}
