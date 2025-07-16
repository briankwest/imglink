import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import axios from 'axios'

export interface CommentAuthor {
  id: number
  username: string
  avatar_url?: string
}

export interface Comment {
  id: number
  content: string
  image_id: number
  user_id: number
  parent_id?: number
  created_at: string
  updated_at: string
  author: CommentAuthor
  replies: Comment[]
}

export const useComments = (imageId: number) => {
  const { isAuthenticated, accessToken, user } = useAuthStore()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ws, setWs] = useState<WebSocket | null>(null)
  
  // Use refs to store current functions to avoid WebSocket recreation
  const addCommentRef = useRef<(comment: Comment) => void>()
  const updateCommentRef = useRef<(comment: Comment) => void>()
  const removeCommentRef = useRef<(commentId: number) => void>()

  // Fetch comments from API
  const fetchComments = useCallback(async () => {
    try {
      const response = await axios.get(`/api/v1/images/${imageId}/comments`)
      setComments(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load comments')
    } finally {
      setLoading(false)
    }
  }, [imageId])

  // Add new comment to state (with duplicate check)
  const addComment = useCallback((newComment: Comment) => {
    if (newComment.parent_id) {
      // This is a reply - add to parent's replies
      const addReplyToComment = (comments: Comment[]): Comment[] => {
        return comments.map(comment => {
          if (comment.id === newComment.parent_id) {
            // Check if reply already exists
            const replyExists = comment.replies?.some(reply => reply.id === newComment.id)
            if (replyExists) {
              // console.log('Preventing duplicate reply:', newComment.id)
              return comment // Don't add duplicate
            }
            return {
              ...comment,
              replies: [...(comment.replies || []), newComment]
            }
          } else if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: addReplyToComment(comment.replies)
            }
          }
          return comment
        })
      }
      setComments(prev => addReplyToComment(prev))
    } else {
      // This is a top-level comment - check if it already exists
      setComments(prev => {
        const commentExists = prev.some(comment => comment.id === newComment.id)
        if (commentExists) {
          // console.log('Preventing duplicate top-level comment:', newComment.id)
          return prev // Don't add duplicate
        }
        return [...prev, newComment]
      })
    }
  }, [])

  // Update ref
  addCommentRef.current = addComment

  // Update existing comment in state
  const updateComment = useCallback((updatedComment: Comment) => {
    const updateCommentInTree = (comments: Comment[]): Comment[] => {
      return comments.map(comment => {
        if (comment.id === updatedComment.id) {
          return { ...comment, ...updatedComment }
        } else if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: updateCommentInTree(comment.replies)
          }
        }
        return comment
      })
    }
    setComments(prev => updateCommentInTree(prev))
  }, [])

  // Update ref
  updateCommentRef.current = updateComment

  // Remove comment from state
  const removeComment = useCallback((commentId: number) => {
    const removeCommentFromTree = (comments: Comment[]): Comment[] => {
      return comments.filter(comment => {
        if (comment.id === commentId) {
          return false
        }
        if (comment.replies && comment.replies.length > 0) {
          comment.replies = removeCommentFromTree(comment.replies)
        }
        return true
      })
    }
    setComments(prev => removeCommentFromTree(prev))
  }, [])

  // Update ref
  removeCommentRef.current = removeComment

  // WebSocket connection management
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return

    const connectWebSocket = () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const wsUrl = apiUrl.replace('http://', 'ws://').replace('https://', 'wss://')
      
      const websocket = new WebSocket(`${wsUrl}/api/v1/ws/notifications?token=${accessToken}`)
      
      websocket.onopen = () => {
        console.log('WebSocket connected for comments')
        setWs(websocket)
        
        // Join the image room
        websocket.send(JSON.stringify({
          type: 'join_room',
          room_id: `image_${imageId}`
        }))
      }
      
      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'new_comment') {
            // Only add if this comment is not from the current user (to prevent duplicates)
            if (user && data.comment.user_id !== user.id) {
              addCommentRef.current?.(data.comment)
            }
          } else if (data.type === 'edit_comment') {
            console.log('Edit message received:', {
              messageUserId: data.comment.user_id,
              currentUserId: user?.id,
              currentUsername: user?.username,
              shouldProcess: user && data.comment.user_id !== user.id,
              comment: data.comment
            })
            // Only update if this comment is not from the current user (to prevent duplicates)
            if (user && data.comment.user_id !== user.id) {
              console.log('Processing edit update')
              updateCommentRef.current?.(data.comment)
            } else {
              console.log('Skipping edit update - same user or no user')
            }
          } else if (data.type === 'delete_comment') {
            // For deletes, we only get the comment_id, so we need to check if we should process it
            // Since we can't check the author_id from comment_id alone, we'll process all delete events
            // The backend should already exclude the author from receiving delete events
            removeCommentRef.current?.(data.comment_id)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }
      
      websocket.onclose = () => {
        console.log('WebSocket disconnected')
        setWs(null)
        
        // Reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000)
      }
      
      websocket.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    }
    
    connectWebSocket()
    
    // Cleanup on unmount
    return () => {
      if (ws) {
        // Leave the room before disconnecting
        ws.send(JSON.stringify({
          type: 'leave_room',
          room_id: `image_${imageId}`
        }))
        ws.close()
      }
    }
  }, [isAuthenticated, accessToken, imageId, user])

  // Fetch comments on mount
  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  // Submit new comment
  const submitComment = useCallback(async (content: string, parentId?: number) => {
    try {
      const response = await axios.post(`/api/v1/images/${imageId}/comments`, {
        content,
        parent_id: parentId
      })
      
      // Add to local state immediately for the author
      addComment(response.data)
      
      return response.data
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || 'Failed to post comment')
    }
  }, [imageId, addComment])

  // Edit comment
  const editComment = useCallback(async (commentId: number, content: string) => {
    try {
      const response = await axios.put(`/api/v1/images/comments/${commentId}`, { content })
      
      // Update local state immediately for the author
      updateComment(response.data)
      
      return response.data
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || 'Failed to update comment')
    }
  }, [updateComment])

  // Delete comment
  const deleteComment = useCallback(async (commentId: number) => {
    try {
      await axios.delete(`/api/v1/images/comments/${commentId}`)
      
      // Remove from local state immediately for the author
      removeComment(commentId)
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || 'Failed to delete comment')
    }
  }, [removeComment])

  return {
    comments,
    loading,
    error,
    submitComment,
    editComment,
    deleteComment,
    refetch: fetchComments,
  }
}