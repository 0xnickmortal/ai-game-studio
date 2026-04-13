/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Required for Docker deployment

  // node-pty is a native module — exclude from webpack bundling
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('node-pty');
    }
    return config;
  },
};

export default nextConfig;
