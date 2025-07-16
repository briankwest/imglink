import React from 'react';
import { Link } from 'react-router-dom';
import { UserIcon } from '@heroicons/react/24/solid';
import FollowButton from './FollowButton';
import FollowStats from './FollowStats';

interface UserCardProps {
  user: {
    id: number;
    username: string;
    full_name?: string;
    avatar_url?: string;
    bio?: string;
    followers_count: number;
    following_count: number;
    is_following?: boolean;
    is_followed_by?: boolean;
  };
  showFollowButton?: boolean;
  onFollowChange?: (userId: number, isFollowing: boolean) => void;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  showFollowButton = true,
  onFollowChange
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <Link to={`/users/${user.username}`}>
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.username}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
            )}
          </Link>

          {/* User Info */}
          <div className="flex-1">
            <Link
              to={`/users/${user.username}`}
              className="font-semibold text-gray-900 dark:text-white hover:underline"
            >
              {user.full_name || user.username}
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              @{user.username}
            </p>
            
            {user.is_followed_by && (
              <span className="inline-block mt-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                Follows you
              </span>
            )}
            
            {user.bio && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {user.bio}
              </p>
            )}
            
            <FollowStats
              username={user.username}
              followersCount={user.followers_count}
              followingCount={user.following_count}
              className="mt-3"
            />
          </div>
        </div>

        {/* Follow Button */}
        {showFollowButton && (
          <FollowButton
            userId={user.id}
            username={user.username}
            initialIsFollowing={user.is_following || false}
            onFollowChange={(isFollowing) => onFollowChange?.(user.id, isFollowing)}
            size="sm"
          />
        )}
      </div>
    </div>
  );
};

export default UserCard;