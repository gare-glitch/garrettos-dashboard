'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { AppLoadingScreen } from '@/components/garrettos/auth/AppLoadingScreen';
import { GarrettOSMark, LoginForm, LoginGlassPanel } from '@/components/garrettos/auth/LoginExperience';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('Enter your email to receive a private GarrettOS magic link.');
  const [loading, setLoading] = useState(false);
  const [entering, setEntering] = useState(false);

  async function signIn() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      setMessage(error ? error.message : 'Magic link sent. Check your inbox.');
      if (!error) setEntering(true);
    } catch {
      setMessage('Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel first.');
    } finally {
      setLoading(false);
    }
  }

  if (entering) {
    return (
      <AppLoadingScreen
        title="Entering GarrettOS"
        subtitle="Magic link sent — open your inbox to continue."
      />
    );
  }

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[#021018]" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-surface-container-low/40 via-transparent to-[#021018]" aria-hidden />
      <div className="pointer-events-none absolute -left-32 top-1/4 size-96 rounded-full bg-primary/6 blur-[100px]" aria-hidden />
      <div className="pointer-events-none absolute -right-24 bottom-1/4 size-80 rounded-full bg-tertiary/5 blur-[90px]" aria-hidden />

      <LoginGlassPanel>
        <GarrettOSMark />
        <LoginForm
          email={email}
          onEmailChange={setEmail}
          onSubmit={signIn}
          loading={loading}
          message={message}
        />
      </LoginGlassPanel>
    </main>
  );
}
