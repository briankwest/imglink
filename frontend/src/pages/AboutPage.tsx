import { Link } from 'react-router-dom'
import { 
  CameraIcon, 
  CloudArrowUpIcon, 
  ShieldCheckIcon, 
  SparklesIcon,
  UserGroupIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline'

const features = [
  {
    name: 'Easy Upload',
    description: 'Drag and drop or click to upload. Support for JPEG, PNG, GIF, and WebP formats.',
    icon: CloudArrowUpIcon,
  },
  {
    name: 'Privacy First',
    description: 'Control who sees your images with public, private, and unlisted sharing options.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Smart Organization',
    description: 'Create albums, add tags, and organize your images the way you want.',
    icon: SparklesIcon,
  },
  {
    name: 'Community Features',
    description: 'Connect with other users through comments, likes, and sharing.',
    icon: UserGroupIcon,
  },
  {
    name: 'Lightning Fast',
    description: 'Optimized image delivery with automatic thumbnails and CDN support.',
    icon: RocketLaunchIcon,
  },
  {
    name: 'Free Forever',
    description: 'Core features will always be free. No hidden costs or surprise charges.',
    icon: CameraIcon,
  },
]

const stats = [
  { name: 'Active Users', value: '10,000+' },
  { name: 'Images Uploaded', value: '1M+' },
  { name: 'Uptime', value: '99.9%' },
  { name: 'Response Time', value: '<100ms' },
]

export default function AboutPage() {
  return (
    <div className="bg-white dark:bg-gray-900">
      {/* Hero section */}
      <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 pb-32">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 mix-blend-multiply" />
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl lg:text-6xl">
            About ImgLink
          </h1>
          <p className="mt-6 max-w-3xl text-xl text-indigo-100">
            We're building the best image sharing platform on the web. Simple, fast, and designed with your privacy in mind.
          </p>
        </div>
      </div>

      {/* Mission section */}
      <div className="relative -mt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div className="px-6 py-12 sm:px-12">
            <div className="lg:grid lg:grid-cols-2 lg:gap-8">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
                  Our Mission
                </h2>
                <p className="mt-6 text-lg text-gray-500 dark:text-gray-400">
                  ImgLink was created to provide a modern, privacy-focused alternative to existing image hosting services. 
                  We believe that sharing images online should be simple, fast, and respect your privacy.
                </p>
                <p className="mt-6 text-lg text-gray-500 dark:text-gray-400">
                  Whether you're a photographer sharing your portfolio, a developer documenting your work, or just someone 
                  who wants to share memories with friends, ImgLink provides the tools you need without the complexity.
                </p>
              </div>
              <div className="mt-12 lg:mt-0">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
                  Our Values
                </h2>
                <dl className="mt-6 space-y-6">
                  <div>
                    <dt className="text-lg font-medium text-gray-900 dark:text-white">Privacy</dt>
                    <dd className="mt-1 text-gray-500 dark:text-gray-400">Your images belong to you. We never sell your data or use your images for advertising.</dd>
                  </div>
                  <div>
                    <dt className="text-lg font-medium text-gray-900 dark:text-white">Simplicity</dt>
                    <dd className="mt-1 text-gray-500 dark:text-gray-400">No unnecessary features or complicated interfaces. Just what you need to share images.</dd>
                  </div>
                  <div>
                    <dt className="text-lg font-medium text-gray-900 dark:text-white">Performance</dt>
                    <dd className="mt-1 text-gray-500 dark:text-gray-400">Fast uploads, quick page loads, and optimized image delivery worldwide.</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features section */}
      <div className="py-24 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              Why Choose ImgLink?
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400">
              Everything you need to upload, manage, and share your images.
            </p>
          </div>

          <div className="mt-20">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.name} className="relative">
                  <div className="flow-root bg-white dark:bg-gray-700 rounded-lg px-6 pb-8 h-full shadow-lg">
                    <div className="-mt-6">
                      <div>
                        <span className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-md shadow-lg">
                          <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                        </span>
                      </div>
                      <h3 className="mt-8 text-lg font-medium text-gray-900 dark:text-white tracking-tight">{feature.name}</h3>
                      <p className="mt-5 text-base text-gray-500 dark:text-gray-400">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats section */}
      <div className="bg-indigo-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Trusted by thousands of users
            </h2>
            <p className="mt-3 text-xl text-indigo-200 sm:mt-4">
              Our platform is growing every day
            </p>
          </div>
          <dl className="mt-10 text-center sm:max-w-3xl sm:mx-auto sm:grid sm:grid-cols-4 sm:gap-8">
            {stats.map((stat) => (
              <div key={stat.name} className="flex flex-col mt-10 sm:mt-0">
                <dt className="order-2 mt-2 text-lg leading-6 font-medium text-indigo-200">{stat.name}</dt>
                <dd className="order-1 text-5xl font-extrabold text-white">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* CTA section */}
      <div className="bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block text-indigo-600">Create your free account today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Get started
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 dark:bg-gray-800 dark:text-indigo-400 dark:hover:bg-gray-700"
              >
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}