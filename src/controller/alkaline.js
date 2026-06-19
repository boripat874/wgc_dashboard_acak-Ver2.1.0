import knexfile from '@/lib/configKnex.ts';
import { convertTotimestamp } from '@/controller/funtion.js';

// interface alkalirecieved {
//     result: string;
//     id?: number;
//     // ... other properties
// }

import knex from 'knex';
import { format } from 'date-fns';
import { number } from 'framer-motion';
// import knexfile from '../../knexfile';

const db = knex(knexfile.development);

const timeout = 5000; // กำหนดค่า timeout (หน่วยมิลลิวินาที)

function mergeAndPivotDataByDateTime(recieved, mixer, store, consumed) {
    // 1. Create Maps for efficient O(1) lookup

    // Create a standardized function to ensure consistent key format
    const standardizeDateKey = (dateValue) => {
        // If the date is a JS Date object, convert it to an ISO string and slice it.
        // If it's already a string, trim any potential time components.
        if (dateValue instanceof Date) {
            // Converts to 'YYYY-MM-DD'
            return dateValue.toISOString().slice(0, 10); 
        }
        // Assumes it's a string, takes the first 10 characters ('YYYY-MM-DD')
        return String(dateValue).slice(0, 10); 
    };

    const recievedMap = new Map();

    for (const item of recieved) {
      recievedMap.set(standardizeDateKey(item.date_time), item);
    }
    
    // Map for mixer data (tank3_1, tank3_2)
    const mixerMap = new Map();

    for (const item of mixer) {
      mixerMap.set(standardizeDateKey(item.date_time), item);
    }

    // Map for store data (tan4) - Renamed in the final object to avoid conflict
    const storeMap = new Map();

    for (const item of store) {
      // Store the item directly or a relevant subset
      storeMap.set(standardizeDateKey(item.date_time), item);
    }

    // Map for consumed data, transformed/pivoted
    const consumedPivotedMap = new Map();

    for (const item of consumed) {

      const dateTime = standardizeDateKey(item.date_time);
      // Create the new column name: tank4_PLANT_NAME

        var plantname = "";

        if (item.plant == "PD1") {

          plantname = "usepd1";

        } else if (item.plant == "PD2") {

          plantname = "usepd2";

        } else if (item.plant == "PD3") {

          plantname = "usepd3";

        }

        const plantKey = plantname;
        const plantValue = item.tank4;

        // console.log(dateTime, ">>",plantKey, ">>",plantValue);

        if (!consumedPivotedMap.has(dateTime)) {
          consumedPivotedMap.set(dateTime, {});
        }
        
        // Add the pivoted data to the map for the specific date
        // Use consumedPivotedMap.get(dateTime) to get the object for this date
        if(plantKey){
          consumedPivotedMap.get(dateTime)[plantKey] = plantValue;
        }
    }

    // สร้าง Master List (Unique Date Set) จากทุกแหล่งข้อมูล

    const allUniqueDateKeys = new Set();
    
    // รวมวันที่จาก recieved
    recieved.forEach(item => allUniqueDateKeys.add(standardizeDateKey(item.date_time)));
    
    // รวมวันที่จาก mixer (ถ้าซ้ำจะถูกตัดออกโดย Set)
    mixer.forEach(item => allUniqueDateKeys.add(standardizeDateKey(item.date_time)));
    
    // รวมวันที่จาก store
    store.forEach(item => allUniqueDateKeys.add(standardizeDateKey(item.date_time)));
    
    // รวมวันที่จาก consumed
    consumed.forEach(item => allUniqueDateKeys.add(standardizeDateKey(item.date_time)));
    
    // แปลง Set เป็น Array และจัดเรียงวันที่ (Ascending)
    const sortedMasterDateList = Array.from(allUniqueDateKeys).sort();


    // 2. Iterate through 'recieved' (the master date list) and merge all data
    const finalReportData = sortedMasterDateList.map(dateTimeKey  => {
        
        // Lookup corresponding data
        const recievedItem = recievedMap.get(dateTimeKey);
        const mixerItem = mixerMap.get(dateTimeKey);
        const storeItem = storeMap.get(dateTimeKey);
        const consumedData = consumedPivotedMap.get(dateTimeKey);

        // console.log("recievedItem >>",dateTimeKey);
        // console.log("mixerItem >>",mixerMap.get(dateTimeKey));
        // console.log("storeItem >>",storeMap.get(dateTimeKey));
        // console.log("consumedData >>",consumedPivotedMap.get(dateTimeKey));
        
        // 3. Combine all the data into the final object
        const mergedItem = {

            date_time: dateTimeKey,
            
            // recieved data (tank1, tank2)
            tank1: recievedItem ? recievedItem.tank1 : 0,
            tank2: recievedItem ? recievedItem.tank2 : 0,
            tank12: recievedItem ? (Number(recievedItem.tank1) + Number(recievedItem.tank2)).toFixed(2) : 0,
            
            // mixer data (tank3_1, tank3_2) - default to 0 if missing
            tank3: mixerItem ? (Number(mixerItem.tank3_1) + Number(mixerItem.tank3_2)).toFixed(2) : 0,
            tank3_1: mixerItem ? mixerItem.tank3_1 : 0,
            tank3_2: mixerItem ? mixerItem.tank3_2 : 0,
            
            // store data (tan4) - Renamed to tan4_store for clarity
            tank4: storeItem ? storeItem.tank4 : 0,

            // consumed data: Spread the pivoted columns (e.g., tank4_PD1, tank4_PD2, etc.)
            usepd1: consumedData ? consumedData.usepd1 : 0,
            usepd2: consumedData ? consumedData.usepd2 : 0,
            usepd3: consumedData ? consumedData.usepd3 : 0,
        };

        return mergedItem;
    });

    return finalReportData;
}

