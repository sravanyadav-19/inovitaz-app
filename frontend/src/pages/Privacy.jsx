export default function Privacy() {
  return (
    <div className="min-h-screen bg-secondary-50 fade-in py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-secondary-200 px-8 py-10">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">Privacy Policy</h1>
        <p className="text-secondary-500 text-sm mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-8 text-secondary-700">
          <p>
            At <strong>Inovitaz</strong>, we respect your privacy. This policy explains how we handle your data.
          </p>

          <section>
            <h2 className="text-xl font-semibold text-secondary-900 mb-3">Data We Collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Account Info:</strong> Name, email address (for login and delivery).</li>
              <li><strong>Payment Info:</strong> We do NOT store card details. Payments are processed securely via Razorpay.</li>
              <li><strong>Usage Data:</strong> Download history and order logs.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-secondary-900 mb-3">How We Use Data</h2>
            <p>
              We use your email solely to send order confirmations, download links, and critical account updates. We do not sell your data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-secondary-900 mb-3">Security</h2>
            <p>
              We use industry-standard encryption (HTTPS/TLS) and secure database practices to protect your personal information. Passwords are hashed and never stored in plain text.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-secondary-900 mb-3">Contact Us</h2>
            <p>
              If you have questions about this policy, please contact our support team at <span className="font-medium text-primary-600">inovitaz.help@gmail.com</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}