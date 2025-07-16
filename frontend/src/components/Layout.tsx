import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import axios from 'axios'

export default function Layout() {
  const { accessToken, isAuthenticated, fetchCurrentUser } = useAuthStore()

  useEffect(() => {
    if (accessToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
      if (isAuthenticated) {
        fetchCurrentUser().catch(() => {
          // Handle error silently, user might need to re-login
        })
      }
    }
  }, [accessToken, isAuthenticated, fetchCurrentUser])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}