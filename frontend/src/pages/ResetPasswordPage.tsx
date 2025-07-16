import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { KeyIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import axios from 'axios'

interface ResetPasswordForm {
  new_password: string
  confirm_password: string
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const token = searchParams.get('token')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordForm>()

  const new_password = watch('new_password')

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token')
    }
  }, [token])

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) return

    setLoading(true)
    setError('')
    
    try {
      await axios.post('http://localhost:8000/api/v1/auth/reset-password', {
        token,
        new_password: data.new_password
      })
      setSuccess(true)
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.detail?.includes('expired')) {
        setError('Your reset link has expired. Please request a new one.')
      } else {
        setError(err.response?.data?.detail || 'Failed to reset password. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500 dark:text-green-400" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Password Reset Successfully
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Your password has been reset. You can now sign in with your new password.
            </p>
            <div className="mt-6">
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                Sign In Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!token || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <ExclamationCircleIcon className="mx-auto h-16 w-16 text-red-500 dark:text-red-400" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Invalid Reset Link
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {error || 'This password reset link is invalid or has expired.'}
            </p>
            <div className="mt-6 space-x-4">
              <Link
                to="/forgot-password"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                Request New Link
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <KeyIcon className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter your new password below
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4">
              <div className="text-sm text-red-700 dark:text-red-400">{error}</div>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                New Password
              </label>
              <input
                {...register('new_password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' }
                })}
                type="password"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your new password"
              />
              {errors.new_password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.new_password.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm New Password
              </label>
              <input
                {...register('confirm_password', {
                  required: 'Please confirm your password',
                  validate: value => value === new_password || 'Passwords do not match'
                })}
                type="password"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirm your new password"
              />
              {errors.confirm_password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirm_password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}