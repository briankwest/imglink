import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserGroupIcon, UserIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import FollowButton from './FollowButton';

interface SuggestedUser {
  id: number;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  followers_count: number;
  is_followed_by: boolean;
}

interface UserSuggestionsProps {
  limit?: number;
  className?: string;
}

const UserSuggestions: React.FC<UserSuggestionsProps> = ({ 
  limit = 5, 
  className = '' 
}) => {
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSuggestions();
  }, [limit]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get<SuggestedUser[]>(
        `/api/v1/suggestions/?limit=${limit}`
      );
      setSuggestions(data);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowChange = (userId: number) => {
    // Remove the user from suggestions after following
    setSuggestions(prev => prev.filter(user => user.id !== userId));
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <UserGroupIcon className="h-5 w-5 mr-2" />
          Suggested for You
        </h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || suggestions.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <UserGroupIcon className="h-5 w-5 mr-2" />
        Suggested for You
      </h3>
      
      <div className="space-y-4">
        {suggestions.map(user => (
          <div key={user.id} className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <Link to={`/users/${user.username}`}>
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
              </Link>
              
              <div className="flex-1 min-w-0">
                <Link
                  to={`/users/${user.username}`}
                  className="font-medium text-gray-900 dark:text-white hover:underline block truncate"
                >
                  {user.full_name || user.username}
                </Link>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  @{user.username}
                </p>
                {user.is_followed_by && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Follows you
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {user.followers_count} {user.followers_count === 1 ? 'follower' : 'followers'}
                </p>
              </div>
            </div>
            
            <FollowButton
              userId={user.id}
              username={user.username}
              initialIsFollowing={false}
              onFollowChange={() => handleFollowChange(user.id)}
              size="sm"
              showText={false}
            />
          </div>
        ))}
      </div>
      
      <Link
        to="/discover/users"
        className="block mt-4 text-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
      >
        See more suggestions
      </Link>
    </div>
  );
};

export default UserSuggestions;