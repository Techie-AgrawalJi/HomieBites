import React from 'react';

const AboutUs = () => {
  return (
    <div className="max-w-5xl mx-auto page-shell px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="font-heading page-title text-3xl sm:text-4xl font-bold mb-2">About Us</h1>
        <p className="opacity-70">Learn who we are, what we do, and how HomieBites supports users and providers.</p>
      </div>

      <div className="glass rounded-2xl p-5 sm:p-7 space-y-6 leading-relaxed">
        <section>
          <h2 className="font-heading text-2xl font-semibold mb-2">Who We Are</h2>
          <p className="opacity-80">
            HomieBites is a student- and professional-focused housing and meal discovery platform. We help users find trusted PG listings and reliable meal services in one place, while helping providers showcase their offerings with better visibility.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold mb-2">Our Mission</h2>
          <p className="opacity-80">
            Our mission is to reduce relocation stress by making accommodation and food search fast, transparent, and local. We aim to provide clear listing details, location-aware discovery, and practical communication tools between users and providers.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold mb-2">What We Offer</h2>
          <ul className="list-disc pl-5 opacity-80 space-y-1">
            <li>PG listing discovery with filters for budget, furnishing, and preferences.</li>
            <li>Meal service discovery with cuisines, diet types, and plans.</li>
            <li>Location-based search and nearby listing suggestions.</li>
            <li>Provider dashboard to submit and manage listings.</li>
            <li>Booking and payment flow designed for clarity and traceability.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold mb-2">Trust and Listing Quality</h2>
          <p className="opacity-80">
            We work to maintain listing quality through review and verification workflows. While we strive for accuracy, users should independently verify critical details such as pricing, amenities, and terms before making final decisions.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold mb-2">Our Values</h2>
          <ul className="list-disc pl-5 opacity-80 space-y-1">
            <li>Transparency in listing details and communication.</li>
            <li>Fair access for both users and providers.</li>
            <li>Privacy-conscious handling of account and usage data.</li>
            <li>Continuous platform improvements based on feedback.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold mb-2">Contact</h2>
          <p className="opacity-80">For support, partnerships, or legal requests, contact us at support@homiebites.com.</p>
        </section>

        <p className="text-sm opacity-60">Last updated: April 9, 2026</p>
      </div>
    </div>
  );
};

export default AboutUs;
