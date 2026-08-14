import {
  HiShieldCheck,
  HiLockClosed,
  HiServer,
  HiUserGroup,
  HiMail,
  HiClock,
  HiDocumentReport,
  HiBadgeCheck,
} from "react-icons/hi";

/**
 * Security & Trust page.
 * Communicates the platform's real security posture in plain language.
 * NOTE: certification / pentest sections are intentionally honest — no
 * unearned badges. Update them as the business earns them.
 */
export default function Security() {
  return (
    <div className="min-h-screen bg-surface-lowest fade-in py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto bg-primary/20 rounded-2xl flex items-center justify-center mb-4">
            <HiShieldCheck className="w-9 h-9 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Security at InovitaZ</h1>
          <p className="text-outline mt-3 max-w-xl mx-auto">
            How we protect your data, your payments, and your purchases — explained in plain language.
          </p>
        </div>

        <div className="space-y-6">
          {/* Data encryption */}
          <section className="bg-surface rounded-2xl border border-surface-variant p-6">
            <div className="flex items-center gap-3 mb-3">
              <HiLockClosed className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-white">Data encryption</h2>
            </div>
            <div className="space-y-3 text-outline text-sm leading-relaxed">
              <p>
                <strong className="text-white">In transit:</strong> All traffic between your browser and
                InovitaZ is encrypted with HTTPS/TLS, so your login details and payment information can't
                be read while travelling over the network.
              </p>
              <p>
                <strong className="text-white">At rest:</strong> Passwords are never stored in plain text —
                they are salted and hashed with bcrypt. Your account and order data is stored in an
                access-controlled PostgreSQL database.
              </p>
              <p>
                <strong className="text-white">Payments:</strong> Card details never touch our servers.
                Payments are processed end-to-end by Razorpay (PCI-DSS compliant), and we only ever receive
                a confirmation.
              </p>
            </div>
          </section>

          {/* Data residency */}
          <section className="bg-surface rounded-2xl border border-surface-variant p-6">
            <div className="flex items-center gap-3 mb-3">
              <HiServer className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-white">Data residency</h2>
            </div>
            <p className="text-outline text-sm leading-relaxed">
              InovitaZ runs on trusted cloud providers:{" "}
              <strong className="text-white">Neon</strong> (managed PostgreSQL),{" "}
              <strong className="text-white">Render</strong> (API hosting) and{" "}
              <strong className="text-white">Vercel</strong> (frontend). Your data is processed and stored
              within these providers' secure data centres. For specific region details, contact us at{" "}
              <a
                href="mailto:inovitaz.help@gmail.com"
                className="font-medium text-primary-dim hover:text-primary-fixed underline"
              >
                inovitaz.help@gmail.com
              </a>.
            </p>
          </section>

          {/* Access controls */}
          <section className="bg-surface rounded-2xl border border-surface-variant p-6">
            <div className="flex items-center gap-3 mb-3">
              <HiUserGroup className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-white">Access controls</h2>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-outline text-sm leading-relaxed">
              <li>Access to customer data is restricted by role — staff can only see what's needed to run the platform.</li>
              <li>Administrative actions are recorded in an audit trail for accountability.</li>
              <li>Sessions use short-lived JWTs, and all sessions are invalidated whenever you reset your password.</li>
            </ul>
          </section>

          {/* Vulnerability disclosure */}
          <section className="bg-surface rounded-2xl border border-surface-variant p-6">
            <div className="flex items-center gap-3 mb-3">
              <HiMail className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-white">Vulnerability disclosure</h2>
            </div>
            <p className="text-outline text-sm leading-relaxed">
              Found a security issue? We'd love to hear from you. Email{" "}
              <a
                href="mailto:inovitaz.help@gmail.com"
                className="font-medium text-primary-dim hover:text-primary-fixed underline"
              >
                inovitaz.help@gmail.com
              </a>{" "}
              with as much detail as possible (steps to reproduce, affected page). We aim to acknowledge
              reports within <strong className="text-white">5 business days</strong> and resolve confirmed
              issues as quickly as we can. Please give us a reasonable window to fix an issue before
              disclosing it publicly.
            </p>
          </section>

          {/* Incident history */}
          <section className="bg-surface rounded-2xl border border-surface-variant p-6">
            <div className="flex items-center gap-3 mb-3">
              <HiClock className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-white">Incident history</h2>
            </div>
            <p className="text-outline text-sm leading-relaxed">
              <strong className="text-white">No disclosed security incidents to date.</strong> If an
              incident that affects customer data ever occurs, we commit to notifying affected users
              promptly and publishing a transparent summary here.
            </p>
          </section>

          {/* Penetration testing */}
          <section className="bg-surface rounded-2xl border border-surface-variant p-6">
            <div className="flex items-center gap-3 mb-3">
              <HiDocumentReport className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-white">Penetration testing</h2>
            </div>
            <p className="text-outline text-sm leading-relaxed">
              InovitaZ is a young platform and has not yet completed a formal third-party penetration test.
              We build with security best practices — security headers, rate limiting, strict CORS,
              signature-verified webhooks — and plan to commission an independent audit as we grow. For
              details, contact{" "}
              <a
                href="mailto:inovitaz.help@gmail.com"
                className="font-medium text-primary-dim hover:text-primary-fixed underline"
              >
                inovitaz.help@gmail.com
              </a>.
            </p>
          </section>

          {/* Certifications */}
          <section className="bg-surface rounded-2xl border border-surface-variant p-6">
            <div className="flex items-center gap-3 mb-3">
              <HiBadgeCheck className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-white">Certifications & compliance</h2>
            </div>
            <p className="text-outline text-sm leading-relaxed">
              InovitaZ does not yet hold formal certifications such as SOC 2 or ISO 27001 — we'd rather be
              upfront than display badges we haven't earned. We follow industry-standard practices
              (encryption, least-privilege access, audit logging) and are working toward formal
              certification as the platform matures.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
