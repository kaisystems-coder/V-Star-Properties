'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabaseBrowser } from '@/lib/supabase/browser';
import SignIn from './SignIn';
import ListingManager from './ListingManager';

type Gate =
  | { state: 'checking' }
  | { state: 'signed-out' }
  | { state: 'no-access'; email: string }
  | { state: 'ready'; session: Session };

/**
 * Who may see the listing manager: a signed-in user with an owner, admin or
 * staff membership of this site's tenant. The membership read runs under RLS
 * (a user can read their own rows), so the check cannot be talked around from
 * the browser; it only decides which screen to show.
 */
export default function AdminGate({ tenantId }: { tenantId: string }) {
  const [gate, setGate] = useState<Gate>({ state: 'checking' });

  const resolve = useCallback(
    async (session: Session | null) => {
      if (!session) return setGate({ state: 'signed-out' });
      const { data } = await supabaseBrowser()
        .from('memberships')
        .select('role')
        .eq('tenant_id', tenantId)
        .eq('user_id', session.user.id)
        .in('role', ['owner', 'admin', 'staff'])
        .maybeSingle();
      setGate(
        data
          ? { state: 'ready', session }
          : { state: 'no-access', email: session.user.email ?? 'this account' },
      );
    },
    [tenantId],
  );

  useEffect(() => {
    const auth = supabaseBrowser().auth;
    auth.getSession().then(({ data }) => resolve(data.session));
    // Sign-in, sign-out and an expired session all land here.
    const { data } = auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') resolve(session);
    });
    return () => data.subscription.unsubscribe();
  }, [resolve]);

  const signOut = () => supabaseBrowser().auth.signOut();

  if (!tenantId) {
    return (
      <Notice title="The listing manager is not set up">
        This deployment has no TENANT_ID, so it does not know whose listings to manage.
      </Notice>
    );
  }
  if (gate.state === 'checking') {
    return <div className="min-h-[70vh]" aria-busy="true" aria-label="Checking your sign-in" />;
  }
  if (gate.state === 'signed-out') return <SignIn />;
  if (gate.state === 'no-access') {
    return (
      <Notice title="This account cannot manage these listings">
        You are signed in as {gate.email}, which is not on this site&rsquo;s team.
        <button
          type="button"
          onClick={signOut}
          className="mt-6 block w-full rounded-sm bg-ink px-5 py-3 text-[0.88rem] text-mist transition-[background-color,transform] duration-200 ease-out hover:bg-brand-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-px sm:mx-auto sm:w-auto"
        >
          Sign out and use another account
        </button>
      </Notice>
    );
  }
  return (
    <ListingManager
      tenantId={tenantId}
      email={gate.session.user.email ?? ''}
      onSignOut={signOut}
    />
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[34rem] px-5 pb-24 pt-36 text-center sm:px-8 sm:pt-40">
      <h1 className="font-display text-[1.7rem] tracking-display text-ink text-balance">{title}</h1>
      <div className="mt-3 text-[0.95rem] leading-relaxed text-ink-mute">{children}</div>
    </div>
  );
}
