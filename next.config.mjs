/** @type {import("next").NextConfig} */

import os from 'os';

// ดึง IP เครื่องปัจจุบันมาใส่ใน List โดยอัตโนมัติ (ESM Style)
const networkInterfaces = os.networkInterfaces();
const localIPs = Object.values(networkInterfaces)
  .flat()
  .filter((iface) => iface && iface.family === 'IPv4')
  .map((iface) => iface.address);

const nextConfig = {

  allowedDevOrigins: [...localIPs, 'localhost', '10.238.70.9'],
  
  compiler: {
    // ใส่การตั้งค่า compiler ที่ถูกต้องตรงนี้ เช่น
    styledComponents: true, 
  },
  images: {
    qualities: [75, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        port: ""
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: ""
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: ""
      },
      {
        protocol: "https",
        hostname: "pub-b7fd9c30cdbf439183b75041f5f71b92.r2.dev",
        port: ""
      }
    ]
  },
}

export default nextConfig;
