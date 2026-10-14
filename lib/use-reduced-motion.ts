'use client';

import { useReducedMotion as useFramerReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * Framer's useReducedMotion reads the media query during the first render,
 * so a reduced-motion visitor's client markup differs from the server's and
 * React reports a hydration mismatch. This returns false until mount (matching
 * the server), then the real preference.
 */
export function useReducedMotion(): boolean {
  const prefers = useFramerReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? Boolean(prefers) : false;
}
