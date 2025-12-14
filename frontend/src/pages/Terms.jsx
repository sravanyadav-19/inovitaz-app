export default function Terms() {
  return (
    <div className="min-h-screen bg-secondary-50 fade-in py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-secondary-200 px-8 py-10">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">Terms & Conditions</h1>
        <p className="text-secondary-500 text-sm mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-8 text-secondary-700">
          <section>
            <h2 className="text-xl font-semibold text-secondary-900 mb-3">1. Intellectual Property</h2>
            <p className="leading-relaxed">
              All content, source code, designs, and documentation sold on <strong>Inovitaz Innovations Pvt. Ltd.</strong> are the exclusive intellectual property of Inovitaz. Purchasing a project grants you a <strong>personal, non-exclusive license</strong> to use the files for academic or personal learning purposes only.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-secondary-900 mb-3">2. Prohibited Uses</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Reselling, redistributing, or publishing our code/files online.</li>
              <li>Using our projects for commercial mass production without a commercial license.</li>
              <li>Sharing your account credentials to allow others to download files.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-secondary-900 mb-3">3. User Accounts</h2>
            <p>
              We reserve the right to suspend or terminate accounts found violating these terms, sharing purchased content illegally, or engaging in fraudulent activity.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-secondary-900 mb-3">4. Limitation of Liability</h2>
            <p>
              Inovitaz provides project files "as-is" for educational purposes. We are not liable for hardware damage, project failure, academic grading results, or any direct/indirect damages arising from the use of our products. Hardware safety is the user's responsibility.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}