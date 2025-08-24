"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Upload,
  Save,
  X,
  User,
  Mail,
  Phone,
  Linkedin,
  Github,
  Globe,
  Eye,
  EyeOff
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useToast } from "@/contexts/ToastContext";
import ConfirmationModal from "@/components/ConfirmationModal";

interface TeamCard {
  id: string;
  name: string;
  position: string;
  bio: string;
  image_url: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  github_url?: string;
  website_url?: string;
  is_active: boolean;
  order_index: number;
  page_type: string;
  created_at: string;
  updated_at: string;
}

export default function LandingTeamManagement() {
  const { user, isLoading } = useAuth();
  const { isAuthenticated } = useAuthGuard({ 
    redirectReason: "Please sign in to access admin features",
    redirectOnClose: true,
    redirectPath: "/login"
  });
  const { showToast } = useToast();
  const router = useRouter();

  const [teamCards, setTeamCards] = useState<TeamCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCard, setEditingCard] = useState<TeamCard | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    card: TeamCard | null;
  }>({ show: false, card: null });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    bio: "",
    email: "",
    phone: "",
    linkedin_url: "",
    github_url: "",
    website_url: "",
    is_active: true
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Enhanced role checking for admin access
  const userRole = user?.role?.toLowerCase() || '';
  const isZenithCommittee = [
    'president',
    'vice_president', 
    'innovation_head',
    'secretary',
    'treasurer',
    'outreach_coordinator',
    'media_coordinator',
    'zenith_committee'
  ].includes(userRole);
  const isSystemAdmin = userRole === 'admin';
  const hasAccess = isZenithCommittee || isSystemAdmin;

  useEffect(() => {
    if (!isLoading && !hasAccess) {
      showToast({
        type: "error",
        title: "Access Denied",
        message: "You don't have permission to manage landing page content"
      });
      router.push('/admin/club-management');
      return;
    }
    
    if (hasAccess) {
      fetchTeamCards();
    }
  }, [user, isLoading, hasAccess]);

  const fetchTeamCards = async () => {
    try {
      const response = await fetch('/api/admin/team?page_type=landing');
      if (response.ok) {
        const data = await response.json();
        setTeamCards(data.teamCards || []);
      } else {
        throw new Error('Failed to fetch team cards');
      }
    } catch (error) {
      console.error('Error fetching team cards:', error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to load team cards"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      position: "",
      bio: "",
      email: "",
      phone: "",
      linkedin_url: "",
      github_url: "",
      website_url: "",
      is_active: true
    });
    setImageFile(null);
    setImagePreview("");
    setEditingCard(null);
  };

  const handleCreateCard = async () => {
    if (!formData.name || !formData.position || !formData.bio || !imageFile) {
      showToast({
        type: "error",
        title: "Validation Error",
        message: "Please fill in all required fields and select an image"
      });
      return;
    }

    setSaving(true);
    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value.toString());
      });
      formDataToSend.append('page_type', 'landing');
      formDataToSend.append('image', imageFile);

      const response = await fetch('/api/admin/team', {
        method: 'POST',
        body: formDataToSend
      });

      if (response.ok) {
        showToast({
          type: "success",
          title: "Success",
          message: "Team member added successfully"
        });
        setShowCreateModal(false);
        resetForm();
        fetchTeamCards();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create team card');
      }
    } catch (error) {
      console.error('Error creating team card:', error);
      showToast({
        type: "error",
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to create team card"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCard = async () => {
    if (!editingCard || !formData.name || !formData.position || !formData.bio) {
      showToast({
        type: "error",
        title: "Validation Error",
        message: "Please fill in all required fields"
      });
      return;
    }

    setSaving(true);
    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value.toString());
      });
      
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      const response = await fetch(`/api/admin/team/${editingCard.id}`, {
        method: 'PUT',
        body: formDataToSend
      });

      if (response.ok) {
        showToast({
          type: "success",
          title: "Success",
          message: "Team member updated successfully"
        });
        resetForm();
        fetchTeamCards();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update team card');
      }
    } catch (error) {
      console.error('Error updating team card:', error);
      showToast({
        type: "error",
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to update team card"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = async () => {
    if (!deleteModal.card) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/team/${deleteModal.card.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showToast({
          type: "success",
          title: "Success",
          message: "Team member deleted successfully"
        });
        setDeleteModal({ show: false, card: null });
        fetchTeamCards();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete team card');
      }
    } catch (error) {
      console.error('Error deleting team card:', error);
      showToast({
        type: "error",
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to delete team card"
      });
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (card: TeamCard) => {
    setEditingCard(card);
    setFormData({
      name: card.name,
      position: card.position,
      bio: card.bio,
      email: card.email || "",
      phone: card.phone || "",
      linkedin_url: card.linkedin_url || "",
      github_url: card.github_url || "",
      website_url: card.website_url || "",
      is_active: card.is_active
    });
    setImagePreview(card.image_url);
    setShowCreateModal(true);
  };

  if (isLoading || !hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-college-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Landing Page Team</h1>
                <p className="text-gray-600 mt-2">Manage team member cards on the landing page</p>
              </div>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="bg-college-primary text-primary px-4 py-2 rounded-lg hover:bg-college-primary/90 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Team Member</span>
            </button>
          </div>
        </div>

        {/* Team Cards Grid */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
            <p className="text-gray-600 mt-1">Manage your team member cards and their information</p>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-college-primary mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading team members...</p>
              </div>
            ) : teamCards.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
                <p className="text-gray-600 mb-4">Add your first team member to get started</p>
                <button
                  onClick={() => {
                    resetForm();
                    setShowCreateModal(true);
                  }}
                  className="bg-college-primary text-primary px-4 py-2 rounded-lg hover:bg-college-primary/90 transition-colors"
                >
                  Add First Team Member
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamCards.map((card) => (
                  <div
                    key={card.id}
                    className={`border rounded-xl p-6 transition-all ${
                      card.is_active 
                        ? 'border-green-300 bg-green-50 shadow-md' 
                        : 'border-gray-300 bg-gray-50 opacity-75'
                    }`}
                  >
                    {/* Image */}
                    <div className="flex justify-center mb-4">
                      <img
                        src={card.image_url}
                        alt={card.name}
                        className="w-20 h-20 object-cover rounded-full border-4 border-white shadow-lg"
                      />
                    </div>

                    {/* Content */}
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900">{card.name}</h3>
                      <p className="text-sm text-blue-600 font-medium mt-1">{card.position}</p>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-3">{card.bio}</p>

                      {/* Contact Info */}
                      <div className="mt-4 flex justify-center space-x-3">
                        {card.email && (
                          <a
                            href={`mailto:${card.email}`}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Mail className="w-4 h-4" />
                          </a>
                        )}
                        {card.linkedin_url && (
                          <a
                            href={card.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Linkedin className="w-4 h-4" />
                          </a>
                        )}
                        {card.github_url && (
                          <a
                            href={card.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-900 transition-colors"
                          >
                            <Github className="w-4 h-4" />
                          </a>
                        )}
                        {card.website_url && (
                          <a
                            href={card.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-green-600 transition-colors"
                          >
                            <Globe className="w-4 h-4" />
                          </a>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex justify-center space-x-2">
                        <div className="flex items-center">
                          {card.is_active ? (
                            <Eye className="w-4 h-4 text-green-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <button
                          onClick={() => openEditModal(card)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ show: true, card })}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingCard ? 'Edit' : 'Add'} Team Member
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Image *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-full mx-auto"
                      />
                      <button
                        onClick={() => {
                          setImagePreview("");
                          setImageFile(null);
                        }}
                        className="absolute top-0 right-1/2 transform translate-x-16 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Click to upload a profile image</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="mt-2"
                      />
                    </div>
                  )}
                  {imagePreview && (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="mt-2 mx-auto block"
                    />
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-college-primary focus:border-transparent"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position *
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-college-primary focus:border-transparent"
                    placeholder="e.g., President, Vice President"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio *
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-college-primary focus:border-transparent"
                  placeholder="Brief description about the team member"
                />
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-college-primary focus:border-transparent"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-college-primary focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-college-primary focus:border-transparent"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    value={formData.github_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, github_url: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-college-primary focus:border-transparent"
                    placeholder="https://github.com/username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-college-primary focus:border-transparent"
                    placeholder="https://website.com"
                  />
                </div>
              </div>

              {/* Active Status */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded border-gray-300 text-college-primary focus:ring-college-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">Active (visible on website)</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingCard ? handleUpdateCard : handleCreateCard}
                disabled={saving}
                className="px-4 py-2 bg-college-primary text-primary rounded-lg hover:bg-college-primary/90 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{saving ? 'Saving...' : (editingCard ? 'Update' : 'Create')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.show}
        onClose={() => setDeleteModal({ show: false, card: null })}
        onConfirm={handleDeleteCard}
        title="Delete Team Member"
        message={`Are you sure you want to delete "${deleteModal.card?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