// Dashboard Alkali Fill
export const alkalirecieved = async (c) => {

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Request timed out")), timeout);
  });

  const alkalirecievedDataListLogic = new Promise(async (resolve, reject) => {
    try { 
      // ใส่ logic การทำงานของคุณตรงนี้
      // เช่น การเรียกดูข้อมูลจากฐานข้อมูล
      const timestamp = await convertTotimestamp(c.req.query()); // แปลง timestamp
      // const period = await c.req.query();
      // console.log(timestamp);

      const data_query = await db('ScadaDataLogAlkaline')
        .select('*')
        .where('UnixTimestamp', '>=', timestamp.startTimestamp)
        .where('UnixTimestamp', '<', timestamp.endTimestamp)
        .orderBy('UnixTimestamp', 'asc');

        const promises_ = await Promise.all(

            data_query.map(async (item) => {
    
              const baseDate = new Date(item.UnixTimestamp * 1000); // แปลง Unix Timestamp เป็น Date Object
            
              // 1. หาวันเมื่อวาน (ถอยหลังไป 1 วัน) เริ่มต้นที่ 00:00:00
              const prevStart = new Date(baseDate);
              prevStart.setDate(baseDate.getDate() - 1); // เปลี่ยนจาก +1 เป็น -1
              prevStart.setHours(0, 0, 0, 0);
    
              // 2. หาวันสิ้นสุดของเมื่อวาน (ก็คือจุดเริ่มต้นของวัน baseDate ที่ 00:00:00)
              const prevEnd = new Date(baseDate);
              prevEnd.setHours(0, 0, 0, 0);
    
              // แปลงเป็น Seconds (Unix Timestamp)
              const prevStartSec = Math.floor(prevStart.getTime() / 1000);
              const prevEndSec = Math.floor(prevEnd.getTime() / 1000);
    
              // Query ข้อมูลจากตาราง ScadaDataLogAlkaline วันก่อน
              const rows = await db('ScadaDataLogAlkaline')
                .select("*")
                .where('UnixTimestamp', '>=', prevStartSec)
                .where('UnixTimestamp', '<=', prevEndSec)
                .orderBy('UnixTimestamp', 'desc')
                .first(); // เอาแถวล่าสุดแถวเดียว
    
              // console.log("rows >>", rows);
    
              if (rows) {
    
                const System_Data_Fill = item.Fill_Kg_N || 0;
                const System_Data_Density = item.Density_N || 1;
                const System_Data_Fill_lastday = rows.Fill_Kg_N || 0;
                const System_Data_Density_lastday = rows.Density_N || 1;
    
                const LT_PV_m3_LT_101N = item.LT_PV_m3_LT_101N || 0;
                const data_remaining_tank1_fill = (LT_PV_m3_LT_101N + 0.8) * 1000;
                const data_remaining_tank1_fill_total = (data_remaining_tank1_fill * System_Data_Density);
    
                const LT_PV_m3_LT_101N_lastday = rows.LT_PV_m3_LT_101N || 0;
                const data_remaining_tank1_fill_lastday = (LT_PV_m3_LT_101N_lastday + 0.8) * 1000;
                const data_remaining_tank1_fill_total_lastday = (data_remaining_tank1_fill_lastday * System_Data_Density_lastday);
    
                const LT_PV_m3_LT_102N = item.LT_PV_m3_LT_102N || 0;
                const data_remaining_tank2_fill = (LT_PV_m3_LT_102N + 0.8) * 1000;
                const data_remaining_tank2_fill_total = (data_remaining_tank2_fill * System_Data_Density);
    
                const LT_PV_m3_LT_102N_lastday = rows.LT_PV_m3_LT_102N || 0;
                const data_remaining_tank2_fill_lastday = (LT_PV_m3_LT_102N_lastday + 0.8) * 1000;
                const data_remaining_tank2_fill_total_lastday = (data_remaining_tank2_fill_lastday * System_Data_Density_lastday);
    
                // console.log("data_remaining_tank1_fill_total >>", data_remaining     
    
                const kg_101N = data_remaining_tank1_fill_total - data_remaining_tank1_fill_total_lastday;
                const kg_102N = data_remaining_tank2_fill_total - data_remaining_tank2_fill_total_lastday;
    
                const total_tank_fill = data_remaining_tank1_fill_total + data_remaining_tank2_fill_total;
    
                item.kg_101N = data_remaining_tank1_fill_total;
                item.kg_102N = data_remaining_tank2_fill_total;
                item.total_tank_fill = total_tank_fill; 
    
                return {
                  ...item
                }
    
              }
    
              
              return null; // หรือ return ค่าอื่นๆ ตามที่ต้องการเมื่อไม่มีข้อมูลของวันก่อนหน้า
            })
        );

        // console.log("promises_ >>", await Promise.all(promises_));
        const final_items = promises_.filter(item => item !== null);

      resolve({ 
        total: final_items.length,
        result: final_items 
      });

    } catch (error) {
      reject(error);
    }
  });

  try {
    const result = await Promise.race([alkalirecievedDataListLogic, timeoutPromise]);
    
    return c.json(result);

  } catch (error) {
    if (error instanceof Error && error.message === "Request timed out") {
      // ส่ง status 402 หรือตามที่ต้องการกลับไป
      return c.json({ message: "Request timed out" }, 402);
    } else {
      // จัดการกับ error อื่นๆ
      console.error("An unexpected error occurred:", error);
      return c.json({ message: "Internal Server Error" }, 500);
    }
  }
};

// Dashboard Alkali Mixed
export const alkalimixed = async (c) => {

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Request timed out")), timeout);
  });

  const alkalimixedDataListLogic = new Promise(async (resolve, reject) => {
    try {
      // ใส่ logic การทำงานของคุณตรงนี้
      // เช่น การเรียกดูข้อมูลจากฐานข้อมูล
      const timestamp = await convertTotimestamp(c.req.query()); // แปลง timestamp
      // const period = await c.req.query();
      // console.log(timestamp);
 
      const data_query = await db('ScadaDataLogAlkaline')
        .select('*')
        .where('UnixTimestamp', '>=', timestamp.startTimestamp)
        .where('UnixTimestamp', '<', timestamp.endTimestamp)
        .orderBy('UnixTimestamp', 'asc');

      const promises_ = await Promise.all(

            data_query.map(async (item) => {
    
              const baseDate = new Date(item.UnixTimestamp * 1000); // แปลง Unix Timestamp เป็น Date Object
            
              // 1. หาวันเมื่อวาน (ถอยหลังไป 1 วัน) เริ่มต้นที่ 00:00:00
              const prevStart = new Date(baseDate);
              prevStart.setDate(baseDate.getDate() - 1); // เปลี่ยนจาก +1 เป็น -1
              prevStart.setHours(0, 0, 0, 0);
    
              // 2. หาวันสิ้นสุดของเมื่อวาน (ก็คือจุดเริ่มต้นของวัน baseDate ที่ 00:00:00)
              const prevEnd = new Date(baseDate);
              prevEnd.setHours(0, 0, 0, 0);
    
              // แปลงเป็น Seconds (Unix Timestamp)
              const prevStartSec = Math.floor(prevStart.getTime() / 1000);
              const prevEndSec = Math.floor(prevEnd.getTime() / 1000);
    
              // Query ข้อมูลจากตาราง ScadaDataLogAlkaline วันก่อน
              const rows = await db('ScadaDataLogAlkaline')
                .select("*")
                .where('UnixTimestamp', '>=', prevStartSec)
                .where('UnixTimestamp', '<=', prevEndSec)
                .orderBy('UnixTimestamp', 'desc')
                .first(); // เอาแถวล่าสุดแถวเดียว
    
              // console.log("rows >>", rows);
    
              if (rows) {
    
                const Aka_Total_ALL_FT_101N = (item.Aka_Total_ALL_FT_101N || 0) - (rows.Aka_Total_ALL_FT_101N || 0);
                const Aka_Total_ALL_FT_201N = (item.Aka_Total_ALL_FT_201N || 0) - (rows.Aka_Total_ALL_FT_201N || 0);
    
                item.ro_data = Aka_Total_ALL_FT_101N;
                item.chemical_data = Aka_Total_ALL_FT_201N;

                item.total_mix = item.ro_data + item.chemical_data; 
    
                return {
                  ...item
                }
    
              }
              
              return null; // หรือ return ค่าอื่นๆ ตามที่ต้องการเมื่อไม่มีข้อมูลของวันก่อนหน้า
            })
      );

      // console.log("promises_ >>", await Promise.all(promises_));
      const final_items = promises_.filter(item => item !== null);

      resolve({ 
        total: final_items.length,
        result: final_items 
      });

    } catch (error) {
      reject(error);
    }
  });

  try {
    const result = await Promise.race([alkalimixedDataListLogic, timeoutPromise]);
    
    return c.json(result);

  } catch (error) {
    if (error instanceof Error && error.message === "Request timed out") {
      // ส่ง status 402 หรือตามที่ต้องการกลับไป
      return c.json({ message: "Request timed out" }, 402);
    } else {
      // จัดการกับ error อื่นๆ
      console.error("An unexpected error occurred:", error);
      return c.json({ message: "Internal Server Error" }, 500);
    }
  }
};

