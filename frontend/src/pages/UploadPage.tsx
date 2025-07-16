import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { PhotoIcon, ArrowUpTrayIcon, XMarkIcon, EyeIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'
import axios from 'axios'

interface FileWithPreview extends File {
  preview: string
  id: string
}

export default function UploadPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [defaultPrivacy, setDefaultPrivacy] = useState<'public' | 'private' | 'unlisted'>('public')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(7)
    }))
    setFiles(prev => [...prev, ...newFiles])
    setError('')
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true,
    maxFiles: 10,
    maxSize: 20 * 1024 * 1024, // 20MB
    onDrop,
    onDropRejected: (rejectedFiles) => {
      const errors = rejectedFiles.map(file => 
        file.errors.map(error => error.message).join(', ')
      ).join('; ')
      setError(`Upload failed: ${errors}`)
    },
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  })

  const removeFile = (index: number) => {
    const fileToRemove = files[index]
    URL.revokeObjectURL(fileToRemove.preview)
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const clearAllFiles = () => {
    files.forEach(file => URL.revokeObjectURL(file.preview))
    setFiles([])
    setUploadProgress({})
  }

  const uploadFiles = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (files.length === 0) {
      setError('Please select at least one file to upload')
      return
    }

    setUploading(true)
    setError('')

    try {
      const uploadPromises = files.map(async (file, index) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('title', file.name.split('.')[0])
        formData.append('privacy', defaultPrivacy)

        const response = await axios.post('http://localhost:8000/api/v1/images/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              )
              setUploadProgress(prev => ({
                ...prev,
                [file.id]: percentCompleted
              }))
            }
          }
        })

        return response.data
      })

      const results = await Promise.all(uploadPromises)
      
      // Navigate to the first uploaded image or dashboard if multiple
      if (results.length === 1) {
        navigate(`/image/${results[0].id}`)
      } else {
        navigate('/dashboard')
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
      setUploadProgress({})
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Sign in required</h3>
        <p className="mt-1 text-sm text-gray-500">
          You need to sign in to upload images.
        </p>
        <div className="mt-6">
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Upload Images</h1>
        <p className="mt-2 text-gray-600">
          Share your images with the world. Supports JPEG, PNG, GIF, and WebP formats up to 20MB each.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* File Drop Zone */}
      <div
        {...getRootProps()}
        className={`mb-6 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive || dragActive
            ? 'border-indigo-500 bg-indigo-50 scale-105'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <ArrowUpTrayIcon className={`mx-auto h-12 w-12 transition-colors ${
          isDragActive || dragActive ? 'text-indigo-500' : 'text-gray-400'
        }`} />
        {isDragActive || dragActive ? (
          <div>
            <p className="mt-2 text-sm text-indigo-600 font-medium">Drop the files here!</p>
            <p className="text-xs text-indigo-500">Release to upload</p>
          </div>
        ) : (
          <div>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG, GIF, WebP up to 20MB each (max 10 files)
            </p>
          </div>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Selected Files ({files.length})
            </h3>
            {files.length > 1 && !uploading && (
              <button
                onClick={clearAllFiles}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Clear All
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file, index) => (
              <div
                key={file.id}
                className="relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Image Preview */}
                <div className="aspect-square bg-gray-100">
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Progress Overlay */}
                  {uploadProgress[file.id] !== undefined && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full border-4 border-white border-t-transparent animate-spin mb-2"></div>
                        <p className="text-white text-sm font-medium">
                          {uploadProgress[file.id]}%
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* File Info */}
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                {/* Actions */}
                {!uploading && (
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <button
                      onClick={() => window.open(file.preview, '_blank')}
                      className="p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                      title="Preview"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                      title="Remove"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Privacy Settings */}
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Upload Settings</h3>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Privacy Setting for All Images
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <label className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                    defaultPrivacy === 'public' ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="privacy"
                      value="public"
                      checked={defaultPrivacy === 'public'}
                      onChange={(e) => setDefaultPrivacy(e.target.value as any)}
                      className="sr-only"
                    />
                    <div className="flex flex-col">
                      <span className="block text-sm font-medium text-gray-900">Public</span>
                      <span className="mt-1 flex items-center text-xs text-gray-500">
                        Anyone can view
                      </span>
                    </div>
                  </label>

                  <label className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                    defaultPrivacy === 'unlisted' ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="privacy"
                      value="unlisted"
                      checked={defaultPrivacy === 'unlisted'}
                      onChange={(e) => setDefaultPrivacy(e.target.value as any)}
                      className="sr-only"
                    />
                    <div className="flex flex-col">
                      <span className="block text-sm font-medium text-gray-900">Unlisted</span>
                      <span className="mt-1 flex items-center text-xs text-gray-500">
                        Only with link
                      </span>
                    </div>
                  </label>

                  <label className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                    defaultPrivacy === 'private' ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="privacy"
                      value="private"
                      checked={defaultPrivacy === 'private'}
                      onChange={(e) => setDefaultPrivacy(e.target.value as any)}
                      className="sr-only"
                    />
                    <div className="flex flex-col">
                      <span className="block text-sm font-medium text-gray-900">Private</span>
                      <span className="mt-1 flex items-center text-xs text-gray-500">
                        Only you can view
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {showAdvanced && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Privacy Options Explained:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li><strong>Public:</strong> Images appear in galleries and search results</li>
                      <li><strong>Unlisted:</strong> Images are accessible via direct link only</li>
                      <li><strong>Private:</strong> Only you can view these images</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <div className="text-center">
          <button
            onClick={uploadFiles}
            disabled={uploading}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                Uploading...
              </>
            ) : (
              <>
                <ArrowUpTrayIcon className="-ml-1 mr-2 h-5 w-5" />
                Upload {files.length} {files.length === 1 ? 'Image' : 'Images'}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}