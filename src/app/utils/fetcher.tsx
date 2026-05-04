import { mutate } from "swr";
import axios from "axios";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:80';

export function fetcher(path: string) {
  // เช็คว่าเป็น Relative path (/api/...) และอยู่บน Server หรือไม่
  const isServer = typeof window === 'undefined';
  const fullUrl = (isServer && path.startsWith('/')) 
    ? `${baseUrl}${path}` 
    : path;

  return axios
    .get(fullUrl)
    .then((result) => result.data)
    .catch((error) => {
      // ในช่วง Build ให้ log แค่ warning แทนที่จะพ่น error เต็มระบบ
      console.warn(`Fetch failed for: ${fullUrl} - ${error.message}`);
      return null; // คืนค่า null เพื่อไม่ให้ Build พัง (Exit 1)
    });
}

export async function fetchAndCache(key: string) {
  try {
    const request = await fetcher(key);
    
    // mutate ข้อมูลเข้า Cache เฉพาะเมื่อรันบน Browser เท่านั้น
    if (typeof window !== 'undefined') {
      mutate(key, request, false);
    }
    
    return request;
  } catch (error) {
    return null; // ป้องกันการโยน Error จน Build หยุดทำงาน
  }
}