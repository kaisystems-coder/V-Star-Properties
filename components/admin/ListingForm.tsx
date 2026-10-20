'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import type { Listing, ListingDraft } from '@/types/listing';
import { LISTING_STATUSES, PROPERTY_TYPES, REGIONS } from '@/types/listing';
import { BLUR_DATA_URL } from '@/lib/format';
import { removePhotos, uploadPhoto } from '@/lib/admin/listings';
import { PHOTO_PUBLIC_PREFIX } from '@/lib/supabase/config';
import { Spinner } from './SignIn';

const EMPTY: ListingDraft = {
  title: '',
  listingType: 'Sale',
  propertyType: 'House',
  status: 'Active',
  price: 0,
  location: '',
  region: 'San Fernando',
  beds: 3,
  baths: 2,
  sqft: 1500,
  description: '',
  amenities: [],
  images: [],
  featured: false,
  dateListed: new Date().toISOString().slice(0, 10),
  isPublished: true,
};

/** A photo on its way up: shown as a tile until its URL comes back. */
type Pending = { key: string; name: string };

type Errors = Partial<Record<string, string>>;

/**
 * Add / edit form in a modal. Same component for both — an existing listing
 * pre-fills it, so an agent learns one screen rather than two.
 *
 * Photos upload the moment they are chosen, into the listing's own folder (a
 * new listing gets its id up front for this). Photos uploaded and then
 * abandoned — removed again, or the form closed without saving — are deleted.
 */
