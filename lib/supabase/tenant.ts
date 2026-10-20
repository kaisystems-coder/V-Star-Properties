/**
 * This site's tenant on the shared project (public.tenants, slug
 * v-star-properties). Server-side only: import it from Server Components and
 * route handlers, and pass it down as a prop. A TENANT_ID env var overrides it,
 * which is how this codebase would be redeployed for another client.
 */
export const TENANT_ID = process.env.TENANT_ID || '949f81ee-ba83-4f50-ab7c-1c6545759543';
