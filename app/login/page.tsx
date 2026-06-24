'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
        initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 24 }}
        className="w-full max-w-md"
      >
        <Card className="glow-ring overflow-hidden rounded-3xl">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan to-violet text-base font-black text-primary-foreground">
                G
              </span>
              <div>
                <CardDescription className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan">
                  Private access
                </CardDescription>
                <CardTitle className="text-2xl">Sign in to GarrettOS</CardTitle>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Supabase Auth gates the dashboard. No service-role keys are used in the browser.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
            />
            <Button className="w-full" onClick={signIn}>
              <Sparkles className="size-4" />
              Send magic link
            </Button>
            <p className="text-center text-sm text-muted-foreground">{message}</p>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
