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
  Image as ImageIcon,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useToast } from "@/contexts/ToastContext";
import ConfirmationModal from "@/components/ConfirmationModal";

interface CarouselSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  link_url?: string;
  link_text?: string;
  is_active: boolean;
  order_index: number;
  page_type: string;
  created_at: string;
  updated_at: string;
}

export default function LandingCarouselManagement() {
  const { user, isLoading } = useAuth();
  const { isAuthenticated } = useAuthGuard({ 
    redirectReason: "Please sign in to access admin features",
    redirectOnClose: true,
    redirectPath: "/login"
  });
  const { showToast } = useToast();
  const router = useRouter();

  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState<CarouselSlide | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    slide: CarouselSlide | null;
  }>({ show: false, slide: null });

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    link_url: "",
    link_text: "",
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
      fetchSlides();
    }
  }, [user, isLoading, hasAccess]);

  const fetchSlides = async () => {
    try {
      const response = await fetch('/api/admin/carousel?page_type=landing');
      if (response.ok) {
        const data = await response.json();
        setSlides(data.slides || []);
      } else {
        throw new Error('Failed to fetch slides');
      }
    } catch (error) {
      console.error('Error fetching slides:', error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to load carousel slides"
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
      title: "",
      subtitle: "",
      description: "",
      link_url: "",
      link_text: "",
      is_active: true
    });
    setImageFile(null);
    setImagePreview("");
    setEditingSlide(null);
  };

  const handleCreateSlide = async () => {
    if (!formData.title || !formData.description || !imageFile) {
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
      formDataToSend.append('title', formData.title);
      formDataToSend.append('subtitle', formData.subtitle);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('link_url', formData.link_url);
      formDataToSend.append('link_text', formData.link_text);
      formDataToSend.append('is_active', formData.is_active.toString());
      formDataToSend.append('page_type', 'landing');
      formDataToSend.append('image', imageFile);

      const response = await fetch('/api/admin/carousel', {
        method: 'POST',
        body: formDataToSend
      });

      if (response.ok) {
        showToast({
          type: "success",
          title: "Success",
          message: "Carousel slide created successfully"
        });
        setShowCreateModal(false);
        resetForm();
        fetchSlides();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create slide');
      }
    } catch (error) {
      console.error('Error creating slide:', error);
      showToast({
        type: "error",
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to create slide"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSlide = async () => {
    if (!editingSlide || !formData.title || !formData.description) {
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
      formDataToSend.append('title', formData.title);
      formDataToSend.append('subtitle', formData.subtitle);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('link_url', formData.link_url);
      formDataToSend.append('link_text', formData.link_text);
      formDataToSend.append('is_active', formData.is_active.toString());
      
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      const response = await fetch(`/api/admin/carousel/${editingSlide.id}`, {
        method: 'PUT',
        body: formDataToSend
      });

      if (response.ok) {
        showToast({
          type: "success",
          title: "Success",
          message: "Carousel slide updated successfully"
        });
        resetForm();
        fetchSlides();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update slide');
      }
    } catch (error) {
      console.error('Error updating slide:', error);
      showToast({
        type: "error",
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to update slide"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlide = async () => {
    if (!deleteModal.slide) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/carousel/${deleteModal.slide.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showToast({
          type: "success",
          title: "Success",
          message: "Carousel slide deleted successfully"
        });
        setDeleteModal({ show: false, slide: null });
        fetchSlides();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete slide');
      }
    } catch (error) {
      console.error('Error deleting slide:', error);
      showToast({
        type: "error",
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to delete slide"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReorderSlide = async (slideId: string, direction: 'up' | 'down') => {
    try {
      const response = await fetch(`/api/admin/carousel/${slideId}/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ direction })
      });

      if (response.ok) {
        fetchSlides();
      } else {
        throw new Error('Failed to reorder slide');
      }
    } catch (error) {
      console.error('Error reordering slide:', error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to reorder slide"
      });
    }
  };

  const openEditModal = (slide: CarouselSlide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle || "",
      description: slide.description,
      link_url: slide.link_url || "",
      link_text: slide.link_text || "",
      is_active: slide.is_active
    });
    setImagePreview(slide.image_url);
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
                <h1 className="text-3xl font-bold text-gray-900">Landing Page Carousel</h1>
                <p className="text-gray-600 mt-2">Manage the main carousel slides on the landing page</p>
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
              <span>Add Slide</span>
            </button>
          </div>
        </div>

        {/* Slides List */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Carousel Slides</h2>
            <p className="text-gray-600 mt-1">Manage and reorder your landing page carousel slides</p>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-college-primary mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading slides...</p>
              </div>
            ) : slides.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No slides found</h3>
                <p className="text-gray-600 mb-4">Create your first carousel slide to get started</p>
                <button
                  onClick={() => {
                    resetForm();
                    setShowCreateModal(true);
                  }}
                  className="bg-college-primary text-primary px-4 py-2 rounded-lg hover:bg-college-primary/90 transition-colors"
                >
                  Add First Slide
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {slides.map((slide, index) => (
                  <div
                    key={slide.id}
                    className={`border rounded-lg p-4 ${
                      slide.is_active ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={slide.image_url}
                          alt={slide.title}
                          className="w-24 h-16 object-cover rounded-lg"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{slide.title}</h3>
                            {slide.subtitle && (
                              <p className="text-sm text-gray-600 mt-1">{slide.subtitle}</p>
                            )}
                            <p className="text-sm text-gray-700 mt-2 line-clamp-2">{slide.description}</p>
                            {slide.link_url && (
                              <div className="mt-2">
                                <span className="text-xs text-blue-600">Link: {slide.link_text || slide.link_url}</span>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2">
                            {/* Status */}
                            <div className="flex items-center space-x-1">
                              {slide.is_active ? (
                                <Eye className="w-4 h-4 text-green-600" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-gray-400" />
                              )}
                            </div>

                            {/* Reorder */}
                            <div className="flex flex-col space-y-1">
                              <button
                                onClick={() => handleReorderSlide(slide.id, 'up')}
                                disabled={index === 0}
                                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                              >
                                <MoveUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleReorderSlide(slide.id, 'down')}
                                disabled={index === slides.length - 1}
                                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                              >
                                <MoveDown className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Edit */}
                            <button
                              onClick={() => openEditModal(slide)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => setDeleteModal({ show: true, slide })}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
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
                  {editingSlide ? 'Edit' : 'Create'} Carousel Slide
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
                  Image *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => {
                          setImagePreview("");
                          setImageFile(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Click to upload an image</p>
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
                      className="mt-2"
                    />
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-college-primary focus:border-transparent"
                  placeholder="Enter slide title"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-college-primary focus:border-transparent"
                  placeholder="Enter slide subtitle (optional)"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-college-primary focus:border-transparent"
                  placeholder="Enter slide description"
                />
              </div>

              {/* Link URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link URL
                </label>
                <input
                  type="url"
                  value={formData.link_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-college-primary focus:border-transparent"
                  placeholder="https://example.com (optional)"
                />
              </div>

              {/* Link Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link Text
                </label>
                <input
                  type="text"
                  value={formData.link_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, link_text: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-college-primary focus:border-transparent"
                  placeholder="Learn More (optional)"
                />
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
                onClick={editingSlide ? handleUpdateSlide : handleCreateSlide}
                disabled={saving}
                className="px-4 py-2 bg-college-primary text-primary rounded-lg hover:bg-college-primary/90 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{saving ? 'Saving...' : (editingSlide ? 'Update' : 'Create')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.show}
        onClose={() => setDeleteModal({ show: false, slide: null })}
        onConfirm={handleDeleteSlide}
        title="Delete Slide"
        message={`Are you sure you want to delete "${deleteModal.slide?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
