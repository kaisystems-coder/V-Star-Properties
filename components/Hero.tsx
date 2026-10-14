'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BLUR_DATA_URL } from '@/lib/format';
import HeroSearch from './HeroSearch';

// The still that opens the section on every load, stays under the video
// until it can play, and is the whole picture for reduced-motion visitors,
// phones and any browser that can't play the clip.
const HERO_STILL =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=74';

/**
 * The hero reel: four properties, three seconds each, cross-dissolved into a
 * seamless 12-second loop — pre-rendered into one file per orientation.
 *
 * It used to be assembled live from four separate Pexels 1080p clips, juggled
 * between two <video> elements on a timer. That streamed ~55MB to show twelve
 * seconds, which is why phones were never given it, and four sources racing
 * for bandwidth is what produced the long-running transition blip. Baking the
 * reel into a single file removes both problems: one source, one native
 * `loop`, nothing to time and nothing to race.
 *
 * Both cuts come from the 4K originals, so the portrait one is a genuine
 * 1080x1920 crop rather than a landscape clip upscaled ~3x to fill a tall
 * phone. Built with ffmpeg (trim 3.9s per shot, 0.9s xfade, HLG→SDR tone map
 * on the HDR waterfront clip, crop centres set by eye per shot); the darkening
 * grade that was a CSS filter is baked in, so phones do not pay for a
 * full-screen filter on every frame.
 *
 *   landscape  1920x1080  30fps  12s  8.5MB  — desktop, landscape phones
 *   portrait   1080x1920  30fps  12s  7.8MB  — phones and portrait tablets
 */
const HERO_VIDEO = {
  landscape: '/video/hero-landscape.mp4',
  portrait: '/video/hero-portrait.mp4',
} as const;

/** Visitors who have asked their browser to spare data never get the reel. */
function prefersSavingData(): boolean {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  return Boolean(nav.connection?.saveData);
}

