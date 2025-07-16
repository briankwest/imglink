import React from 'react';
import { Link } from 'react-router-dom';

interface TagListProps {
  tags: string[];
  size?: 'sm' | 'md' | 'lg';
  linkable?: boolean;
  onRemove?: (tag: string) => void;
  className?: string;
}

const TagList: React.FC<TagListProps> = ({ 
  tags, 
  size = 'md', 
  linkable = true, 
  onRemove,
  className = '' 
}) => {
  if (!tags || tags.length === 0) return null;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const createSlug = (tag: string) => {
    return tag.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tag) => {
        const content = (
          <span className="flex items-center gap-1">
            <span className="opacity-60">#</span>
            {tag}
            {onRemove && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove(tag);
                }}
                className="ml-1 hover:text-red-500 transition-colors"
                aria-label={`Remove tag ${tag}`}
              >
                ×
              </button>
            )}
          </span>
        );

        const baseClasses = `inline-flex items-center rounded-full font-medium transition-all ${sizeClasses[size]}`;
        
        if (linkable && !onRemove) {
          return (
            <Link
              key={tag}
              to={`/tags/${createSlug(tag)}`}
              className={`${baseClasses} bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600`}
            >
              {content}
            </Link>
          );
        }

        return (
          <span
            key={tag}
            className={`${baseClasses} ${
              onRemove 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {content}
          </span>
        );
      })}
    </div>
  );
};

export default TagList;