import React, { useState } from 'react';
import { UserPlusIcon, UserMinusIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { apiService } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface FollowButtonProps {
  userId: number;
  username: string;
  initialIsFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  username,
  initialIsFollowing,
  onFollowChange,
  size = 'md',
  showText = true
}) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  // Don't show button for own profile or when not authenticated
  if (!isAuthenticated || user?.id === userId) {
    return null;
  }

  const handleFollow = async () => {
    setIsLoading(true);
    try {
      if (isFollowing) {
        await apiService.delete(`/api/v1/users/${userId}/unfollow`);
        setIsFollowing(false);
        onFollowChange?.(false);
      } else {
        await apiService.post(`/api/v1/users/${userId}/follow`);
        setIsFollowing(true);
        onFollowChange?.(true);
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      alert(error.response?.data?.detail || 'Failed to update follow status');
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  const getButtonText = () => {
    if (!showText) return null;
    if (isFollowing) {
      return isHovered ? 'Unfollow' : 'Following';
    }
    return 'Follow';
  };

  const getButtonIcon = () => {
    if (isFollowing && isHovered) {
      return <UserMinusIcon className="h-5 w-5" />;
    } else if (isFollowing) {
      return <CheckIcon className="h-5 w-5" />;
    } else {
      return <UserPlusIcon className="h-5 w-5" />;
    }
  };

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        ${sizeClasses[size]}
        inline-flex items-center gap-2 rounded-full font-medium transition-all
        ${isFollowing
          ? isHovered
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {getButtonIcon()}
      {getButtonText()}
    </button>
  );
};

export default FollowButton;