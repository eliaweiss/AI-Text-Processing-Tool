/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Configure webpack for @huggingface/transformers
    config.resolve.alias = {
      ...config.resolve.alias,
      'sharp$': false,
      'onnxruntime-node$': false,
    };

    // Enable WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Add loader for markdown files to import as raw strings
    config.module.rules.push({
      test: /\.md$/,
      type: 'asset/source',
    });

    return config;
  },
  // Enable static export if needed
  // output: 'export',
  
  // Disable x-powered-by header
  poweredByHeader: false,
  
  // Configure headers for WASM and WebGPU
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

