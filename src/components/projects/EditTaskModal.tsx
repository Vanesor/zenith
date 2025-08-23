"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, Calendar, User, Flag, Tag, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast as notify } from 'react-hot-toast';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  projectId: string;
  onTaskUpdated: (updatedTask: Task) => void;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'to_do' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'task' | 'bug';
  assignee_name?: string;
  assignee_id?: string;
  created_at: string;
  due_date?: string;
  task_key: string;
  estimated_hours?: number;
}

interface ProjectMember {
  id: string;
  name: string;
  email: string;
}

export default function EditTaskModal({ 
  isOpen, 
  onClose, 
  task, 
  projectId, 
  onTaskUpdated 
}: EditTaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    type: 'task',
    assignee_id: '',
    due_date: '',
    estimated_hours: ''
  });
  const [loading, setLoading] = useState(false);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);

  useEffect(() => {
    if (isOpen && task) {
      setFormData({
        title: task.title,
        description: task.description,
        priority: task.priority,
        type: task.type,
        assignee_id: task.assignee_id || '',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        estimated_hours: task.estimated_hours?.toString() || ''
      });
      fetchProjectMembers();
    }
  }, [isOpen, task, projectId]);

  const fetchProjectMembers = async () => {
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch(`/api/projects/${projectId}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProjectMembers(data.members || []);
      }
    } catch (error) {
      console.error('Error fetching project members:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    if (!formData.title.trim()) {
      notify.error('Task title is required');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('zenith-token');
      const updateData: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        task_type: formData.type,
        assignee_id: formData.assignee_id || null,
        due_date: formData.due_date || null,
        estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : null
      };

      const response = await fetch(`/api/projects/${projectId}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const data = await response.json();
        onTaskUpdated(data.task);
        notify.success('Task updated successfully!');
        onClose();
      } else {
        const errorData = await response.json();
        notify.error(errorData.error || 'Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      notify.error('Error updating task');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!task) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-zenith-card rounded-xl border border-zenith-border max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-0 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-zenith-border">
                <CardTitle className="text-xl font-semibold text-zenith-primary">
                  Edit Task
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-zenith-muted hover:text-zenith-primary"
                >
                  <X className="w-5 h-5" />
                </Button>
              </CardHeader>

              <CardContent className="p-6 max-h-[70vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Task Title */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zenith-primary">
                      Title *
                    </label>
                    <Input
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Enter task title..."
                      className="bg-zenith-main border-zenith-border focus:border-zenith-brand focus:ring-2 focus:ring-blue-500/20"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zenith-primary">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Enter task description..."
                      rows={4}
                      className="w-full px-3 py-2 bg-zenith-main border border-zenith-border rounded-md focus:border-zenith-brand focus:ring-2 focus:ring-blue-500/20 resize-none text-zenith-primary placeholder:text-zenith-muted"
                    />
                  </div>

                  {/* Row 1: Priority and Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zenith-primary flex items-center gap-2">
                        <Flag className="w-4 h-4" />
                        Priority
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => handleInputChange('priority', e.target.value)}
                        className="w-full px-3 py-2 bg-zenith-main border border-zenith-border rounded-md focus:border-zenith-brand focus:ring-2 focus:ring-blue-500/20 text-zenith-primary"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zenith-primary flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Type
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className="w-full px-3 py-2 bg-zenith-main border border-zenith-border rounded-md focus:border-zenith-brand focus:ring-2 focus:ring-blue-500/20 text-zenith-primary"
                      >
                        <option value="task">Task</option>
                        <option value="bug">Bug</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 2: Assignee and Due Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zenith-primary flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Assignee
                      </label>
                      <select
                        value={formData.assignee_id}
                        onChange={(e) => handleInputChange('assignee_id', e.target.value)}
                        className="w-full px-3 py-2 bg-zenith-main border border-zenith-border rounded-md focus:border-zenith-brand focus:ring-2 focus:ring-blue-500/20 text-zenith-primary"
                      >
                        <option value="">Unassigned</option>
                        {projectMembers.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zenith-primary flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Due Date
                      </label>
                      <Input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => handleInputChange('due_date', e.target.value)}
                        className="bg-zenith-main border-zenith-border focus:border-zenith-brand focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  {/* Estimated Hours */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zenith-primary flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Estimated Hours
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="999"
                      value={formData.estimated_hours}
                      onChange={(e) => handleInputChange('estimated_hours', e.target.value)}
                      placeholder="e.g., 8"
                      className="bg-zenith-main border-zenith-border focus:border-zenith-brand focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-zenith-border">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      className="border-zenith-border hover:bg-zenith-hover"
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-zenith-brand hover:bg-blue-700 text-white"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Update Task
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
