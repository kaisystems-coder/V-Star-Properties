'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { supabaseBrowser } from '@/lib/supabase/browser';

/**
 * Sign-in for the listing manager. One panel set like the site's spec ledger:
 * a ruled sheet with labelled rows, so it reads as part of the same agency
 * paperwork rather than a generic auth screen.
 */
export default function SignIn() {
  const reduce = useReducedMotion();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    setError(null);
    const { error: authError } = await supabaseBrowser().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (authError) {
      // AdminGate swaps this screen out on success; only failures land here.
      setError(
        /invalid login credentials/i.test(authError.message)
          ? 'That email and password do not match. Check both and try again.'
          : /fetch|network/i.test(authError.message)
            ? 'Could not reach the server. Check your internet connection and try again.'
            : authError.message,
      );
      passwordRef.current?.select();
    }
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-[82rem] items-start justify-center px-5 pb-16 pt-28 sm:px-8 sm:pt-36">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[26rem]"
      >
        <h1 className="font-display text-[1.9rem] font-bold tracking-display text-ink sm:text-[2.1rem]">
          Listing manager
        </h1>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-mute">
          Sign in to add, edit or take down your properties. Changes show on the site as soon as
          you save.
        </p>

        <form
          onSubmit={submit}
          noValidate
          className="mt-8 rounded-sm border border-mist-edge bg-mist shadow-raise"
        >
          <div className="border-b border-mist-edge px-5 py-4 transition-colors duration-200 ease-out focus-within:bg-brand-wash focus-within:ring-2 focus-within:ring-inset focus-within:ring-brand">
            <label htmlFor="signin-email" className="block text-[0.72rem] uppercase tracking-[0.14em] text-ink-faint">
              Email
            </label>
            <input
              id="signin-email"
              type="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!error}
              aria-describedby={error ? 'signin-error' : undefined}
              className="mt-1.5 w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-ink-faint"
              placeholder="you@example.com"
            />
          </div>
          <div className="px-5 py-4 transition-colors duration-200 ease-out focus-within:bg-brand-wash focus-within:ring-2 focus-within:ring-inset focus-within:ring-brand">
            <label htmlFor="signin-password" className="block text-[0.72rem] uppercase tracking-[0.14em] text-ink-faint">
              Password
            </label>
            <div className="mt-1.5 flex items-center gap-3">
              <input
                ref={passwordRef}
                id="signin-password"
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!error}
                aria-describedby={error ? 'signin-error' : undefined}
                className="min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-pressed={show}
                className="min-h-11 shrink-0 rounded-sm px-2 text-[0.8rem] text-accent-deep underline decoration-accent-deep/30 underline-offset-4 transition-colors duration-200 ease-out hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand active:translate-y-px desk:min-h-0 desk:py-1"
              >
                {show ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="border-t border-mist-edge p-3">
            <button
              type="submit"
              disabled={busy}
              aria-busy={busy}
              className="flex min-h-12 w-full items-center justify-center gap-2.5 rounded-sm bg-brand-deep px-5 text-[0.92rem] text-mist transition-[background-color,transform,opacity] duration-200 ease-out hover:bg-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-px disabled:cursor-progress disabled:opacity-70"
            >
              {busy && <Spinner />}
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </form>

        <div aria-live="polite" className="min-h-[3.5rem]">
          {error && (
            <p id="signin-error" role="alert" className="mt-3 text-[0.86rem] leading-relaxed text-[#9B3D2E]">
              {error}
            </p>
          )}
        </div>

        <p className="text-[0.82rem] leading-relaxed text-ink-faint">
          Forgotten your password? Your website developer can reset it for you.
        </p>
      </motion.div>
    </div>
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      aria-hidden
      className={'animate-spin motion-reduce:animate-none ' + className}
    >
      <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.6" />
      <path d="M7 1.5a5.5 5.5 0 0 1 5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
