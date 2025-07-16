import { useState } from 'react'
import { EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitMessage(null)

    // In a real app, this would send the form data to your backend
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // For demo purposes, just show success
      setSubmitMessage({
        type: 'success',
        text: 'Thank you for your message! We\'ll get back to you soon.'
      })
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      })
    } catch (error) {
      setSubmitMessage({
        type: 'error',
        text: 'Sorry, there was an error sending your message. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Contact Us
          </h1>
          <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
            Have a question or feedback? We'd love to hear from you.
          </p>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-16 lg:grid-cols-2">
          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
              Get in Touch
            </h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
              Whether you have a question about features, pricing, need a demo, or anything else, our team is ready to answer all your questions.
            </p>

            <dl className="mt-8 space-y-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <EnvelopeIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-3 text-base text-gray-500 dark:text-gray-400">
                  <p>support@imglink.com</p>
                  <p className="mt-1">We'll respond within 24 hours</p>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0">
                  <PhoneIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-3 text-base text-gray-500 dark:text-gray-400">
                  <p>+1 (555) 123-4567</p>
                  <p className="mt-1">Mon-Fri 9am to 6pm PST</p>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0">
                  <MapPinIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-3 text-base text-gray-500 dark:text-gray-400">
                  <p>123 Tech Street</p>
                  <p>San Francisco, CA 94105</p>
                </div>
              </div>
            </dl>

            {/* FAQ Section */}
            <div className="mt-12">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Frequently Asked Questions</h3>
              <div className="mt-6 space-y-6">
                <div>
                  <h4 className="text-base font-medium text-gray-900 dark:text-white">How do I delete my account?</h4>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    You can delete your account from your profile settings. All your data will be permanently removed.
                  </p>
                </div>
                <div>
                  <h4 className="text-base font-medium text-gray-900 dark:text-white">Is there a file size limit?</h4>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Yes, the maximum file size is 20MB per image. We support JPEG, PNG, GIF, and WebP formats.
                  </p>
                </div>
                <div>
                  <h4 className="text-base font-medium text-gray-900 dark:text-white">Can I recover deleted images?</h4>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Unfortunately, deleted images cannot be recovered. Please make sure to keep backups of important images.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-6 py-8 sm:px-10">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6">
              Send us a Message
            </h2>

            {submitMessage && (
              <div className={`mb-6 p-4 rounded-md ${
                submitMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {submitMessage.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Subject
                </label>
                <select
                  name="subject"
                  id="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="bug">Report a Bug</option>
                  <option value="feature">Feature Request</option>
                  <option value="business">Business Inquiry</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Message
                </label>
                <textarea
                  name="message"
                  id="message"
                  rows={6}
                  required
                  value={formData.message}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Tell us more about how we can help you..."
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    isSubmitting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  }`}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}