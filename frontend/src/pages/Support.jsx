import { useState } from "react";
import { 
  HiMail, 
  HiPhone, 
  HiChat, 
  HiLocationMarker, 
  HiChevronDown, 
  HiChevronUp,
  HiQuestionMarkCircle,
  HiSearch
} from "react-icons/hi";

// FAQ content, grouped by topic. Edit questions/answers here.
const FAQ_TOPICS = [
  {
    id: "purchases",
    label: "Purchases & Payments",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "We accept UPI, credit/debit cards, net banking, and wallets — all processed securely through Razorpay. We never see or store your card details."
      },
      {
        q: "Is the hardware included in the price?",
        a: "No, InovitaZ is a digital marketplace. The price covers the complete source code, circuit diagrams, component list, and setup guide. You purchase the hardware components (Arduino, ESP32, sensors, etc.) separately from electronics vendors."
      },
      {
        q: "Do you offer discounts or coupons?",
        a: "Yes! We occasionally run coupons. Enter a valid coupon code at checkout and the discount is applied instantly. Coupons are validated securely on our servers."
      }
    ]
  },
  {
    id: "download",
    label: "Download & Access",
    items: [
      {
        q: "How do I get my files after purchase?",
        a: "Instantly. As soon as your payment is confirmed, your project is unlocked and you can download the full kit from your dashboard. You'll also receive an email confirmation."
      },
      {
        q: "Do I get lifetime access to my downloads?",
        a: "Yes. Once purchased, the project stays in your dashboard permanently. Downloads are protected by time-limited, signed links to prevent unauthorized sharing."
      },
      {
        q: "Is there a limit on how many times I can download?",
        a: "Downloads are capped per purchase to prevent abuse. If you ever need an extra download, contact support and we'll help."
      }
    ]
  },
  {
    id: "technical",
    label: "Technical",
    items: [
      {
        q: "Which boards and platforms are the projects for?",
        a: "Our catalog covers Arduino, ESP32, Raspberry Pi, and more. Each project's description lists the exact board and components required before you buy."
      },
      {
        q: "What if the code doesn't work?",
        a: "Every project is tested before listing. If you run into an issue, contact our technical support via WhatsApp or email and we'll help you debug it."
      },
      {
        q: "Do you provide support after purchase?",
        a: "Yes. Technical support is included with every purchase — reach us on WhatsApp (fastest) or email for assistance."
      }
    ]
  },
  {
    id: "licensing",
    label: "Licensing & Refunds",
    items: [
      {
        q: "Can I share or resell the code I buy?",
        a: "No. Each purchase is a personal, non-exclusive license for academic and personal learning. Reselling, redistributing, or publishing the files is prohibited — see our Terms & Conditions."
      },
      {
        q: "Can I get a refund?",
        a: "Since these are digital products delivered instantly, all sales are final. The only exception is if payment succeeds but access is not provided due to a platform error. See our Refund Policy for details."
      }
    ]
  }
];

// Helper Component for Accordion
function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-surface border border-surface-variant rounded-xl overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-surface-high transition-colors"
      >
        <span className="font-semibold text-white">{question}</span>
        {isOpen ? <HiChevronUp className="text-primary" /> : <HiChevronDown className="text-outline" />}
      </button>
      {isOpen && (
        <div className="px-6 pb-4 text-outline text-sm leading-relaxed border-t border-surface-variant bg-surface-highest">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function Support() {
  const [activeTopic, setActiveTopic] = useState("all");
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();

  const visibleTopics = FAQ_TOPICS
    .filter((topic) => activeTopic === "all" || topic.id === activeTopic)
    .map((topic) => ({
      ...topic,
      items: topic.items.filter(
        (item) =>
          !normalizedQuery ||
          item.q.toLowerCase().includes(normalizedQuery) ||
          item.a.toLowerCase().includes(normalizedQuery)
      )
    }))
    .filter((topic) => topic.items.length > 0);

  const totalCount = FAQ_TOPICS.reduce((acc, t) => acc + t.items.length, 0);

  return (
    <div className="min-h-screen bg-surface-lowest fade-in">
      
      {/* 1. Hero Section */}
      <div className="bg-gradient-to-br from-primary/20 to-surface text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
          <p className="text-outline text-lg max-w-2xl mx-auto">
            Whether you have a question about a project, pricing, or need technical assistance, our team is ready to answer all your questions.
          </p>
        </div>
      </div>

      {/* 2. Contact Cards - Floating overlap */}
      <div className="max-w-7xl mx-auto px-6 -mt-10 pb-16">
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* WhatsApp */}
          <div className="bg-surface rounded-2xl shadow-lg p-8 text-center border border-surface-variant hover:-translate-y-1 transition-transform duration-300">
            <div className="w-14 h-14 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <HiChat className="w-7 h-7 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Chat on WhatsApp</h2>
            <p className="text-outline mb-6 text-sm">
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
          <div className="bg-surface rounded-2xl shadow-lg p-8 text-center border border-surface-variant hover:-translate-y-1 transition-transform duration-300">
            <div className="w-14 h-14 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
              <HiMail className="w-7 h-7 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Send an Email</h2>
            <p className="text-outline mb-6 text-sm">
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
          <div className="bg-surface rounded-2xl shadow-lg p-8 text-center border border-surface-variant hover:-translate-y-1 transition-transform duration-300">
            <div className="w-14 h-14 mx-auto bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
              <HiPhone className="w-7 h-7 text-purple-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Call Us</h2>
            <p className="text-outline mb-6 text-sm">
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
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
              <HiQuestionMarkCircle className="text-primary" />
              Frequently Asked Questions
            </h2>
            <p className="text-outline text-sm mt-2">
              Search {totalCount} common questions or browse by topic.
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <HiSearch className="w-5 h-5 text-outline" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a question…"
              className="input pl-10 w-full"
            />
          </div>

          {/* Topic pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <button
              onClick={() => setActiveTopic("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTopic === "all"
                  ? "bg-primary text-white"
                  : "bg-surface text-outline hover:text-white border border-surface-variant"
              }`}
            >
              All
            </button>
            {FAQ_TOPICS.map((topic) => (
              <button
                key={topic.id}
                onClick={() => setActiveTopic(topic.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeTopic === topic.id
                    ? "bg-primary text-white"
                    : "bg-surface text-outline hover:text-white border border-surface-variant"
                }`}
              >
                {topic.label}
              </button>
            ))}
          </div>

          {/* Questions */}
          {visibleTopics.length === 0 ? (
            <p className="text-center text-outline py-8">
              No results for "{query}". Try a different keyword, or contact us using the options above.
            </p>
          ) : (
            <div className="space-y-8">
              {visibleTopics.map((topic) => (
                <div key={topic.id}>
                  <h3 className="text-lg font-semibold text-white mb-4">{topic.label}</h3>
                  <div className="space-y-4">
                    {topic.items.map((item) => (
                      <FAQItem key={item.q} question={item.q} answer={item.a} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Location Footer */}
        <div className="mt-20 pt-10 border-t border-surface-variant text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface-high rounded-full text-outline text-sm font-medium">
            <HiLocationMarker className="w-4 h-4 text-primary" />
            Amaravathi, Andhra Pradesh, India
          </div>
        </div>

      </div>
    </div>
  );
}
