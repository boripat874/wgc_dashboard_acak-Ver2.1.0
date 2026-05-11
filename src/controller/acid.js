import { Context } from 'hono';
import { getPool } from '@/lib/db';

import knexfile from '@/lib/configKnex.ts';
import { convertTotimestamp } from '@/controller/funtion.js';


// interface acidrecieved {
//     result: string;
//     id?: number;
//     // ... other properties
// }

import knex from 'knex';
import { format } from 'date-fns';
// import knexfile from '../../knexfile';

const db = knex(knexfile.development);

const timeout = 5000; // กำหนดค่า timeout (หน่วยมิลลิวินาที)

// acid recieved
export const acidrecieved = async (c) => {

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Request timed out")), timeout);
  });

  const acidrecievedDataListLogic = new Promise(async (resolve, reject) => {
    try {
      // ใส่ logic การทำงานของคุณตรงนี้
      // เช่น การเรียกดูข้อมูลจากฐานข้อมูล
      const timestamp = await convertTotimestamp(c.req.query()); // แปลง timestamp
      // const period = await c.req.query();
      // console.log(timestamp);

      const data_query = await db('ScadaDataLogAcid')
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
              const rows = await db('ScadaDataLogAcid')
                .select("*")
                .where('UnixTimestamp', '>=', prevStartSec)
                .where('UnixTimestamp', '<=', prevEndSec)
                .orderBy('UnixTimestamp', 'desc')
                .first(); // เอาแถวล่าสุดแถวเดียว
    
              // console.log("rows >>", rows);
    
              if (rows) {
    
                const System_Data_Fill = item.Fill_Kg_H || 0;
                const System_Data_Density = item.Density_H || 1;
                const System_Data_Fill_lastday = rows.Fill_Kg_H || 0;
                const System_Data_Density_lastday = rows.Density_H || 1;
    
                const LT_PV_m3_LT_101H = item.LT_PV_m3_LT_101H || 0;
                const data_remaining_tank1_fill = (LT_PV_m3_LT_101H + 0.8) * 1000;
                const data_remaining_tank1_fill_total = (data_remaining_tank1_fill * System_Data_Density);
    
                const LT_PV_m3_LT_101H_lastday = rows.LT_PV_m3_LT_101H || 0;
                const data_remaining_tank1_fill_lastday = (LT_PV_m3_LT_101H_lastday + 0.8) * 1000;
                const data_remaining_tank1_fill_total_lastday = (data_remaining_tank1_fill_lastday * System_Data_Density_lastday);
    
                const LT_PV_m3_LT_102H = item.LT_PV_m3_LT_102H || 0;
                const data_remaining_tank2_fill = (LT_PV_m3_LT_102H + 0.8) * 1000;
                const data_remaining_tank2_fill_total = (data_remaining_tank2_fill * System_Data_Density);
    
                const LT_PV_m3_LT_102H_lastday = rows.LT_PV_m3_LT_102H || 0;
                const data_remaining_tank2_fill_lastday = (LT_PV_m3_LT_102H_lastday + 0.8) * 1000;
                const data_remaining_tank2_fill_total_lastday = (data_remaining_tank2_fill_lastday * System_Data_Density_lastday);
  
    
                const kg_101H = data_remaining_tank1_fill_total - data_remaining_tank1_fill_total_lastday;
                const kg_102H = data_remaining_tank2_fill_total - data_remaining_tank2_fill_total_lastday;
    
                const total_tank_fill = kg_101H + kg_102H;

                // console.log("data_remaining_tank1_fill_total >>", data_remaining_tank1_fill_total);
                // console.log("data_remaining_tank1_fill_total_lastday >>", data_remaining_tank1_fill_total_lastday);
                // console.log("data_remaining_tank2_fill_total >>", data_remaining_tank2_fill_total);
                // console.log("data_remaining_tank2_fill_total_lastday >>", data_remaining_tank2_fill_total_lastday);

                // console.log("kg_101H >>", kg_101H);
                // console.log("kg_102H >>", kg_102H);
                // console.log("total_tank_fill >>", total_tank_fill);

                item.kg_101H = kg_101H;
                item.kg_102H = kg_102H;
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
    const result = await Promise.race([acidrecievedDataListLogic, timeoutPromise]);
    
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

// acid Mixed
export const acidmixed = async (c) => {

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Request timed out")), timeout);
  });

  const acidmixedDataListLogic = new Promise(async (resolve, reject) => {
    try {
      // ใส่ logic การทำงานของคุณตรงนี้
      // เช่น การเรียกดูข้อมูลจากฐานข้อมูล
      const timestamp = await convertTotimestamp(c.req.query()); // แปลง timestamp
      // const period = await c.req.query();
      // console.log(timestamp);

      const data_query = await db('ScadaDataLogAcid')
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
    
              // Query ข้อมูลจากตาราง ScadaDataLogAcid วันก่อนหน้า
              const rows = await db('ScadaDataLogAcid')
                .select("*")
                .where('UnixTimestamp', '>=', prevStartSec)
                .where('UnixTimestamp', '<=', prevEndSec)
                .orderBy('UnixTimestamp', 'desc')
                .first(); // เอาแถวล่าสุดแถวเดียว
    
              // console.log("rows >>", rows);
    
              if (rows) {
    
                const Aka_Total_ALL_FT_101H = (item.Aka_Total_ALL_FT_101H || 0) - (rows.Aka_Total_ALL_FT_101H || 0);
                const Aka_Total_ALL_FT_201H = (item.Aka_Total_ALL_FT_201H || 0) - (rows.Aka_Total_ALL_FT_201H || 0);
    
                item.ro_data = Aka_Total_ALL_FT_101H;
                item.chemical_data = Aka_Total_ALL_FT_201H;

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
    const result = await Promise.race([acidmixedDataListLogic, timeoutPromise]);
    
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

// acid Consumed
export const acidconsumed = async (c) => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Request timed out")), timeout);
  });

  const acidconsumedDataListLogic = new Promise(async (resolve, reject) => {
    try {
      // ใส่ logic การทำงานของคุณตรงนี้
      // เช่น การเรียกดูข้อมูลจากฐานข้อมูล
      const timestamp = await convertTotimestamp(c.req.query()); // แปลง timestamp
      // const plant = c.req.query('plant') || 'PD1';
      // const period = await c.req.query();
      // console.log(timestamp);

      const data_query = await db('ScadaDataLogAcid')
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
    
              // Query ข้อมูลจากตาราง ScadaDataLogAcid วันก่อนหน้า
              const rows = await db('ScadaDataLogAcid')
                .select("*")
                .where('UnixTimestamp', '>=', prevStartSec)
                .where('UnixTimestamp', '<=', prevEndSec)
                .orderBy('UnixTimestamp', 'desc')
                .first(); // เอาแถวล่าสุดแถวเดียว
    
              // console.log("rows >>", rows);
    
              if (rows) {
    
                const Aka_Total_ALL_FT_401H = (item.Aka_Total_ALL_FT_401H || 0) - (rows.Aka_Total_ALL_FT_401H || 0);
                const Aka_Total_ALL_FT_402H = (item.Aka_Total_ALL_FT_402H || 0) - (rows.Aka_Total_ALL_FT_402H || 0);
                const Aka_Total_ALL_FT_403H = (item.Aka_Total_ALL_FT_403H || 0) - (rows.Aka_Total_ALL_FT_403H || 0);
                const Aka_Total_ALL_FT_501H = (item.Aka_Total_ALL_FT_501H || 0) - (rows.Aka_Total_ALL_FT_501H || 0);

                //===  Total NaOH Used today
                item.usepd1 = Aka_Total_ALL_FT_401H;
                item.usepd2 = Aka_Total_ALL_FT_402H;
                item.usepd3 = Aka_Total_ALL_FT_403H;
                item.usees = Aka_Total_ALL_FT_501H;
                item.total_used = (Aka_Total_ALL_FT_401H + Aka_Total_ALL_FT_402H + Aka_Total_ALL_FT_403H + Aka_Total_ALL_FT_501H);
    
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
    const result = await Promise.race([acidconsumedDataListLogic, timeoutPromise]);
    
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

// Report HCI Fill
export const reporthcirecieved = async (c) => {

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Request timed out")), timeout);
  });

  const reportrecievedDataListLogic = new Promise(async (resolve, reject) => {
    try {
      // ใส่ logic การทำงานของคุณตรงนี้
      // เช่น การเรียกดูข้อมูลจากฐานข้อมูล
      const timestamp = await convertTotimestamp(c.req.query()); // แปลง timestamp

      const data_HCI_ = await db('ScadaDataLogAcid')
        .select('*')
        .where('UnixTimestamp', '>=', timestamp.startTimestamp)
        .where('UnixTimestamp', '<', timestamp.endTimestamp)
        .orderBy('UnixTimestamp', 'asc');

      // 1. สร้าง Array ของ Promises จากการ Map ข้อมูล
      const hci_promises = await Promise.all(data_HCI_.map(async (item) => {

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

            const System_Data_Fill = item.Fill_Kg_H || 0;
            const System_Data_Density = item.Density_H || 1;
            const System_Data_Fill_lastday = rows.Fill_Kg_H || 0;
            const System_Data_Density_lastday = rows.Density_H || 1;

            const Timestamp_data = new Date(item.UnixTimestamp * 1000);

            const constant_tank1_fill = 0.8;
            const constant_tank2_fill = 0.8;

            // col A
            item.dateTime = format(Timestamp_data, 'yyyy-MM-dd');

            const LT_PV_m3_LT_101 = item.LT_PV_m3_LT_101H || 0;
            const data_remaining_tank1_fill = (LT_PV_m3_LT_101 + constant_tank1_fill);
            // const data_remaining_tank1_fill_total = (data_remaining_tank1_fill * System_Data_Density);

            const LT_PV_m3_LT_102 = item.LT_PV_m3_LT_102H || 0;
            const data_remaining_tank2_fill = (LT_PV_m3_LT_102 + constant_tank2_fill);
            // const data_remaining_tank2_fill_total = (data_remaining_tank2_fill * System_Data_Density);

            const LT_PV_m3_LT_101_lastday = rows.LT_PV_m3_LT_101H || 0;
            const data_remaining_tank1_fill_lastday = (LT_PV_m3_LT_101_lastday + constant_tank1_fill);
            // const data_remaining_tank1_fill_total_lastday = (data_remaining_tank1_fill_lastday * System_Data_Density_lastday);

            const LT_PV_m3_LT_102_lastday = rows.LT_PV_m3_LT_102H || 0;
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

      const hci_results = hci_promises.filter(Boolean);

      resolve({ 
        start_timeDisplay: format(timestamp.startTimestamp * 1000, 'yyyy-MM-dd'),
        end_timeDisplay: format(timestamp.endTimestamp * 1000, 'yyyy-MM-dd'),
        total: hci_results.length,
        result: hci_results 
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

// Report HCI Mixed
export const reporthcimixed = async (c) => {

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Request timed out")), timeout);
  });

  const reportmixDataListLogic = new Promise (async (resolve, reject) =>{

    try{

      const timestamp = await convertTotimestamp(c.req.query()); // แปลง timestamp

      const data_HCI_ = await db('ScadaDataLogAcid')
        .select('*')
        .where('UnixTimestamp', '>=', timestamp.startTimestamp)
        .where('UnixTimestamp', '<', timestamp.endTimestamp)
        .orderBy('UnixTimestamp', 'asc');

      // 1. สร้าง Array ของ Promises จากการ Map ข้อมูล
      const hci_promises = await Promise.all(data_HCI_.map(async (item) => {

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
          const rows = await db('ScadaDataLogAcid')
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

            const constant_tank3_Mix = 0.8;
            const constant_tank4_Store = 1.3;

            // const constant_chemical = 4;

            const Timestamp_data = new Date(item.UnixTimestamp * 1000);

            // col A
            item.dateTime = format(Timestamp_data, 'yyyy-MM-dd');

            // col B
            const Total_ALL_FT_101 = (item.Aka_Total_ALL_FT_101H || 0);
            item.Total_ALL_FT_101 = Total_ALL_FT_101;

            // col C
            const Total_ALL_FT_201 = (item.Aka_Total_ALL_FT_201H || 0);
            item.Total_ALL_FT_201 = Total_ALL_FT_201;

            const Total_ALL_FT_101_lastday = (rows.Aka_Total_ALL_FT_101H || 0);
            const Total_ALL_FT_201_lastday = (rows.Aka_Total_ALL_FT_201H || 0);

            // col D
            item.chemical_between_day = (Total_ALL_FT_101 - Total_ALL_FT_101_lastday);

            // col E
            item.ro_between_day = (Total_ALL_FT_201 - Total_ALL_FT_201_lastday);
            
            // col G
            const LT_PV_m3_LT_301 = item.LT_PV_m3_LT_301H || 0;
            const data_remaining_tank_Mix = (LT_PV_m3_LT_301 + constant_tank3_Mix) * 1000;

            item.data_remaining_tank_Mix = data_remaining_tank_Mix;

            // col G
            const LT_PV_m3_LT_301_lastday = rows.LT_PV_m3_LT_301H || 0;
            const data_remaining_tank_Mix_lastday = (LT_PV_m3_LT_301_lastday + constant_tank3_Mix) * 1000;

            item.tank_Mix_between_day = (data_remaining_tank_Mix - data_remaining_tank_Mix_lastday);

            // col H
            const LT_PV_m3_LT_401 = (item.LT_PV_m3_LT_401H || 0);
            const data_remaining_tank_Store = (LT_PV_m3_LT_401 + constant_tank4_Store) * 1000;

            item.data_remaining_tank_Store = data_remaining_tank_Store;

            // col I
            const LT_PV_m3_LT_401_lastday = (rows.LT_PV_m3_LT_401H || 0);
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
      const hci_results = hci_promises.filter(Boolean);

      resolve({ 

        start_timeDisplay: format(timestamp.startTimestamp*1000, 'yyyy-MM-dd'),
        end_timeDisplay: format(timestamp.endTimestamp*1000, 'yyyy-MM-dd'),
        total: hci_results.length,
        result: hci_results 
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

// Report HCI Used
export const reporthciconsumed = async (c) => {

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Request timed out")), timeout);
  });

  const reportconsumedDataListLogic = new Promise(async (resolve, reject) => {

    const timestamp = await convertTotimestamp(c.req.query()); // แปลง timestamp

    const unit = c.req.query('unit') || 'kg';
    const aggregation = c.req.query('aggregation') || 'perday';

    const data_HCI_ = await db('ScadaDataLogAcid')
        .select('*')
        .where('UnixTimestamp', '>=', timestamp.startTimestamp)
        .where('UnixTimestamp', '<', timestamp.endTimestamp)
        .orderBy('UnixTimestamp', 'asc');

    // 1. สร้าง Array ของ Promises จากการ Map ข้อมูล
    const hci_promises = await Promise.all(data_HCI_.map(async (item) => {

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

      // Query ข้อมูลจากตาราง ScadaDataLogAcid วันก่อน
      const rows = await db('ScadaDataLogAcid')
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

          const constant_tank3_Mix = 0.8;
          const constant_tank4_Store = 1.3;

          const constant_chemical = 4;

          const Timestamp_data = new Date(item.UnixTimestamp * 1000);

          // col A
          item.dateTime = format(Timestamp_data, 'yyyy-MM-dd');

          // col B
          const LT_PV_m3_LT_301 = item.LT_PV_m3_LT_301H || 0;

          const data_remaining_tank_Mix = (LT_PV_m3_LT_301 + constant_tank3_Mix) * 1000;

          item.data_remaining_tank_Mix = data_remaining_tank_Mix;

          // col C
          const data_remaining_tank_Mix_chemical = (data_remaining_tank_Mix * constant_chemical) / 50;
          item.data_remaining_tank_Mix_chemical = data_remaining_tank_Mix_chemical;

          // col D
          item.data_remaining_tank_Mix_ro = data_remaining_tank_Mix - data_remaining_tank_Mix_chemical;

          // col E
          const LT_PV_m3_LT_301_lastday = rows.LT_PV_m3_LT_301H || 0;
          const data_remaining_tank_Mix_lastday = (LT_PV_m3_LT_301_lastday + constant_tank3_Mix) * 1000;

          item.tank_Mix_between_day = (data_remaining_tank_Mix - data_remaining_tank_Mix_lastday);

          // col F
          const LT_PV_m3_LT_401 = (item.LT_PV_m3_LT_401H || 0);
          const data_remaining_tank_Store = (LT_PV_m3_LT_401 + constant_tank4_Store) * 1000;

          item.data_remaining_tank_Store = data_remaining_tank_Store;

          // col G
          const data_remaining_tank_Store_chemical = (data_remaining_tank_Store * constant_chemical) / 50;
          item.data_remaining_tank_Store_chemical = data_remaining_tank_Store_chemical;

          // col H
          item.data_remaining_tank_Store_ro = data_remaining_tank_Store - data_remaining_tank_Store_chemical;

          // col I
          const LT_PV_m3_LT_401_lastday = (rows.LT_PV_m3_LT_401H || 0);
          const data_remaining_tank_Store_lastday = (LT_PV_m3_LT_401_lastday + constant_tank4_Store) * 1000;

          item.tank_Store_between_day = (data_remaining_tank_Store - data_remaining_tank_Store_lastday);

          // col J
          const Total_ALL_FT_401 = (item.Aka_Total_ALL_FT_401H || 0);
          
          item.Total_ALL_FT_401 = Total_ALL_FT_401;

          // col K
          const Total_ALL_FT_401_chemical = (Total_ALL_FT_401 * constant_chemical) / 50;
          item.Total_ALL_FT_401_chemical = Total_ALL_FT_401_chemical;

          // col L
          const Total_ALL_FT_401_ro = Total_ALL_FT_401 - Total_ALL_FT_401_chemical;
          item.Total_ALL_FT_401_ro = Total_ALL_FT_401_ro;
          
          // col M
          const Total_ALL_FT_402 = (item.Aka_Total_ALL_FT_402H || 0);

          item.Total_ALL_FT_402 = Total_ALL_FT_402;

          // col N
          const Total_ALL_FT_402_chemical = (Total_ALL_FT_402 * constant_chemical) / 50;
          item.Total_ALL_FT_402_chemical = Total_ALL_FT_402_chemical;

          // col O
          const Total_ALL_FT_402_ro =  Total_ALL_FT_402 - Total_ALL_FT_402_chemical;
          item.Total_ALL_FT_402_ro = Total_ALL_FT_402_ro;

          // col P
          const Total_ALL_FT_403 = (item.Aka_Total_ALL_FT_403H || 0);

          item.Total_ALL_FT_403 = Total_ALL_FT_403;

          // col Q
          const Total_ALL_FT_403_chemical = (Total_ALL_FT_403 * constant_chemical) / 50;
          item.Total_ALL_FT_403_chemical = Total_ALL_FT_403_chemical;

          // col R
          const Total_ALL_FT_403_ro = Total_ALL_FT_403 - Total_ALL_FT_403_chemical;
          item.Total_ALL_FT_403_ro = Total_ALL_FT_403_ro;

          // col S
          item.Total_ALL_Used = (Total_ALL_FT_401 + Total_ALL_FT_402 + Total_ALL_FT_403);

          // col T
          item.Total_ALL_Used_chemical = (Total_ALL_FT_401_chemical + Total_ALL_FT_402_chemical + Total_ALL_FT_403_chemical);

          // col U
          item.Total_ALL_Used_ro = (Total_ALL_FT_401_ro + Total_ALL_FT_402_ro + Total_ALL_FT_403_ro);

          // ส่งค่ากลับไปในแต่ละ item เพื่อนำไปบวกเพิ่มภายหลัง
          return {
              ...item,
          };
      }

      return null;
    }))

    const hci_results = hci_promises.filter(Boolean);

    resolve({ 

      start_timeDisplay: format(timestamp.startTimestamp*1000, 'yyyy-MM-dd'),
      end_timeDisplay: format(timestamp.endTimestamp*1000, 'yyyy-MM-dd'),
      total: hci_results.length,
      result: hci_results 
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

// // Report HCI Received
// export const reporthcirecieved = async (c) => {

//   const timeoutPromise = new Promise((_, reject) => {
//     setTimeout(() => reject(new Error("Request timed out")), timeout);
//   });

//   const reporthcirecievedDataListLogic = new Promise(async (resolve, reject) => {

//       try {
//         // ใส่ logic การทำงานของคุณตรงนี้
//         // เช่น การเรียกดูข้อมูลจากฐานข้อมูล
//         const timestamp = await convertTotimestamp(c.req.query()); // แปลง timestamp
  
//         const tank = c.req.query('tank') || '12';
//         const unit = c.req.query('unit') || 'kg';
//         const aggregation = c.req.query('aggregation') || 'perday';
  
//         // const period = await c.req.query();
//         // console.log(timestamp);
//         const dbTableRecieved = 'acidrecieved';
//         const dbTablerecievedSD = 'acidrecievedSD';
  
//         var tableRecievedT1 = "volume_T1_Kg";
//         var tableRecievedT2 = "volume_T2_Kg";
  
//         var before_tableRecievedT1 = "before_volume_T1_Kg";
//         var before_tableRecievedT2 = "before_volume_T2_Kg";
  
//         // Liter
//         if(unit == 'Liter'){
  
//           tableRecievedT1 = "volume_T1_Kg";
//           tableRecievedT2 = "volume_T2_Kg";
  
//           before_tableRecievedT1 = "before_volume_T1_Kg";
//           before_tableRecievedT2 = "before_volume_T2_Kg";
  
//         }else if(unit == 'kg'){
  
//           tableRecievedT1 = "volume_T1_Kg";
//           tableRecievedT2 = "volume_T2_Kg";
  
//           before_tableRecievedT1 = "before_volume_T1_Kg";
//           before_tableRecievedT2 = "before_volume_T2_Kg";
  
//         }else if(unit == 'm3'){
  
//           tableRecievedT1 = "volume_T1_m3";
//           tableRecievedT2 = "volume_T2_m3";
  
//           before_tableRecievedT1 = "before_volume_T1_m3";
//           before_tableRecievedT2 = "before_volume_T2_m3";
//         }
  
//         // console.log("tableRecievedT1 -->",tableRecievedT1);
//         // console.log("tableRecievedT2 -->",tableRecievedT2);
  
//         const sqlServerEpoch_recieved = "FORMAT(DATEADD(SECOND, [start_time], '1970-01-01'), 'yyyy-MM-dd')";
  
//         var dbdata = [];
  
//         if(aggregation == 'perday'){
  
//           // dbdata = await db(dbTableRecieved)
//           // .select(
//           //     // 1. Extract the date for grouping and aliasing it as 'date'
//           //     db.raw(`CAST(${sqlServerEpoch_recieved} AS DATE) as date_time`),
//           //     // 2. Calculate the total volume for tank 1 for the day
//           //     db.raw(`SUM(${tableRecievedT1}) as tank1`),
//           //     db.raw(`SUM(${before_tableRecievedT1}) as before_tank1`),
//           //     // 3. Calculate the total volume for tank 2 for the day
//           //     db.raw(`SUM(${tableRecievedT2}) as tank2`),
//           //     db.raw(`SUM(${before_tableRecievedT2}) as before_tank2`)
  
//           // )
//           // .where('start_time', '>=', timestamp.startTimestamp)
//           // .andWhere('start_time', '<', timestamp.endTimestamp)
//           // .groupBy(db.raw(`CAST(${sqlServerEpoch_recieved} AS DATE)`)) 
//           // .orderBy('date_time', 'asc');

//             dbdata = await db(dbTableRecieved)
//             .select(
//               // 1. Extract the date for grouping and aliasing it as 'date'
//               db.raw(`CAST(${sqlServerEpoch_recieved} AS DATE) as date_time`),
//               `start_time`,
//               `end_time`,
//               `${tableRecievedT1} as tank1`,
//               `${tableRecievedT2} as tank2`,
//               `${before_tableRecievedT1} as before_tank1`,
//               `${before_tableRecievedT2} as before_tank2`,
//           )
//           .where('start_time', '>=', timestamp.startTimestamp)
//           .andWhere('start_time', '<', timestamp.endTimestamp)
//           .orderBy('date_time', 'asc')
//           .then(async (data_HCI_Fill_day) => {

//             // if(unit == 'kg'){

//               // 1. สร้าง Array ของ Promises จากการ Map ข้อมูลแต่ละแถว
//               const hci_promises = data_HCI_Fill_day.map(async (item) => {
                
//                 let System_Data_Fill = 0;
//                 let System_Data_Density = 1;

//                 // แปลงเวลาให้ถูกต้อง (ใช้ new Date โดยตรง)
//                 const baseDate = new Date(Date(item.start_time));
//                 const startOfDay = new Date(baseDate).setHours(0, 0, 0, 0); 
//                 const endOfDay = new Date(baseDate).setHours(23, 59, 59, 999);

//                 const startTimeSec = Math.floor(startOfDay / 1000);
//                 const endTimeSec = Math.floor(endOfDay / 1000);
              
//                 // Query ข้อมูลจากตาราง SD
//                 const rows = await db(dbTablerecievedSD)
//                   .select("Fill_Kg", "Density")
//                   .where('date_time', '>=', startTimeSec)
//                   .where('date_time', '<=', endTimeSec)
//                   .orderBy('date_time', 'desc')
//                   .first(); // เอาแถวล่าสุดแถวเดียว

//                 if (rows) {

//                   System_Data_Fill = rows.Fill_Kg || 0;
//                   System_Data_Density = rows.Density || 1;

//                   if(unit == 'm3'){

//                     item.tank1 = (item.tank1 || 0)+0.8;
//                     item.before_tank1 = (item.before_tank1 || 0)+0.8;

//                     item.tank2 = (item.tank2 || 0)+0.8;
//                     item.before_tank2 = (item.before_tank2 || 0)+0.8;

//                     item.result_tank1 = ((item.tank1 || 0) * System_Data_Density)+0.8;
//                     item.result_before_tank1 = ((item.before_tank1 || 0) * System_Data_Density)+0.8;

//                     item.result_tank2 = ((item.tank2 || 0) * System_Data_Density)+0.8;
//                     item.result_before_tank2 = ((item.before_tank2 || 0) * System_Data_Density)+0.8;

//                   }else if(unit == 'kg'){

//                     item.tank1 = (item.tank1 || 0);
//                     item.before_tank1 = (item.before_tank1 || 0);

//                     item.tank2 = (item.tank2 || 0);
//                     item.before_tank2 = (item.before_tank2 || 0);

//                     item.result_tank1 = (item.tank1 || 0) * System_Data_Density;
//                     item.result_before_tank1 = (item.before_tank1 || 0) * System_Data_Density;

//                     item.result_tank2 = (item.tank2 || 0) * System_Data_Density;
//                     item.result_before_tank2 = (item.before_tank2 || 0) * System_Data_Density;
                  
//                   }
//                   else{

//                     item.tank1 = (item.tank1 || 0);
//                     item.before_tank1 = (item.before_tank1 || 0);

//                     item.tank2 = (item.tank2 || 0);
//                     item.before_tank2 = (item.before_tank2 || 0);

//                     item.result_tank1 = (item.tank1 || 0);
//                     item.result_before_tank1 = (item.before_tank1 || 0);

//                     item.result_tank2 = (item.tank2 || 0);
//                     item.result_before_tank2 = (item.before_tank2 || 0);
//                   }
//                 }

//                 return {
//                   ...item,
//                   System_Data_Fill,
//                   System_Data_Density
//                 };

//               });

//               // 2. รอให้ Query ของทุก Item ทำงานเสร็จพร้อมกัน
//               const final_hci_items = await Promise.all(hci_promises);

//               const hci_Total = final_hci_items.reduce((total, item) => {

//                 let key = item.date_time;

//                 // 3. ถ้าไม่มี key (กรณีข้อมูลผิดพลาด) ให้ข้ามไป
//                 if (!key) return acc;

//                 if (!total[key]) {
//                   total[key] = {
//                     date_time: key,
//                     tank1: 0,
//                     before_tank1: 0,
//                     tank2: 0,
//                     before_tank2: 0,
//                     result_tank1: 0,
//                     result_before_tank1: 0,
//                     result_tank2: 0,
//                     result_before_tank2: 0
//                   };
//                 }

//                 total[key].tank1 += (Number(item.tank1) || 0);
//                 total[key].before_tank1 += (Number(item.before_tank1) || 0);
//                 total[key].tank2 += (Number(item.tank2) || 0);
//                 total[key].before_tank2 += (Number(item.before_tank2) || 0);

//                 total[key].result_tank1 += (Number(item.result_tank1) || 0);
//                 total[key].result_before_tank1 += (Number(item.result_before_tank1) || 0);
//                 total[key].result_tank2 += (Number(item.result_tank2) || 0);
//                 total[key].result_before_tank2 += (Number(item.result_before_tank2) || 0);

//                 return total;

//               }, {});

//               // 2. แปลงเป็น Array และจัดการทศนิยมให้เหลือ 2-4 ตำแหน่ง (ถ้าต้องการ)
//               const hci_Total_Array = Object.values(hci_Total).map(item => ({
//                 ...item,
//                 tank1: Number(item.tank1.toFixed(2)),
//                 before_tank1: Number(item.before_tank1.toFixed(2)),
//                 tank2: Number(item.tank2.toFixed(2)),
//                 before_tank2: Number(item.before_tank2.toFixed(2)),
//                 result_tank1: Number(item.result_tank1.toFixed(2)),
//                 result_before_tank1: Number(item.result_before_tank1.toFixed(2)),
//                 result_tank2: Number(item.result_tank2.toFixed(2)),
//                 result_before_tank2: Number(item.result_before_tank2.toFixed(2)),
//               }));

//               return hci_Total_Array;

//             // }else{

//             //   return data_HCI_Fill_day;

//             // }

//           });
  
//         }else{
  
//           dbdata = await db(dbTableRecieved)
//             .select(
//               // 1. Extract the date for grouping and aliasing it as 'date'
//               db.raw(`CAST(${sqlServerEpoch_recieved} AS DATE) as date_time`),
//               `start_time`,
//               `end_time`,
//               `${tableRecievedT1} as tank1`,
//               `${tableRecievedT2} as tank2`,
//           )
//           .where('start_time', '>=', timestamp.startTimestamp)
//           .andWhere('start_time', '<', timestamp.endTimestamp)
//           .orderBy('date_time', 'asc')
//           .then(async(data_HCI_Fill) => {
  
//             // if(unit == 'kg'){

//               // 1. สร้าง Array ของ Promises จากการ Map ข้อมูล
//               const hci_promises = data_HCI_Fill.map(async (item) => {

//                 let System_Data_Fill = 0;
//                 let System_Data_Density = 1;

//                 // แปลงเวลาให้ถูกต้อง (ใช้ new Date โดยตรง)
//                 const baseDate = new Date(Date(item.start_time));
//                 const startOfDay = new Date(baseDate).setHours(0, 0, 0, 0); 
//                 const endOfDay = new Date(baseDate).setHours(23, 59, 59, 999);

//                 const startTimeSec = Math.floor(startOfDay / 1000);
//                 const endTimeSec = Math.floor(endOfDay / 1000);

//                 const rows = await db(dbTablerecievedSD)
//                   .select("Fill_Kg", "Density")
//                   .where('date_time', '>=', startTimeSec)
//                   .where('date_time', '<=', endTimeSec)
//                   .orderBy('date_time', 'desc')
//                   .first(); // เอาแถวล่าสุดแถวเดียว

//                 if (rows) {

//                   System_Data_Fill = rows.Fill_Kg || 0;
//                   System_Data_Density = rows.Density || 1;

//                   if(unit == 'm3'){

//                     item.tank1 = (item.tank1 || 0)+0.8;
//                     item.before_tank1 = (item.before_tank1 || 0)+0.8;

//                     item.tank2 = (item.tank2 || 0)+0.8;
//                     item.before_tank2 = (item.before_tank2 || 0)+0.8;

//                     item.result_tank1 = ((item.tank1 || 0) * System_Data_Density)+0.8;
//                     item.result_before_tank1 = ((item.before_tank1 || 0) * System_Data_Density)+0.8;

//                     item.result_tank2 = ((item.tank2 || 0) * System_Data_Density)+0.8;
//                     item.result_before_tank2 = ((item.before_tank2 || 0) * System_Data_Density)+0.8;

//                   }else if(unit == 'kg'){

//                     item.tank1 = (item.tank1 || 0);
//                     item.before_tank1 = (item.before_tank1 || 0);

//                     item.tank2 = (item.tank2 || 0);
//                     item.before_tank2 = (item.before_tank2 || 0);

//                     item.result_tank1 = (item.tank1 || 0) * System_Data_Density;
//                     item.result_before_tank1 = (item.before_tank1 || 0) * System_Data_Density;

//                     item.result_tank2 = (item.tank2 || 0) * System_Data_Density;
//                     item.result_before_tank2 = (item.before_tank2 || 0) * System_Data_Density;
                  
//                   }
//                   else{

//                     item.tank1 = (item.tank1 || 0);
//                     item.before_tank1 = (item.before_tank1 || 0);

//                     item.tank2 = (item.tank2 || 0);
//                     item.before_tank2 = (item.before_tank2 || 0);

//                     item.result_tank1 = (item.tank1 || 0);
//                     item.result_before_tank1 = (item.before_tank1 || 0);

//                     item.result_tank2 = (item.tank2 || 0);
//                     item.result_before_tank2 = (item.before_tank2 || 0);
//                   }

//                 }

//                 return {
//                   ...item,
//                   System_Data_Fill,
//                   System_Data_Density
//                 };

//               });

//               //2. รอให้ Query ของทุก Item ทำงานเสร็จพร้อมกัน
//               const final_hci_items = await Promise.all(hci_promises);

//               return final_hci_items;

//             // }else{

//             //   return data_HCI_Fill;

//             // }
  
//           })
                  
  
//         }
//         // console.log(result);
  
//         const promises = dbdata.map(async (item) => {
//           // {
//           //     "start_timeDisplay": "2026-01-26",
//           //     "end_timeDisplay": "2026-02-01",
//           //     "total": 1,
//           //     "result": [
//             //         {
//           //             "date_time": "2026-01-27",
//           //             "start_time": "21:51",
//           //             "end_time": "22:32",
//           //             "tank1": 7234.848,
//           //             "tank2": 7236.428,
//           //             "before_volume_T1": 9607.459,
//           //             "before_volume_T2": 9530.912,
//           //             "Before_Fill": 9606.659000000001,
//           //             "After_Fill": 16840.707000000002,
//           //             "Error_Fill": 0,
//           //             "result_Before_Fill": 9607.459,
//           //             "result_After_Fill": 16842.307,
//           //             "result_Error_Fill": 0,
//           //             "System_Data_Fill": 0,
//           //             "System_Data_Density": 1
//           //         }
//           //     ]
//           // }
          
//           let System_Data_Fill = 0; 
//           let System_Data_Density = 1;
  
//           const sqlServerEpoch_recievedSD = "FORMAT(DATEADD(SECOND, [date_time], '1970-01-01'), 'yyyy-MM-dd')";
  
//           await db(dbTablerecievedSD)
  
//             .select("*", db.raw(`CAST(${sqlServerEpoch_recievedSD} AS DATE) as created_date`))
//             // Use .whereRaw and repeat the logic, passing the value as a binding (?)
//             .whereRaw(`CAST(${sqlServerEpoch_recievedSD} AS DATE) = ?`, [item.date_time])
//             .then((rows) => {
  
//               // console.log("rows SD >>",rows);
  
//               if(rows.length > 0){
  
//                 System_Data_Fill = rows[0].Fill_Kg || 0;
//                 System_Data_Density = rows[0].Density || 1;
  
//               }
  
//             })
  
//             item.System_Data_Fill = System_Data_Fill;
//             item.System_Data_Density = System_Data_Density;
            
//             const before_tank1 = Number(item.before_tank1) || 0;
//             const before_tank2 = Number(item.before_tank2) || 0;
  
//             const tank1 = Number(item.tank1) || 0;
//             const tank2 = Number(item.tank2) || 0;

//             const result_tank1 = Number(item.result_tank1) || 0;
//             const result_tank2 = Number(item.result_tank2) || 0;
            
//             const result_before_tank1 = Number(item.result_before_tank1) || 0;
//             const result_before_tank2 = Number(item.result_before_tank2) || 0;
  
//             // console.log("unit kg >>",unit);
//             // console.log("tank >>",tank);
  
//             item.date_time = format(item.date_time, 'yyyy-MM-dd');
  
//             if (aggregation == 'perday') {
  
//               item.start_time = "--:--";
//               item.end_time = "--:--";
  
//             }else{
//               item.start_time = format(item.start_time*1000, 'HH:mm');
//               item.end_time = format(item.end_time*1000, 'HH:mm');
//             }
  
//             if(unit == 'kg'){
  
//               if (tank == "12") {
  
//                 item.Before_Fill = (before_tank1 + before_tank2);
//                 item.After_Fill = ((before_tank1 + tank1) + (before_tank2 + tank2));
  
//                 item.Error_Fill = System_Data_Fill - (tank1 + tank2);
  
//                 item.result_Before_Fill = ((result_before_tank1) + (result_before_tank2));
//                 item.result_After_Fill = (((result_before_tank1) + (result_tank1)) + (result_before_tank2 + (result_tank2)));

//                 item.result_Error_Fill = System_Data_Fill - ((result_tank1) + (result_tank2));
  
//               }else if (tank == "1"){
  
//                 item.Before_Fill = ((before_tank1));
//                 item.After_Fill = ((before_tank1 + (tank1)));
  
//                 item.Error_Fill = 0;
  
//                 item.result_Before_Fill = ((result_before_tank1));
//                 item.result_After_Fill = (result_before_tank1 + (result_tank1));

//                 item.result_Error_Fill = 0;
  
//               }else if (tank == "2"){
  
//                 item.Before_Fill = ((before_tank2));
//                 item.After_Fill = ((before_tank2) + (tank2));
  
//                 item.Error_Fill = 0;
  
//                 item.result_Before_Fill = ((result_before_tank2));
//                 item.result_After_Fill = (result_before_tank2 + (result_tank2));
  
//                 item.result_Error_Fill = 0;
  
//               }
  
//             }else if(unit == 'Liter'){
  
//               if (tank == "12") {
  
//                 item.Before_Fill = ((before_tank1) + (before_tank2));
//                 item.After_Fill = (((before_tank1) + (tank1)) + ((before_tank2) + (tank2)));
  
//                 // item.Error_Fill = System_Data_Fill - ((tank1) + (tank2));
//                 item.Error_Fill = 0;
  
//                 item.result_Before_Fill = ((result_before_tank1) + (result_before_tank2));
//                 item.result_After_Fill = (((result_before_tank1) + (result_tank1)) + ((result_before_tank2) + (result_tank2)));

//                 // item.result_Error_Fill = System_Data_Fill - ((tank1) + (tank2));
//                 item.result_Error_Fill = 0;
                
//               }else if (tank == "1"){
  
//                 item.Before_Fill = ((before_tank1));
//                 item.After_Fill = (((before_tank1) + (tank1)));
  
//                 item.Error_Fill = 0;
  
//                 item.result_Before_Fill = ((result_before_tank1));
//                 item.result_After_Fill = (((result_before_tank1) + (result_tank1)));
  
//                 item.result_Error_Fill = 0;
                
//               }else if (tank == "2"){
  
//                 item.Before_Fill = ((before_tank2));
//                 item.After_Fill = ((before_tank2) + (tank2));
  
//                 item.Error_Fill = 0;
  
//                 item.result_Before_Fill = ((result_before_tank2));
//                 item.result_After_Fill = ((result_before_tank2) + (result_tank2));
  
//                 item.result_Error_Fill = 0;
                
//               }
  
  
//             }else if (unit == 'm3'){
  
//               if (tank == "12") {
  
//                 item.Before_Fill = ((before_tank1) + (before_tank2));
//                 item.After_Fill = (((before_tank1) + (tank1)) + ((before_tank2) + (tank2)));
  
//                 // item.Error_Fill = System_Data_Fill - ((tank1) + (tank2));
//                 item.Error_Fill = 0;
  
//                 item.result_Before_Fill = ((result_before_tank1) + (result_before_tank2));
//                 item.result_After_Fill = (((result_before_tank1) + (result_tank1)) + ((result_before_tank2) + (result_tank2)));
  
//                 // item.result_Error_Fill = System_Data_Fill - ((tank1) + (tank2));
//                 item.result_Error_Fill = 0;
                
//               }else if (tank == "1"){
  
//                 item.Before_Fill = ((before_tank1));
//                 item.After_Fill = (((before_tank1) + (tank1)));
  
//                 item.Error_Fill = 0;
  
//                 item.result_Before_Fill = ((result_before_tank1));
//               item.result_After_Fill = (((result_before_tank1) + (result_tank1)));
  
//                 item.result_Error_Fill = 0;
                
//               }else if (tank == "2"){
  
//                 item.Before_Fill = ((before_tank2));
//                 item.After_Fill = ((before_tank2) + (tank2));
  
//                 item.Error_Fill = 0;
  
//                 item.result_Before_Fill = ((result_before_tank2));
//                 item.result_After_Fill = ((result_before_tank2) + (result_tank2));
  
//                 item.result_Error_Fill = 0;
                
//               }
  
//             }
            
//           return {
//             ...item
//           }
//         })
  
//         // console.log(result);
//         const result = await Promise.all(promises);
  
//         resolve({ 
//           start_timeDisplay: format(timestamp.startTimestamp*1000, 'yyyy-MM-dd'),
//           end_timeDisplay: format(timestamp.endTimestamp*1000, 'yyyy-MM-dd'),
//           total: result.length,
//           result: result 
//           // message: 'Hello, Smart Automation Thailand!',
//         });
  
//       } catch (error) {
//         reject(error);
//       }
//     });

//   try {
//     const result = await Promise.race([reporthcirecievedDataListLogic, timeoutPromise]);
    
//     return c.json(result);

//   } catch (error) {
//     if (error instanceof Error && error.message === "Request timed out") {
//       // ส่ง status 402 หรือตามที่ต้องการกลับไป
//       return c.json({ message: "Request timed out" }, 402);
//     } else {
//       // จัดการกับ error อื่นๆ
//       console.error("An unexpected error occurred:", error);
//       return c.json({ message: "Internal Server Error" }, 500);
//     }
//   }
// }

// // Report HCI Mixed
// export const reporthcimixed = async (c) => {

//   const timeoutPromise = new Promise((_, reject) => {
//     setTimeout(() => reject(new Error("Request timed out")), timeout);
//   });

//   const reportmixDataListLogic = new Promise (async (resolve, reject) =>{

//     try{

//       const timestamp = await convertTotimestamp(c.req.query()); // แปลง timestamp

//       const unit = c.req.query('unit') || 'kg';
//       const aggregation = c.req.query('aggregation') || 'perday';

//       const dbTableMixer = 'acidmix';
//       const dbTablerecievedSD = 'acidrecievedSD';

//       // var tableMixerMain = "";
//       // var tableMixerRO = "";
//       // var tableMixerT3 = "";

//       // if(unit == 'Liter'){

//       //   tableMixerT3 = "volume_T3_Kg";

//       // }else if(unit == 'kg'){

//       //   tableMixerT3 = "volume_T3_Kg";

//       // }else if(unit == 'm3'){

//       //   tableMixerT3 = "volume_T3_m3";

//       // }

//       const sqlServerEpoch = "FORMAT(DATEADD(SECOND, [start_time], '1970-01-01'), 'yyyy-MM-dd')";

//       var dbdata = [];

//       if(aggregation == 'perday'){

//         dbdata = await db(dbTableMixer)
//         // .select(
//         //     // 1. Extract the date for grouping and aliasing it as 'date'
//         //     db.raw(`CAST(${sqlServerEpoch} AS DATE) as date_time`),
//         //     // 2. Calculate the total volume for tank 1 for the day
//         //     db.raw(`SUM(ro_volume) as ro_volume`),
//         //     // 3. Calculate the total volume for tank 2 for the day
//         //     db.raw(`SUM(main_volume) as main_volume`),
//         //     db.raw(`SUM(volume_T3_Kg) as volume_T3_Kg`),
//         //     db.raw(`SUM(volume_T3_m3) as volume_T3_m3`),
//         //     db.raw(`SUM(volume_T3_mm) as volume_T3_mm`)

//         // )
//         // .where('start_time', '>=', timestamp.startTimestamp)
//         // .andWhere('start_time', '<', timestamp.endTimestamp)
//         // .groupBy(db.raw(`CAST(${sqlServerEpoch} AS DATE)`)) 
//         // .orderBy('date_time', 'asc');
//         .select(
//           db.raw(`CAST(${sqlServerEpoch} AS DATE) as date_time`),
//           'ro_volume',
//           'main_volume',
//           'volume_T3_Kg',
//           'volume_T3_m3',
//           'volume_T3_mm',
//           'start_time',
//           'end_time'
//         )
//         .where('start_time', '>=', timestamp.startTimestamp)
//         .andWhere('start_time', '<', timestamp.endTimestamp)
//         .orderBy('date_time', 'asc')
//         .then(async(rows) => {

//           const hci_promises = rows.map(async (item) => {

//             // กำหนดค่าเริ่มต้นสำหรับแต่ละรอบ
//             let System_Data_Fill = 0;
//             let System_Data_Density = 1;

//             // แปลงเวลาให้ถูกต้อง (ใช้ new Date โดยตรง)
//             const baseDate = new Date(Date(item.start_time));
//             const startOfDay = new Date(baseDate).setHours(0, 0, 0, 0);
//             const endOfDay = new Date(baseDate).setHours(23, 59, 59, 999);

//             const startTimeSec = Math.floor(startOfDay / 1000);
//             const endTimeSec = Math.floor(endOfDay / 1000);

//             // Query ข้อมูลจากตาราง SD
//             const rows = await db(dbTablerecievedSD)
//               .select("Fill_Kg", "Density")
//               .where('date_time', '>=', startTimeSec)
//               .where('date_time', '<=', endTimeSec)
//               .orderBy('date_time', 'desc')
//               .first(); // เอาแถวล่าสุดแถวเดียว

//             if (rows) {
              
//               System_Data_Fill = rows.Fill_Kg || 0;
//               System_Data_Density = rows.Density || 1;

//               // item.volume = (item.volume || 0) * System_Data_Density;
//               item.ro_volume = (item.ro_volume || 0);
//               item.main_volume = (item.main_volume || 0) * System_Data_Density;
//               item.volume_T3_Kg = (item.volume_T3_Kg || 0);
//               item.volume_T3_m3 = (Number(item.volume_T3_m3) || 0)+0.8;
//               item.volume_T3_mm = (item.volume_T3_mm || 0);

//             }

//             // ส่งค่ากลับไปในแต่ละ item เพื่อนำไปบวกเพิ่มภายหลัง
//             return {
//               ...item,
//               System_Data_Fill,
//               System_Data_Density
//             };

//           });
          
//           // 2. รอให้ Query ของทุก Item ทำงานเสร็จพร้อมกัน
//           const final_HCI_items = await Promise.all(hci_promises);

//           // 3. ใช้ .reduce() เพื่อรวมค่า Total ทั้งหมด (วิธีนี้ปลอดภัยและแม่นยำกว่า)
//           const groupedData = final_HCI_items.reduce((acc, curr) => {

//             // แปลง timestamp เป็นวันที่ (YYYY-MM-DD) เพื่อใช้เป็น Key ในการกลุ่ม
//             const dateObj = new Date(curr.start_time * 1000); 
//             const dateKey = format(dateObj, 'yyyy-MM-dd');

//             if (!acc[dateKey]) {

//               // สร้างโครงสร้างเริ่มต้นสำหรับวันใหม่
//               acc[dateKey] = { 
//                   // แปลง key กลับเป็น Date Object (เริ่มที่เวลา 00:00:00) เพื่อให้เหมือน output ที่คุณต้องการ
//                   date_time: new Date(dateKey), 
//                   ro_volume: 0, 
//                   main_volume: 0,
//                   volume_T3_Kg: 0,
//                   volume_T3_m3: 0,
//                   volume_T3_mm: 0,
//                   // สำหรับฟิลด์อื่นๆ ถ้าต้องการค่าเฉลี่ยหรือค่าล่าสุดให้ใส่ไว้ตรงนี้
//                   start_time: curr.start_time, // หรือจะเก็บเป็น Array ก็ได้
//                   end_time: curr.end_time,
//                   System_Data_Fill: curr.System_Data_Fill || 0,
//                   System_Data_Density: curr.System_Data_Density || 1
//               };
//             }

//             // 2. สะสมค่า (Summation)
//             acc[dateKey].ro_volume += (Number(curr.ro_volume) || 0);
//             acc[dateKey].main_volume += (Number(curr.main_volume) || 0);
//             acc[dateKey].volume_T3_Kg += (Number(curr.volume_T3_Kg) || 0);
//             acc[dateKey].volume_T3_m3 += (Number(curr.volume_T3_m3) || 0);
//             acc[dateKey].volume_T3_mm += (Number(curr.volume_T3_mm) || 0);
            
//             // อัปเดต end_time ให้เป็นตัวล่าสุดของวันนั้น
//             acc[dateKey].end_time = curr.end_time;

//             return acc;

//           }, {});

//           // 3. แปลงจาก Object เป็น Array เพื่อให้ได้ผลลัพธ์ตามที่ต้องการ
//           const HCI_Total_day = Object.values(groupedData);

//           return HCI_Total_day;
//         })

//       }else{

//         dbdata = await db(dbTableMixer)
//         .select(
//           db.raw(`CAST(${sqlServerEpoch} AS DATE) as date_time`),
//           'ro_volume',
//           'main_volume',
//           'volume_T3_Kg',
//           'volume_T3_m3',
//           'volume_T3_mm',
//           'start_time',
//           'end_time'
//         )
//         .where('start_time', '>=', timestamp.startTimestamp)
//         .andWhere('start_time', '<', timestamp.endTimestamp)
//         .orderBy('date_time', 'asc')
//         .then(async(rows) => {

//           const hci_promises = rows.map(async (item) => {

//             // กำหนดค่าเริ่มต้นสำหรับแต่ละรอบ
//             let System_Data_Fill = 0;
//             let System_Data_Density = 1;

//             // แปลงเวลาให้ถูกต้อง (ใช้ new Date โดยตรง)
//             const baseDate = new Date(Date(item.start_time));
//             const startOfDay = new Date(baseDate).setHours(0, 0, 0, 0);
//             const endOfDay = new Date(baseDate).setHours(23, 59, 59, 999);

//             const startTimeSec = Math.floor(startOfDay / 1000);
//             const endTimeSec = Math.floor(endOfDay / 1000);

//             // Query ข้อมูลจากตาราง SD
//             // const rows = await db(dbTablerecievedSD)
//             // .select("Fill_Kg", "Density")
//             // .where('date_time', '>=', startTimeSec)
//             // .where('date_time', '<=', endTimeSec)
//             // .orderBy('date_time', 'desc')
//             // .first(); // เอาแถวล่าสุดแถวเดียว

//             // if (rows) {

//             //   System_Data_Fill = rows.Fill_Kg || 0;
//             //   System_Data_Density = rows.Density || 1;

//               // item.volume = (item.volume || 0) * System_Data_Density;
//               item.ro_volume = (item.ro_volume || 0);

//               if(unit == 'kg'){

//                 item.main_volume = (item.main_volume || 0) * System_Data_Density;

//               }else{
//                 item.main_volume = (item.main_volume || 0);
//               }
//               item.volume_T3_Kg = (item.volume_T3_Kg || 0);
//               item.volume_T3_m3 = Number((item.volume_T3_m3 || 0))+0.8;
//               item.volume_T3_mm = (item.volume_T3_mm || 0);

//             // }

//             // ส่งค่ากลับไปในแต่ละ item เพื่อนำไปบวกเพิ่มภายหลัง
//             return {
//               ...item,
//               // System_Data_Fill,
//               // System_Data_Density
//             };
//           });

//           // 2. รอให้ Query ของทุก Item ทำงานเสร็จพร้อมกัน
//           const final_hci_items = await Promise.all(hci_promises);

//           return final_hci_items
//         })
//       }

//       const promises = dbdata.map(async (item) => {

//         // let System_Data_Fill = 0; 
//         // let System_Data_Density = 1;

//         // const sqlServerEpoch_SD = "FORMAT(DATEADD(SECOND, [date_time], '1970-01-01'), 'yyyy-MM-dd')";
        
//         // await db(dbTablerecievedSD)

//         //   .select("*", db.raw(`CAST(${sqlServerEpoch_SD} AS DATE) as created_date`))
//         //   // Use .whereRaw and repeat the logic, passing the value as a binding (?)
//         //   .whereRaw(`CAST(${sqlServerEpoch_SD} AS DATE) = ?`, [item.date_time])
//         //   .then((rows) => {

//             // if(rows.length > 0){

//             //   System_Data_Fill = rows[0].Fill_Kg || 0;
//             //   System_Data_Density = rows[0].Density || 1;

//             // }

//             // item.System_Data_Fill = System_Data_Fill;
//             // item.System_Data_Density = System_Data_Density;

//             const ro_volume = Number(item.ro_volume) || 0;
//             const main_volume = Number(item.main_volume) || 0;
//             const volume_T3_Kg = Number(item.volume_T3_Kg) || 0;
//             const volume_T3_m3 = Number(item.volume_T3_m3) || 0;
//             const volume_T3_mm = Number(item.volume_T3_mm) || 0;

//             item.date_time = format(item.date_time, 'yyyy-MM-dd');

//             if (aggregation == 'perday') {

//               item.start_time = "--:--";
//               item.end_time = "--:--";

//             }else{
//               item.start_time = format(item.start_time*1000, 'HH:mm');
//               item.end_time = format(item.end_time*1000, 'HH:mm');
//             }

//             if(unit == 'kg' || unit == 'Liter'){

//               const result_ro_value = (ro_volume);
//               const result_main_value = (main_volume);

//               item.ro_value = result_ro_value;
//               item.main_value = result_main_value;
//               item.total = result_ro_value + result_main_value;
//               item.error_value = (result_ro_value + result_main_value) - volume_T3_Kg;
//               item.tank3 = volume_T3_Kg;
              
//             }else if(unit == 'm3'){

//               const result_ro_value = (ro_volume)*0.001;
//               const result_main_value = (main_volume)*0.001;

//               item.ro_value = result_ro_value;
//               item.main_value = result_main_value;
//               item.total = result_ro_value + result_main_value;
//               item.error_value = (result_ro_value + result_main_value) - volume_T3_m3;
//               item.tank3 = volume_T3_m3;

//             }

//             item.volume_T3_Kg = volume_T3_Kg;
//             item.volume_T3_m3 = volume_T3_m3;
//             item.volume_T3_mm = volume_T3_mm;

//         //   }
//         // )

//         return {
//           ...item
//         }

//       });

//       const result = await Promise.all(promises);

//       resolve({ 

//         start_timeDisplay: format(timestamp.startTimestamp*1000, 'yyyy-MM-dd'), 
//         end_timeDisplay: format(timestamp.endTimestamp*1000, 'yyyy-MM-dd'), 
//         total: result.length, 
//         result: result 
//         // message: 'Hello, Smart Automation Thailand!',

//       });

//     }catch(error){

//       reject(error);
//     }
    
//   })

//   try {
//     const result = await Promise.race([reportmixDataListLogic, timeoutPromise]);
    
//     return c.json(result);

//   } catch (error) {
//     if (error instanceof Error && error.message === "Request timed out") {
//       // ส่ง status 402 หรือตามที่ต้องการกลับไป
//       return c.json({ message: "Request timed out" }, 402);
//     } else {
//       // จัดการกับ error อื่นๆ
//       console.error("An unexpected error occurred:", error);
//       return c.json({ message: "Internal Server Error" }, 500);
//     }
//   }
// }

// // Report HCI Consumed
// export const reporthciconsumed = async (c) => {

//   const timeoutPromise = new Promise((_, reject) => {
//     setTimeout(() => reject(new Error("Request timed out")), timeout);
//   });

//   const reportconsumedDataListLogic = new Promise(async (resolve, reject) => {

//     const timestamp = await convertTotimestamp(c.req.query()); // แปลง timestamp

//     const unit = c.req.query('unit') || 'kg';
//     const aggregation = c.req.query('aggregation') || 'perday';

//     const dbTableConsumed = 'acidconsumed';
//     const dbTablerecievedSD = 'acidrecievedSD';
//     const dbTableRecieved = 'acidrecieved';
//     const dbTableTotal = 'acidconsumedtotal';
//     const dbTableStore = 'acidstore';

//     try {
//       // ใส่ logic การทำงานของคุณตรงนี้
//       // เช่น การเรียกดูข้อมูลจากฐานข้อมูล
//       const sqlServerEpoch = "FORMAT(DATEADD(SECOND, [start_time], '1970-01-01'), 'yyyy-MM-dd')";

//       var tableRecievedT1 = "volume_T1_Kg";
//       var tableRecievedT2 = "volume_T2_Kg";

//       // Liter
//       if(unit == 'Liter'){

//         tableRecievedT1 = "volume_T1_Kg";
//         tableRecievedT2 = "volume_T2_Kg";

//       }else if(unit == 'kg'){

//         tableRecievedT1 = "volume_T1_Kg";
//         tableRecievedT2 = "volume_T2_Kg";

//       }else if(unit == 'm3'){

//         tableRecievedT1 = "volume_T1_m3";
//         tableRecievedT2 = "volume_T2_m3";

//       }

//       const dbdata = await db(dbTableConsumed)
//       .select(
//           // 1. Extract the date
//           db.raw(`CAST(${sqlServerEpoch} AS DATE) as date_time`),
//           // 2. Select plant column
//           db.raw(`CAST(plant AS VARCHAR(MAX)) as plant`),
//           // 3. Calculate sum
//           db.raw(`SUM(volume) as volume`)
//       )
//       .where('start_time', '>=', timestamp.startTimestamp)
//       .andWhere('start_time', '<', timestamp.endTimestamp)
//       // แก้ไขตรงนี้: เพิ่ม 'plant' เข้าไปใน groupBy
//       .groupByRaw(`CAST(${sqlServerEpoch} AS DATE), CAST(plant AS VARCHAR(MAX))`)
//       .orderBy('date_time', 'asc');

//       // console.log("startTimestamp -->",timestamp.startTimestamp);
//       // console.log("endTimestamp -->",timestamp.endTimestamp);
//       // console.log("dbdata -->",dbdata);

//       // 1. กำหนดรายชื่อ Plant ทั้งหมดที่มี (เพื่อให้ทุก Object มี Key ครบ)
//       // const plants = ['pd1', 'pd2', 'pd3'];

//       const result_dbdata = Object.values(dbdata.reduce((acc, item) => {
//           const dateKey = new Date(item.date_time).toISOString();

//           // 2. ถ้ายังไม่เคยเจอวันที่นี้ ให้สร้าง Object ใหม่พร้อม Default เป็น 0 ทุกตัว
//           if (!acc[dateKey]) {
//               acc[dateKey] = { 
//                   date_time: item.date_time,
//                   pd1: 0,
//                   pd2: 0,
//                   pd3: 0
//               };
//           }

//           // 3. ใส่ค่า volume ลงใน plant ที่ตรงกัน (แปลงชื่อเป็นตัวเล็กเพื่อให้ตรงกับ key)
//           const plantKey = item.plant.toLowerCase();
          
//           // ตรวจสอบเผื่อมี plant อื่นที่ไม่ได้อยู่ใน list ด้านบน
//           acc[dateKey][plantKey] = item.volume || 0;

//           return acc;
//       }, {}));

//       // console.log("result_dbdata -->",result_dbdata);

                   
//       const promises = result_dbdata.map(async (item) => {

//         let System_Data_Fill = 0; 
//         let System_Data_Density = 1;

//         const sqlServerEpoch_total = "FORMAT(DATEADD(SECOND, [date_time], '1970-01-01'), 'yyyy-MM-dd')";

//         // 1. แปลง item.date_time เป็น Date Object (ไม่ต้อง * 1000 ถ้าค่าเดิมเป็น Date/String อยู่แล้ว)
//         // แต่ถ้า item.date_time เป็น seconds ให้ใช้ new Date(item.date_time * 1000) เหมือนเดิม
//         const baseDate = new Date(item.date_time); 

//         // 2. หาวันพรุ่งนี้ (วันถัดไป 1 วัน) เริ่มต้นที่ 00:00:00
//         const nextStart = new Date(baseDate);
//         nextStart.setDate(baseDate.getDate() + 1); // บวก 1 วัน
//         nextStart.setHours(0, 0, 0, 0);

//         // 3. หาวันสิ้นสุด (คือจุดเริ่มต้นของวันถัดไปอีกวัน)
//         const nextEnd = new Date(nextStart);
//         nextEnd.setDate(nextStart.getDate() + 1);
//         nextEnd.setHours(0, 0, 0, 0);

//         // แปลงเป็น Seconds (Unix Timestamp)
//         // .getTime() จะให้ค่าที่เป็น UTC Standard อยู่แล้ว (ไม่ต้องห่วงเรื่อง Timezone ในขั้นตอนนี้)
//         const nextStartSec = Math.floor(nextStart.getTime() / 1000);
//         const nextEndSec = Math.floor(nextEnd.getTime() / 1000);

//         // 1. หาวันเมื่อวาน (ถอยหลังไป 1 วัน) เริ่มต้นที่ 00:00:00
//         const prevStart = new Date(baseDate);
//         prevStart.setDate(baseDate.getDate() - 1); // เปลี่ยนจาก +1 เป็น -1
//         prevStart.setHours(0, 0, 0, 0);

//         // 2. หาวันสิ้นสุดของเมื่อวาน (ก็คือจุดเริ่มต้นของวัน baseDate ที่ 00:00:00)
//         const prevEnd = new Date(baseDate);
//         prevEnd.setHours(0, 0, 0, 0);

//         // แปลงเป็น Seconds (Unix Timestamp)
//         const prevStartSec = Math.floor(prevStart.getTime() / 1000);
//         const prevEndSec = Math.floor(prevEnd.getTime() / 1000);

//         // console.log("beforeStart -->",item.date_time);
//         // console.log("beforeEnd -->",item.date_time);

//         // console.log("Query Start:", nextStartSec, nextStart);
//         // console.log("Query End:  ", nextEndSec, nextEnd);

//         const sqlServerEpoch_Store = "FORMAT(DATEADD(SECOND, [start_time], '1970-01-01'), 'yyyy-MM-dd')";

//         const dbdataStore = await db(dbTableStore)
//         .select(
//             // 1. Extract the date for grouping and aliasing it as 'date'
//             db.raw(`CAST(${sqlServerEpoch_Store} AS DATE) as date_time`),
//             // 2. Calculate the total volume for tank 1 for the day
//             db.raw(`SUM(volume_Kg) as volume_Kg`),
//             // 3. Calculate the total volume for tank 2 for the day
//             db.raw(`SUM(volume_m3) as volume_m3`),
//         )
//         .whereRaw(`CAST(${sqlServerEpoch_Store} AS DATE) = ?`, [item.date_time])
//         .groupBy(db.raw(`CAST(${sqlServerEpoch_Store} AS DATE)`)) 
//         .orderBy('date_time', 'asc');


//         const dbtableTotal = await db(dbTableTotal)
//         .select(
//           // 1. Extract the date for grouping and aliasing it as 'date'
//           db.raw(`CAST(${sqlServerEpoch_total} AS DATE) as date_time`),
//           // 2. Calculate the total volume for tank 1 for the day
//           db.raw(`SUM(volumepd1_total) as volumepd1_total`),
//           db.raw(`SUM(volumepd2_total) as volumepd2_total`),
//           db.raw(`SUM(volumepd3_total) as volumepd3_total`),
          
//           db.raw(`SUM(volume_T3_Kg) as volume_T3_Kg`),
//           db.raw(`SUM(volume_T3_m3) as volume_T3_m3`),
//           db.raw(`SUM(volume_T3_mm) as volume_T3_mm`),

//           db.raw(`SUM(volume_T4_Kg) as volume_T4_Kg`),
//           db.raw(`SUM(volume_T4_m3) as volume_T4_m3`),
//           db.raw(`SUM(volume_T4_mm) as volume_T4_mm`)

//         )
//         .where('date_time', '>=', nextStartSec)
//         .andWhere('date_time', '<', nextEndSec) 
//         // -------------------------
//         .groupBy(db.raw(`CAST(${sqlServerEpoch_total} AS DATE)`)) 
//         .orderBy('date_time', 'asc');

//         // --- เพิ่มเงื่อนไขตรงนี้ ---
//         if (dbtableTotal.length === 0) {
//             return null; // หรือ return undefined เพื่อบอกว่าไม่เอา item นี้
//         }

        
//         // console.log("item.date_time -->",item.date_time);
//         // const sqlServerEpoch_SD = "FORMAT(DATEADD(SECOND, [date_time], '1970-01-01'), 'yyyy-MM-dd')";
        
//         // await db(dbTablerecievedSD)

//         //   .select("*", db.raw(`CAST(${sqlServerEpoch_SD} AS DATE) as created_date`))
//         //   // Use .whereRaw and repeat the logic, passing the value as a binding (?)
//         //   .whereRaw(`CAST(${sqlServerEpoch_SD} AS DATE) = ?`, [item.date_time])

//         //   .then(async (rows) => {
            
//         //     if(rows.length > 0){

//         //       System_Data_Fill = rows[0].Fill_Kg || 0;
//         //       System_Data_Density = rows[0].Density || 1;

//         //     }

//         //     item.System_Data_Fill = System_Data_Fill;
//         //     item.System_Data_Density = System_Data_Density;

//             let volumepd1_recieved = 0;
//             let volumepd2_recieved = 0;    
            
//             let volumeStore_total = 0;

//             let pd1_use_total = 0;
//             let pd2_use_total = 0;
//             let pd3_use_total = 0;
//             let use_total = 0;
            
//             item.date_time = format(item.date_time, 'yyyy-MM-dd');
            
//             if (aggregation == 'perday') {
              
//               item.start_time = "--:--";
//               item.end_time = "--:--";
              
//             }else{
              
//               item.start_time = format(item.start_time*1000, 'HH:mm');
//               item.end_time = format(item.end_time*1000, 'HH:mm');
              
//             }
            
//             if(unit == 'kg'){
              
//               // volumepd1_recieved = Number(dbdataRecieved[0]?.tank1)*System_Data_Density || 0;
//               // volumepd2_recieved = Number(dbdataRecieved[0]?.tank2)*System_Data_Density || 0; 
//               // volumepd1_recieved = Number(dbdataRecieved[0]?.tank1) || 0;
//               // volumepd2_recieved = Number(dbdataRecieved[0]?.tank2) || 0; 
              
//               // volumeRecieved_total = volumepd1_recieved + volumepd2_recieved; 
//               volumeStore_total = Number(dbdataStore[0]?.volume_Kg || 0); 

//               // pd1_use_total = Number(item.pd1)*System_Data_Density || 0;
//               // pd2_use_total = Number(item.pd2)*System_Data_Density || 0;
//               // pd3_use_total = Number(item.pd3)*System_Data_Density || 0;
//               pd1_use_total = Number(item.pd1) || 0;
//               pd2_use_total = Number(item.pd2) || 0;
//               pd3_use_total = Number(item.pd3) || 0;
              
//               use_total = pd1_use_total + pd2_use_total + pd3_use_total;

//               // item.remaining_tank3 = Number(dbtableTotal[0]?.volume_T3_Kg*System_Data_Density) || 0;
//               // item.remaining_tank4 = Number(dbtableTotal[0]?.volume_T4_Kg*System_Data_Density) || 0;
//               item.remaining_tank3 = Number(dbtableTotal[0]?.volume_T3_Kg) || 0;
//               item.remaining_tank4 = Number(dbtableTotal[0]?.volume_T4_Kg) || 0;

//               item.total_use = use_total;

//               item.error = volumeStore_total - use_total;
              
//             }else if(unit == 'm3'){
              
//               // volumepd1_recieved = Number(dbdataRecieved[0]?.tank1) || 0;
//               // volumepd2_recieved = Number(dbdataRecieved[0]?.tank2) || 0; 
              
//               // volumeRecieved_total = volumepd1_recieved + volumepd2_recieved; 
//               volumeStore_total = Number(dbdataStore[0]?.volume_m3 || 0); 

//               pd1_use_total = Number(item.pd1 * 0.001) || 0;
//               pd2_use_total = Number(item.pd2 * 0.001) || 0;
//               pd3_use_total = Number(item.pd3 * 0.001) || 0;
              
//               use_total = pd1_use_total + pd2_use_total + pd3_use_total;

//               item.remaining_tank3 = Number(dbtableTotal[0]?.volume_T3_m3)+0.8 || 0;
//               item.remaining_tank4 = Number(dbtableTotal[0]?.volume_T4_m3)+0.8 || 0;

//               item.total_use = use_total;

//               item.error = volumeStore_total - use_total;

              
//             }else if (unit == 'Liter'){
              
//               // volumepd1_recieved = Number(dbdataRecieved[0]?.tank1) || 0;
//               // volumepd2_recieved = Number(dbdataRecieved[0]?.tank2) || 0; 
              
//               // volumeRecieved_total = volumepd1_recieved + volumepd2_recieved; 
//               volumeStore_total = Number(dbdataStore[0]?.volume_Kg || 0); 

//               pd1_use_total = Number(item.pd1) || 0;
//               pd2_use_total = Number(item.pd2) || 0;
//               pd3_use_total = Number(item.pd3) || 0;
              
//               use_total = pd1_use_total + pd2_use_total + pd3_use_total;

//               item.remaining_tank3 = Number(dbtableTotal[0]?.volume_T3_Kg) || 0;
//               item.remaining_tank4 = Number(dbtableTotal[0]?.volume_T4_Kg) || 0;

//               item.total_use = use_total;

//               item.error = volumeStore_total - use_total;
              
//             }

//             item.pd1_total = pd1_use_total;
//             item.pd2_total = pd2_use_total;
//             item.pd3_total = pd3_use_total;

//             item.pd1_value = pd1_use_total * 0.1;
//             item.pd2_value = pd2_use_total * 0.1;
//             item.pd3_value = pd3_use_total * 0.1;

//             item.pd1_ro = pd1_use_total * 0.9;
//             item.pd2_ro = pd2_use_total * 0.9;
//             item.pd3_ro = pd3_use_total * 0.9;

//         //   }
//         // )

//         return {
//           ...item
//         }

//       });

//       const result = await Promise.all(promises);

//       // กรองเอาเฉพาะข้อมูลที่ไม่เป็น null (ตัวที่ dbtableTotal.length > 0)
//       const finalData = result.filter(item => item !== null);

//       resolve({ 

//         start_timeDisplay: format(timestamp.startTimestamp*1000, 'yyyy-MM-dd'),
//         end_timeDisplay: format(timestamp.endTimestamp*1000, 'yyyy-MM-dd'),
//         total: finalData.length,
//         result: finalData 
//         // message: 'Hello, Smart Automation Thailand!',
//       });

//     } catch (error) {
//       reject(error);
//     }
//   });

//   try {
//     const result = await Promise.race([reportconsumedDataListLogic, timeoutPromise]);
    
//     return c.json(result);

//   } catch (error) {
//     if (error instanceof Error && error.message === "Request timed out") {
//       // ส่ง status 402 หรือตามที่ต้องการกลับไป
//       return c.json({ message: "Request timed out" }, 402);
//     } else {
//       // จัดการกับ error อื่นๆ
//       console.error("An unexpected error occurred:", error);
//       return c.json({ message: "Internal Server Error" }, 500);
//     }
//   }
// }