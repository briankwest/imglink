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

  const connect = useCallback(() => {
    if (!isAuthenticated || !accessToken || wsRef.current?.readyState === WebSocket.OPEN) {
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
        
        // Attempt to reconnect with exponential backoff
        if (isAuthenticated && reconnectAttemptsRef.current < 5) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          console.log(`Reconnecting in ${timeout}ms...`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            connect()
          }, timeout)
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

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    )
    
    // Send mark as read message to server
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'mark_read',
        notification_id: notificationId
      }))
    }
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  // Connect when authenticated and page is loaded
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      // Wait for page to be fully loaded before connecting
      if (document.readyState === 'complete') {
        // Small delay to ensure everything is initialized
        const timer = setTimeout(() => {
          connect()
        }, 500)
        return () => {
          clearTimeout(timer)
          disconnect()
        }
      } else {
        const handleLoad = () => {
          const timer = setTimeout(() => {
            connect()
          }, 500)
        }
        
        window.addEventListener('load', handleLoad)
        return () => {
          window.removeEventListener('load', handleLoad)
          disconnect()
        }
      }
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [isAuthenticated, accessToken, connect, disconnect])

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