// Dashboard HCI Tank Mixed
export const alkalitankmixed = async (c) => {

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Request timed out")), timeout);
  });

  const alkalinetankmixedDataListLogic = new Promise(async (resolve, reject) => {
    try {
      // ใส่ logic การทำงานของคุณตรงนี้
      // เช่น การเรียกดูข้อมูลจากฐานข้อมูล
      const timestamp = await convertTotimestamp(c.req.query()); // แปลง timestamp
      // const period = await c.req.query();
      // console.log(timestamp);
 
      const data_query = await db('ScadaDataLogAlkaline')
        .select('*')
        .where('UnixTimestamp', '>=', timestamp.startTimestamp)
        .where('UnixTimestamp', '<', timestamp.endTimestamp)
        .orderBy('UnixTimestamp', 'asc');

      const promises_ = await Promise.all(

            data_query.map(async (item) => {
    
              const baseDate = new Date(item.UnixTimestamp * 1000); // แปลง Unix Timestamp เป็น Date Object
            
              // 1. หาวันเมื่อวาน (ถอยหลังไป 1 วัน) เริ่มต้นที่ 00:00:00
              const prevStart = new Date(baseDate);
              prevStart.setDate(baseDate.getDate() - 1); // เปลี่ยนจาก +1 เป็น -1
              prevStart.setHours(0, 0, 0, 0);
    
              // 2. หาวันสิ้นสุดของเมื่อวาน (ก็คือจุดเริ่มต้นของวัน baseDate ที่ 00:00:00)
              const prevEnd = new Date(baseDate);
              prevEnd.setHours(0, 0, 0, 0);
    
              // แปลงเป็น Seconds (Unix Timestamp)
              const prevStartSec = Math.floor(prevStart.getTime() / 1000);
              const prevEndSec = Math.floor(prevEnd.getTime() / 1000);
    
              // Query ข้อมูลจากตาราง ScadaDataLogAlkaline วันก่อน
              const rows = await db('ScadaDataLogAlkaline')
                .select("*")
                .where('UnixTimestamp', '>=', prevStartSec)
                .where('UnixTimestamp', '<=', prevEndSec)
                .orderBy('UnixTimestamp', 'desc')
                .first(); // เอาแถวล่าสุดแถวเดียว
    
              // console.log("rows >>", rows);
    
              if (rows) {

                const constant_tank3_Mix = 0.3;
                const constant_tank4_Store = 1.3;
    
                const LT_PV_m3_LT_301 = item.LT_PV_m3_LT_301N || 0;
                const data_remaining_tank_Mix = (LT_PV_m3_LT_301 + constant_tank3_Mix) * 1000;

                item.data_remaining_tank_Mix = data_remaining_tank_Mix;

                // col G
                const LT_PV_m3_LT_301_lastday = rows.LT_PV_m3_LT_301N || 0;
                const data_remaining_tank_Mix_lastday = (LT_PV_m3_LT_301_lastday + constant_tank3_Mix) * 1000;

                item.tank_Mix_between_day = (data_remaining_tank_Mix - data_remaining_tank_Mix_lastday);
    
                return {
                  ...item
                }
    
              }
              
              return null; // หรือ return ค่าอื่นๆ ตามที่ต้องการเมื่อไม่มีข้อมูลของวันก่อนหน้า
            })
      );

      // console.log("promises_ >>", await Promise.all(promises_));
      const final_items = promises_.filter(item => item !== null);

      resolve({ 
        total: final_items.length,
        result: final_items 
      });

    } catch (error) {
      reject(error);
    }
  });

  try {
    const result = await Promise.race([alkalinetankmixedDataListLogic, timeoutPromise]);
    
    return c.json(result);

  } catch (error) {
    if (error instanceof Error && error.message === "Request timed out") {
      // ส่ง status 402 หรือตามที่ต้องการกลับไป
      return c.json({ message: "Request timed out" }, 402);
    } else {
      // จัดการกับ error อื่นๆ
      console.error("An unexpected error occurred:", error);
      return c.json({ message: "Internal Server Error" }, 500);
    }
  }
};

// Dashboard Alkali Tank Store
export const alkalitankstore = async (c) => {

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Request timed out")), timeout);
  });

  const alkalitankstoreDataListLogic = new Promise(async (resolve, reject) => {
    try {
      // ใส่ logic การทำงานของคุณตรงนี้
      // เช่น การเรียกดูข้อมูลจากฐานข้อมูล
      const timestamp = await convertTotimestamp(c.req.query()); // แปลง timestamp
      // const period = await c.req.query();
      // console.log(timestamp);
 
      const data_query = await db('ScadaDataLogAlkaline')
        .select('*')
        .where('UnixTimestamp', '>=', timestamp.startTimestamp)
        .where('UnixTimestamp', '<', timestamp.endTimestamp)
        .orderBy('UnixTimestamp', 'asc');

      const promises_ = await Promise.all(

            data_query.map(async (item) => {
    
              const baseDate = new Date(item.UnixTimestamp * 1000); // แปลง Unix Timestamp เป็น Date Object
            
              // 1. หาวันเมื่อวาน (ถอยหลังไป 1 วัน) เริ่มต้นที่ 00:00:00
              const prevStart = new Date(baseDate);
              prevStart.setDate(baseDate.getDate() - 1); // เปลี่ยนจาก +1 เป็น -1
              prevStart.setHours(0, 0, 0, 0);
    
              // 2. หาวันสิ้นสุดของเมื่อวาน (ก็คือจุดเริ่มต้นของวัน baseDate ที่ 00:00:00)
              const prevEnd = new Date(baseDate);
              prevEnd.setHours(0, 0, 0, 0);
    
              // แปลงเป็น Seconds (Unix Timestamp)
              const prevStartSec = Math.floor(prevStart.getTime() / 1000);
              const prevEndSec = Math.floor(prevEnd.getTime() / 1000);
    
              // Query ข้อมูลจากตาราง ScadaDataLogAlkaline วันก่อน
              const rows = await db('ScadaDataLogAlkaline')
                .select("*")
                .where('UnixTimestamp', '>=', prevStartSec)
                .where('UnixTimestamp', '<=', prevEndSec)
                .orderBy('UnixTimestamp', 'desc')
                .first(); // เอาแถวล่าสุดแถวเดียว
    
              // console.log("rows >>", rows);
    
              if (rows) {

                const constant_tank3_Mix = 0.3;
                const constant_tank4_Store = 1.3;
    
                const LT_PV_m3_LT_401 = (item.LT_PV_m3_LT_401N || 0);
                const data_remaining_tank_Store = (LT_PV_m3_LT_401 + constant_tank4_Store) * 1000;

                item.data_remaining_tank_Store = data_remaining_tank_Store;

                // col I
                const LT_PV_m3_LT_401_lastday = (rows.LT_PV_m3_LT_401N || 0);
                const data_remaining_tank_Store_lastday = (LT_PV_m3_LT_401_lastday + constant_tank4_Store) * 1000;

                item.tank_Store_between_day = (data_remaining_tank_Store - data_remaining_tank_Store_lastday);
    
                return {
                  ...item
                }
    
              }
              
              return null; // หรือ return ค่าอื่นๆ ตามที่ต้องการเมื่อไม่มีข้อมูลของวันก่อนหน้า
            })
      );

      // console.log("promises_ >>", await Promise.all(promises_));
      const final_items = promises_.filter(item => item !== null);

      resolve({ 
        total: final_items.length,
        result: final_items 
      });

    } catch (error) {
      reject(error);
    }
  });

  try {
    const result = await Promise.race([alkalitankstoreDataListLogic, timeoutPromise]);
    
    return c.json(result);

  } catch (error) {
    if (error instanceof Error && error.message === "Request timed out") {
      // ส่ง status 402 หรือตามที่ต้องการกลับไป
      return c.json({ message: "Request timed out" }, 402);
    } else {
      // จัดการกับ error อื่นๆ
      console.error("An unexpected error occurred:", error);
      return c.json({ message: "Internal Server Error" }, 500);
    }
  }
};

