import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { ChatBubbleLeftIcon, PencilIcon, TrashIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'
import axios from 'axios'

interface CommentAuthor {
  id: number
  username: string
  avatar_url?: string
}

interface Comment {
  id: number
  content: string
  image_id: number
  author_id: number
  parent_id?: number
  created_at: string
  updated_at: string
  author: CommentAuthor
  replies: Comment[]
}

interface CommentForm {
  content: string
}

interface CommentsProps {
  imageId: number
}

interface CommentItemProps {
  comment: Comment
  imageId: number
  onReply: (commentId: number) => void
  onEdit: (commentId: number, content: string) => void
  onDelete: (commentId: number) => void
  replyingTo?: number
  onCancelReply?: () => void
}

function CommentItem({ comment, imageId, onReply, onEdit, onDelete, replyingTo, onCancelReply }: CommentItemProps) {
  const { user, isAuthenticated } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [replyContent, setReplyContent] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)

  const isAuthor = user && comment.author_id === user.id
  const isReplying = replyingTo === comment.id

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleEdit = async () => {
    try {
      await axios.put(`/api/v1/images/comments/${comment.id}`, { content: editContent })
      onEdit(comment.id, editContent)
      setIsEditing(false)
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update comment')
    }
  }

  const handleReply = async () => {
    if (!replyContent.trim()) return

    setSubmittingReply(true)
    try {
      await axios.post(`/api/v1/images/${imageId}/comments`, {
        content: replyContent,
        parent_id: comment.id
      })
      setReplyContent('')
      onCancelReply?.()
      // Trigger refresh of comments
      window.location.reload()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to post reply')
    } finally {
      setSubmittingReply(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex space-x-3">
        <img
          src={comment.author.avatar_url || `https://ui-avatars.com/api/?name=${comment.author.username}&background=6366f1&color=fff`}
          alt={comment.author.username}
          className="h-8 w-8 rounded-full flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm text-gray-900 dark:text-white">{comment.author.username}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(comment.created_at)}</span>
                {comment.updated_at !== comment.created_at && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">(edited)</span>
                )}
              </div>
              {isAuthor && (
                <div className="flex space-x-1">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(comment.id)}
                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm resize-none"
                  rows={2}
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleEdit}
                    className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setEditContent(comment.content)
                    }}
                    className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{comment.content}</p>
            )}
          </div>
          
          {/* Reply button */}
          {!isEditing && isAuthenticated && (
            <button
              onClick={() => onReply(comment.id)}
              className="mt-2 flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <ArrowUturnLeftIcon className="h-4 w-4" />
              <span>Reply</span>
            </button>
          )}

          {/* Reply form */}
          {isReplying && (
            <div className="mt-3 space-y-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`Reply to ${comment.author.username}...`}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm resize-none"
                rows={2}
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleReply}
                  disabled={!replyContent.trim() || submittingReply}
                  className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50"
                >
                  {submittingReply ? 'Posting...' : 'Reply'}
                </button>
                <button
                  onClick={onCancelReply}
                  className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Nested replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 ml-4 space-y-3 border-l-2 border-gray-100 dark:border-gray-700 pl-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  imageId={imageId}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  replyingTo={replyingTo}
                  onCancelReply={onCancelReply}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Comments({ imageId }: CommentsProps) {
  const { isAuthenticated } = useAuthStore()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [replyingTo, setReplyingTo] = useState<number | undefined>()

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CommentForm>()

  useEffect(() => {
    fetchComments()
  }, [imageId])

  const fetchComments = async () => {
    try {
      const response = await axios.get(`/api/v1/images/${imageId}/comments`)
      setComments(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: CommentForm) => {
    try {
      await axios.post(`/api/v1/images/${imageId}/comments`, {
        content: data.content,
      })
      reset()
      fetchComments()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to post comment')
    }
  }

  const handleEdit = (commentId: number, newContent: string) => {
    setComments(prev => 
      prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, content: newContent, updated_at: new Date().toISOString() }
          : comment
      )
    )
  }

  const handleDelete = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      await axios.delete(`/api/v1/images/comments/${commentId}`)
      fetchComments()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete comment')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <ChatBubbleLeftIcon className="h-5 w-5 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Comments ({comments.length})
        </h3>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Comment form */}
      {isAuthenticated && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <textarea
            {...register('content', { required: 'Comment cannot be empty' })}
            placeholder="Write a comment..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md resize-none focus:ring-indigo-500 focus:border-indigo-500"
            rows={3}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      )}

      {/* Comments list */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <ChatBubbleLeftIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No comments yet</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {isAuthenticated ? 'Be the first to comment!' : 'Sign in to leave a comment.'}
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              imageId={imageId}
              onReply={setReplyingTo}
              onEdit={handleEdit}
              onDelete={handleDelete}
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(undefined)}
            />
          ))
        )}
      </div>
    </div>
  )
}