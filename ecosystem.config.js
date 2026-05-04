module.exports = {
  apps: [
    {
      name: "Dashboard WGC Acak",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 80", // Change to your preferred port
      instances: "3",       // Utilizes all CPU cores (cluster mode)
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};