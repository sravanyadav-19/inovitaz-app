import { useState } from "react";
import { 
  HiMail, 
  HiPhone, 
  HiChat, 
  HiLocationMarker, 
  HiChevronDown, 
  HiChevronUp,
  HiQuestionMarkCircle 
} from "react-icons/hi";

export default function Support() {
  return (
    <div className="min-h-screen bg-secondary-50 fade-in">
      
      {/* 1. Hero Section */}
      <div className="bg-gradient-to-br from-primary-700 to-primary-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
          <p className="text-primary-100 text-lg max-w-2xl mx-auto">
            Whether you have a question about a project, pricing, or need technical assistance, our team is ready to answer all your questions.
          </p>
        </div>
      </div>

      {/* 2. Contact Cards - Floating overlap */}
      <div className="max-w-7xl mx-auto px-6 -mt-10 pb-16">
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* WhatsApp */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-secondary-100 hover:-translate-y-1 transition-transform duration-300">
            <div className="w-14 h-14 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <HiChat className="w-7 h-7 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-secondary-900 mb-2">Chat on WhatsApp</h2>
            <p className="text-secondary-500 mb-6 text-sm">
              Fastest way to get answers. <br/>Available 9 AM - 9 PM.
            </p>
            <a
              href="https://wa.me/919705594777"
              target="_blank"
              rel="noreferrer"
              className="block w-full py-2.5 rounded-lg font-semibold bg-green-500 hover:bg-green-600 text-white transition-colors"
            >
              Start Chat
            </a>
          </div>

          {/* Email */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-secondary-100 hover:-translate-y-1 transition-transform duration-300">
            <div className="w-14 h-14 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <HiMail className="w-7 h-7 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-secondary-900 mb-2">Send an Email</h2>
            <p className="text-secondary-500 mb-6 text-sm">
              For detailed technical queries. <br/>Response within 24 hours.
            </p>
            <a
              href="mailto:inovitaz.help@gmail.com"
              className="block w-full py-2.5 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Compose Email
            </a>
          </div>

          {/* Phone */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-secondary-100 hover:-translate-y-1 transition-transform duration-300">
            <div className="w-14 h-14 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <HiPhone className="w-7 h-7 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-secondary-900 mb-2">Call Us</h2>
            <p className="text-secondary-500 mb-6 text-sm">
              Speak directly to our team. <br/>Mon — Fri, 9 AM — 6 PM.
            </p>
            <a
              href="tel:+919705594777"
              className="block w-full py-2.5 rounded-lg font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-colors"
            >
              +91 9705594777
            </a>
          </div>
        </div>

        {/* 3. FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-secondary-900 flex items-center justify-center gap-2">
              <HiQuestionMarkCircle className="text-primary-500" />
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="space-y-4">
            <FAQItem 
              question="Do the projects come with source code?" 
              answer="Yes! Every purchase includes the complete source code, circuit diagrams, and a documentation PDF explaining how to set it up." 
            />
            <FAQItem 
              question="Is the hardware included?" 
              answer="No, Inovitaz is a digital marketplace. We provide the code and schematics. You will need to purchase the hardware components (like Arduino, ESP32) separately from electronics vendors." 
            />
            <FAQItem 
              question="What if the code doesn't work?" 
              answer="Our code is tested before listing. However, if you face issues, you can contact our technical support via WhatsApp or Email for assistance." 
            />
            <FAQItem 
              question="Can I get a refund?" 
              answer="Since these are digital products, refunds are generally not provided once downloaded. However, if there is a genuine technical defect we cannot fix, we will review refund requests on a case-by-case basis." 
            />
          </div>
        </div>

        {/* 4. Location Footer */}
        <div className="mt-20 pt-10 border-t border-secondary-200 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-100 rounded-full text-secondary-600 text-sm font-medium">
            <HiLocationMarker className="w-4 h-4 text-primary-600" />
            Amaravathi, Andhra Pradesh, India
          </div>
        </div>

      </div>
    </div>
  );
}

// Helper Component for Accordion
function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white border border-secondary-200 rounded-xl overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-secondary-50 transition-colors"
      >
        <span className="font-semibold text-secondary-900">{question}</span>
        {isOpen ? <HiChevronUp className="text-primary-500" /> : <HiChevronDown className="text-secondary-400" />}
      </button>
      {isOpen && (
        <div className="px-6 pb-4 text-secondary-600 text-sm leading-relaxed border-t border-secondary-100 bg-secondary-50/50">
          {answer}
        </div>
      )}
    </div>
  );
}