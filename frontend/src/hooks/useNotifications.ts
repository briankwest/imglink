import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuthStore } from '../store/authStore'

interface Notification {
  id: string
  type: 'comment' | 'like' | 'follow' | 'system'
  title: string
  message: string
  timestamp: string
  read: boolean
  data?: any
}

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  isConnected: boolean
  markAsRead: (notificationId: string) => void
  clearAll: () => void
}

export function useNotifications(): UseNotificationsReturn {
  const { accessToken, isAuthenticated } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectAttemptsRef = useRef(0)

  // Fetch existing notifications from REST API
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !accessToken) return

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/v1/notifications/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const fetchedNotifications: Notification[] = data.map((n: any) => ({
          id: n.id.toString(),
          type: n.type,
          title: n.title,
          message: n.message,
          timestamp: n.created_at,
          read: n.read,
          data: n.data
        }))
        setNotifications(fetchedNotifications)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }, [isAuthenticated, accessToken])

  const connect = useCallback(() => {
    if (!isAuthenticated || !accessToken || wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }
    
    // Prevent multiple simultaneous connection attempts
    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket connection already in progress')
      return
    }

    try {
      // Construct WebSocket URL with token
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const wsUrl = apiUrl
        .replace(/^http/, 'ws')
        .replace(/^https/, 'wss') + '/api/v1/ws/notifications?token=' + accessToken
      
      console.log('Connecting to WebSocket:', wsUrl)
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        reconnectAttemptsRef.current = 0
        
        // Fetch existing notifications when connected
        fetchNotifications()
        
        // Send heartbeat every 30 seconds
        const heartbeatInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'heartbeat' }))
          }
        }, 30000)
        
        // Store interval ID for cleanup
        ;(ws as any).heartbeatInterval = heartbeatInterval
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          // Handle different message types
          switch (data.type) {
            case 'connection':
              console.log('Connected to notification service')
              break
              
            case 'notification':
              // Add new notification to the list
              const newNotification: Notification = {
                id: data.id || `${Date.now()}`,
                type: data.notification_type || 'system',
                title: data.title,
                message: data.message,
                timestamp: data.timestamp || new Date().toISOString(),
                read: false,
                data: data.data
              }
              
              setNotifications(prev => [newNotification, ...prev])
              
              // Play notification sound using a simple beep
              try {
                // Create a simple notification sound using Web Audio API
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
                const oscillator = audioContext.createOscillator()
                const gainNode = audioContext.createGain()
                
                oscillator.connect(gainNode)
                gainNode.connect(audioContext.destination)
                
                oscillator.frequency.value = 800 // Frequency in Hz
                gainNode.gain.value = 0.1 // Volume (10%)
                
                oscillator.start()
                oscillator.stop(audioContext.currentTime + 0.1) // Play for 100ms
              } catch (error) {
                console.log('Could not play notification sound:', error)
              }
              
              // Show browser notification if permitted
              if (Notification.permission === 'granted') {
                new Notification(newNotification.title, {
                  body: newNotification.message,
                  icon: '/favicon.png'
                })
              }
              break
              
            case 'heartbeat':
              // Heartbeat response received
              break
              
            case 'online_users':
              // Handle online users list if needed
              console.log('Online users:', data.users)
              break
              
            default:
              console.log('Unknown message type:', data.type)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        if (event.code === 4001) {
          console.error('WebSocket authentication failed:', event.reason)
        }
        setIsConnected(false)
        
        // Clear heartbeat interval
        if ((ws as any).heartbeatInterval) {
          clearInterval((ws as any).heartbeatInterval)
        }
        
        // Attempt to reconnect with exponential backoff, but only for connection errors
        if (isAuthenticated && reconnectAttemptsRef.current < 5 && event.code !== 4001) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          console.log(`Reconnecting in ${timeout}ms... (attempt ${reconnectAttemptsRef.current + 1}/5)`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            connect()
          }, timeout)
        } else if (event.code === 4001) {
          console.error('WebSocket authentication failed, not reconnecting')
        } else if (reconnectAttemptsRef.current >= 5) {
          console.error('Max reconnection attempts reached, falling back to REST API')
          // Fall back to fetching notifications via REST API
          fetchNotifications()
        }
      }
    } catch (error) {
      console.error('Error creating WebSocket connection:', error)
    }
  }, [accessToken, isAuthenticated])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const markAsRead = useCallback(async (notificationId: string) => {
    // Optimistically update local state
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    )
    
    // Send mark as read to backend
    if (isAuthenticated && accessToken) {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
        await fetch(`${apiUrl}/api/v1/notifications/${notificationId}/read`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    }
    
    // Also send via WebSocket if connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'mark_read',
        notification_id: notificationId
      }))
    }
  }, [isAuthenticated, accessToken])

  const clearAll = useCallback(async () => {
    if (!isAuthenticated || !accessToken) return

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/v1/notifications/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        // Clear all notifications from local state
        setNotifications([])
      }
    } catch (error) {
      console.error('Error deleting all notifications:', error)
    }
  }, [isAuthenticated, accessToken])

  // Connect when authenticated and fetch notifications as fallback
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      // Try to connect to WebSocket
      const timer = setTimeout(() => {
        connect()
      }, 1000)
      
      // Always fetch notifications via REST API as fallback
      const fallbackTimer = setTimeout(() => {
        fetchNotifications()
      }, 2000)
      
      return () => {
        clearTimeout(timer)
        clearTimeout(fallbackTimer)
        disconnect()
      }
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [isAuthenticated, accessToken, connect, disconnect, fetchNotifications])

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    clearAll
  }
}