// Dashboard Alkali Transfered
export const alkaliconsumed = async (c) => {

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Request timed out")), timeout);
  });

  const alkaliconsumedDataListLogic = new Promise(async (resolve, reject) => {
    try {
      // ใส่ logic การทำงานของคุณตรงนี้
      // เช่น การเรียกดูข้อมูลจากฐานข้อมูล
      const timestamp = await convertTotimestamp(c.req.query()); // แปลง timestamp
      // const plant = c.req.query('plant') || 'PD1';
      // const period = await c.req.query();
      // console.log(timestamp);

      const data_query = await db('ScadaDataLogAlkaline')
        .select('*')
        .where('UnixTimestamp', '>=', timestamp.startTimestamp)
        .where('UnixTimestamp', '<', timestamp.endTimestamp)
        .orderBy('UnixTimestamp', 'asc');

      const promises_ = await Promise.all(

            data_query.map(async (item) => {
    
              const baseDate = new Date(item.UnixTimestamp * 1000); // แปลง Unix Timestamp เป็น Date Object
            
              // 1. หาวันเมื่อวาน (ถอยหลังไป 1 วัน) เริ่มต้นที่ 00:00:00
              const prevStart = new Date(baseDate);
              prevStart.setDate(baseDate.getDate() - 1); // เปลี่ยนจาก +1 เป็น -1
              prevStart.setHours(0, 0, 0, 0);
    
              // 2. หาวันสิ้นสุดของเมื่อวาน (ก็คือจุดเริ่มต้นของวัน baseDate ที่ 00:00:00)
              const prevEnd = new Date(baseDate);
              prevEnd.setHours(0, 0, 0, 0);
    
              // แปลงเป็น Seconds (Unix Timestamp)
              const prevStartSec = Math.floor(prevStart.getTime() / 1000);
              const prevEndSec = Math.floor(prevEnd.getTime() / 1000);
    
              // Query ข้อมูลจากตาราง ScadaDataLogAlkaline วันก่อน
              const rows = await db('ScadaDataLogAlkaline')
                .select("*")
                .where('UnixTimestamp', '>=', prevStartSec)
                .where('UnixTimestamp', '<=', prevEndSec)
                .orderBy('UnixTimestamp', 'desc')
                .first(); // เอาแถวล่าสุดแถวเดียว
    
              // console.log("rows >>", rows);
    
              if (rows) {
    
                const Aka_Total_ALL_FT_401N = (item.Aka_Total_ALL_FT_401N || 0) - (rows.Aka_Total_ALL_FT_401N || 0);
                const Aka_Total_ALL_FT_402N = (item.Aka_Total_ALL_FT_402N || 0) - (rows.Aka_Total_ALL_FT_402N || 0);
                const Aka_Total_ALL_FT_403N = (item.Aka_Total_ALL_FT_403N || 0) - (rows.Aka_Total_ALL_FT_403N || 0);

                //===  Total NaOH Used today
                item.usepd1 = Aka_Total_ALL_FT_401N;
                item.usepd2 = Aka_Total_ALL_FT_402N;
                item.usepd3 = Aka_Total_ALL_FT_403N;
                item.total_used = (Aka_Total_ALL_FT_401N + Aka_Total_ALL_FT_402N + Aka_Total_ALL_FT_403N);
    
                return {
                  ...item
                }
    
              }
              
              return null; // หรือ return ค่าอื่นๆ ตามที่ต้องการเมื่อไม่มีข้อมูลของวันก่อนหน้า
            })
      );

      // console.log("promises_ >>", await Promise.all(promises_));
      const final_items = promises_.filter(item => item !== null);

      resolve({ 
        total: final_items.length,
        result: final_items 
      });

    } catch (error) {
      reject(error);
    }
  });

  try {
    const result = await Promise.race([alkaliconsumedDataListLogic, timeoutPromise]);
    
    return c.json(result);

  } catch (error) {
    if (error instanceof Error && error.message === "Request timed out") {
      // ส่ง status 402 หรือตามที่ต้องการกลับไป
      return c.json({ message: "Request timed out" }, 402);
    } else {
      // จัดการกับ error อื่นๆ
      console.error("An unexpected error occurred:", error);
      return c.json({ message: "Internal Server Error" }, 500);
    }
  }
  
};

