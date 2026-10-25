import { useId, useState } from "react";
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
import { requestCookieConsent } from "../context/CookieConsentContext";
import toast from "react-hot-toast";
import EmailUs from "../components/EmailUs";
import api from "../api/axios";

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
        a: "Projects are assembled and checked before they are listed — if anything still breaks, contact technical support via WhatsApp or email and we'll help you debug it."
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
  const triggerId = useId();
  const panelId = useId();

  return (
    <div className="bg-surface border border-surface-variant rounded-xl overflow-hidden">
      <button
        id={triggerId}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-surface-high transition-colors"
      >
        <span className="font-semibold text-white">{question}</span>
        {isOpen ? <HiChevronUp aria-hidden="true" className="text-primary-dim" /> : <HiChevronDown aria-hidden="true" className="text-outline" />}
      </button>
      {isOpen && (
        <div id={panelId} role="region" aria-labelledby={triggerId} className="px-6 pb-4 text-outline text-sm leading-relaxed border-t border-surface-variant bg-surface-highest">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function Support() {
  const [activeTopic, setActiveTopic] = useState("all");
  const [query, setQuery] = useState("");
  const [contact, setContact] = useState({ name: "", email: "", subject: "", message: "", company: "" });
  const [sending, setSending] = useState(false);

  // "company" is a honeypot: invisible to humans, filled by bots -> fake success.
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (contact.company) { toast.success("Message sent — we reply within 24 hours."); setContact({ name: "", email: "", subject: "", message: "", company: "" }); return; }
    setSending(true);
    try {
      const res = await api.post("/support/contact", {
        name: contact.name, email: contact.email, subject: contact.subject, message: contact.message,
      });
      toast.success(res.data?.message || "Message sent — we reply within 24 hours.");
      setContact({ name: "", email: "", subject: "", message: "", company: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send right now — try WhatsApp instead.");
    } finally {
      setSending(false);
    }
  };

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
    <div className="min-h-[100dvh] fade-in">
      
      {/* 1. Hero Section */}
      <div className="text-white py-16 border-b border-surface-variant">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="t-label text-primary-dim mb-3">Support</div>
          <h1 className="t-h1 text-white mb-4">How can we help you?</h1>
          <p className="text-outline text-lg max-w-2xl mx-auto">
            Whether you have a question about a project, pricing, or need technical assistance, our team is ready to answer all your questions.
          </p>
        </div>
      </div>

      {/* 2. Contact Cards - Floating overlap */}
      <div className="max-w-7xl mx-auto px-6 mt-10 pb-16">
        <div className="grid gap-6 md:grid-cols-3 items-stretch">
          
          {/* WhatsApp */}
          <div className="bg-surface rounded-2xl p-8 text-center border border-surface-variant hover:border-primary-dim/40 transition-colors flex flex-col h-full">
            <div className="w-14 h-14 mx-auto bg-success/20 rounded-full flex items-center justify-center mb-4">
              <HiChat className="w-7 h-7 text-success-fg" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Chat on WhatsApp</h2>
            <p className="text-outline mb-6 text-sm">
              Fastest way to get an answer.
            </p>
            <div className="mt-auto space-y-2">
              <a
                href="https://wa.me/919705594777"
                target="_blank"
                rel="noreferrer"
                className="block w-full py-2.5 rounded-lg font-semibold bg-secondary hover:bg-secondary-container text-white transition-colors"
              >
                +91 97055 94777
              </a>
              <a
                href="https://wa.me/919652332341"
                target="_blank"
                rel="noreferrer"
                className="block w-full py-2.5 rounded-lg font-semibold bg-secondary hover:bg-secondary-container text-white transition-colors"
              >
                +91 96523 32341
              </a>
            </div>
          </div>

          {/* Email */}
          <div className="bg-surface rounded-2xl p-8 text-center border border-surface-variant hover:border-primary-dim/40 transition-colors flex flex-col h-full">
            <div className="w-14 h-14 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <HiMail className="w-7 h-7 text-primary-dim" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Send an Email</h2>
            <p className="text-outline mb-6 text-sm">
              For detailed technical queries. We reply to every message.
            </p>
            <EmailUs
              block
              label="Compose Email"
              className="w-full py-2.5 rounded-lg font-semibold bg-primary hover:bg-primary-container text-white transition-colors mt-auto justify-center inline-flex items-center gap-2"
            />
          </div>

          {/* Phone */}
          <div className="bg-surface rounded-2xl p-8 text-center border border-surface-variant hover:border-primary-dim/40 transition-colors flex flex-col h-full">
            <div className="w-14 h-14 mx-auto bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
              <HiPhone className="w-7 h-7 text-purple-300" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Call Us</h2>
            <p className="text-outline mb-6 text-sm">
              Speak directly to our team.
            </p>
            <div className="mt-auto space-y-2">
              <a
                href="tel:+919705594777"
                className="block w-full py-2.5 rounded-lg btn-secondary transition-colors"
              >
                +91 97055 94777
              </a>
              <a
                href="tel:+919652332341"
                className="block w-full py-2.5 rounded-lg btn-secondary transition-colors"
              >
                +91 96523 32341
              </a>
            </div>
          </div>
        </div>

        {/* Contact form — posts straight into the team inbox (no mail app needed) */}
        <div className="mt-12 max-w-2xl mx-auto bg-surface rounded-2xl border border-surface-variant p-6 md:p-8">
          <h2 className="text-xl font-bold text-white mb-2 text-center">Message the team directly</h2>
          <p className="text-outline text-sm mb-6 text-center">
            No mail app, no detour — this lands in our inbox and we reply to your email.
          </p>
          <form onSubmit={handleContactSubmit} className="grid gap-4" noValidate={false}>
            <div className="grid sm:grid-cols-2 gap-4">
              <input
                type="text" required minLength={2} maxLength={80}
                value={contact.name}
                onChange={(e) => setContact((p) => ({ ...p, name: e.target.value }))}
                placeholder="Your name" aria-label="Your name"
                className="input w-full min-h-11"
              />
              <input
                type="email" required
                value={contact.email}
                onChange={(e) => setContact((p) => ({ ...p, email: e.target.value }))}
                placeholder="Your email" aria-label="Your email"
                className="input w-full min-h-11"
              />
            </div>
            <input
              type="text" required minLength={3} maxLength={150}
              value={contact.subject}
              onChange={(e) => setContact((p) => ({ ...p, subject: e.target.value }))}
              placeholder="Subject (e.g. Download link for my order)" aria-label="Subject"
              className="input w-full min-h-11"
            />
            <textarea
              required minLength={10} maxLength={2000} rows={5}
              value={contact.message}
              onChange={(e) => setContact((p) => ({ ...p, message: e.target.value }))}
              placeholder="How can we help? Share your order ID or project name if it's about one."
              aria-label="Message"
              className="input w-full resize-y min-h-[140px]"
            />
            {/* honeypot — spam bots only */}
            <input
              type="text" value={contact.company} tabIndex={-1} aria-hidden="true" autoComplete="off"
              onChange={(e) => setContact((p) => ({ ...p, company: e.target.value }))}
              className="hidden" style={{ display: "none" }}
            />
            <button
              type="submit" disabled={sending}
              className="btn btn-primary inline-flex items-center justify-center gap-2 min-h-11 disabled:opacity-60"
            >
              <HiMail aria-hidden="true" className="w-4 h-4" />
              {sending ? "Sending…" : "Send message"}
            </button>
          </form>
        </div>

        {/* 3. FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="t-h2 text-white flex items-center justify-center gap-2">
              <HiQuestionMarkCircle className="text-primary-dim" />
              Frequently Asked Questions
            </h2>
            <p className="text-outline text-sm mt-2">
              Search {totalCount} common questions or browse by topic.
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <label htmlFor="faq-search" className="sr-only">Search frequently asked questions</label>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <HiSearch className="w-5 h-5 text-outline" />
            </div>
            <input
              id="faq-search"
              type="search"
              value={query}
              onChange={(e) => {
                if (e.target.value) requestCookieConsent();
                setQuery(e.target.value);
              }}
              placeholder="Search for a question…"
              className="input pl-10 w-full"
            />
          </div>

          {/* Topic pills */}
          <div role="group" aria-label="Filter frequently asked questions by topic" className="flex flex-wrap justify-center gap-2 mb-8">
            <button
              type="button"
              onClick={() => {
                requestCookieConsent();
                setActiveTopic("all");
              }}
              aria-pressed={activeTopic === "all"}
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
                type="button"
                onClick={() => {
                  requestCookieConsent();
                  setActiveTopic(topic.id);
                }}
                aria-pressed={activeTopic === topic.id}
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
                  <h3 className="t-h4 text-white mb-4">{topic.label}</h3>
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
            <HiLocationMarker className="w-4 h-4 text-primary-dim" />
            Amaravathi, Andhra Pradesh, India
          </div>
        </div>

      </div>
    </div>
  );
}
