import React from 'react';
import { Navbar } from './Navbar';

export default function Privacy() {
  const lastUpdated = 'September 2025';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="h-16" />
      <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-sm text-muted-foreground">Privacy Policy</p>
        <h1 className="text-3xl font-bold tracking-tight mt-1 mb-2">Applycation Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {lastUpdated}</p>

        <section className="space-y-4 mb-8">
          <p>
            Your privacy matters to us. This Privacy Policy explains what information we collect about you
            when you use Applycation and its related services (the "Services"), how we use and share that
            information, and the choices you have. By using the Services, you agree to this Policy.
          </p>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-semibold">Information we collect</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              <span className="text-foreground font-medium">Account data.</span> Name, email address, profile
              photo, and password (if you create a password). If you sign in with Google, we receive basic
              profile details from Google to create your account.
            </li>
            <li>
              <span className="text-foreground font-medium">Application data.</span> Companies, roles, locations,
              statuses, dates, and notes you upload to track your internship/job applications.
            </li>
            <li>
              <span className="text-foreground font-medium">Gmail integration.</span> If you connect Gmail, we
              request access only to read your messages to detect application-related emails. We store OAuth
              tokens securely and never send email on your behalf. Parsed application metadata (company, role,
              dates, status) may be saved to your account; raw email contents are not stored in our database.
            </li>
            <li>
              <span className="text-foreground font-medium">Usage and device data.</span> Log and diagnostic
              information such as IP address, device/browser type, pages visited, and actions you take to help
              us improve the Services.
            </li>
          </ul>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-semibold">How we use information</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Provide, maintain, and improve the Services and troubleshoot issues.</li>
            <li>Personalize your dashboard and track your application progress.</li>
            <li>Secure accounts, prevent abuse, and comply with legal obligations.</li>
            <li>Communicate about updates, security notices, and support. Marketing emails are optional.</li>
            <li>Create aggregated, de-identified analytics to understand feature usage.</li>
          </ul>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-semibold">How we share information</h2>
          <p className="text-muted-foreground">
            We do not sell your personal information. We share data only with service providers that help us
            operate the Services (e.g., hosting, analytics, email delivery). Those providers are bound by
            contracts to protect your information and use it only on our instructions. We may also share data
            if required by law, to protect our rights, or with your consent.
          </p>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-semibold">Data retention</h2>
          <p className="text-muted-foreground">
            We retain your account data while your account is active. You can delete applications or close
            your account at any time, after which we will delete or anonymize your data within a reasonable
            period unless we need to keep it to meet legal or security requirements.
          </p>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-semibold">Your choices and rights</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Access, update, or delete your information via Settings or by contacting us.</li>
            <li>Disconnect Gmail at any time; we stop scanning and revoke token access.</li>
            <li>Opt out of marketing emails using the unsubscribe link.</li>
          </ul>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-semibold">Security</h2>
          <p className="text-muted-foreground">
            We apply industry-standard safeguards to protect your information, including encryption in transit
            and restricted access. No system can be 100% secure, so please keep your password safe and
            immediately inform us if you suspect unauthorized access.
          </p>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-semibold">Children</h2>
          <p className="text-muted-foreground">Applycation is not directed to children under 16.</p>
        </section>

        <section className="space-y-3 mb-12">
          <h2 className="text-xl font-semibold">11. Contact</h2>
          <p className="text-muted-foreground">
            Have a privacy request or question? <a href="/contact" className="underline">Contact us here</a>.
          </p>
        </section>
      </main>
    </div>
  );
}


