import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  UsersIcon, 
  PhotoIcon, 
  ChatBubbleLeftIcon, 
  HeartIcon,
  ChartBarIcon,
  TrashIcon,
  UserIcon,
  LockClosedIcon,
  LockOpenIcon,
  CheckBadgeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'
import axios from 'axios'

interface PlatformStats {
  total_users: number
  total_images: number
  total_public_images: number
  total_private_images: number
  total_unlisted_images: number
  total_comments: number
  total_likes: number
  top_uploaders: Array<{ username: string; image_count: number }>
  recent_activity: {
    new_users: number
    new_images: number
    new_comments: number
  }
}

interface User {
  id: number
  username: string
  email: string
  full_name?: string
  is_active: boolean
  is_verified: boolean
  is_superuser: boolean
  created_at: string
}

interface Image {
  id: number
  title?: string
  url: string
  thumbnail_url?: string
  privacy: string
  views: number
  like_count: number
  created_at: string
}

export default function AdminPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated || !user?.is_superuser) {
      navigate('/')
      return
    }
    fetchStats()
  }, [isAuthenticated, user, navigate])

  const fetchStats = async () => {
    try {
      // Ensure auth header is set before making request
      const token = useAuthStore.getState().accessToken
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }
      
      const response = await axios.get('/api/v1/admin/stats')
      setStats(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      // Ensure auth header is set before making request
      const token = useAuthStore.getState().accessToken
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }
      
      const response = await axios.get('/api/v1/admin/users')
      setUsers(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load users')
    }
  }

  const fetchImages = async () => {
    try {
      // Ensure auth header is set before making request
      const token = useAuthStore.getState().accessToken
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }
      
      const response = await axios.get('/api/v1/admin/images')
      setImages(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load images')
    }
  }

  const toggleUserActive = async (userId: number) => {
    try {
      // Ensure auth header is set before making request
      const token = useAuthStore.getState().accessToken
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }
      
      await axios.put(`/api/v1/admin/users/${userId}/toggle-active`)
      fetchUsers() // Refresh users list
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update user status')
    }
  }

  const toggleUserVerified = async (userId: number) => {
    try {
      // Ensure auth header is set before making request
      const token = useAuthStore.getState().accessToken
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }
      
      await axios.put(`/api/v1/admin/users/${userId}/toggle-verified`)
      fetchUsers() // Refresh users list
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update user verification status')
    }
  }

  const deleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This will also delete all their images, albums, comments, and likes. This action cannot be undone.')) {
      return
    }

    try {
      // Ensure auth header is set before making request
      const token = useAuthStore.getState().accessToken
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }
      
      await axios.delete(`/api/v1/admin/users/${userId}`)
      fetchUsers() // Refresh users list
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete user')
    }
  }

  const deleteImage = async (imageId: number) => {
    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return
    }

    try {
      await axios.delete(`/api/v1/admin/images/${imageId}`)
      fetchImages() // Refresh images list
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete image')
    }
  }

  if (!isAuthenticated || !user?.is_superuser) {
    return null
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
        <p className="text-gray-600 dark:text-gray-400">Platform management and statistics</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'dashboard', name: 'Dashboard', icon: ChartBarIcon },
            { id: 'users', name: 'Users', icon: UsersIcon },
            { id: 'images', name: 'Images', icon: PhotoIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                if (tab.id === 'users' && users.length === 0) fetchUsers()
                if (tab.id === 'images' && images.length === 0) fetchImages()
              }}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && stats && (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <UsersIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_users}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Users</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <PhotoIcon className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_images}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Images</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <ChatBubbleLeftIcon className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_comments}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Comments</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <HeartIcon className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_likes}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Likes</div>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Image Privacy Breakdown</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.total_public_images}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Public</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.total_unlisted_images}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Unlisted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.total_private_images}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Private</div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Activity (24h)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.recent_activity.new_users}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">New Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.recent_activity.new_images}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">New Images</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.recent_activity.new_comments}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">New Comments</div>
              </div>
            </div>
          </div>

          {/* Top Uploaders */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Top Uploaders</h3>
            <div className="space-y-2">
              {stats.top_uploaders.map((uploader, index) => (
                <div key={uploader.username} className="flex justify-between items-center">
                  <span className="text-sm text-gray-900 dark:text-white">
                    #{index + 1} {uploader.username}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {uploader.image_count} images
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">User Management</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Verified</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserIcon className="h-8 w-8 text-gray-400" />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</div>
                          {user.full_name && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">{user.full_name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_verified ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.is_verified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_superuser ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.is_superuser ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggleUserActive(user.id)}
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            user.is_active
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                          title={user.is_active ? 'Deactivate user' : 'Activate user'}
                        >
                          {user.is_active ? (
                            <LockClosedIcon className="h-3 w-3" />
                          ) : (
                            <LockOpenIcon className="h-3 w-3" />
                          )}
                        </button>
                        <button
                          onClick={() => toggleUserVerified(user.id)}
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            user.is_verified
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                          title={user.is_verified ? 'Unverify user' : 'Verify user'}
                        >
                          {user.is_verified ? (
                            <XMarkIcon className="h-3 w-3" />
                          ) : (
                            <CheckBadgeIcon className="h-3 w-3" />
                          )}
                        </button>
                        {!user.is_superuser && (
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200"
                            title="Delete user"
                          >
                            <TrashIcon className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Images Tab */}
      {activeTab === 'images' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Image Management</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
            {images.map((image) => (
              <div key={image.id} className="relative bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
                <img
                  src={image.thumbnail_url || image.url}
                  alt={image.title || 'Image'}
                  className="w-full h-32 object-cover"
                />
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {image.title || 'Untitled'}
                  </h3>
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className={`px-2 py-1 rounded ${
                      image.privacy === 'public' ? 'bg-green-100 text-green-800' :
                      image.privacy === 'private' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {image.privacy}
                    </span>
                    <span>{image.views} views</span>
                  </div>
                  <button
                    onClick={() => deleteImage(image.id)}
                    className="mt-2 w-full inline-flex items-center justify-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                  >
                    <TrashIcon className="h-3 w-3 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}