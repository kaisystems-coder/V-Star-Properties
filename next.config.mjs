/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // WebP only. AVIF encoding costs seconds per variant on a cold cache
    // and this demo is judged on how fast it feels in a pitch meeting.
    formats: ['image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      // Listing photos: the shared project's public bucket, one folder per tenant.
      {
        protocol: 'https',
        hostname: 'ezotkeijhffwylgsjkhq.supabase.co',
        pathname: '/storage/v1/object/public/listing-photos/**',
      },
    ],
  },
};

export default nextConfig;
