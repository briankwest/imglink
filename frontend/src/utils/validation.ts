/**
 * Utility functions for validation
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate image file
 */
export function isValidImageFile(file: File): {
  isValid: boolean
  error?: string
} {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const maxSize = 20 * 1024 * 1024 // 20MB
  
  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Supported types: JPEG, PNG, GIF, WebP'
    }
  }
  
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size exceeds 20MB limit'
    }
  }
  
  return { isValid: true }
}

/**
 * Validate username
 */
export function isValidUsername(username: string): {
  isValid: boolean
  error?: string
} {
  if (username.length < 3) {
    return {
      isValid: false,
      error: 'Username must be at least 3 characters long'
    }
  }
  
  if (username.length > 50) {
    return {
      isValid: false,
      error: 'Username must not exceed 50 characters'
    }
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, underscores, and hyphens'
    }
  }
  
  return { isValid: true }
}