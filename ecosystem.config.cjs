module.exports = {
  apps: [
    {
      name: "Dashboard WGC Acak",
      script: "./node_modules/next/dist/bin/next",
      args: "start -p 80",
      instances: "1",            // จำนวนจำลองแอป: ใส่ตัวเลข หรือ "max" เพื่อใช้ CPU ให้ครบทุก Cores
      exec_mode: "cluster",        // โหมดการรัน: "fork" (รันเดี่ยว) หรือ "cluster" (ช่วยกระจายโหลด)
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};