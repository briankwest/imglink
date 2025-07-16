import React from 'react';
import { Link } from 'react-router-dom';

interface FollowStatsProps {
  username: string;
  followersCount: number;
  followingCount: number;
  showLinks?: boolean;
  className?: string;
}

const FollowStats: React.FC<FollowStatsProps> = ({
  username,
  followersCount,
  followingCount,
  showLinks = true,
  className = ''
}) => {
  const StatItem = ({ count, label, to }: { count: number; label: string; to?: string }) => {
    const content = (
      <>
        <span className="font-bold text-gray-900 dark:text-white">{count.toLocaleString()}</span>
        <span className="text-gray-500 dark:text-gray-400 ml-1">{label}</span>
      </>
    );

    if (showLinks && to) {
      return (
        <Link
          to={to}
          className="hover:underline focus:outline-none focus:underline"
        >
          {content}
        </Link>
      );
    }

    return <span>{content}</span>;
  };

  return (
    <div className={`flex items-center gap-4 text-sm ${className}`}>
      <StatItem
        count={followersCount}
        label={followersCount === 1 ? 'follower' : 'followers'}
        to={showLinks ? `/users/${username}/followers` : undefined}
      />
      <span className="text-gray-300 dark:text-gray-600">•</span>
      <StatItem
        count={followingCount}
        label="following"
        to={showLinks ? `/users/${username}/following` : undefined}
      />
    </div>
  );
};

export default FollowStats;