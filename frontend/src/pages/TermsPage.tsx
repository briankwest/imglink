export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
      
      <div className="prose prose-gray max-w-none">
        <p className="text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString()}</p>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-700 mb-4">
            By accessing and using ImgLink, you accept and agree to be bound by the terms and provision of this agreement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Use License</h2>
          <p className="text-gray-700 mb-4">
            Permission is granted to temporarily download one copy of the materials on ImgLink for personal, non-commercial transitory viewing only.
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose or for any public display</li>
            <li>Attempt to reverse engineer any software contained on ImgLink</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Content</h2>
          <p className="text-gray-700 mb-4">
            You retain all rights to the content you upload to ImgLink. By uploading content, you grant us a worldwide, non-exclusive, royalty-free license to:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>Store, display, and distribute your content</li>
            <li>Create thumbnails and optimize images for performance</li>
            <li>Remove content that violates our policies</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Prohibited Content</h2>
          <p className="text-gray-700 mb-4">You may not upload:</p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>Illegal or harmful content</li>
            <li>Copyrighted material without permission</li>
            <li>Malware or malicious code</li>
            <li>Content that violates privacy rights</li>
            <li>Spam or misleading content</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Privacy</h2>
          <p className="text-gray-700 mb-4">
            Your use of our service is also governed by our Privacy Policy. Please review our Privacy Policy, which also governs the site and informs users of our data collection practices.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Account Termination</h2>
          <p className="text-gray-700 mb-4">
            We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Disclaimer</h2>
          <p className="text-gray-700 mb-4">
            The materials on ImgLink are provided "as is". ImgLink makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitations</h2>
          <p className="text-gray-700 mb-4">
            In no event shall ImgLink or its suppliers be liable for any damages arising out of the use or inability to use the materials on ImgLink.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Governing Law</h2>
          <p className="text-gray-700 mb-4">
            Any claim relating to ImgLink shall be governed by the laws of the jurisdiction in which the service operates.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to Terms</h2>
          <p className="text-gray-700 mb-4">
            ImgLink reserves the right to update or modify these terms at any time without prior notice. Your continued use of the service following any changes constitutes acceptance of those changes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
          <p className="text-gray-700">
            If you have any questions about these Terms of Service, please contact us at legal@imglink.com
          </p>
        </section>
      </div>
    </div>
  )
}