export default function Hero({ count }: { count: number }) {
  const reduce = useReducedMotion();
  // Which cut to play, or null for the still alone. Chosen after mount from
  // the screen's shape, and swapped if the device is rotated.
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  // Only revealed once it is actually playing. A <video> with no decoded
  // frames paints nothing, and autoplay can be refused outright (iOS Low Power
  // Mode), so the still stays in charge until there is real motion to show.
  const [playing, setPlaying] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Phones keep the still: the portrait reel is 7.8MB on mobile data and
    // costs the first paint. Tablets and up still get the reel.
    if (reduce || prefersSavingData() || window.matchMedia('(max-width: 767px)').matches) {
      setVideoSrc(null);
      return;
    }
    const mq = window.matchMedia('(orientation: portrait)');
    const update = () => setVideoSrc(mq.matches ? HERO_VIDEO.portrait : HERO_VIDEO.landscape);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [reduce]);

  // A new cut starts hidden until it plays, so a rotation never flashes an
  // empty frame.
  useEffect(() => setPlaying(false), [videoSrc]);

  // Pause while the hero is scrolled out of view. The homepage is long, and a
  // phone decoding a full-screen video nobody can see is battery and frame
  // budget taken from the page actually being scrolled.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !videoSrc) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const v = videoRef.current;
        if (!v) return;
        if (entry.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0 },
    );
    io.observe(section);
    return () => io.disconnect();
  }, [videoSrc]);

  // iOS Safari only autoplays a video it can see is muted as an attribute.
  // React sets `muted` as a property, which is not enough on its own, so it is
  // stamped onto the element directly before asking it to play. Stable, so a
  // re-render cannot restart a video the observer above has paused.
  const attachVideo = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (!el) return;
    el.muted = true;
    el.defaultMuted = true;
    el.setAttribute('muted', '');
    el.setAttribute('playsinline', '');
    el.play().catch(() => {});
  }, []);

  // Entrance is a short orchestrated sequence, and every element's resting
  // state is visible — the animation only offsets it.
  const rise = (delay: number) =>
    reduce
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 } }
      : {
          // Never 0: the heading must paint from the server HTML (LCP on phones).
          initial: { opacity: 0.35, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <section ref={sectionRef} className="on-ink relative isolate overflow-hidden bg-ink">
      {/* `isolate` makes this its own stacking context, so nothing in the
          media stack can outrank the copy that follows this wrapper. `z-0`
          keeps the whole media stack behind it. */}
      <div className="absolute inset-0 isolate z-0">
        {/* The still, and the backstop the video rests on. It is never faded
            out: it sits at full opacity behind the reel for the life of the
            page, so if the video stalls, buffers or is refused autoplay what
            shows is this photograph rather than the dark page. It is also the
            whole picture for reduced-motion and data-saver visitors. */}
        <div className="grain absolute inset-0">
          <Image
            src={HERO_STILL}
            alt=""
            aria-hidden
            fill
            priority
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>

        {/* The reel. No grain and no blur — moving footage reads any added
            texture as noise rather than warmth. Keyed on the source so a
            rotation mounts the other cut cleanly rather than swapping src on a
            live element. */}
        {videoSrc && (
          <video
            key={videoSrc}
            ref={attachVideo}
            aria-hidden
            muted
            loop
            autoPlay
            playsInline
            preload="auto"
            disablePictureInPicture
            src={videoSrc}
            onPlaying={() => setPlaying(true)}
            className={
              'absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ease-out ' +
              (playing ? 'opacity-100' : 'opacity-0')
            }
          />
        )}

        {/* Scrims: dark only where there is copy to protect, so the footage
            stays visible everywhere else. Values were tuned against a script
            that hides the text and measures WCAG contrast behind every line at
            half-second steps through the whole loop, so they hold on the
            brightest frame, not just the one in a screenshot.

            Phones get one top-to-bottom gradient. The copy spans the full
            width there, so the old left-to-right desktop scrim darkened the
            entire screen. This one is dark behind the eyebrow, headline and
            intro, light behind the search panel (which has its own frosted
            ground), and fades to the page colour at the foot.

            These sit above the video simply by coming after it in the DOM,
            and deliberately carry no z-index of their own — the whole media
            stack is contained by the wrapper's own stacking context (see the
            `isolate z-0` on it) rather than leaking out to outrank the copy
            in the next sibling. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(32,53,70,0.8)_0%,rgba(32,53,70,0.8)_8%,rgba(32,53,70,0.82)_22%,rgba(32,53,70,0.75)_40%,rgba(32,53,70,0.35)_50%,rgba(32,53,70,0.35)_85%,rgba(32,53,70,1)_100%)] sm:hidden"
        />
        {/* From sm up the copy is a left-hand column, so the protection runs
            left to right and is gone by the time it reaches the property. */}
        <div
          aria-hidden
          className="absolute inset-0 hidden bg-[linear-gradient(to_right,rgba(32,53,70,0.88)_0%,rgba(32,53,70,0.8)_44%,rgba(32,53,70,0.35)_58%,rgba(32,53,70,0)_72%)] sm:block"
        />
        {/* A light band along the top keeps the white nav legible over a
            bright sky, and the foot fades into the page without a seam. */}
        <div
          aria-hidden
          className="absolute inset-0 hidden bg-[linear-gradient(to_bottom,rgba(32,53,70,0.8)_0%,rgba(32,53,70,0.6)_8%,rgba(32,53,70,0)_16%,rgba(32,53,70,0)_72%,rgba(32,53,70,1)_100%)] sm:block"
        />
      </div>

      <div className="relative mx-auto max-w-[82rem] px-5 pb-14 pt-[9.5rem] sm:px-8 sm:pb-16 sm:pt-[11rem]">
        <div className="max-w-[44rem]">
          <motion.p
            {...rise(0.05)}
            className="text-[0.72rem] uppercase tracking-[0.24em] text-accent"
          >
            San Fernando &middot; South &amp; Central Trinidad
          </motion.p>

          {/* Two voices, as the brand guide sets its own headline ("Built on
              trust. / Designed for confidence."): a Lato Heavy statement, then
              the answer in Liberation Serif italic, in Fresh Green. */}
          <motion.h1
            {...rise(0.12)}
            className="mt-4 font-display text-[2.4rem] leading-[1.04] tracking-display text-mist xs:text-[2.7rem] sm:text-[3.7rem] lg:text-[4.2rem]"
          >
            Find a place
            <span className="block font-serif font-normal italic tracking-[-0.01em] text-accent">
              to call home.
            </span>
          </motion.h1>

          <motion.p
            {...rise(0.2)}
            className="mt-5 max-w-[34rem] text-[1.02rem] leading-[1.7] text-mist/75"
          >
            Houses, townhouses, apartments and land across San Fernando, La Romaine,
            Palmiste and beyond, from an agency with more than ten years of
            successful results.
          </motion.p>
        </div>

        <HeroSearch count={count} />
      </div>
    </section>
  );
}
