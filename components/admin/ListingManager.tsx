'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Listing, ListingDraft, ListingStatus } from '@/types/listing';
import {
  createListing,
  deleteListing,
  loadListings,
  refreshSite,
  removePhotos,
  updateListing,
} from '@/lib/admin/listings';
import { PHOTO_PUBLIC_PREFIX } from '@/lib/supabase/config';
import { BLUR_DATA_URL, formatDate, formatNumber, formatPrice, specLedger } from '@/lib/format';
import StatusPill from '@/components/StatusPill';
import ListingForm from '@/components/admin/ListingForm';
import ConfirmDelete from '@/components/admin/ConfirmDelete';

const STATUS_TABS: ('All' | ListingStatus)[] = ['All', 'Active', 'Pending', 'Sold'];

/** Thumbnails go through the image optimizer; only local previews can't. */
const unoptimized = (src: string) =>
  !src.startsWith(PHOTO_PUBLIC_PREFIX) && !src.startsWith('https://images.unsplash.com');

/**
 * Her listing manager. Reads every listing of hers (hidden ones too) with her
 * own session, writes through lib/admin/listings.ts, and asks the public site
 * to refresh after each change.
 */
export default function ListingManager({
  tenantId,
  email,
  onSignOut,
}: {
  tenantId: string;
  email: string;
  onSignOut: () => void;
}) {
  const [all, setAll] = useState<Listing[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const listings = useMemo(() => all ?? [], [all]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'All' | ListingStatus>('All');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Listing | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Listing | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter((l) => {
      if (status !== 'All' && l.status !== status) return false;
      if (!q) return true;
      return (l.title + ' ' + l.location + ' ' + l.region).toLowerCase().includes(q);
    });
  }, [listings, query, status]);

  const announce = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 4200);
  }, []);

  const load = useCallback(() => {
    setLoadError(null);
    loadListings(tenantId)
      .then(setAll)
      .catch((e: Error) => setLoadError(e.message));
  }, [tenantId]);

  useEffect(load, [load]);

  /** After a write: refresh the public pages, and say so if that failed. */
  const publishChange = async (message: string) => {
    const refreshed = await refreshSite();
    announce(refreshed ? message : message + ' The website may take up to an hour to show it.');
  };

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (listing: Listing) => {
    setEditing(listing);
    setFormOpen(true);
  };

  /** Throws on failure so the form keeps her edits and shows the error. */
  const save = async (draft: ListingDraft) => {
    const live = draft.isPublished !== false;
    if (editing) {
      const saved = await updateListing(tenantId, editing.id, draft);
      setAll((prev) => (prev ?? []).map((l) => (l.id === saved.id ? saved : l)));
      // Photos taken off the listing are deleted from storage once it saves.
      await removePhotos(
        tenantId,
        editing.images.filter((src) => !saved.images.includes(src)),
      ).catch(() => undefined);
      setFormOpen(false);
      setEditing(null);
      await publishChange(
        'Saved. ' + saved.title + (live ? ' is updated on the site.' : ' is hidden from the site.'),
      );
    } else {
      const saved = await createListing(tenantId, draft, listings.map((l) => l.slug));
      setAll((prev) => [saved, ...(prev ?? [])]);
      setFormOpen(false);
      setEditing(null);
      await publishChange(
        live
          ? 'Published. ' + saved.title + ' is live on the site.'
          : 'Saved. ' + saved.title + ' is hidden from the site.',
      );
    }
  };

  const [deleting, setDeleting] = useState(false);
  const confirmDelete = async () => {
    if (!pendingDelete || deleting) return;
    const gone = pendingDelete;
    setDeleting(true);
    try {
      await deleteListing(tenantId, gone.id);
      setAll((prev) => (prev ?? []).filter((l) => l.id !== gone.id));
      setPendingDelete(null);
      await publishChange('Deleted. ' + gone.title + ' is off the site.');
    } catch (e) {
      setPendingDelete(null);
      announce((e as Error).message + '. Nothing was deleted; try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[82rem] px-5 pb-10 pt-28 sm:px-8 sm:pt-32">
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <div>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
            <h1 className="font-display text-[1.9rem] tracking-display text-ink sm:text-[2.2rem]">
              Listing manager
            </h1>
          </div>
          <p className="mt-2 max-w-[44ch] text-[0.92rem] leading-relaxed text-ink-mute">
            Add, edit or remove a property. Every change shows on the{' '}
            <Link
              href="/"
              className="inline-flex min-h-11 items-center underline decoration-mist-edge underline-offset-4 transition-colors duration-200 ease-out hover:text-ink desk:min-h-0"
            >
              public site
            </Link>{' '}
            as soon as you save.
          </p>
          <p className="mt-3 flex flex-wrap items-center gap-x-1 text-[0.82rem] text-ink-faint">
            <span className="min-w-0 break-all">Signed in as {email}</span>
            <span aria-hidden>&middot;</span>
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex min-h-11 items-center rounded-sm px-1 text-ink-mute underline decoration-mist-edge underline-offset-4 transition-colors duration-200 ease-out hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand active:translate-y-px desk:min-h-0"
            >
              Sign out
            </button>
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          disabled={!all}
          className="flex items-center gap-2 disabled:opacity-50 rounded-sm bg-brand-deep px-5 py-3 text-[0.87rem] text-mist transition-[background-color,transform] duration-200 ease-out hover:bg-ink active:translate-y-px"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <path
              d="M7 2v10M2 7h10"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          Add listing
        </button>
      </header>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-y border-mist-edge py-3">
        <div className="relative min-w-[12rem] flex-1">
          <label htmlFor="admin-search" className="sr-only">
            Search listings
          </label>
          <input
            id="admin-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, area or region"
            className="w-full rounded-sm border border-mist-edge bg-mist px-3 py-3 text-[16px] text-ink transition-colors duration-200 ease-out hover:border-ink/25 focus:border-brand sm:py-2.5 desk:text-[0.86rem]"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatus(tab)}
              aria-pressed={status === tab}
              className={
                'min-h-11 rounded-sm border px-4 py-2.5 text-[0.82rem] transition-[background-color,border-color,color] duration-200 ease-out desk:min-h-0 sm:px-3 sm:py-2 sm:text-[0.79rem] ' +
                (status === tab
                  ? 'border-ink bg-ink text-mist'
                  : 'border-mist-edge text-ink-mute hover:border-ink/25 hover:text-ink')
              }
            >
              {tab}
            </button>
          ))}
        </div>

        <p className="tnum ml-auto text-[0.8rem] text-ink-faint">
          {rows.length} of {listings.length}
        </p>
      </div>

      {loadError ? (
        <div role="alert" className="mt-10 rounded-sm border border-[#9B3D2E]/30 px-6 py-14 text-center">
          <h2 className="font-display text-[1.3rem] tracking-display text-ink">
            Your listings did not load
          </h2>
          <p className="mx-auto mt-2 max-w-[30rem] text-[0.9rem] leading-relaxed text-ink-mute">
            {loadError}. Check your internet connection, then try again.
          </p>
          <button
            type="button"
            onClick={load}
            className="mt-6 rounded-sm bg-ink px-5 py-2.5 text-[0.85rem] text-mist transition-[background-color,transform] duration-200 ease-out hover:bg-brand-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-px"
          >
            Try again
          </button>
        </div>
      ) : !all ? (
        <ul aria-busy="true" aria-label="Loading your listings" className="mt-2 divide-y divide-mist-edge">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="flex items-center gap-3 py-3.5">
              <span className="h-12 w-16 shrink-0 rounded-sm bg-mist-deep" />
              <span className="flex-1 space-y-2">
                <span className="block h-3 w-2/3 max-w-[22rem] rounded-sm bg-mist-deep" />
                <span className="block h-2.5 w-1/3 max-w-[12rem] rounded-sm bg-mist-deep" />
              </span>
            </li>
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <div className="mt-10 rounded-sm border border-dashed border-mist-edge px-6 py-16 text-center">
          <h2 className="font-display text-[1.3rem] tracking-display text-ink">
            {listings.length === 0 ? 'No listings yet' : 'Nothing matches that search'}
          </h2>
          <p className="mx-auto mt-2 max-w-[30rem] text-[0.9rem] leading-relaxed text-ink-mute">
            {listings.length === 0
              ? 'Add the first property and it appears on the homepage straight away.'
              : 'Try a different area name, or switch the status filter back to All.'}
          </p>
          <button
            type="button"
            onClick={listings.length === 0 ? openAdd : () => { setQuery(''); setStatus('All'); }}
            className="mt-6 rounded-sm bg-ink px-5 py-2.5 text-[0.85rem] text-mist transition-transform duration-200 ease-out active:translate-y-px"
          >
            {listings.length === 0 ? 'Add listing' : 'Clear search'}
          </button>
        </div>
      ) : (
        <>
          {/* Desktop: a table. Mobile: the same rows as stacked cards. */}
          <div className="mt-2 hidden lg:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-mist-edge">
                  {['Property', 'Status', 'Price', 'Specification', 'Listed', ''].map(
                    (head) => (
                      <th
                        key={head}
                        scope="col"
                        className="py-3 pr-4 text-[0.66rem] font-normal uppercase tracking-[0.16em] text-ink-faint"
                      >
                        {head}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {rows.map((listing) => (
                    <motion.tr
                      key={listing.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="group border-b border-mist-edge align-middle"
                    >
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3">
                          <span className="relative block h-12 w-16 shrink-0 overflow-hidden rounded-sm bg-mist-deep">
                            {listing.images[0] && (
                              <Image
                                src={listing.images[0]}
                                alt=""
                                fill
                                unoptimized={unoptimized(listing.images[0])}
                                placeholder="blur"
                                blurDataURL={BLUR_DATA_URL}
                                sizes="64px"
                                className="object-cover"
                              />
                            )}
                          </span>
                          <span className="min-w-0">
                            <Link
                              href={'/listings/' + listing.slug}
                              className="block truncate text-[0.9rem] text-ink transition-colors duration-200 ease-out hover:text-accent-deep"
                            >
                              {listing.title}
                            </Link>
                            <span className="block truncate text-[0.78rem] text-ink-faint">
                              {listing.location} &middot; {listing.propertyType}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <StatusPill status={listing.status} className="ring-1 ring-mist-edge" />
                          {listing.isPublished === false && <HiddenPill />}
                        </span>
                      </td>
                      <td className="tnum py-3.5 pr-4 text-[0.88rem] text-ink-soft">
                        {formatPrice(listing)}
                      </td>
                      <td className="tnum py-3.5 pr-4 text-[0.82rem] text-ink-mute">
                        {specLedger(listing)
                          .slice(0, 3)
                          .map((s) => s.value + ' ' + s.label)
                          .join(' · ') || '—'}
                      </td>
                      <td className="py-3.5 pr-4 text-[0.82rem] text-ink-mute">
                        {formatDate(listing.dateListed)}
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          <RowAction onClick={() => openEdit(listing)} label="Edit">
                            Edit
                          </RowAction>
                          <RowAction
                            onClick={() => setPendingDelete(listing)}
                            label={'Delete ' + listing.title}
                            danger
                          >
                            Delete
                          </RowAction>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          <ul className="mt-6 flex flex-col gap-3 lg:hidden">
            <AnimatePresence initial={false}>
              {rows.map((listing) => (
                <motion.li
                  key={listing.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-sm border border-mist-edge bg-mist-deep/50 p-4"
                >
                  <div className="flex gap-3">
                    <span className="relative block h-16 w-20 shrink-0 overflow-hidden rounded-sm bg-mist-deep">
                      {listing.images[0] && (
                        <Image
                          src={listing.images[0]}
                          alt=""
                          fill
                          unoptimized={unoptimized(listing.images[0])}
                          placeholder="blur"
                          blurDataURL={BLUR_DATA_URL}
                          sizes="80px"
                          className="object-cover"
                        />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      {/* The card layout is the phone view, so the title is a
                          real touch target rather than a 22px line of text. */}
                      <Link
                        href={'/listings/' + listing.slug}
                        className="flex min-h-11 items-center truncate text-[0.92rem] text-ink"
                      >
                        {listing.title}
                      </Link>
                      <p className="truncate text-[0.78rem] text-ink-faint">
                        {listing.location} &middot; {listing.propertyType}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <StatusPill
                          status={listing.status}
                          className="ring-1 ring-mist-edge"
                        />
                        {listing.isPublished === false && <HiddenPill />}
                        <span className="tnum text-[0.85rem] text-ink-soft">
                          {formatPrice(listing)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col gap-3 border-t border-mist-edge pt-3 xs:flex-row xs:items-center xs:justify-between">
                    <p className="tnum text-[0.82rem] text-ink-mute">
                      {specLedger(listing)
                        .slice(0, 3)
                        .map((s) => s.value + ' ' + s.label)
                        .join(' · ') || 'No specification'}
                    </p>
                    {/* gap-3, not gap-1: Delete sits next to Edit and a
                        mis-tap is destructive. */}
                    <div className="flex gap-3 sm:gap-1">
                      <RowAction onClick={() => openEdit(listing)} label="Edit">
                        Edit
                      </RowAction>
                      <RowAction
                        onClick={() => setPendingDelete(listing)}
                        label={'Delete ' + listing.title}
                        danger
                      >
                        Delete
                      </RowAction>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </>
      )}

      <ListingForm
        tenantId={tenantId}
        open={formOpen}
        listing={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={save}
      />

      <ConfirmDelete
        listing={pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        busy={deleting}
      />

      {/* Confirmation of what just changed. Polite, never steals focus. */}
      <div aria-live="polite" className="sr-only">
        {toast}
      </div>
      <AnimatePresence>
        {toast && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-5 left-1/2 z-toast -translate-x-1/2 rounded-sm bg-ink px-4 py-3 text-[0.84rem] text-mist shadow-float"
          >
            {toast}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Hidden listings stay in the manager but are off the public site. */
function HiddenPill() {
  return (
    <span className="inline-flex items-center rounded-sm border border-dashed border-ink-faint/50 px-2 py-1 text-[0.68rem] uppercase tracking-[0.16em] text-ink-mute sm:text-[0.6rem]">
      Hidden
    </span>
  );
}

function RowAction({
  onClick,
  label,
  danger,
  children,
}: {
  onClick: () => void;
  label: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={
        // Bordered and 44px tall on touch, so Edit and Delete read as two
        // distinct buttons rather than adjacent words. Delete is separated
        // and tinted, because mis-tapping it destroys a listing.
        'min-h-11 min-w-[4.5rem] rounded-sm border px-3.5 py-2.5 text-[0.82rem] transition-[background-color,border-color,color,transform] duration-200 ease-out active:translate-y-px desk:min-h-0 sm:min-w-0 sm:border-transparent sm:px-2.5 sm:py-1.5 sm:text-[0.79rem] ' +
        (danger
          ? 'border-[#9B3D2E]/25 text-[#9B3D2E] hover:border-[#9B3D2E]/40 hover:bg-[#9B3D2E]/8 sm:text-ink-mute sm:hover:border-[#9B3D2E]/30 sm:hover:text-[#9B3D2E]'
          : 'border-mist-edge text-ink hover:bg-mist-deep sm:text-ink-mute sm:hover:border-mist-edge sm:hover:text-ink')
      }
    >
      {children}
    </button>
  );
}