// Reprot NaOH or HCI
export const reportall = async (c) => {

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Request timed out")), timeout);
  });

  const reportallDataListLogic = new Promise(async (resolve, reject) => {

    try {
      // ใส่ logic การทำงานของคุณตรงนี้
      // เช่น การเรียกดูข้อมูลจากฐานข้อมูล
      
      const plant = c.req.query('plant') || 'Alkaline';
      const unit = c.req.query('unit') || 'Liter';
      
      const timestamp = await convertTotimestamp(c.req.query()); // แปลง timestamp

      // console.log("Date Start", c.req.query("date_start"));
      // console.log("Date End", c.req.query("date_end"));

      // console.log("query", c.req.query());


      // console.log(timestamp);


      // const period = await c.req.query();
      // console.log(timestamp);
      var dbTablerecievedSD = '';
      var dbTableRecieved = '';
      var dbTableMixer = '';
      var dbTableStore = '';
      var dbTableConsumed = '';

      var dbTablePlant = '';

      if(plant == 'Alkaline'){

        dbTablePlant = 'alkali';

      }else{

        dbTablePlant = 'acid';
      }

      var tableRecievedT1 = "volume_T1_Kg";
      var tableRecievedT2 = "volume_T2_Kg";
      var tableMixerRO = "RO_total";
      var tableMixer = dbTablePlant+"_Total";
      var tableStore = "volume_Kg";
      var tableConsumed = "volume_total";

      // Liter
      if(unit == 'Liter'){

        dbTableRecieved = dbTablePlant+'recieved';
        // dbTableMixer = dbTablePlant+'mixtotal';
        // dbTableStore = dbTablePlant+'store';
        // dbTableConsumed = dbTablePlant+'consumedtotal';

        tableRecievedT1 = "volume_T1_Kg";
        tableRecievedT2 = "volume_T1_Kg";
        tableMixerRO = "RO_total";
        tableMixer = dbTablePlant+"_Total";
        tableStore = "volume_Kg";
        tableConsumed = "volume_total";

      }else if(unit == 'kg'){

        dbTableRecieved = dbTablePlant+'recieved';
        dbTableMixer = dbTablePlant+'mixtotal';
        dbTableStore = dbTablePlant+'store';
        dbTableConsumed = dbTablePlant+'consumedtotal';

        tableRecievedT1 = "volume_T1_Kg";
        tableRecievedT2 = "volume_T1_Kg";
        tableMixerRO = "RO_total";
        tableMixer = dbTablePlant+"_Total";
        tableStore = "volume_Kg";
        tableConsumed = "volume_total";

      }else if(unit == 'm3'){

        dbTableRecieved = dbTablePlant+'recieved';
        dbTableMixer = dbTablePlant+'mixtotal';
        dbTableStore = dbTablePlant+'store';
        dbTableConsumed = dbTablePlant+'consumedtotal';

        tableRecievedT1 = "volume_T1_m3";
        tableRecievedT2 = "volume_T1_m3";
        tableMixerRO = "RO_total";
        tableMixer = dbTablePlant+"_Total";
        tableStore = "volume_m3";
        tableConsumed = "volume_total";
      }

      // console.log("timestamp -->",timestamp);

      const sqlServerEpoch_recieved = "FORMAT(DATEADD(SECOND, [start_time], '1970-01-01'), 'yyyy-MM-dd')";

      // ทุกหน่วยใช้ตัวนี้หมด
      const recieved = await db(dbTableRecieved)
        .select(
            // 1. Extract the date for grouping and aliasing it as 'date'
            db.raw(`CAST(${sqlServerEpoch_recieved} AS DATE) as date_time`),
            // 2. Calculate the total volume for tank 1 for the day
            db.raw(`SUM(${tableRecievedT1}) as tank1`),
            // 3. Calculate the total volume for tank 2 for the day
            db.raw(`SUM(${tableRecievedT2}) as tank2`)
        )
        .where('start_time', '>=', timestamp.startTimestamp)
        .andWhere('start_time', '<', timestamp.endTimestamp)
        .groupBy(db.raw(`CAST(${sqlServerEpoch_recieved} AS DATE)`)) 
        .orderBy('date_time', 'asc');

      const resultRecieved = recieved.map((item) => {

        item.tank1 = Number(item.tank1).toFixed(2);
        item.tank2 = Number(item.tank2).toFixed(2);

        return {
          ...item
        }
      })
      // console.log("resultRecieved -->",resultRecieved);

      // const  mixer = [];
      // const  consumed = [];

      const sqlServerEpoch_mixer = "FORMAT(DATEADD(SECOND, [date_time], '1970-01-01'), 'yyyy-MM-dd')";

     const mixer = await db(dbTableMixer)
        .select(
          // 1. Extract the date for grouping and aliasing it as 'date'
          db.raw(`CAST(${sqlServerEpoch_mixer} AS DATE) as date_time`),
          // 2. Calculate the total volume for tank 1 for the day
          db.raw(`SUM(${tableMixerRO}) as tank3_1`),
          // 3. Calculate the total volume for tank 2 for the day
          db.raw(`SUM(${tableMixer}) as tank3_2`)
        )
        .where('date_time', '>=', timestamp.startTimestamp)
        .andWhere('date_time', '<', timestamp.endTimestamp)
        .groupBy(db.raw(`CAST(${sqlServerEpoch_mixer} AS DATE)`)) 
        .orderBy('date_time', 'asc');

      // console.log("mixer -->",mixer);
      
      const resultMixer = mixer.map((item) => {

        if(unit == 'm3'){
          item.tank3_1 = item.tank3_1*0.001;
          item.tank3_2 = item.tank3_2*0.001;
        }

          item.tank3_1 = Number(item.tank3_1).toFixed(2);
          item.tank3_2 = Number(item.tank3_2).toFixed(2);

        return {
          ...item
        }
      })

      // console.log("resultMixer -->",resultMixer);
 
      // console.log("mixer -->",mixer);

      const sqlServerEpoch_store = "FORMAT(DATEADD(SECOND, [start_time], '1970-01-01'), 'yyyy-MM-dd')";

      const store = await db(dbTableStore)

        .select(
            // 1. Extract the date for grouping and aliasing it as 'date'
            db.raw(`CAST(${sqlServerEpoch_store} AS DATE) as date_time`),
            // 2. Calculate the total volume for tank 4 for the day
            db.raw(`SUM(${tableStore}) as tank4`),
        )
        .where('start_time', '>=', timestamp.startTimestamp)
        .andWhere('start_time', '<', timestamp.endTimestamp)
        .groupBy(db.raw(`CAST(${sqlServerEpoch_store} AS DATE)`)) 
        .orderBy('date_time', 'asc');


      const resultStore = store.map((item) => {

        item.tank4 = Number(item.tank4).toFixed(2);

        return {
          ...item
        }
      })

      // console.log("store -->",store);
      
      
      const sqlServerEpoch_consumed = "FORMAT(DATEADD(SECOND, [date_time], '1970-01-01'), 'yyyy-MM-dd')";

      const consumed = await db(dbTableConsumed)
       .select(
        // ... other selects
        db.raw(`CAST(${sqlServerEpoch_consumed} AS DATE) as date_time`),
        db.raw('CAST(plant AS NVARCHAR(100)) AS plant'),
        db.raw(`SUM(${tableConsumed}) as tank4`)
       )
       .where('date_time', '>=', timestamp.startTimestamp)
       .andWhere('date_time', '<', timestamp.endTimestamp)
       .groupBy(
        db.raw(`CAST(${sqlServerEpoch_consumed} AS DATE) , CAST(plant AS NVARCHAR(100))`),
        // db.raw('plant')
       ) 
       .orderBy('date_time', 'asc');

       const resultConsumed = consumed.map((item) => {

         if(unit == 'm3'){
          item.tank4 = item.tank4*0.001;
         }
          
          item.tank4 = Number(item.tank4).toFixed(2);
        return {
          ...item
        }
      })
      

      // console.log("consumed -->",consumed);


      const finalReport = mergeAndPivotDataByDateTime(resultRecieved, resultMixer, resultStore, resultConsumed);

      // console.log("Final Report Data -->", finalReport);

      // const resultData = async() =>{

        
      // };

      resolve({ 
        total: finalReport.length,
        result: finalReport 
        // message: 'Hello, Smart Automation Thailand!',
      });

    } catch (error) {
      reject(error);
    }

  });

  try {
    const result = await Promise.race([reportallDataListLogic, timeoutPromise]);
    
    return c.json(result);

  } catch (error) {
    if (error instanceof Error && error.message === "Request timed out") {
      // ส่ง status 402 หรือตามที่ต้องการกลับไป
      return c.json({ message: "Request timed out" }, 402);
    } else {
      // จัดการกับ error อื่นๆ
      console.error("An unexpected error occurred:", error);
      return c.json({ message: "Internal Server Error" }, 500);
    }
  }
};

