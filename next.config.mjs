/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // WebP only. AVIF encoding costs seconds per variant on a cold cache
    // and this demo is judged on how fast it feels in a pitch meeting.
    formats: ['image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      // Where V-Star's listing photos are uploaded today. Moves to Supabase
      // Storage when the backend goes in.
      { protocol: 'https', hostname: 'mybunchofkeys.com', pathname: '/wp-content/uploads/**' },
    ],
  },
};

export default nextConfig;
