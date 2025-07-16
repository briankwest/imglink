import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { CheckCircleIcon, ExclamationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import axios from 'axios'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading')
  const [message, setMessage] = useState('')
  const [resendEmail, setResendEmail] = useState('')
  const [resending, setResending] = useState(false)

  const token = searchParams.get('token')

  useEffect(() => {
    if (token) {
      verifyEmail(token)
    } else {
      setStatus('error')
      setMessage('No verification token provided')
    }
  }, [token])

  const verifyEmail = async (token: string) => {
    try {
      await axios.post('http://localhost:8000/api/v1/auth/verify-email', { token })
      setStatus('success')
      setMessage('Your email has been successfully verified! You can now sign in to your account.')
    } catch (error: any) {
      if (error.response?.status === 400 && error.response?.data?.detail?.includes('expired')) {
        setStatus('expired')
        setMessage('Your verification link has expired. Please request a new one.')
      } else {
        setStatus('error')
        setMessage(error.response?.data?.detail || 'Verification failed. Please try again.')
      }
    }
  }

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resendEmail) return

    setResending(true)
    try {
      await axios.post('http://localhost:8000/api/v1/auth/resend-verification', { email: resendEmail })
      setMessage('Verification email sent! Please check your inbox.')
    } catch (error: any) {
      setMessage(error.response?.data?.detail || 'Failed to send verification email.')
    } finally {
      setResending(false)
    }
  }

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying your email...</h2>
            <p className="text-gray-600">Please wait while we verify your email address.</p>
          </div>
        )

      case 'success':
        return (
          <div className="text-center">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Sign In Now
            </Link>
          </div>
        )

      case 'expired':
        return (
          <div className="text-center">
            <ExclamationCircleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Expired</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            
            <form onSubmit={handleResendVerification} className="max-w-sm mx-auto">
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 text-left">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={resending}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending ? (
                  <>
                    <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Sending...
                  </>
                ) : (
                  'Resend Verification Email'
                )}
              </button>
            </form>
          </div>
        )

      case 'error':
      default:
        return (
          <div className="text-center">
            <ExclamationCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-x-4">
              <Link
                to="/register"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Create New Account
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Back to Sign In
              </Link>
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