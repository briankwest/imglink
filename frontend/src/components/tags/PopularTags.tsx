import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TagIcon } from '@heroicons/react/24/outline';
import { apiService } from '../../services/api';

interface PopularTag {
  name: string;
  slug: string;
  usage_count: number;
}

interface PopularTagsProps {
  limit?: number;
  className?: string;
}

const PopularTags: React.FC<PopularTagsProps> = ({ limit = 15, className = '' }) => {
  const [tags, setTags] = useState<PopularTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPopularTags();
  }, [limit]);

  const fetchPopularTags = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get<PopularTag[]>(`/api/v1/tags/popular?limit=${limit}`);
      setTags(data || []);
    } catch (err) {
      console.error('Error fetching popular tags:', err);
      setError('Failed to load popular tags');
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <TagIcon className="h-5 w-5 mr-2" />
          Popular Tags
        </h3>
        <div className="animate-pulse space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-24"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !tags || tags.length === 0) {
    return null;
  }

  // Calculate relative sizes based on usage count
  const maxCount = Math.max(...tags.map(tag => tag.usage_count));
  const minCount = Math.min(...tags.map(tag => tag.usage_count));
  const range = maxCount - minCount || 1;

  const getTagSize = (count: number) => {
    const normalized = (count - minCount) / range;
    if (normalized > 0.8) return 'text-lg font-semibold';
    if (normalized > 0.6) return 'text-base font-medium';
    if (normalized > 0.4) return 'text-sm font-medium';
    return 'text-sm';
  };

  const getTagColor = (count: number) => {
    const normalized = (count - minCount) / range;
    if (normalized > 0.8) return 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300';
    if (normalized > 0.6) return 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300';
    if (normalized > 0.4) return 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100';
    return 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <TagIcon className="h-5 w-5 mr-2" />
        Popular Tags
      </h3>
      
      <div className="flex flex-wrap gap-3">
        {tags.map((tag) => (
          <Link
            key={tag.slug}
            to={`/tags/${tag.slug}`}
            className={`inline-flex items-center transition-colors ${getTagSize(tag.usage_count)} ${getTagColor(tag.usage_count)}`}
            title={`${tag.usage_count} ${tag.usage_count === 1 ? 'image' : 'images'}`}
          >
            <span className="opacity-60 mr-1">#</span>
            {tag.name}
            <span className="ml-1 text-xs opacity-60">({tag.usage_count})</span>
          </Link>
        ))}
      </div>

      {tags.length === limit && (
        <div className="mt-4 text-center">
          <Link
            to="/tags"
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            View all tags →
          </Link>
        </div>
      )}
    </div>
  );
};

export default PopularTags;