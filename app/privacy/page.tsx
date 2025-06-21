import React from 'react'

export default function PrivacyPolicy() {
  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4">
        <strong>Last updated:</strong> June 2024
      </p>
      <p className="mb-4">
        Welcome to our salon booking platform. Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your personal information when you use our services.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">1. Information We Collect</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>
          <strong>Account Information:</strong> Name, email address, phone number, and profile photo.
        </li>
        <li>
          <strong>Booking Details:</strong> Appointment dates, times, and service preferences.
        </li>
        <li>
          <strong>Usage Data:</strong> Device information, log data, and usage patterns.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">2. How We Use Your Information</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>To provide and improve our booking services.</li>
        <li>To personalize your experience and show relevant content.</li>
        <li>To communicate with you about appointments, updates, and offers.</li>
        <li>To ensure the security and integrity of our platform.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">3. Sharing Your Information</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>We do <strong>not</strong> sell your personal information.</li>
        <li>
          We may share information with service providers (such as payment processors or cloud storage) only as necessary to operate our platform.
        </li>
        <li>
          We may disclose information if required by law or to protect our rights and users.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">4. Data Security</h2>
      <p className="mb-4">
        We use industry-standard security measures to protect your data. However, no method of transmission over the Internet or electronic storage is 100% secure.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">5. Your Rights & Choices</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>You can access and update your profile information at any time.</li>
        <li>You may request deletion of your account and data by contacting us.</li>
        <li>You can opt out of marketing communications at any time.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">6. Changes to This Policy</h2>
      <p className="mb-4">
        We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">7. Contact Us</h2>
      <p>
        If you have any questions or concerns about this Privacy Policy, please contact us at <a href="mailto:support@saloonlink.com" className="text-emerald-600 underline">support@saloonlink.com</a>.
      </p>
    </div>
  );
}
