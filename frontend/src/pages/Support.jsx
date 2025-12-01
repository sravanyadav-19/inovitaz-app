// src/pages/Support.jsx
import { HiMail, HiPhone, HiChatAlt2, HiClock } from 'react-icons/hi';

const Support = () => {
  return (
    <div className="min-h-screen bg-secondary-50 fade-in">
      {/* Header */}
      <div className="bg-white border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">
            We're Here to Help
          </h1>
          <p className="text-secondary-600">
            Have questions? Reach out to our support team.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-16 space-y-10">
        <div className="grid md:grid-cols-3 gap-6">
          {/* WhatsApp */}
          <div className="card p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <HiChatAlt2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-secondary-900">
                  WhatsApp Support
                </h2>
                <p className="text-sm text-secondary-600">
                  Chat with us instantly.
                </p>
              </div>
            </div>
            <div className="mt-auto">
              <a
                href="https://wa.me/919705594777"
                target="_blank"
                rel="noreferrer"
                className="btn w-full mt-4 bg-green-500 hover:bg-green-600 text-white"
              >
                Open WhatsApp
              </a>
            </div>
          </div>

          {/* Email */}
          <div className="card p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <HiMail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-secondary-900">
                  Email Support
                </h2>
                <p className="text-sm text-secondary-600">
                  Get a response within 24 hours.
                </p>
              </div>
            </div>
            <div className="mt-auto">
              <a
                href="mailto:support@inovitaz.com"
                className="btn w-full mt-4 bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                Send Email
              </a>
            </div>
          </div>

          {/* Phone */}
          <div className="card p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <HiPhone className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-secondary-900">
                  Phone Support
                </h2>
                <p className="text-sm text-secondary-600">
                  Mon – Fri, 9 AM – 6 PM IST.
                </p>
              </div>
            </div>
            <div className="mt-auto">
              <a
                href="tel:+919705594777"
                className="btn w-full mt-4 bg-purple-500 hover:bg-purple-600 text-white"
              >
                Call Now
              </a>
            </div>
          </div>
        </div>

        {/* Extra info */}
        <div className="card p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <HiClock className="w-6 h-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-secondary-900">
              Response Time
            </h3>
            <p className="text-sm text-secondary-600 mt-1">
              We usually respond to queries within a few hours during business
              days. For urgent issues, please use WhatsApp or phone support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;