import { HiExclamationCircle, HiMail, HiPhone } from "react-icons/hi";

export default function Refund() {
  return (
    <div className="min-h-screen bg-surface-lowest fade-in py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-surface rounded-2xl shadow-sm border border-surface-variant overflow-hidden">
        
        <div className="px-8 py-10">
          <h1 className="text-3xl font-bold text-white mb-2">Refund Policy</h1>
          <p className="text-outline text-sm mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="bg-red-500/10 border-l-4 border-red-500 p-4 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <HiExclamationCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-400">Digital Product Notice</h3>
                <div className="mt-2 text-sm text-red-300">
                  <p>Due to the nature of digital downloadable products, <strong>all sales are final</strong>. Once a purchase is completed, access is granted permanently, making refunds unavailable.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 text-outline [&_strong]:text-white">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Exceptions</h2>
              <p className="leading-relaxed">
                We stand by our quality. The only exception for a refund is if a payment is successfully charged but <strong>access to the file is NOT provided</strong> due to a platform technical error.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">How to Request</h2>
              <p className="mb-4">
                If you face a technical delivery issue, please contact us within <strong>24 hours</strong> of purchase.
              </p>
              <div className="bg-surface-high p-4 rounded-lg border border-surface-variant">
                <div className="flex items-center gap-3 mb-2">
                  <HiMail className="text-primary" />
                  <a
                    href="mailto:inovitaz.help@gmail.com"
                    className="hover:underline font-medium text-primary-dim hover:text-primary-fixed"
                  >
                    inovitaz.help@gmail.com
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <HiPhone className="text-primary" />
                  <a href="tel:+919705594777" className="hover:underline font-medium">+91 9705594777</a>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Abuse Policy</h2>
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