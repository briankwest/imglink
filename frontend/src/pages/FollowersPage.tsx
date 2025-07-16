import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import UserCard from '../components/UserCard';
import { useAuthStore } from '../store/authStore';

interface UserFollowInfo {
  id: number;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  followers_count: number;
  following_count: number;
  is_following: boolean;
  is_followed_by: boolean;
}

const FollowersPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [followers, setFollowers] = useState<UserFollowInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { user: currentUser } = useAuthStore();
  const limit = 20;

  useEffect(() => {
    if (username) {
      fetchUserAndFollowers();
    }
  }, [username]);

  const fetchUserAndFollowers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user ID from username
      const userProfile = await apiService.get<{ id: number; username: string }>(
        `/api/v1/users/username/${username}`
      );
      
      // Fetch followers
      const data = await apiService.get<UserFollowInfo[]>(
        `/api/v1/users/${userProfile.id}/followers?skip=0&limit=${limit}`
      );
      
      setFollowers(data);
      setHasMore(data.length === limit);
    } catch (err) {
      console.error('Error fetching followers:', err);
      setError('Failed to load followers');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || loading) return;
    
    try {
      const userProfile = await apiService.get<{ id: number }>(
        `/api/v1/users/username/${username}`
      );
      
      const newPage = page + 1;
      const data = await apiService.get<UserFollowInfo[]>(
        `/api/v1/users/${userProfile.id}/followers?skip=${newPage * limit}&limit=${limit}`
      );
      
      setFollowers(prev => [...prev, ...data]);
      setPage(newPage);
      setHasMore(data.length === limit);
    } catch (err) {
      console.error('Error loading more followers:', err);
    }
  };

  const handleFollowChange = (userId: number, isFollowing: boolean) => {
    setFollowers(prev =>
      prev.map(user =>
        user.id === userId ? { ...user, is_following: isFollowing } : user
      )
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <Link
            to={`/users/${username}`}
            className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          to={`/users/${username}`}
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to profile
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {username}'s Followers
        </h1>
      </div>

      {followers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No followers yet
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {followers.map(follower => (
            <UserCard
              key={follower.id}
              user={follower}
              showFollowButton={currentUser?.id !== follower.id}
              onFollowChange={handleFollowChange}
            />
          ))}
          
          {hasMore && (
            <div className="text-center py-4">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FollowersPage;