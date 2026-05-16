module.exports = {
  apps: [
    {
      name: "Dashboard WGC Acak",
      script: "npm",               // สคริปต์หลักที่สั่งรัน (หรือใส่เป็น "node_modules/next/dist/bin/next")
      args: "run start",           // อาร์กิวเมนต์ที่ส่งให้สคริปต์
      instances: "1",            // จำนวนจำลองแอป: ใส่ตัวเลข หรือ "max" เพื่อใช้ CPU ให้ครบทุก Cores
      exec_mode: "cluster",        // โหมดการรัน: "fork" (รันเดี่ยว) หรือ "cluster" (ช่วยกระจายโหลด)
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};