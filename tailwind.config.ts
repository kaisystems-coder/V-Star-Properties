import type { Config } from 'tailwindcss';

/**
 * Brand tokens live here and ONLY here.
 * Values come from the V-Star brand guide. Nothing else references raw hex
 * except globals.css, which mirrors these for the range slider and focus ring.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: {
        // Small phones (320-400px) need a stacked layout where a 400px+
        // phone has room for a row.
        xs: '400px',
      },
      colors: {
        // V-Star brand guide (V-Star_Properties_Brand_Guidelines.pdf):
        // Property Blue #4D93C8, Trust Blue #2568A7, Fresh Green #A5CF5E,
        // Charcoal #203546, neutrals White / Mist / Stone grey.
        ink: {
          DEFAULT: '#203546', // Charcoal — body text + dark grounds
          soft: '#2C4458',
          mute: '#4A5F70', // 6.6:1 on white
          faint: '#5F7383', // 4.9:1 on white — the floor for small labels
        },
        mist: {
          DEFAULT: '#FFFFFF', // page ground — the guide's "50% white"
          deep: '#F3F6F9', // Mist — elevated surface
          edge: '#DCE4EB', // hairlines, the spec ledger rules
        },
        // The accent works in two registers, exactly as the brand guide uses
        // it: Fresh Green on charcoal grounds, Trust Blue on white ones.
        accent: {
          DEFAULT: '#A5CF5E', // Fresh Green — on ink, hairlines, markers (7:1 on ink)
          deep: '#2568A7', // Trust Blue — accent text on white (5.8:1)
          wash: '#E6F0F8',
        },
        brand: {
          DEFAULT: '#4D93C8', // Property Blue — primary brand colour (decorative, large)
          deep: '#2568A7', // Trust Blue — headings and CTAs
          wash: '#EAF4FB',
        },
      },
      fontFamily: {
        display: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', '"Liberation Serif"', '"Times New Roman"', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        display: '-0.03em',
      },
      boxShadow: {
        // Layered, ink-tinted. No flat shadow-md anywhere.
        raise: '0 1px 2px rgba(32,53,70,0.04), 0 8px 24px -12px rgba(32,53,70,0.10)',
        lift: '0 2px 4px rgba(32,53,70,0.05), 0 18px 44px -20px rgba(32,53,70,0.18)',
        float: '0 4px 8px rgba(32,53,70,0.06), 0 32px 64px -28px rgba(32,53,70,0.28)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      zIndex: {
        sticky: '20',
        overlay: '40',
        modal: '50',
        toast: '60',
      },
    },
  },
  plugins: [
    /**
     * `touch:` — a coarse-pointer variant.
     *
     * Touch sizing keyed only to width breaks on a landscape phone: at 844px
     * wide the `sm:` rules fire and fingers get 24px targets. This variant asks
     * the device what it actually is, so a control can hold 44px on every
     * touchscreen and still tighten up for a mouse.
     */
    function pointerVariants({ addVariant }: { addVariant: (n: string, v: string) => void }) {
      addVariant('touch', '@media (pointer: coarse)');
      // `desk:` — the mouse-only counterpart to `sm:`. Use it wherever a rule
      // shrinks a hit target, so the tightening follows the pointer rather
      // than the viewport and a landscape phone keeps its 44px.
      addVariant('desk', '@media (min-width: 640px) and (pointer: fine)');
    },
  ],
};

export default config;