// Report NaOH Fill
export const reportnaohrecieved = async (c) => {

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Request timed out")), timeout);
  });

  const reportrecievedDataListLogic = new Promise(async (resolve, reject) => {
    try {
      // ใส่ logic การทำงานของคุณตรงนี้
      // เช่น การเรียกดูข้อมูลจากฐานข้อมูล
      const timestamp = await convertTotimestamp(c.req.query()); // แปลง timestamp

      const data_NaOH_ = await db('ScadaDataLogAlkaline')
        .select('*')
        .where('UnixTimestamp', '>=', timestamp.startTimestamp)
        .where('UnixTimestamp', '<', timestamp.endTimestamp)
        .orderBy('UnixTimestamp', 'asc');

      // 1. สร้าง Array ของ Promises จากการ Map ข้อมูล
      const naoh_promises = await Promise.all(data_NaOH_.map(async (item) => {

        const baseDate = new Date(item.UnixTimestamp * 1000); // แปลง Unix Timestamp เป็น Date Object

        // 1. หาวันเมื่อวาน (ถอยหลังไป 1 วัน) เริ่มต้นที่ 00:00:00
        const prevStart = new Date(baseDate); // แปลง Unix Timestamp เป็น Date Object
        prevStart.setDate(baseDate.getDate() - 1); // เปลี่ยนจาก +1 เป็น -1
        prevStart.setHours(0, 0, 0, 0);

        // 2. หาวันสิ้นสุดของเมื่อวาน (ก็คือจุดเริ่มต้นของวัน baseDate ที่ 00:00:00)
        const prevEnd = new Date(baseDate);
        prevEnd.setHours(0, 0, 0, 0);

        // แปลงเป็น Seconds (Unix Timestamp)
        const prevStartSec = Math.floor(prevStart.getTime() / 1000);
        const prevEndSec = Math.floor(prevEnd.getTime() / 1000);

        // Query ข้อมูลจากตาราง ScadaDataLogAlkaline วันก่อน
        const rows = await db('ScadaDataLogAlkaline')
            .select("*")
            .where('UnixTimestamp', '>=', prevStartSec)
            .where('UnixTimestamp', '<=', prevEndSec)
            .orderBy('UnixTimestamp', 'desc')
            .first(); // เอาแถวล่าสุดแถวเดียว

        if (rows) {

            // console.log("rows >>:", rows);

            const System_Data_Fill = item.Fill_Kg_N || 0;
            const System_Data_Density = item.Density_N || 1;
            const System_Data_Fill_lastday = rows.Fill_Kg_N || 0;
            const System_Data_Density_lastday = rows.Density_N || 1;

            const Timestamp_data = new Date(item.UnixTimestamp * 1000);

            const constant_tank1_fill = 0.8;
            const constant_tank2_fill = 0.8;
 
            // col A
            item.dateTime = format(Timestamp_data, 'yyyy-MM-dd');

            const LT_PV_m3_LT_101 = item.LT_PV_m3_LT_101N || 0;
            const data_remaining_tank1_fill = (LT_PV_m3_LT_101 + constant_tank1_fill);
            // const data_remaining_tank1_fill_total = (data_remaining_tank1_fill * System_Data_Density);

            const LT_PV_m3_LT_102 = item.LT_PV_m3_LT_102N || 0;
            const data_remaining_tank2_fill = (LT_PV_m3_LT_102 + constant_tank2_fill);
            // const data_remaining_tank2_fill_total = (data_remaining_tank2_fill * System_Data_Density);

            const LT_PV_m3_LT_101_lastday = rows.LT_PV_m3_LT_101N || 0;
            const data_remaining_tank1_fill_lastday = (LT_PV_m3_LT_101_lastday + constant_tank1_fill);
            // const data_remaining_tank1_fill_total_lastday = (data_remaining_tank1_fill_lastday * System_Data_Density_lastday);

            const LT_PV_m3_LT_102_lastday = rows.LT_PV_m3_LT_102N || 0;
            const data_remaining_tank2_fill_lastday = (LT_PV_m3_LT_102_lastday + constant_tank2_fill);
            // const data_remaining_tank2_fill_total_lastday = (data_remaining_tank2_fill_lastday * System_Data_Density_lastday);

            // console.log("data_remaining_tank1_fill_total >>", data_remaining     
            // col B
            item.density = System_Data_Density;
            
            // col C
            const data_remaining_fill = (data_remaining_tank1_fill + data_remaining_tank2_fill) * 1000;
            item.data_remaining_fill = data_remaining_fill;

            // col D
            const data_remaining_fill_total = data_remaining_fill * System_Data_Density;
            item.data_remaining_fill_total = data_remaining_fill_total;

            const data_remaining_fill_lastday =  (data_remaining_tank1_fill_lastday + data_remaining_tank2_fill_lastday) * 1000;
            const data_remaining_fill_total_lastday = data_remaining_fill_lastday * System_Data_Density_lastday;

            // col E
            const Fill_between_day = (data_remaining_fill_total_lastday + System_Data_Fill_lastday) - data_remaining_fill_total;
            item.Fill_between_day = Fill_between_day;

            // col F
            item.data_Fill =  System_Data_Fill;

            // ส่งค่ากลับไปในแต่ละ item เพื่อนำไปบวกเพิ่มภายหลัง
            return {
              ...item,
            };
        }

        return null;
      }))

      const naoh_results = naoh_promises.filter(Boolean);

      resolve({ 
        period_Display: `${naoh_results.length == 0 ? "-" : naoh_results.length} Day`,
        start_timeDisplay: naoh_results[0]?.dateTime || "--",
        end_timeDisplay: naoh_results[naoh_results.length - 1]?.dateTime || '--',
        total: naoh_results.length,
        result: naoh_results 
        // message: 'Hello, Smart Automation Thailand!',
      });

    } catch (error) {
      reject(error);
    }
  });

  try {
    const result = await Promise.race([reportrecievedDataListLogic, timeoutPromise]);
    
    return c.json(result);

  } catch (error) {
    if (error instanceof Error && error.message === "Request timed out") {
      // ส่ง status 402 หรือตามที่ต้องการกลับไป
      return c.json({ message: "Request timed out" }, 402);
    } else {
      // จัดการกับ error อื่นๆ
      console.error("An unexpected error occurred:", error);
      return c.json({ message: "Internal Server Error" }, 500);
    }
  }
}

