'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { GlassPanel } from '@/components/garrettos';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('Enter your email to receive a private GarrettOS magic link.');
  const reduceMotion = useReducedMotion();

  async function signIn() {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      setMessage(error ? error.message : 'Magic link sent. Check your inbox.');
    } catch {
      setMessage('Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel first.');
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 28 }}
        className="w-full max-w-md"
      >
        <GlassPanel className="glow-ring p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl border border-cyan/20 bg-cyan/10 text-sm font-bold text-cyan">G</span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan">Private access</p>
              <h1 className="text-xl font-semibold tracking-tight">Sign in to GarrettOS</h1>
            </div>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Supabase Auth gates the dashboard. No service-role keys are used in the browser.
          </p>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            type="email"
            autoComplete="email"
          />
          <Button className="mt-3 w-full" onClick={signIn}>
            <Sparkles className="size-4" />
            Send magic link
          </Button>
          <p className="mt-3 text-center text-sm text-muted-foreground">{message}</p>
        </GlassPanel>
      </motion.div>
    </main>
  );
}