export default function ListingForm({
  tenantId,
  open,
  listing,
  onClose,
  onSave,
}: {
  tenantId: string;
  open: boolean;
  listing: Listing | null;
  onClose: () => void;
  /** Rejects with a message the form shows; the form stays open with her edits. */
  onSave: (draft: ListingDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<ListingDraft>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [amenityInput, setAmenityInput] = useState('');
  const [pending, setPending] = useState<Pending[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const reduce = useReducedMotion();
  const titleRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // Photos uploaded in this sitting and not yet saved onto the listing.
  const unsaved = useRef<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setDraft(listing ? { ...listing } : { ...EMPTY, id: crypto.randomUUID(), dateListed: new Date().toISOString().slice(0, 10) });
    setErrors({});
    setAmenityInput('');
    setPending([]);
    setUploadErrors([]);
    setSaving(false);
    setSaveError(null);
    unsaved.current = [];
    const focus = setTimeout(() => titleRef.current?.focus(), 80);
    return () => clearTimeout(focus);
  }, [open, listing]);

  /** Closing without saving: delete what this sitting uploaded. */
  const close = () => {
    if (saving) return;
    removePhotos(tenantId, unsaved.current).catch(() => undefined);
    unsaved.current = [];
    onClose();
  };
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const patch = (part: Partial<ListingDraft>) => setDraft((d) => ({ ...d, ...part }));

  const listingId = listing?.id ?? draft.id ?? '';

  const onFiles = async (files: FileList | null) => {
    if (!files?.length || !listingId) return;
    const batch = Array.from(files).map((file) => ({ file, key: crypto.randomUUID() }));
    if (fileRef.current) fileRef.current.value = '';
    setUploadErrors([]);
    setErrors((e) => ({ ...e, images: undefined }));
    setPending((p) => [...p, ...batch.map(({ file, key }) => ({ key, name: file.name }))]);
    // Two at a time: quick on office wifi, and a phone on mobile data is not
    // asked to push ten photos at once.
    let next = 0;
    const worker = async () => {
      while (next < batch.length) {
        const { file, key } = batch[next++];
        try {
          const url = await uploadPhoto(tenantId, listingId, file);
          unsaved.current.push(url);
          setDraft((d) => ({ ...d, images: [...d.images, url] }));
        } catch (e) {
          setUploadErrors((list) => [...list, (e as Error).message]);
        } finally {
          setPending((p) => p.filter((x) => x.key !== key));
        }
      }
    };
    await Promise.all([worker(), worker()]);
  };

  const removeImage = (i: number) => {
    const src = draft.images[i];
    patch({ images: draft.images.filter((_, idx) => idx !== i) });
    // Only this sitting's uploads go straight away; a photo that was already
    // on the listing is deleted when the listing saves without it.
    if (unsaved.current.includes(src)) {
      unsaved.current = unsaved.current.filter((u) => u !== src);
      removePhotos(tenantId, [src]).catch(() => undefined);
    }
  };

  const makeCover = (i: number) =>
    patch({ images: [draft.images[i], ...draft.images.filter((_, idx) => idx !== i)] });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || pending.length > 0) return;
    const next: Errors = {};
    if (!draft.title.trim()) next.title = 'Give the listing a title.';
    if (!draft.location.trim()) next.location = 'Name the neighbourhood.';
    if (!draft.price || draft.price <= 0) next.price = 'Enter a price above zero.';
    if (draft.images.length === 0) next.images = 'Add at least one photograph.';

    setErrors(next);
    if (Object.keys(next).length > 0) {
      document.getElementById(Object.keys(next)[0] === 'images' ? 'form-images' : 'form-' + Object.keys(next)[0])?.focus();
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(draft);
      unsaved.current = [];
    } catch (err) {
      setSaveError((err as Error).message + '. Your changes are still here; try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            className="fixed inset-0 z-overlay bg-ink/50 backdrop-blur-[2px]"
          />
          <motion.div
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="form-heading"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.99 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 bottom-0 top-auto z-modal mx-auto flex max-h-[92dvh] w-full max-w-[46rem] flex-col overflow-hidden rounded-t-lg border border-mist-edge bg-mist shadow-float sm:inset-4 sm:bottom-auto sm:top-[4vh] sm:rounded-lg"
          >
            <div className="flex items-center justify-between border-b border-mist-edge px-6 py-4">
              <h2
                id="form-heading"
                className="font-display text-[1.25rem] tracking-display text-ink"
              >
                {listing ? 'Edit listing' : 'Add listing'}
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close without saving"
                className="flex h-11 w-11 items-center justify-center rounded-sm text-ink-mute transition-colors duration-200 ease-out hover:bg-mist-deep hover:text-ink sm:h-auto sm:w-auto sm:p-1.5"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                  <path
                    d="M4 4l10 10M14 4L4 14"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </button>
            </div>

            <form
              id="listing-form"
              onSubmit={submit}
              noValidate
              className="flex-1 overflow-y-auto px-6 py-6"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="form-title" error={errors.title}>
                    Title
                  </Label>
                  <input
                    ref={titleRef}
                    id="form-title"
                    value={draft.title}
                    onChange={(e) => patch({ title: e.target.value })}
                    className={inputClass(errors.title)}
                  />
                  <ErrorText id="form-title" message={errors.title} />
                </div>

                <div>
                  <Label htmlFor="form-location" error={errors.location}>
                    Neighbourhood
                  </Label>
                  <input
                    id="form-location"
                    value={draft.location}
                    onChange={(e) => patch({ location: e.target.value })}
                    className={inputClass(errors.location)}
                  />
                  <ErrorText id="form-location" message={errors.location} />
                </div>

                <div>
                  <Label htmlFor="form-region">Region</Label>
                  <select
                    id="form-region"
                    value={draft.region}
                    onChange={(e) => patch({ region: e.target.value })}
                    className={inputClass()}
                  >
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="form-listingType">Sale or rent</Label>
                  <select
                    id="form-listingType"
                    value={draft.listingType}
                    onChange={(e) =>
                      patch({ listingType: e.target.value as ListingDraft['listingType'] })
                    }
                    className={inputClass()}
                  >
                    <option value="Sale">For sale</option>
                    <option value="Rent">For rent</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="form-propertyType">Property type</Label>
                  <select
                    id="form-propertyType"
                    value={draft.propertyType}
                    onChange={(e) =>
                      patch({
                        propertyType: e.target.value as ListingDraft['propertyType'],
                      })
                    }
                    className={inputClass()}
                  >
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="form-price" error={errors.price}>
                    Price, TTD
                    <span className="ml-1.5 text-[0.72rem] text-ink-faint">
                      {draft.listingType === 'Rent' ? 'per month' : 'asking'}
                    </span>
                  </Label>
                  <input
                    id="form-price"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={draft.price || ''}
                    onChange={(e) => patch({ price: Number(e.target.value) })}
                    className={inputClass(errors.price) + ' tnum'}
                  />
                  <ErrorText id="form-price" message={errors.price} />
                </div>

                <div>
                  <Label htmlFor="form-status">Status</Label>
                  <select
                    id="form-status"
                    value={draft.status}
                    onChange={(e) =>
                      patch({ status: e.target.value as ListingDraft['status'] })
                    }
                    className={inputClass()}
                  >
                    {LISTING_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3 sm:col-span-2">
                  <div>
                    <Label htmlFor="form-beds">Beds</Label>
                    <input
                      id="form-beds"
                      type="number"
                      min={0}
                      value={draft.beds ?? ''}
                      onChange={(e) =>
                        patch({ beds: e.target.value === '' ? null : Number(e.target.value) })
                      }
                      className={inputClass() + ' tnum'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="form-baths">Baths</Label>
                    <input
                      id="form-baths"
                      type="number"
                      min={0}
                      step={0.5}
                      value={draft.baths ?? ''}
                      onChange={(e) =>
                        patch({ baths: e.target.value === '' ? null : Number(e.target.value) })
                      }
                      className={inputClass() + ' tnum'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="form-sqft">Sq ft</Label>
                    <input
                      id="form-sqft"
                      type="number"
                      min={0}
                      value={draft.sqft ?? ''}
                      onChange={(e) =>
                        patch({ sqft: e.target.value === '' ? null : Number(e.target.value) })
                      }
                      className={inputClass() + ' tnum'}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="form-description">Description</Label>
                  <textarea
                    id="form-description"
                    rows={7}
                    value={draft.description}
                    onChange={(e) => patch({ description: e.target.value })}
                    className={inputClass() + ' resize-y leading-relaxed'}
                  />
                </div>

                {/* Amenities */}
                <div className="sm:col-span-2">
                  <Label htmlFor="form-amenity">Amenities</Label>
                  <div className="flex gap-2">
                    <input
                      id="form-amenity"
                      value={amenityInput}
                      placeholder="Private Pool"
                      onChange={(e) => setAmenityInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (!amenityInput.trim()) return;
                          patch({ amenities: [...draft.amenities, amenityInput.trim()] });
                          setAmenityInput('');
                        }
                      }}
                      className={inputClass()}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!amenityInput.trim()) return;
                        patch({ amenities: [...draft.amenities, amenityInput.trim()] });
                        setAmenityInput('');
                      }}
                      className="shrink-0 rounded-sm border border-mist-edge px-4 text-[0.82rem] text-ink-soft transition-colors duration-200 ease-out hover:border-ink/25 hover:text-ink"
                    >
                      Add
                    </button>
                  </div>
                  {draft.amenities.length > 0 && (
                    <ul className="mt-2.5 flex flex-wrap gap-1.5">
                      {draft.amenities.map((a, i) => (
                        <li key={a + i}>
                          <button
                            type="button"
                            onClick={() =>
                              patch({
                                amenities: draft.amenities.filter((_, idx) => idx !== i),
                              })
                            }
                            className="group flex items-center gap-1.5 rounded-sm bg-accent-wash px-2.5 py-1 text-[0.76rem] text-ink transition-colors duration-200 ease-out hover:bg-accent/40"
                          >
                            {a}
                            <span
                              aria-hidden
                              className="text-ink-faint group-hover:text-ink"
                            >
                              &times;
                            </span>
                            <span className="sr-only">Remove {a}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Images */}
                <div className="sm:col-span-2">
                  <Label htmlFor="form-images" error={errors.images}>
                    Photographs
                  </Label>
                  <input
                    ref={fileRef}
                    id="form-images-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="sr-only"
                    tabIndex={-1}
                    onChange={(e) => onFiles(e.target.files)}
                  />
                  <button
                    id="form-images"
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    aria-describedby={errors.images ? 'form-images-error' : undefined}
                    className={
                      'flex min-h-14 w-full items-center justify-center gap-2.5 rounded-sm border border-dashed px-4 text-[0.88rem] text-accent-deep transition-colors duration-200 ease-out hover:border-brand hover:bg-brand-wash focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-px ' +
                      (errors.images ? 'border-[#9B3D2E]' : 'border-ink-faint/40')
                    }
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                      <path d="M8 11V3M4.5 6.5 8 3l3.5 3.5M2.5 11v2h11v-2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {draft.images.length ? 'Add more photos' : 'Choose photos'}
                  </button>
                  <p className="mt-1.5 text-[0.75rem] text-ink-faint">
                    JPEG, PNG or WebP. The first photo is the cover. Large photos are resized for the web.
                  </p>
                  <ErrorText id="form-images" message={errors.images} />
                  {uploadErrors.length > 0 && (
                    <ul role="alert" className="mt-1.5 space-y-1 text-[0.75rem] text-[#9B3D2E]">
                      {uploadErrors.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  )}

                  {(draft.images.length > 0 || pending.length > 0) && (
                    <ul className="mt-3 flex flex-wrap gap-2.5">
                      {draft.images.map((src, i) => (
                        <li key={src} className="relative">
                          <span className="relative block h-20 w-28 overflow-hidden rounded-sm bg-mist-deep">
                            <Image
                              src={src}
                              alt={'Photograph ' + (i + 1)}
                              fill
                              unoptimized={!src.startsWith(PHOTO_PUBLIC_PREFIX) && !src.startsWith('https://images.unsplash.com')}
                              placeholder="blur"
                              blurDataURL={BLUR_DATA_URL}
                              sizes="112px"
                              className="object-cover"
                            />
                            {i === 0 ? (
                              <span className="absolute bottom-1 left-1 rounded-sm bg-ink/80 px-1.5 py-0.5 text-[0.62rem] uppercase tracking-[0.14em] text-mist">
                                Cover
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => makeCover(i)}
                                className="absolute bottom-1 left-1 rounded-sm bg-mist/90 px-1.5 py-0.5 text-[0.62rem] uppercase tracking-[0.14em] text-ink transition-colors duration-200 ease-out hover:bg-mist focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                              >
                                Make cover
                              </button>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            aria-label={'Remove photograph ' + (i + 1)}
                            className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[0.8rem] text-mist transition-transform duration-200 ease-out hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand active:scale-95"
                          >
                            &times;
                          </button>
                        </li>
                      ))}
                      {pending.map((p) => (
                        <li
                          key={p.key}
                          aria-label={'Uploading ' + p.name}
                          className="flex h-20 w-28 flex-col items-center justify-center gap-1.5 rounded-sm border border-mist-edge bg-mist-deep px-2 text-accent-deep"
                        >
                          <Spinner />
                          <span className="w-full truncate text-center text-[0.65rem] text-ink-faint">{p.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <label className="flex cursor-pointer items-center gap-2.5 sm:col-span-2">
                  <input
                    id="form-published"
                    type="checkbox"
                    checked={draft.isPublished !== false}
                    onChange={(e) => patch({ isPublished: e.target.checked })}
                    className="h-4 w-4 accent-[#4D93C8]"
                  />
                  <span className="text-[0.86rem] text-ink-soft">
                    Show on the website
                    <span className="ml-1.5 text-[0.76rem] text-ink-faint">
                      Untick to hide it without deleting
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-2.5 sm:col-span-2">
                  <input
                    id="form-featured"
                    type="checkbox"
                    checked={draft.featured}
                    onChange={(e) => patch({ featured: e.target.checked })}
                    className="h-4 w-4 accent-[#4D93C8]"
                  />
                  <span className="text-[0.86rem] text-ink-soft">
                    Feature on the homepage
                  </span>
                </label>
              </div>
            </form>

            <div className="border-t border-mist-edge px-6 py-4">
              {saveError && (
                <p role="alert" className="mb-3 text-[0.8rem] leading-relaxed text-[#9B3D2E]">
                  {saveError}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-end gap-3">
                {pending.length > 0 && (
                  <p aria-live="polite" className="mr-auto text-[0.78rem] text-ink-faint">
                    Uploading {pending.length} photo{pending.length === 1 ? '' : 's'}&hellip;
                  </p>
                )}
                <button
                  type="button"
                  onClick={close}
                  disabled={saving}
                  className="min-h-11 rounded-sm border border-mist-edge px-4 py-2.5 text-[0.85rem] text-ink-mute transition-colors duration-200 ease-out hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand active:translate-y-px disabled:opacity-50 desk:min-h-0"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="listing-form"
                  disabled={saving || pending.length > 0}
                  aria-busy={saving}
                  className="flex min-h-11 items-center gap-2 rounded-sm bg-brand-deep px-5 py-2.5 text-[0.85rem] text-mist transition-[background-color,transform,opacity] duration-200 ease-out hover:bg-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 desk:min-h-0"
                >
                  {saving && <Spinner />}
                  {saving
                    ? 'Saving…'
                    : listing
                      ? 'Save changes'
                      : draft.isPublished === false
                        ? 'Save hidden'
                        : 'Publish listing'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function inputClass(error?: string) {
  return (
    'w-full rounded-sm border bg-mist px-3 py-3 text-[16px] text-ink transition-colors duration-200 ease-out focus:border-brand sm:py-2.5 desk:text-[0.88rem] ' +
    (error ? 'border-[#9B3D2E]' : 'border-mist-edge hover:border-ink/25')
  );
}

function Label({
  htmlFor,
  children,
  error,
}: {
  htmlFor: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={
        'mb-1.5 block text-[0.76rem] ' + (error ? 'text-[#9B3D2E]' : 'text-ink-soft')
      }
    >
      {children}
    </label>
  );
}

function ErrorText({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id + '-error'} role="alert" className="mt-1.5 text-[0.75rem] text-[#9B3D2E]">
      {message}
    </p>
  );
}
