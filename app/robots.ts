import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

/**
 * robots.txt.
 *
 * Everyone may crawl the public site. AI search and answer engines are named
 * explicitly and allowed: being quoted by ChatGPT, Perplexity, Gemini and
 * Copilot is a traffic source for an agency that is short of it, and some of
 * these bots only crawl where they are invited.
 *
 * /admin (the open listing manager in the preview) and /saved (a visitor's own
 * shortlist) are kept out of every index. A crawl rule is not security; /admin
 * still needs a login before launch.
 */
const AI_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot',
  'Applebot-Extended',
  'Bingbot',
  'DuckAssistBot',
  'Meta-ExternalAgent',
  'CCBot',
];

const PRIVATE = ['/admin', '/saved'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE },
      { userAgent: AI_BOTS, allow: '/', disallow: PRIVATE },
    ],
    sitemap: SITE_URL + '/sitemap.xml',
    host: SITE_URL,
  };
}
