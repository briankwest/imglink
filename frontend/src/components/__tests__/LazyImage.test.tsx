import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import LazyImage from '../LazyImage'

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    // Immediately trigger callback for testing
    setTimeout(() => {
      callback([{ isIntersecting: true }] as IntersectionObserverEntry[], this)
    }, 100)
  }
  
  observe() {}
  disconnect() {}
  unobserve() {}
}

describe('LazyImage Component', () => {
  const defaultProps = {
    src: 'https://example.com/image.jpg',
    alt: 'Test image',
  }

  test('renders with loading state initially', () => {
    render(<LazyImage {...defaultProps} />)
    
    // Should show loading skeleton
    expect(screen.getByTestId('lazy-image-loading')).toBeInTheDocument()
  })

  test('shows thumbnail first when provided', async () => {
    const props = {
      ...defaultProps,
      thumbnailSrc: 'https://example.com/thumbnail.jpg',
    }
    
    render(<LazyImage {...props} />)
    
    // Should eventually load the thumbnail
    await waitFor(() => {
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('src', expect.stringContaining('thumbnail.jpg'))
    })
  })

  test('applies custom className', () => {
    const customClass = 'custom-image-class'
    render(<LazyImage {...defaultProps} className={customClass} />)
    
    const container = screen.getByTestId('lazy-image-container')
    expect(container).toHaveClass(customClass)
  })

  test('handles aspect ratio correctly', () => {
    render(<LazyImage {...defaultProps} aspectRatio="square" />)
    
    const container = screen.getByTestId('lazy-image-container')
    expect(container).toHaveClass('aspect-square')
  })

  test('handles loading error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    render(<LazyImage {...defaultProps} src="invalid-url" />)
    
    // Simulate image load error
    const img = await screen.findByRole('img')
    img.dispatchEvent(new Event('error'))
    
    // Should show error state
    await waitFor(() => {
      expect(screen.getByTestId('lazy-image-error')).toBeInTheDocument()
    })
    
    consoleSpy.mockRestore()
  })

  test('handles successful image load', async () => {
    render(<LazyImage {...defaultProps} />)
    
    // Wait for intersection observer to trigger
    await waitFor(() => {
      const img = screen.getByRole('img')
      img.dispatchEvent(new Event('load'))
    })
    
    // Should show loaded image
    await waitFor(() => {
      expect(screen.queryByTestId('lazy-image-loading')).not.toBeInTheDocument()
    })
  })
})

describe('LazyImage Accessibility', () => {
  test('has proper alt text', () => {
    render(<LazyImage src="test.jpg" alt="Test description" />)
    
    expect(screen.getByAltText('Test description')).toBeInTheDocument()
  })

  test('supports loading attribute', () => {
    render(<LazyImage src="test.jpg" alt="Test" loading="eager" />)
    
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('loading', 'eager')
  })
})

describe('LazyImage Performance', () => {
  test('only loads image when in viewport', () => {
    const mockObserver = jest.fn()
    
    global.IntersectionObserver = class {
      constructor(callback: IntersectionObserverCallback) {
        mockObserver(callback)
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    }
    
    render(<LazyImage src="test.jpg" alt="Test" />)
    
    // Should have created intersection observer
    expect(mockObserver).toHaveBeenCalled()
  })
})