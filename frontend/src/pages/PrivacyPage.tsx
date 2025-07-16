export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white dark:text-white mb-8">Privacy Policy</h1>
      
      <div className="prose prose-gray max-w-none">
        <p className="text-gray-600 dark:text-gray-400 mb-6">Last updated: {new Date().toLocaleDateString()}</p>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. Information We Collect</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">We collect information you provide directly to us, such as:</p>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
            <li>Account information (username, email, password)</li>
            <li>Profile information (bio, avatar)</li>
            <li>Images and content you upload</li>
            <li>Comments and interactions with other users</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. How We Use Your Information</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">We use the information we collect to:</p>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send technical notices and support messages</li>
            <li>Respond to your comments and questions</li>
            <li>Monitor and analyze trends and usage</li>
            <li>Detect and prevent fraudulent activity</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. Information Sharing</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">We do not sell, trade, or rent your personal information. We may share your information in the following situations:</p>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
            <li>With your consent</li>
            <li>To comply with legal obligations</li>
            <li>To protect rights and safety</li>
            <li>With service providers who assist in our operations</li>
            <li>In connection with a merger or acquisition</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. Data Storage and Security</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
          </p>
          <p className="text-gray-700 dark:text-gray-300 mb-4">Your data is stored on secure servers and transmitted using encryption.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. Cookies and Tracking</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">We use cookies and similar tracking technologies to:</p>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
            <li>Keep you logged in</li>
            <li>Remember your preferences</li>
            <li>Analyze site traffic and usage</li>
            <li>Personalize content</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">6. Your Rights</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">You have the right to:</p>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
            <li>Access your personal information</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Export your data</li>
            <li>Opt-out of marketing communications</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">7. Children's Privacy</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Our service is not directed to individuals under 13. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">8. International Data Transfers</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Your information may be transferred to and maintained on servers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">9. Data Retention</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy, unless a longer retention period is required by law.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">10. Changes to This Policy</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Contact Us</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
            <li>Email: privacy@imglink.com</li>
            <li>Address: [Your Company Address]</li>
          </ul>
        </section>
      </div>
    </div>
  )
}