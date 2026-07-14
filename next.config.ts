/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["img.freepik.com"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            value: [
              "accelerometer=()",
              "ambient-light-sensor=()",
              "autoplay=()",
              "bluetooth=()",
              "camera=()",
              "display-capture=()",
              "fullscreen=(self)",
              "geolocation=()",
              "gyroscope=()",
              "hid=()",
              "magnetometer=()",
              "microphone=()",
              "midi=()",
              "payment=()",
              "publickey-credentials-get=()",
              "screen-wake-lock=()",
              "serial=()",
              "usb=()",
              "web-share=()",
              "xr-spatial-tracking=()",
            ].join(", "),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