// Report NaOH Mixed
export const reportnaohmixed = async (c) => {

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Request timed out")), timeout);
  });

  const reportmixDataListLogic = new Promise (async (resolve, reject) =>{

    try{

      const timestamp = await convertTotimestamp(c.req.query()); // แปลง timestamp

      const data_NaOH_ = await db('ScadaDataLogAlkaline')
        .select('*')
        .where('UnixTimestamp', '>=', timestamp.startTimestamp)
        .where('UnixTimestamp', '<', timestamp.endTimestamp)
        .orderBy('UnixTimestamp', 'asc');

      // 1. สร้าง Array ของ Promises จากการ Map ข้อมูล
      const naoh_promises = await Promise.all(data_NaOH_.map(async (item) => {

          const baseDate = new Date(item.UnixTimestamp * 1000); // แปลง Unix Timestamp เป็น Date Object

          // 1. หาวันเมื่อวาน (ถอยหลังไป 1 วัน) เริ่มต้นที่ 00:00:00
          const prevStart = new Date(baseDate); // แปลง Unix Timestamp เป็น Date Object
          prevStart.setDate(baseDate.getDate() - 1); // เปลี่ยนจาก +1 เป็น -1
          prevStart.setHours(0, 0, 0, 0);

          // 2. หาวันสิ้นสุดของเมื่อวาน (ก็คือจุดเริ่มต้นของวัน baseDate ที่ 00:00:00)
          const prevEnd = new Date(baseDate);
          prevEnd.setHours(0, 0, 0, 0);

          // แปลงเป็น Seconds (Unix Timestamp)
          const prevStartSec = Math.floor(prevStart.getTime() / 1000);
          const prevEndSec = Math.floor(prevEnd.getTime() / 1000);

          // Query ข้อมูลจากตาราง ScadaDataLogAlkaline วันก่อน
          const rows = await db('ScadaDataLogAlkaline')
              .select("*")
              .where('UnixTimestamp', '>=', prevStartSec)
              .where('UnixTimestamp', '<=', prevEndSec)
              .orderBy('UnixTimestamp', 'desc')
              .first(); // เอาแถวล่าสุดแถวเดียว

          if (rows) {

            // console.log("rows >>:", rows);

            // const System_Data_Fill = item.Fill_Kg_N || 0;
            // const System_Data_Density = item.Density_N || 1;
            // const System_Data_Fill_lastday = rows.Fill_Kg_N || 0;
            // const System_Data_Density_lastday = rows.Density_N || 1;

            const constant_tank3_Mix = 0.3;
            const constant_tank4_Store = 1.3;

            // const C1 = 4;

            const Timestamp_data = new Date(item.UnixTimestamp * 1000);

            // col A
            item.dateTime = format(Timestamp_data, 'yyyy-MM-dd');

            // col B
            item.Count_mix = (item.Count_mix_N || 0);


            // col C
            const Total_ALL_FT_101 = (item.Aka_Total_ALL_FT_101N || 0);
            item.Total_ALL_FT_101 = Total_ALL_FT_101;

            // col D
            const Total_ALL_FT_201 = (item.Aka_Total_ALL_FT_201N || 0);
            item.Total_ALL_FT_201 = Total_ALL_FT_201;

            const Total_ALL_FT_101_lastday = (rows.Aka_Total_ALL_FT_101N || 0);
            const Total_ALL_FT_201_lastday = (rows.Aka_Total_ALL_FT_201N || 0);

            // col E
            item.chemical_between_day = (Total_ALL_FT_101 - Total_ALL_FT_101_lastday);

            // col F
            item.ro_between_day = (Total_ALL_FT_201 - Total_ALL_FT_201_lastday);
            
            // col G
            const LT_PV_m3_LT_301 = item.LT_PV_m3_LT_301N || 0;
            const data_remaining_tank_Mix = (LT_PV_m3_LT_301 + constant_tank3_Mix) * 1000;

            item.data_remaining_tank_Mix = data_remaining_tank_Mix;

            // col H
            const LT_PV_m3_LT_301_lastday = rows.LT_PV_m3_LT_301N || 0;
            const data_remaining_tank_Mix_lastday = (LT_PV_m3_LT_301_lastday + constant_tank3_Mix) * 1000;

            item.tank_Mix_between_day = (data_remaining_tank_Mix - data_remaining_tank_Mix_lastday);

            // col I
            const LT_PV_m3_LT_401 = (item.LT_PV_m3_LT_401N || 0);
            const data_remaining_tank_Store = (LT_PV_m3_LT_401 + constant_tank4_Store) * 1000;

            item.data_remaining_tank_Store = data_remaining_tank_Store;

            // col J
            const LT_PV_m3_LT_401_lastday = (rows.LT_PV_m3_LT_401N || 0);
            const data_remaining_tank_Store_lastday = (LT_PV_m3_LT_401_lastday + constant_tank4_Store) * 1000;

            item.tank_Store_between_day = (data_remaining_tank_Store - data_remaining_tank_Store_lastday);

            // ส่งค่ากลับไปในแต่ละ item เพื่อนำไปบวกเพิ่มภายหลัง
            return {
                ...item,
            };
          }

          return null;
      }))

      // 1. รอให้ Promises ทั้งหมดทำงานเสร็จสิ้น และกรองค่าที่เป็น null ออก
      const naoh_results = naoh_promises.filter(Boolean);

      resolve({ 
        period_Display: `${naoh_results.length == 0 ? "-" : naoh_results.length} Day`,
        start_timeDisplay: naoh_results[0]?.dateTime || "--",
        end_timeDisplay: naoh_results[naoh_results.length - 1]?.dateTime || '--',
        total: naoh_results.length,
        result: naoh_results 
        // message: 'Hello, Smart Automation Thailand!',

      });

    }catch(error){

      reject(error);
    }
    
  })

  try {
    const result = await Promise.race([reportmixDataListLogic, timeoutPromise]);
    
    return c.json(result);

  } catch (error) {
    if (error instanceof Error && error.message === "Request timed out") {
      // ส่ง status 402 หรือตามที่ต้องการกลับไป
      return c.json({ message: "Request timed out" }, 402);
    } else {
      // จัดการกับ error อื่นๆ
      console.error("An unexpected error occurred:", error);
      return c.json({ message: "Internal Server Error" }, 500);
    }
  }
}

