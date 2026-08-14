import { LEGAL_LAST_UPDATED } from "../utils/legal";

export default function Cookies() {
  return (
    <div className="min-h-screen bg-surface-lowest fade-in py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-surface rounded-2xl shadow-sm border border-surface-variant px-8 py-10">
        <h1 className="text-3xl font-bold text-white mb-2">Cookie Policy</h1>
        <p className="text-outline text-sm mb-8">Last updated: {LEGAL_LAST_UPDATED}</p>

        <div className="space-y-8 text-outline [&_strong]:text-white">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              What this policy covers
            </h2>
            <p className="leading-relaxed">
              This page explains how <strong>Inovitaz</strong> uses cookies and
              similar technologies (such as browser local storage) when you
              visit our website. It also explains how you can control them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              What we use and why
            </h2>
            <div className="space-y-4">
              <div className="bg-surface-high p-4 rounded-lg border border-surface-variant">
                <h3 className="text-white font-semibold mb-1">
                  Essential storage (always on)
                </h3>
                <p className="text-sm leading-relaxed">
                  We use your browser's <strong>local storage</strong> to keep
                  you signed in (your login token and profile) and to remember
                  your cookie preference. These are required for the site to
                  work and cannot be switched off.
                </p>
              </div>

              <div className="bg-surface-high p-4 rounded-lg border border-surface-variant">
                <h3 className="text-white font-semibold mb-1">
                  Analytics (optional — only with your consent)
                </h3>
                <p className="text-sm leading-relaxed">
                  If you accept, we use <strong>Vercel Analytics</strong> to
                  collect anonymous, aggregated usage statistics (such as which
                  pages are visited). This helps us improve the platform. No
                  personally identifiable information is collected through this.
                  Analytics is <strong>not loaded until you accept</strong>, and
                  it is disabled entirely if you decline.
                </p>
              </div>

              <div className="bg-surface-high p-4 rounded-lg border border-surface-variant">
                <h3 className="text-white font-semibold mb-1">
                  Third-party services
                </h3>
                <p className="text-sm leading-relaxed">
                  A few pages load resources from trusted providers to function:
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>
                      <strong>Google Fonts</strong> — loads the site's typefaces
                      (fonts.googleapis.com / fonts.gstatic.com).
                    </li>
                    <li>
                      <strong>Razorpay</strong> — our payment processor; its
                      checkout script loads when you make a purchase so your
                      payment is processed securely.
                    </li>
                  </ul>
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              Managing cookies
            </h2>
            <p className="leading-relaxed">
              You can <strong>Accept</strong> or <strong>Decline</strong>{" "}
              non-essential cookies using the banner shown on your first visit.
              Your choice is saved on your device. You can also clear or block
              cookies and site data at any time through your browser settings —
              please note that blocking essential storage will prevent you from
              staying signed in or completing a purchase.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Contact</h2>
            <p>
              Questions about this policy? Contact us at{" "}
              <a
                href="mailto:inovitaz.help@gmail.com"
                className="font-medium text-primary-dim hover:text-primary-fixed underline"
              >
                inovitaz.help@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
