import { HiExclamationCircle, HiMail, HiPhone } from "react-icons/hi";

export default function Refund() {
  return (
    <div className="min-h-screen bg-secondary-50 fade-in py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-secondary-200 overflow-hidden">
        
        <div className="px-8 py-10">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Refund Policy</h1>
          <p className="text-secondary-500 text-sm mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <HiExclamationCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Digital Product Notice</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>Due to the nature of digital downloadable products, <strong>all sales are final</strong>. Once a purchase is completed, access is granted permanently, making refunds unavailable.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 text-secondary-700">
            <section>
              <h2 className="text-xl font-semibold text-secondary-900 mb-3">Exceptions</h2>
              <p className="leading-relaxed">
                We stand by our quality. The only exception for a refund is if a payment is successfully charged but <strong>access to the file is NOT provided</strong> due to a platform technical error.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-secondary-900 mb-3">How to Request</h2>
              <p className="mb-4">
                If you face a technical delivery issue, please contact us within <strong>24 hours</strong> of purchase.
              </p>
              <div className="bg-secondary-50 p-4 rounded-lg border border-secondary-100">
                <div className="flex items-center gap-3 mb-2">
                  <HiMail className="text-primary-600" />
                  <a href="mailto:inovitaz.help@gmail.com" className="hover:underline font-medium">inovitaz.help@gmail.com</a>
                </div>
                <div className="flex items-center gap-3">
                  <HiPhone className="text-primary-600" />
                  <a href="tel:+919705594777" className="hover:underline font-medium">+91 9705594777</a>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-secondary-900 mb-3">Abuse Policy</h2>
              <p>
                Any attempt to abuse this policy, initiate fraudulent chargebacks, or unauthorized distribution claims will result in a permanent ban from the platform and legal action where applicable.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}