import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setTokens } = useAuthStore()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const error = searchParams.get('error')

    if (error) {
      setStatus('error')
      switch (error) {
        case 'oauth_failed':
          setMessage('OAuth authentication failed. Please try again.')
          break
        case 'no_email':
          setMessage('Your account does not have a public email address. Please make your email public on GitHub or use a different sign-in method.')
          break
        default:
          setMessage('Authentication failed. Please try again.')
      }
    } else if (accessToken && refreshToken) {
      // Set tokens in store
      setTokens(accessToken, refreshToken)
      setStatus('success')
      setMessage('Successfully signed in! Redirecting to dashboard...')
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } else {
      setStatus('error')
      setMessage('Invalid authentication response.')
    }
  }, [searchParams, navigate, setTokens])

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing authentication...</h2>
            <p className="text-gray-600">Please wait while we complete your sign-in.</p>
          </div>
        )

      case 'success':
        return (
          <div className="text-center">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to ImgLink!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="animate-pulse">
              <div className="h-2 bg-indigo-200 rounded-full w-48 mx-auto">
                <div className="h-2 bg-indigo-600 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        )

      case 'error':
      default:
        return (
          <div className="text-center">
            <ExclamationCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Home
              </button>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {renderContent()}
      </div>
    </div>
  )
}