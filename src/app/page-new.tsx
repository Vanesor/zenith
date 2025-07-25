import React from "react";
import { Layout } from "@/components/Layout";
import { PostCard } from "@/components/PostCard";
import type { Post, User, Category } from "@/shared/types";

// Mock data for demonstration
const mockUser: User = {
  id: "1",
  username: "john_doe",
  email: "john@college.edu",
  role: "member",
  joinDate: new Date("2024-01-15"),
  bio: "Computer Science student",
};

const mockCategory: Category = {
  id: "1",
  name: "General Discussion",
  description: "General topics and discussions",
  color: "#3B82F6",
  postCount: 42,
};

const mockPosts: Post[] = [
  {
    id: "1",
    title: "Welcome to Zenith Forum!",
    content:
      "This is the official launch of our college forum. Feel free to introduce yourselves and start meaningful discussions. We have categories for different subjects, clubs, and general topics.",
    authorId: "1",
    author: mockUser,
    categoryId: "1",
    category: mockCategory,
    tags: ["welcome", "introduction", "community"],
    createdAt: new Date("2024-12-01"),
    updatedAt: new Date("2024-12-01"),
    likes: 15,
    isLiked: false,
    commentCount: 8,
    isPinned: true,
    isLocked: false,
  },
  {
    id: "2",
    title: "Study Group for Data Structures",
    content:
      "Looking for students interested in forming a study group for Data Structures and Algorithms. We can meet weekly to solve problems and discuss concepts. Anyone from CS 201 welcome!",
    authorId: "2",
    author: { ...mockUser, id: "2", username: "study_buddy" },
    categoryId: "2",
    category: {
      ...mockCategory,
      id: "2",
      name: "Study Groups",
      color: "#10B981",
    },
    tags: ["study-group", "data-structures", "algorithms", "cs201"],
    createdAt: new Date("2024-11-28"),
    updatedAt: new Date("2024-11-28"),
    likes: 7,
    isLiked: true,
    commentCount: 12,
    isPinned: false,
    isLocked: false,
  },
  {
    id: "3",
    title: "Campus Events This Week",
    content:
      "Here are the upcoming events on campus this week: Tech Talk on AI (Monday), Career Fair (Wednesday), Basketball game vs State (Friday). Do not miss out!",
    authorId: "3",
    author: { ...mockUser, id: "3", username: "events_coordinator" },
    categoryId: "3",
    category: { ...mockCategory, id: "3", name: "Events", color: "#F59E0B" },
    tags: ["events", "campus", "tech-talk", "career-fair", "sports"],
    createdAt: new Date("2024-11-25"),
    updatedAt: new Date("2024-11-25"),
    likes: 23,
    isLiked: false,
    commentCount: 5,
    isPinned: false,
    isLocked: false,
  },
];

export default function Home() {
  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to Zenith Forum
            </h1>
            <p className="text-gray-600">
              Connect with your college community, share knowledge, and engage
              in meaningful discussions.
            </p>
          </div>

          {/* Posts */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Latest Posts
              </h2>
              <div className="flex items-center space-x-2">
                <select className="border border-gray-300 rounded-md px-3 py-1 text-sm">
                  <option>Latest</option>
                  <option>Popular</option>
                  <option>Most Liked</option>
                </select>
              </div>
            </div>

            {mockPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Forum Stats */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Forum Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Posts</span>
                <span className="font-semibold">1,234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Users</span>
                <span className="font-semibold">156</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Categories</span>
                <span className="font-semibold">8</span>
              </div>
            </div>
          </div>

          {/* Popular Categories */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Popular Categories
            </h3>
            <div className="space-y-3">
              {[
                { name: "General Discussion", count: 89, color: "#3B82F6" },
                { name: "Study Groups", count: 45, color: "#10B981" },
                { name: "Events", count: 32, color: "#F59E0B" },
                { name: "Tech Talk", count: 28, color: "#8B5CF6" },
              ].map((category) => (
                <div
                  key={category.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-gray-700">{category.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {category.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                Create New Post
              </button>
              <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                Join Study Group
              </button>
              <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                Browse Events
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
