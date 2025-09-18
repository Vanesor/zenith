"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { 
  ImageIcon, 
  FileText, 
  Settings, 
  Save, 
  Plus, 
  Edit, 
  Trash2, 
  Upload,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  RefreshCw
} from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface LandingPageContent {
  id: string;
  section: string;
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  video_url: string;
  button_text: string;
  button_url: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CarouselImage {
  id: string;
  title: string;
  description: string;
  image_url: string;
  alt_text: string;
  link_url: string;
  context: string;
  context_id: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SiteContent {
  id: string;
  key: string;
  value: string;
  description: string;
  content_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function ContentManagementPage() {
  const { user, isLoading } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('landing');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [landingContent, setLandingContent] = useState<LandingPageContent[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [siteContent, setSiteContent] = useState<SiteContent[]>([]);
  
  // Modal states
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isSiteContentModalOpen, setIsSiteContentModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Check if user has permission to access content management
  const hasContentManagementAccess = user && [
    'admin', 
    'super_admin', 
    'coordinator', 
    'co_coordinator', 
    'president', 
    'vice_president',
    'innovation_head',
    'secretary',
    'treasurer',
    'outreach_coordinator',
    'media_coordinator',
    'zenith_committee'
  ].includes(user.role);

  useEffect(() => {
    if (!isLoading && user) {
      if (!hasContentManagementAccess) {
        showToast({ type: 'error', title: 'Access denied. Insufficient permissions.' });
        return;
      }
      fetchAllContent();
    }
  }, [user, isLoading]);

  const fetchAllContent = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/content-management', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('zenith-token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLandingContent(data.landingContent || []);
        setCarouselImages(data.carouselImages || []);
        setSiteContent(data.siteContent || []);
      } else {
        showToast({ type: 'error', title: 'Failed to load content data' });
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      showToast({ type: 'error', title: 'Error loading content data' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLandingContent = () => {
    setEditingItem({
      section: '',
      title: '',
      subtitle: '',
      description: '',
      image_url: '',
      video_url: '',
      button_text: '',
      button_url: '',
      order_index: landingContent.length + 1,
      is_active: true
    });
    setIsContentModalOpen(true);
  };

  const handleEditLandingContent = (content: LandingPageContent) => {
    setEditingItem(content);
    setIsContentModalOpen(true);
  };

  const handleCreateCarouselImage = () => {
    setEditingItem({
      title: '',
      description: '',
      image_url: '',
      alt_text: '',
      link_url: '',
      context: 'landing',
      context_id: '',
      order_index: carouselImages.length + 1,
      is_active: true
    });
    setIsImageModalOpen(true);
  };

  const handleEditCarouselImage = (image: CarouselImage) => {
    setEditingItem(image);
    setIsImageModalOpen(true);
  };

  const handleCreateSiteContent = () => {
    setEditingItem({
      key: '',
      value: '',
      description: '',
      content_type: 'text',
      is_active: true
    });
    setIsSiteContentModalOpen(true);
  };

  const handleEditSiteContent = (content: SiteContent) => {
    setEditingItem(content);
    setIsSiteContentModalOpen(true);
  };

  const saveLandingContent = async (data: Partial<LandingPageContent>) => {
    try {
      const url = editingItem?.id ? `/api/admin/content-management/landing/${editingItem.id}` : '/api/admin/content-management/landing';
      const method = editingItem?.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('zenith-token')}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        showToast({ type: 'success', title: `Landing content ${editingItem?.id ? 'updated' : 'created'} successfully` });
        setIsContentModalOpen(false);
        setEditingItem(null);
        fetchAllContent();
      } else {
        throw new Error('Failed to save content');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      showToast({ type: 'error', title: 'Failed to save content' });
    }
  };

  const saveCarouselImage = async (data: Partial<CarouselImage>) => {
    try {
      const url = editingItem?.id ? `/api/admin/content-management/carousel/${editingItem.id}` : '/api/admin/content-management/carousel';
      const method = editingItem?.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('zenith-token')}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        showToast({ type: 'success', title: `Carousel image ${editingItem?.id ? 'updated' : 'created'} successfully` });
        setIsImageModalOpen(false);
        setEditingItem(null);
        fetchAllContent();
      } else {
        throw new Error('Failed to save image');
      }
    } catch (error) {
      console.error('Error saving image:', error);
      showToast({ type: 'error', title: 'Failed to save image' });
    }
  };

  const saveSiteContent = async (data: Partial<SiteContent>) => {
    try {
      const url = editingItem?.id ? `/api/admin/content-management/site/${editingItem.id}` : '/api/admin/content-management/site';
      const method = editingItem?.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('zenith-token')}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        showToast({ type: 'success', title: `Site content ${editingItem?.id ? 'updated' : 'created'} successfully` });
        setIsSiteContentModalOpen(false);
        setEditingItem(null);
        fetchAllContent();
      } else {
        throw new Error('Failed to save content');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      showToast({ type: 'error', title: 'Failed to save content' });
    }
  };

  const deleteItem = async (type: string, id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`/api/admin/content-management/${type}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('zenith-token')}`
        }
      });

      if (response.ok) {
        showToast({ type: 'success', title: 'Item deleted successfully' });
        fetchAllContent();
      } else {
        throw new Error('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      showToast({ type: 'error', title: 'Failed to delete item' });
    }
  };

  const toggleItemStatus = async (type: string, id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/content-management/${type}/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('zenith-token')}`
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (response.ok) {
        showToast({ type: 'success', title: `Item ${!currentStatus ? 'activated' : 'deactivated'} successfully` });
        fetchAllContent();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showToast({ type: 'error', title: 'Failed to update status' });
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading content management...</p>
        </div>
      </div>
    );
  }

  if (!hasContentManagementAccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">You don't have permission to access content management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Content Management</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage website content, carousel images, and site settings
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { id: 'landing', name: 'Landing Page', icon: FileText },
              { id: 'carousel', name: 'Carousel Images', icon: ImageIcon },
              { id: 'site', name: 'Site Content', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Landing Page Content Tab */}
        {activeTab === 'landing' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Landing Page Content</h2>
              <button
                onClick={handleCreateLandingContent}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Content Section
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Section
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {landingContent.map((content) => (
                      <tr key={content.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {content.section}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {content.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {content.order_index}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            content.is_active
                              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                              : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                          }`}>
                            {content.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEditLandingContent(content)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleItemStatus('landing', content.id, content.is_active)}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            {content.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => deleteItem('landing', content.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Carousel Images Tab */}
        {activeTab === 'carousel' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Carousel Images</h2>
              <button
                onClick={handleCreateCarouselImage}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Carousel Image
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Image
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Context
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {carouselImages.map((image) => (
                      <tr key={image.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <img 
                            src={image.image_url} 
                            alt={image.alt_text}
                            className="h-12 w-20 object-cover rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {image.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {image.context}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {image.order_index}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            image.is_active
                              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                              : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                          }`}>
                            {image.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEditCarouselImage(image)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleItemStatus('carousel', image.id, image.is_active)}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            {image.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => deleteItem('carousel', image.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Site Content Tab */}
        {activeTab === 'site' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Site Content</h2>
              <button
                onClick={handleCreateSiteContent}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Site Content
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Key
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {siteContent.map((content) => (
                      <tr key={content.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {content.key}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                          {content.value}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {content.content_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            content.is_active
                              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                              : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                          }`}>
                            {content.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEditSiteContent(content)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleItemStatus('site', content.id, content.is_active)}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            {content.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => deleteItem('site', content.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals will be added in the next part due to space limitations */}
    </div>
  );
}