"use client";

import React from "react";
import { Tag as TagIcon, X } from "lucide-react";

interface TagBubbleProps {
  text: string;
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "danger"
    | "warning"
    | "info"
    | "default";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  onDelete?: () => void;
  className?: string;
  isClickable?: boolean;
}

export default function TagBubble({
  text,
  variant = "primary",
  size = "md",
  onClick,
  onDelete,
  className = "",
  isClickable = false,
}: TagBubbleProps) {
  // Color variants
  const variantClasses = {
    primary: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    secondary: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    success:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    warning:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    info: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
    default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  };

  // Size variants
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  // Icon sizes
  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  const handleClick = () => {
    if (isClickable && onClick) {
      onClick();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    if (onDelete) {
      e.stopPropagation();
      onDelete();
    }
  };

  return (
    <span
      className={`inline-flex items-center rounded-full ${
        variantClasses[variant]
      } ${sizeClasses[size]} ${
        isClickable && onClick ? "cursor-pointer hover:opacity-80" : ""
      } ${className}`}
      onClick={handleClick}
    >
      <TagIcon size={iconSizes[size]} className="mr-1" />
      <span>{text}</span>
      {onDelete && (
        <button
          type="button"
          onClick={handleDelete}
          className={`ml-1 rounded-full hover:bg-opacity-20 hover:bg-black dark:hover:bg-white focus:outline-none`}
        >
          <X size={iconSizes[size]} />
        </button>
      )}
    </span>
  );
}
