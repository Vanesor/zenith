"use client";

import React from 'react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onTaskCreated?: () => void;
}

export default function CreateTaskModal({ isOpen, onClose, projectId, onTaskCreated }: CreateTaskModalProps) {
  return (
    <div>
      {/* Temporary stub component */}
    </div>
  );
}
