import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="max-w-5xl mx-auto page-shell px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="font-heading page-title text-3xl sm:text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="opacity-70">This policy explains how HomieBites collects, uses, and protects your data.</p>
      </div>

      <div className="glass rounded-2xl p-5 sm:p-7 space-y-6 leading-relaxed">
        <section>
          <h2 className="font-heading text-2xl font-semibold mb-2">1. Information We Collect</h2>
          <ul className="list-disc pl-5 opacity-80 space-y-1">
            <li>Account details: name, email, phone, city, role, and profile data.</li>
            <li>Listing data: address details, photos, pricing, and listing metadata.</li>
            <li>Usage data: interactions, search filters, and feature usage patterns.</li>
            <li>Location data: only when you explicitly grant location permission.</li>
            <li>Transaction data: payment-related metadata and booking history.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold mb-2">2. How We Use Information</h2>
          <ul className="list-disc pl-5 opacity-80 space-y-1">
            <li>Provide platform features and maintain account functionality.</li>
            <li>Display relevant listing results and nearby search results.</li>
            <li>Process bookings and payment verification workflows.</li>
            <li>Improve service quality, safety, and fraud prevention controls.</li>
            <li>Send service-related notifications and support communications.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold mb-2">3. Legal Basis and Consent</h2>
          <p className="opacity-80">Where required, we process personal information based on consent, contractual necessity, legal obligations, or legitimate platform interests such as security and fraud prevention.</p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold mb-2">4. Sharing of Information</h2>
          <p className="opacity-80">We may share limited information with service providers, payment partners, or legal authorities where required. We do not sell your personal data.</p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold mb-2">5. Data Retention</h2>
          <p className="opacity-80">We retain data for as long as necessary for account operations, legal compliance, dispute handling, and security monitoring, then delete or anonymize it when no longer required.</p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold mb-2">6. Security Measures</h2>
          <p className="opacity-80">We use reasonable administrative and technical safeguards to protect personal information, but no system is absolutely secure.</p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold mb-2">7. Your Rights</h2>
          <ul className="list-disc pl-5 opacity-80 space-y-1">
            <li>Access, correction, or deletion requests for your account data.</li>
            <li>Objection to certain processing activities where legally applicable.</li>
            <li>Withdrawal of consent for optional data processing.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold mb-2">8. Cookies and Similar Technologies</h2>
          <p className="opacity-80">We may use cookies or similar storage mechanisms to keep sessions active, improve usability, and understand traffic behavior.</p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold mb-2">9. Child Privacy</h2>
          <p className="opacity-80">HomieBites is not intended for children below the legal minimum age for entering contracts in your jurisdiction.</p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold mb-2">10. Policy Updates</h2>
          <p className="opacity-80">We may revise this Privacy Policy from time to time. The latest version will be published on this page with an updated date.</p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold mb-2">11. Contact</h2>
          <p className="opacity-80">For privacy-related requests or complaints, contact support@homiebites.com.</p>
        </section>

        <p className="text-sm opacity-60">Last updated: April 9, 2026</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
