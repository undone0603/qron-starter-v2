/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["fal.media", "your-supabase-url.supabase.co"],
  },
  // No experimental.serverActions — remove it entirely
};

module.exports = nextConfig;