// Report NaOH Used
export const reportnaohconsumed = async (c) => {

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Request timed out")), timeout);
  });

  const reportconsumedDataListLogic = new Promise(async (resolve, reject) => {

    const timestamp = await convertTotimestamp(c.req.query()); // แปลง timestamp

    const unit = c.req.query('unit') || 'kg';
    const aggregation = c.req.query('aggregation') || 'perday';

    const data_NaOH_ = await db('ScadaDataLogAlkaline')
      .select('*')
      .where('UnixTimestamp', '>=', timestamp.startTimestamp)
      .where('UnixTimestamp', '<', timestamp.endTimestamp)
      .orderBy('UnixTimestamp', 'asc');

    // 1. สร้าง Array ของ Promises จากการ Map ข้อมูล
    const naoh_promises = await Promise.all(data_NaOH_.map(async (item) => {

      const baseDate = new Date(item.UnixTimestamp * 1000); // แปลง Unix Timestamp เป็น Date Object

      // 1. หาวันเมื่อวาน (ถอยหลังไป 1 วัน) เริ่มต้นที่ 00:00:00
      const prevStart = new Date(baseDate); // แปลง Unix Timestamp เป็น Date Object
      prevStart.setDate(baseDate.getDate() - 1); // เปลี่ยนจาก +1 เป็น -1
      prevStart.setHours(0, 0, 0, 0);

      // 2. หาวันสิ้นสุดของเมื่อวาน (ก็คือจุดเริ่มต้นของวัน baseDate ที่ 00:00:00)
      const prevEnd = new Date(baseDate);
      prevEnd.setHours(0, 0, 0, 0);

      // แปลงเป็น Seconds (Unix Timestamp)
      const prevStartSec = Math.floor(prevStart.getTime() / 1000);
      const prevEndSec = Math.floor(prevEnd.getTime() / 1000);

      // Query ข้อมูลจากตาราง ScadaDataLogAlkaline วันก่อน
      const rows = await db('ScadaDataLogAlkaline')
          .select("*")
          .where('UnixTimestamp', '>=', prevStartSec)
          .where('UnixTimestamp', '<=', prevEndSec)
          .orderBy('UnixTimestamp', 'desc')
          .first(); // เอาแถวล่าสุดแถวเดียว

      if (rows) {

          // console.log("rows >>:", rows);
          // const System_Data_Fill = item.Fill_Kg_N || 0;
          // const System_Data_Density = item.Density_N || 1;
          // const System_Data_Fill_lastday = rows.Fill_Kg_N || 0;
          // const System_Data_Density_lastday = rows.Density_N || 1;

          const constant_tank3_Mix = 0.3;
          const constant_tank4_Store = 1.3;

          const C1 = 4;
          const C2 = 50;
          

          const Timestamp_data = new Date(item.UnixTimestamp * 1000);

          // col A
          item.dateTime = format(Timestamp_data, 'yyyy-MM-dd');

          // col B
          const LT_PV_m3_LT_301 = item.LT_PV_m3_LT_301N || 0;

          const data_remaining_tank_Mix = (LT_PV_m3_LT_301 + constant_tank3_Mix) * 1000;

          item.data_remaining_tank_Mix = data_remaining_tank_Mix;

          // col C
          const data_remaining_tank_Mix_chemical = (data_remaining_tank_Mix * C1) / C2;
          item.data_remaining_tank_Mix_chemical = data_remaining_tank_Mix_chemical;

          // col D
          const data_remaining_tank_Mix_ro = data_remaining_tank_Mix - data_remaining_tank_Mix_chemical;
          item.data_remaining_tank_Mix_ro = data_remaining_tank_Mix_ro;

          // col E
          const LT_PV_m3_LT_301_lastday = rows.LT_PV_m3_LT_301N || 0;
          const data_remaining_tank_Mix_lastday = (LT_PV_m3_LT_301_lastday + constant_tank3_Mix) * 1000;

          item.tank_Mix_between_day = (data_remaining_tank_Mix - data_remaining_tank_Mix_lastday);

          // col F
          const LT_PV_m3_LT_401 = (item.LT_PV_m3_LT_401N || 0);
          const data_remaining_tank_Store = (LT_PV_m3_LT_401 + constant_tank4_Store) * 1000;

          item.data_remaining_tank_Store = data_remaining_tank_Store;

          // col G
          const data_remaining_tank_Store_chemical = (data_remaining_tank_Store * C1) / C2;
          item.data_remaining_tank_Store_chemical = data_remaining_tank_Store_chemical;

          // col H
          const data_remaining_tank_Store_ro = data_remaining_tank_Store - data_remaining_tank_Store_chemical;
          item.data_remaining_tank_Store_ro = data_remaining_tank_Store_ro;

          // col I
          const LT_PV_m3_LT_401_lastday = (rows.LT_PV_m3_LT_401N || 0);
          const data_remaining_tank_Store_lastday = (LT_PV_m3_LT_401_lastday + constant_tank4_Store) * 1000;

          item.tank_Store_between_day = (data_remaining_tank_Store - data_remaining_tank_Store_lastday);

          // col J
          const Total_ALL_FT_401_today = (item.Aka_Total_ALL_FT_401N || 0);
          const Total_ALL_FT_401_lastday = (rows.Aka_Total_ALL_FT_401N || 0);

          const Total_ALL_FT_401 = Total_ALL_FT_401_today - Total_ALL_FT_401_lastday;
          item.Total_ALL_FT_401 = Total_ALL_FT_401;

          // col K
          const Total_ALL_FT_401_chemical = (Total_ALL_FT_401 * C1) / C2;
          
          item.Total_ALL_FT_401_chemical = Total_ALL_FT_401_chemical;

          // col L
          const Total_ALL_FT_401_ro = Total_ALL_FT_401 - Total_ALL_FT_401_chemical;
          item.Total_ALL_FT_401_ro = Total_ALL_FT_401_ro;
          
          // col M
          const Total_ALL_FT_402_today = (item.Aka_Total_ALL_FT_402N || 0);
          const Total_ALL_FT_402_lastday = (rows.Aka_Total_ALL_FT_402N || 0);

          const Total_ALL_FT_402 = Total_ALL_FT_402_today - Total_ALL_FT_402_lastday;

          item.Total_ALL_FT_402 = Total_ALL_FT_402;

          // col N
          const Total_ALL_FT_402_chemical = (Total_ALL_FT_402 * C1) / C2;
          item.Total_ALL_FT_402_chemical = Total_ALL_FT_402_chemical;

          // col O
          const Total_ALL_FT_402_ro =  Total_ALL_FT_402 - Total_ALL_FT_402_chemical;
          item.Total_ALL_FT_402_ro = Total_ALL_FT_402_ro;

          // col P
          const Total_ALL_FT_403_today = (item.Aka_Total_ALL_FT_403N || 0);
          const Total_ALL_FT_403_lastday = (rows.Aka_Total_ALL_FT_403N || 0);

          const Total_ALL_FT_403 = Total_ALL_FT_403_today - Total_ALL_FT_403_lastday;

          item.Total_ALL_FT_403 = Total_ALL_FT_403;

          // col Q
          const Total_ALL_FT_403_chemical = (Total_ALL_FT_403 * C1) / C2;
          item.Total_ALL_FT_403_chemical = Total_ALL_FT_403_chemical;

          // col R
          const Total_ALL_FT_403_ro = Total_ALL_FT_403 - Total_ALL_FT_403_chemical;
          item.Total_ALL_FT_403_ro = Total_ALL_FT_403_ro;

          // col S
          item.Total_ALL_Used = (data_remaining_tank_Mix + data_remaining_tank_Store + Total_ALL_FT_401 + Total_ALL_FT_402 + Total_ALL_FT_403);

          // col T
          item.Total_ALL_Used_chemical = (data_remaining_tank_Mix_chemical + data_remaining_tank_Store_chemical + Total_ALL_FT_401_chemical + Total_ALL_FT_402_chemical + Total_ALL_FT_403_chemical);

          // col U
          item.Total_ALL_Used_ro = (data_remaining_tank_Mix_ro + data_remaining_tank_Store_ro + Total_ALL_FT_401_ro + Total_ALL_FT_402_ro + Total_ALL_FT_403_ro);

          // ส่งค่ากลับไปในแต่ละ item เพื่อนำไปบวกเพิ่มภายหลัง
          return {
              ...item,
          };
      }

      return null;
    }))

    const naoh_results = naoh_promises.filter(Boolean);

    resolve({ 

      period_Display: `${naoh_results.length == 0 ? "-" : naoh_results.length} Day`,
      start_timeDisplay: naoh_results[0]?.dateTime || "--",
      end_timeDisplay: naoh_results[naoh_results.length - 1]?.dateTime || '--',
      total: naoh_results.length,
      result: naoh_results 
      // message: 'Hello, Smart Automation Thailand!',

    });


  });

  try {
    const result = await Promise.race([reportconsumedDataListLogic, timeoutPromise]);
    
    return c.json(result);

  } catch (error) {
    if (error instanceof Error && error.message === "Request timed out") {
      // ส่ง status 402 หรือตามที่ต้องการกลับไป
      return c.json({ message: "Request timed out" }, 402);
    } else {
      // จัดการกับ error อื่นๆ
      console.error("An unexpected error occurred:", error);
      return c.json({ message: "Internal Server Error" }, 500);
    }
  }
}