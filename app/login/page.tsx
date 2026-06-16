'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('Enter your email to receive a private GarrettOS magic link.');

  async function signIn() {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/auth/callback` } });
      setMessage(error ? error.message : 'Magic link sent. Check your inbox.');
    } catch {
      setMessage('Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel first.');
    }
  }

  return <main className="login-shell"><section className="login-card"><div className="eyebrow">Private access</div><h1>Sign in to GarrettOS</h1><p className="sub">Supabase Auth gates the dashboard. No service-role keys are used in the browser.</p><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email"/><button className="button" onClick={signIn}>Send magic link</button><p className="sub">{message}</p></section></main>;
}
