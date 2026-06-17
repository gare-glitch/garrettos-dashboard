'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';

const RATE_LIMIT_MESSAGE = 'Too many login emails sent. Wait 30–60 minutes before trying again.';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('Enter your email to receive a private GarrettOS magic link.');
  const [cooldown, setCooldown] = useState(0);

  async function signIn() {
    if (cooldown > 0) return;
    setCooldown(60);
    const timer = window.setInterval(() => {
      setCooldown((seconds) => {
        if (seconds <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/auth/callback` } });
      const rateLimited = error?.message.toLowerCase().includes('email rate limit exceeded');
      setMessage(error ? (rateLimited ? RATE_LIMIT_MESSAGE : error.message) : 'Magic link sent. Check your inbox.');
    } catch {
      setMessage('Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel first.');
    }
  }

  return <main className="login-shell"><section className="login-card"><div className="eyebrow">Private access</div><h1>Sign in to GarrettOS</h1><p className="sub">Supabase Auth gates the dashboard. No service-role keys are used in the browser.</p><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email"/><button className="button" disabled={cooldown > 0} onClick={signIn}>{cooldown > 0 ? `Try again in ${cooldown}s` : 'Send magic link'}</button><p className="sub">{message}</p></section></main>;
}
