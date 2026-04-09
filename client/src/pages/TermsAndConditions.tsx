import React from 'react';

const TermsAndConditions = () => {
  return (
    <div className="max-w-5xl mx-auto page-shell px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="font-heading page-title text-3xl sm:text-4xl font-bold mb-2">Terms and Conditions</h1>
        <p className="opacity-70">Please read these terms carefully before using HomieBites.</p>
      </div>

      <div className="glass rounded-2xl p-5 sm:p-7 space-y-6 leading-relaxed">
        <section>
          <h2 className="font-heading text-2xl font-semibold mb-2">1. Acceptance of Terms</h2>
          <p className="opacity-80">By accessing or using HomieBites, you agree to these Terms and Conditions and our Privacy Policy. If you do not agree, you should not use the platform.</p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold mb-2">2. Platform Role</h2>
          <p className="opacity-80">HomieBites is a discovery and coordination platform for PG listings and meal services. We do not own or directly operate third-party listings unless explicitly stated.</p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold mb-2">3. User Accounts</h2>
          <ul className="list-disc pl-5 opacity-80 space-y-1">
            <li>You must provide accurate and complete account details.</li>
            <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
            <li>You are responsible for all actions performed through your account.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold mb-2">4. Provider Responsibilities</h2>
          <ul className="list-disc pl-5 opacity-80 space-y-1">
            <li>Providers must submit truthful listing details, pricing, and availability.</li>
            <li>Providers must comply with applicable housing, business, and food-related regulations.</li>
            <li>Misleading or fraudulent listing content may lead to suspension or removal.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold mb-2">5. Payments and Bookings</h2>
          <p className="opacity-80">Payments and booking confirmations may be subject to provider approval, payment verification, and platform checks. Refunds, if applicable, are governed by platform policy and payment status.</p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold mb-2">6. Prohibited Conduct</h2>
          <ul className="list-disc pl-5 opacity-80 space-y-1">
            <li>Illegal activity, abusive behavior, impersonation, or harassment.</li>
            <li>Uploading malicious content or attempting to compromise platform security.</li>
            <li>Posting false reviews, fraudulent listings, or manipulated information.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold mb-2">7. Intellectual Property</h2>
          <p className="opacity-80">Platform branding, software, and original content are protected by applicable intellectual property laws. Unauthorized copying or redistribution is prohibited.</p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold mb-2">8. Limitation of Liability</h2>
          <p className="opacity-80">To the maximum extent permitted by law, HomieBites is not liable for indirect, incidental, or consequential losses arising from third-party listing interactions, service interruptions, or inaccurate listing information.</p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold mb-2">9. Termination</h2>
          <p className="opacity-80">We may suspend or terminate accounts that violate these terms, abuse platform services, or create legal or security risks.</p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold mb-2">10. Changes to Terms</h2>
          <p className="opacity-80">We may update these Terms and Conditions periodically. Continued platform use after changes indicates acceptance of the updated terms.</p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold mb-2">11. Contact</h2>
          <p className="opacity-80">For legal or terms-related questions, contact support@homiebites.com.</p>
        </section>

        <p className="text-sm opacity-60">Last updated: April 9, 2026</p>
      </div>
    </div>
  );
};

export default TermsAndConditions;
