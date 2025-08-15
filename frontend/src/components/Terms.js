import React from 'react';
import { Navbar } from './Navbar';

export default function Terms() {
  const lastUpdated = 'June 10, 2025';
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="h-16" />
      <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-sm text-muted-foreground">Terms of Service</p>
        <h1 className="text-3xl font-bold tracking-tight mt-1">Applycation Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {lastUpdated}</p>

        <section className="space-y-4 mb-8">
          <p>
            These Terms of Service (the "Terms") govern your access to and use of Applycation and related
            services (the "Services"). By creating an account or using the Services you agree to be bound by
            these Terms.
          </p>
          <p>
            If you are accepting on behalf of a company or organization, you represent that you have authority
            to bind that entity, and references to "you" include that entity and its users.
          </p>
        </section>

        <section className="space-y-2 mb-8">
          <h2 className="text-xl font-semibold">1. The Service</h2>
          <p className="text-muted-foreground">
            Applycation helps you track internship and job applications, optionally connect Gmail to detect
            application‑related emails, and manage your personal notes and statuses. We may update or improve
            features from time to time.
          </p>
        </section>

        <section className="space-y-2 mb-8">
          <h2 className="text-xl font-semibold">2. Accounts and Eligibility</h2>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>You must be at least 16 years old.</li>
            <li>You are responsible for the security of your account and for all activity under it.</li>
            <li>Provide accurate information and keep it up to date.</li>
          </ul>
        </section>

        <section className="space-y-2 mb-8">
          <h2 className="text-xl font-semibold">3. Gmail Integration</h2>
          <p className="text-muted-foreground">
            If you choose to connect Gmail, you authorize us to read relevant messages to identify application
            emails and extract metadata (e.g., company, role, dates, status). We do not send email on your
            behalf. You can disconnect at any time in Settings.
          </p>
        </section>

        <section className="space-y-2 mb-8">
          <h2 className="text-xl font-semibold">4. Your Content and Rights</h2>
          <p className="text-muted-foreground">
            You own the content you add to Applycation (your "Content"). You grant us a limited license to
            store, process, and display your Content solely to operate and improve the Services. You are
            responsible for ensuring you have rights to the Content you upload and that it is lawful.
          </p>
        </section>

        <section className="space-y-2 mb-8">
          <h2 className="text-xl font-semibold">5. Acceptable Use</h2>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Do not misuse the Services or attempt to disrupt or degrade them.</li>
            <li>Do not upload unlawful, infringing, or harmful content.</li>
            <li>Do not share login credentials or use another user’s account.</li>
          </ul>
        </section>

        <section className="space-y-2 mb-8">
          <h2 className="text-xl font-semibold">6. Fees</h2>
          <p className="text-muted-foreground">
            If we offer paid tiers, pricing will be shown before purchase. Fees are non‑refundable except where
            required by law.
          </p>
        </section>

        <section className="space-y-2 mb-8">
          <h2 className="text-xl font-semibold">7. Termination</h2>
          <p className="text-muted-foreground">
            You may stop using the Services at any time. We may suspend or terminate access if you breach these
            Terms or misuse the Service. Upon termination we may delete your Content after a reasonable period
            unless we are required to keep it by law.
          </p>
        </section>

        <section className="space-y-2 mb-8">
          <h2 className="text-xl font-semibold">8. Disclaimers</h2>
          <p className="text-muted-foreground">
            The Services are provided "as is" without warranties of any kind. We do not warrant that the
            Services will be uninterrupted or error‑free, or that results will be accurate or complete.
          </p>
        </section>

        <section className="space-y-2 mb-8">
          <h2 className="text-xl font-semibold">9. Limitation of Liability</h2>
          <p className="text-muted-foreground">
            To the maximum extent permitted by law, we will not be liable for indirect, incidental, special,
            consequential, or punitive damages, or any loss of data, use, or profits. Our aggregate liability
            arising from or relating to the Services will not exceed the amounts you paid to us (if any) in the
            12 months before the event giving rise to the claim.
          </p>
        </section>

        <section className="space-y-2 mb-8">
          <h2 className="text-xl font-semibold">10. Changes</h2>
          <p className="text-muted-foreground">
            We may update these Terms from time to time. If we make material changes, we will notify you (for
            example, by email or in‑app). Your continued use of the Services after the changes take effect
            constitutes acceptance of the revised Terms.
          </p>
        </section>

        <section className="space-y-2 mb-12">
          <h2 className="text-xl font-semibold">11. Contact</h2>
          <p className="text-muted-foreground">Questions about these Terms? <a href="/contact" className="underline">Contact us here</a>.</p>
        </section>
      </main>
    </div>
  );
}


