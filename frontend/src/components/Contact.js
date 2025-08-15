import React, { useState } from 'react';
import { Navbar } from './Navbar';
import config from '../config/config';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="h-16" />
      <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-sm text-muted-foreground">Contact</p>
        <h1 className="text-3xl font-bold tracking-tight mt-1 mb-6">Get in touch</h1>
        <p className="text-muted-foreground mb-6">Have a question, feedback, or a privacy request? Send us a note below.</p>

        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setStatus('');
            if (!message || message.trim().length < 5) {
              setStatus('Please provide a short message.');
              return;
            }
            try {
              const res = await fetch(`${config.API_BASE_URL}/api/auth/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, message }),
              });
              const data = await res.json().catch(() => ({}));
              if (!res.ok) throw new Error(data.error || 'Failed to send');
              setStatus('Message sent. We will get back to you soon.');
              setName(''); setEmail(''); setMessage('');
            } catch (err) {
              setStatus(err.message || 'Failed to send message');
            }
          }}
        >
          <div>
            <label className="text-xs uppercase text-muted-foreground">Name</label>
            <input
              className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
            />
          </div>
          <div>
            <label className="text-xs uppercase text-muted-foreground">Email</label>
            <input
              type="email"
              className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com (optional)"
            />
          </div>
          <div>
            <label className="text-xs uppercase text-muted-foreground">Message</label>
            <textarea
              className="mt-1 w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="How can we help?"
            />
          </div>
          {status && <div className="text-sm text-muted-foreground">{status}</div>}
          <div className="flex justify-end">
            <button type="submit" className="h-10 rounded-md px-4 text-sm bg-black text-white dark:bg-white dark:text-black">Send</button>
          </div>
        </form>
      </main>
    </div>
  );
}


