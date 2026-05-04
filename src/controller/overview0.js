import knexfile from '@/lib/configKnex.ts';
import { convertTotimestamp } from '@/controller/funtion.js';

import knex from 'knex';
import { format } from 'date-fns';
import { select } from '@heroui/react';

const db = knex(knexfile.development);

const timeout = 5000; // กำหนดค่า timeout (หน่วยมิลลิวินาที)

export const CardOverview = async (c) => {

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out")), timeout);
    });

    const cardoverviewDataListLogic = new Promise(async (resolve, reject) => {

        try {

            const timestamp = await convertTotimestamp(c.req.query()); // แปลง timestamp

            // console.log(timestamp);
            
            const data_NaOH_Fill_day = await db('alkalirecieved')
            .select('*')
            .where('start_time', '>=', timestamp.startTimestamp)
            .where('start_time', '<', timestamp.endTimestamp)
            .orderBy('start_time', 'asc');


            const data_HCI_Fill_day = await db('acidrecieved')
            .select('*')
            .where('start_time', '>=', timestamp.startTimestamp)
            .where('start_time', '<', timestamp.endTimestamp)
            .orderBy('start_time', 'asc');

            const data_NaOH_Transfer_day = await db('alkaliconsumed')
            .sum('volume as total_volume') // รวม volume ของกลุ่มนั้นๆ
            .where('start_time', '>=', timestamp.startTimestamp)
            .where('start_time', '<', timestamp.endTimestamp)
            .groupBy('start_time') // จัดกลุ่มตามเวลา
            .first(); // ถ้าต้องการยอดรวมทั้งหมดก้อนเดียว ใช้ .first()

            const data_HCI_Transfer_day = await db('acidconsumed')
            .sum('volume as total_volume') // รวม volume ของกลุ่มนั้นๆ
            .where('start_time', '>=', timestamp.startTimestamp)
            .where('start_time', '<', timestamp.endTimestamp)
            .groupBy('start_time') // จัดกลุ่มตามเวลา
            .first(); // ถ้าต้องการยอดรวมทั้งหมดก้อนเดียว ใช้ .first()

            //======================================================================= result NaOH_Fill_day =======================================================================

            // 1. สร้าง Array ของ Promises จากการ Map ข้อมูล
            const naoh_promises = data_NaOH_Fill_day.map(async (item) => {

                // กำหนดค่าเริ่มต้นสำหรับแต่ละรอบ
                let System_Data_Fill = 0;
                let System_Data_Density = 1;

                // แปลงเวลาให้ถูกต้อง (ใช้ new Date โดยตรง)
                const baseDate = new Date(Date(item.start_time));
                const startOfDay = new Date(baseDate).setHours(0, 0, 0, 0);
                const endOfDay = new Date(baseDate).setHours(23, 59, 59, 999);

                const startTimeSec = Math.floor(startOfDay / 1000);
                const endTimeSec = Math.floor(endOfDay / 1000);

                // console.log("Start Time (sec):", startTimeSec);
                // console.log("End Time (sec):", endTimeSec);

                // Query ข้อมูลจากตาราง SD
                const rows = await db('alkalirecievedSD')
                    .select("Fill_Kg", "Density")
                    .where('date_time', '>=', startTimeSec)
                    .where('date_time', '<=', endTimeSec)
                    .orderBy('date_time', 'desc')
                    .first(); // เอาแถวล่าสุดแถวเดียว

                if (rows) {
                    System_Data_Fill = rows.Fill_Kg || 0;
                    System_Data_Density = rows.Density || 1;

                    item.volume_T1_Kg = (item.volume_T1_Kg || 0) * System_Data_Density;
                    item.volume_T1_m3 = item.volume_T1_m3 || 0;
                    item.volume_T2_Kg = (item.volume_T2_Kg || 0) * System_Data_Density;
                    item.volume_T2_m3 = item.volume_T2_m3 || 0;
                    item.before_volume_T1_Kg = (item.before_volume_T1_Kg || 0) * System_Data_Density;
                    item.before_volume_T1_m3 = item.before_volume_T1_m3 || 0;
                    item.before_volume_T2_Kg = (item.before_volume_T2_Kg || 0) * System_Data_Density;
                    item.before_volume_T2_m3 = item.before_volume_T2_m3 || 0;
                }

                // ส่งค่ากลับไปในแต่ละ item เพื่อนำไปบวกเพิ่มภายหลัง
                return {
                    ...item,
                    System_Data_Fill,
                    System_Data_Density
                };
            });

            // 2. รอให้ Query ของทุก Item ทำงานเสร็จพร้อมกัน
            const final_NaOH_items = await Promise.all(naoh_promises);

            // 3. ใช้ .reduce() เพื่อรวมค่า Total ทั้งหมด (วิธีนี้ปลอดภัยและแม่นยำกว่า)
            const NaOH_Total = final_NaOH_items.reduce((acc, curr) => {
                return {
                    total_T1_Kg: acc.total_T1_Kg + (curr.volume_T1_Kg || 0),
                    total_T1_m3: acc.total_T1_m3 + (curr.volume_T1_m3 || 0),
                    total_T2_Kg: acc.total_T2_Kg + (curr.volume_T2_Kg || 0),
                    total_T2_m3: acc.total_T2_m3 + (curr.volume_T2_m3 || 0),
                    before_T1_Kg: acc.before_T1_Kg + (curr.before_volume_T1_Kg || 0),
                    before_T1_m3: acc.before_T1_m3 + (curr.before_volume_T1_m3 || 0),
                    before_T2_Kg: acc.before_T2_Kg + (curr.before_volume_T2_Kg || 0),
                    before_T2_m3: acc.before_T2_m3 + (curr.before_volume_T2_m3 || 0)
                };
            }, {
                total_T1_Kg: 0, total_T1_m3: 0, total_T2_Kg: 0, total_T2_m3: 0,
                before_T1_Kg: 0, before_T1_m3: 0, before_T2_Kg: 0, before_T2_m3: 0
            });




            //======================================================================= result NaOH_Transfer_day =======================================================================
            const NaOH_Transfer_day = data_NaOH_Transfer_day ? data_NaOH_Transfer_day.total_volume || 0 : 0;

            //======================================================================= result HCI_Fill_day =======================================================================
            const hci_promises = data_HCI_Fill_day.map(async (item) => {

                // แปลงเวลาให้ถูกต้อง (ใช้ new Date โดยตรง)
                const baseDate = new Date(Date(item.start_time));
                const startOfDay = new Date(baseDate).setHours(0, 0, 0, 0);
                const endOfDay = new Date(baseDate).setHours(23, 59, 59, 999);

                const startTimeSec = Math.floor(startOfDay / 1000);
                const endTimeSec = Math.floor(endOfDay / 1000);

                // Query ข้อมูลจากตาราง SD
                const rows = await db('acidrecievedSD')
                    .select("Fill_Kg", "Density")
                    .where('date_time', '>=', startTimeSec)
                    .where('date_time', '<=', endTimeSec)
                    .orderBy('date_time', 'desc')
                    .first(); // เอาแถวล่าสุดแถวเดียว

                if (rows) {
                    item.volume_T1_Kg = (item.volume_T1_Kg || 0) * rows.Density;
                    item.volume_T1_m3 = item.volume_T1_m3 || 0;
                    item.volume_T2_Kg = (item.volume_T2_Kg || 0) * rows.Density;
                    item.volume_T2_m3 = item.volume_T2_m3 || 0;
                    item.before_volume_T1_Kg = (item.before_volume_T1_Kg || 0) * rows.Density;
                    item.before_volume_T1_m3 = item.before_volume_T1_m3 || 0;
                    item.before_volume_T2_Kg = (item.before_volume_T2_Kg || 0) * rows.Density;
                    item.before_volume_T2_m3 = item.before_volume_T2_m3 || 0;
                }

                return item;
            });

            const final_HCI_items = await Promise.all(hci_promises);

            const HCI_Total = final_HCI_items.reduce((acc, curr) => {
                return {
                    total_T1_Kg: acc.total_T1_Kg + (curr.volume_T1_Kg || 0),
                    total_T1_m3: acc.total_T1_m3 + (curr.volume_T1_m3 || 0),
                    total_T2_Kg: acc.total_T2_Kg + (curr.volume_T2_Kg || 0),
                    total_T2_m3: acc.total_T2_m3 + (curr.volume_T2_m3 || 0),    
                    before_T1_Kg: acc.before_T1_Kg + (curr.before_volume_T1_Kg || 0),
                    before_T1_m3: acc.before_T1_m3 + (curr.before_volume_T1_m3 || 0),
                    before_T2_Kg: acc.before_T2_Kg + (curr.before_volume_T2_Kg || 0),
                    before_T2_m3: acc.before_T2_m3 + (curr.before_volume_T2_m3 || 0)
                };
            }, {
                total_T1_Kg: 0, total_T1_m3: 0, total_T2_Kg: 0, total_T2_m3: 0,
                before_T1_Kg: 0, before_T1_m3: 0, before_T2_Kg: 0, before_T2_m3: 0
            });

             //======================================================================= result NaOH_Transfer_day =======================================================================
            const HCI_Transfer_day = data_HCI_Transfer_day ? data_HCI_Transfer_day.total_volume || 0 : 0;

            resolve({
                "msg": "success",
                "data": {
                    "NaOH_Fill_day": NaOH_Total,
                    "NaOH_Transfer_day": NaOH_Transfer_day,
                    "HCI_Fill_day": HCI_Total,
                    "HCI_Transfer_day": HCI_Transfer_day
                }
            });

        } catch (error) {
            reject(error);
        }

    }); 
    
    try {

        const result = await Promise.race([cardoverviewDataListLogic, timeoutPromise]);

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

export const chartFillOverview = async (c) => {

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out")), timeout);
    });

    const chartFillDataListLogic = new Promise(async (resolve, reject) => {

        try {
            
            const timestamp = await convertTotimestamp(c.req.query()); // แปลง timestamp  
            
            const data_NaOH_ = await db('ScadaDataLogAlkaline')
            .select('*')
            .where('UnixTimestamp', '>=', timestamp.startTimestamp)
            .where('UnixTimestamp', '<', timestamp.endTimestamp)
            .orderBy('UnixTimestamp', 'asc');


            const data_HCI_ = await db('ScadaDataLogAcid')
            .select('*')
            .where('UnixTimestamp', '>=', timestamp.startTimestamp)
            .where('UnixTimestamp', '<', timestamp.endTimestamp)
            .orderBy('UnixTimestamp', 'asc');

            const aggregation  =  c.req.query('period') || 'today'; // รับค่าการจัดกลุ่มจาก query parameter

            //======================================================================= result NaOH_Fill_day =======================================================================

            // 1. สร้าง Array ของ Promises จากการ Map ข้อมูล
            const naoh_promises = data_NaOH_.map(async (item) => {

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

                if (rows) {
                    
                    const System_Data_Fill = item.Fill_Kg_N || 0;
                    const System_Data_Density = item.Density_N || 1;

                    //=== Total NaOH Fill today (แปลงเป็น kg โดยคูณด้วยความหนาแน่น)
                    item.data_fill = System_Data_Fill;
                }

                // ส่งค่ากลับไปในแต่ละ item เพื่อนำไปบวกเพิ่มภายหลัง
                return {
                    ...item
                };
            });

            // 2. รอให้ Query ของทุก Item ทำงานเสร็จพร้อมกัน
            const final_NaOH_items = await Promise.all(naoh_promises);


            // 3. ใช้ .reduce() เพื่อรวมค่า Total ทั้งหมด (วิธีนี้ปลอดภัยและแม่นยำกว่า)
            const NaOH_Total = final_NaOH_items.reduce((acc, curr) => {
                // 1. แปลง start_time ให้เป็น Date Object ที่ถูกต้อง
                // ถ้า start_time เป็น Unix Timestamp (วินาที) อย่าลืมคูณ 1000
                const dateObj = new Date(curr.UnixTimestamp * 1000);
                // console.log("Original start_time:", curr.start_time, "Converted Date Object:", dateObj);
                let key;

                // 2. กำหนด Key ตามเงื่อนไข
                if (aggregation === 'thismonth') {
                    key = format(dateObj, 'yyyy-MM-dd'); // ผลรวมรายวัน
                } else if (aggregation === 'thisyear') {
                    key = format(dateObj, 'yyyy-MM');    // ผลรวมรายเดือน
                }else{ // aggregation === 'today'
                    
                    key = format(dateObj, 'HH:mm'); 

                }

                // 3. ถ้าไม่มี key (กรณีข้อมูลผิดพลาด) ให้ข้ามไป
                if (!key) return acc;

                // 4. สร้างโครงสร้าง Object ถ้ายังไม่มี Key นี้ใน acc
                if (!acc[key]) {
                    acc[key] = { 
                        date: key, // เก็บ key ไว้ข้างในด้วยเพื่อให้เอาไปใช้ง่ายๆ
                        total_T1_Kg: 0, 
                        total_T1_m3: 0, 
                        total_T2_Kg: 0, 
                        total_T2_m3: 0 
                    };
                }

                // 5. รวมค่าเข้า Key นั้นๆ
                acc[key].total_T1_Kg += (Number(curr.volume_T1_Kg) || 0);
                acc[key].total_T1_m3 += (Number(curr.volume_T1_m3) || 0);
                acc[key].total_T2_Kg += (Number(curr.volume_T2_Kg) || 0);
                acc[key].total_T2_m3 += (Number(curr.volume_T2_m3) || 0);

                return acc;

            }, {}); // เริ่มต้นด้วย {} เสมอสำหรับทุก aggregation

            // console.log("NaOH_Total >>:",NaOH_Total);

            //======================================================================= result HCI_Fill_day =======================================================================
            const hci_promises = data_HCI_Fill_day.map(async (item) => {

                // กำหนดค่าเริ่มต้นสำหรับแต่ละรอบ
                let System_Data_Fill = 0;
                let System_Data_Density = 1;

                // แปลงเวลาให้ถูกต้อง (ใช้ new Date โดยตรง)
                const baseDate = new Date(Date(item.start_time));
                const startOfDay = new Date(baseDate).setHours(0, 0, 0, 0);
                const endOfDay = new Date(baseDate).setHours(23, 59, 59, 999);

                const startTimeSec = Math.floor(startOfDay / 1000);
                const endTimeSec = Math.floor(endOfDay / 1000);

                // Query ข้อมูลจากตาราง SD
                const rows = await db('acidrecievedSD')
                    .select("Fill_Kg", "Density")
                    .where('date_time', '>=', startTimeSec)
                    .where('date_time', '<=', endTimeSec)
                    .orderBy('date_time', 'desc')
                    .first(); // เอาแถวล่าสุดแถวเดียว

                if (rows) {

                    System_Data_Fill = rows.Fill_Kg || 0;
                    System_Data_Density = rows.Density || 1;

                    // item.volume_T1_Kg = (item.volume_T1_Kg || 0) * System_Data_Density;
                    item.volume_T1_Kg = (item.volume_T1_Kg || 0) * System_Data_Density;

                    item.volume_T1_m3 = item.volume_T1_m3 || 0;
                    // item.volume_T2_Kg = (item.volume_T2_Kg || 0) * System_Data_Density;
                    item.volume_T2_Kg = (item.volume_T2_Kg || 0) * System_Data_Density;

                    item.volume_T2_m3 = item.volume_T2_m3 || 0;
                    // item.before_volume_T1_Kg = (item.before_volume_T1_Kg || 0) * System_Data_Density;
                    // item.before_volume_T1_m3 = item.before_volume_T1_m3 || 0;
                    // item.before_volume_T2_Kg = (item.before_volume_T2_Kg || 0) * System_Data_Density;
                    // item.before_volume_T2_m3 = item.before_volume_T2_m3 || 0;
                }

                return item;
            });

            const final_HCI_items = await Promise.all(hci_promises);

            const HCI_Total = final_HCI_items.reduce((acc, curr) => {
                // 1. แปลง start_time ให้เป็น Date Object ที่ถูกต้อง
                // ถ้า start_time เป็น Unix Timestamp (วินาที) อย่าลืมคูณ 1000
                const dateObj = new Date(curr.start_time*1000); 
                // console.log("Original start_time:", curr.start_time, "Converted Date Object:", dateObj);
                let key;

                // 2. กำหนด Key ตามเงื่อนไข
                if (aggregation === 'thismonth') {
                    key = format(dateObj, 'yyyy-MM-dd'); // ผลรวมรายวัน
                } else if (aggregation === 'thisyear') {
                    key = format(dateObj, 'yyyy-MM');    // ผลรวมรายเดือน
                }else{ // aggregation === 'today'
                    
                    key = format(dateObj, 'HH:mm'); 

                }

                // 3. ถ้าไม่มี key (กรณีข้อมูลผิดพลาด) ให้ข้ามไป
                if (!key) return acc;

                // 4. สร้างโครงสร้าง Object ถ้ายังไม่มี Key นี้ใน acc
                if (!acc[key]) {
                    acc[key] = { 
                        date: key, // เก็บ key ไว้ข้างในด้วยเพื่อให้เอาไปใช้ง่ายๆ
                        total_T1_Kg: 0, 
                        total_T1_m3: 0, 
                        total_T2_Kg: 0, 
                        total_T2_m3: 0 
                    };
                }

                // 5. รวมค่าเข้า Key นั้นๆ
                acc[key].total_T1_Kg += (Number(curr.volume_T1_Kg) || 0);
                acc[key].total_T1_m3 += (Number(curr.volume_T1_m3) || 0);
                acc[key].total_T2_Kg += (Number(curr.volume_T2_Kg) || 0);
                acc[key].total_T2_m3 += (Number(curr.volume_T2_m3) || 0);

                return acc;

            }, {}); // เริ่มต้นด้วย {} เสมอสำหรับทุก aggregation

            resolve({
                "msg": "success",
                "data": {
                    "NaOH_Fill": NaOH_Total,
                    "HCI_Fill": HCI_Total,
                    
                }
            })

        } catch (error) {
            reject(error);
        }

    });

    // try {
    
    const result = await Promise.race([chartFillDataListLogic, timeoutPromise]);

    return c.json(result);
    
    // } catch (error) {
    //     reject(error.message);
    // }
};

export const chartTransferOverview = async (c) => {

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out")), timeout);
    });

    const chartoverviewDataListLogic = new Promise(async (resolve, reject) => {

        try {

            const timestamp = await convertTotimestamp(c.req.query()); // แปลง timestamp

            const aggregation  =  c.req.query('period') || 'today'; // รับค่าการจัดกลุ่มจาก query parameter
            
            const data_NaOH_Transfer_day = await db('alkaliconsumed')
            .select('plant', 'start_time', 'volume' )
            .where('start_time', '>=', timestamp.startTimestamp)
            .where('start_time', '<', timestamp.endTimestamp)
            .orderBy('start_time', 'asc');

            const data_HCI_Transfer_day = await db('acidconsumed')
            .select('plant', 'start_time', 'volume' )
            .where('start_time', '>=', timestamp.startTimestamp)
            .where('start_time', '<', timestamp.endTimestamp)
            .orderBy('start_time', 'asc');


            //======================================================================= result NaOH_Transfer_day =======================================================================

            // 1. สร้าง Array ของ Promises จากการ Map ข้อมูล
            const naoh_promises = data_NaOH_Transfer_day.map(async (item) => {

                // กำหนดค่าเริ่มต้นสำหรับแต่ละรอบ
                let System_Data_Fill = 0;
                let System_Data_Density = 1;

                // แปลงเวลาให้ถูกต้อง (ใช้ new Date โดยตรง)
                const baseDate = new Date(Date(item.start_time));
                const startOfDay = new Date(baseDate).setHours(0, 0, 0, 0);
                const endOfDay = new Date(baseDate).setHours(23, 59, 59, 999);

                const startTimeSec = Math.floor(startOfDay / 1000);
                const endTimeSec = Math.floor(endOfDay / 1000);

                // console.log("Start Time (sec):", startTimeSec);
                // console.log("End Time (sec):", endTimeSec);

                // Query ข้อมูลจากตาราง SD
                const rows = await db('alkalirecievedSD')
                    .select("Fill_Kg", "Density")
                    .where('date_time', '>=', startTimeSec)
                    .where('date_time', '<=', endTimeSec)
                    .orderBy('date_time', 'desc')
                    .first(); // เอาแถวล่าสุดแถวเดียว

                if (rows) {
                    System_Data_Fill = rows.Fill_Kg || 0;
                    System_Data_Density = rows.Density || 1;

                    // item.volume = (item.volume || 0) * System_Data_Density;
                    item.volume = (item.volume || 0) * 1;

                }

                // ส่งค่ากลับไปในแต่ละ item เพื่อนำไปบวกเพิ่มภายหลัง
                return {
                    ...item,
                    System_Data_Fill,
                    System_Data_Density
                };
            });

            // 2. รอให้ Query ของทุก Item ทำงานเสร็จพร้อมกัน
            const final_NaOH_items = await Promise.all(naoh_promises);

            // 3. ใช้ .reduce() เพื่อรวมค่า Total ทั้งหมด (วิธีนี้ปลอดภัยและแม่นยำกว่า)
            const NaOH_Total = final_NaOH_items.reduce((acc, curr) => {

                // console.log("Current item:", curr);

                // 1. แปลง start_time ให้เป็น Date Object ที่ถูกต้อง
                // ถ้า start_time เป็น Unix Timestamp (วินาที) อย่าลืมคูณ 1000
                const dateObj = new Date(curr.start_time*1000); 
                // console.log("Original start_time:", curr.start_time, "Converted Date Object:", dateObj);
                let key;

                // 2. กำหนด Key ตามเงื่อนไข
                if (aggregation === 'thismonth') {

                    key = format(dateObj, 'yyyy-MM-dd'); // ผลรวมรายวัน

                } else if (aggregation === 'thisyear') {

                    key = format(dateObj, 'yyyy-MM');    // ผลรวมรายเดือน

                }else{ // aggregation === 'today'

                    key = format(dateObj, 'HH:mm'); 

                }

                // 3. ถ้าไม่มี key (กรณีข้อมูลผิดพลาด) ให้ข้ามไป
                if (!key) return acc;

                // 4. สร้างโครงสร้าง Object ถ้ายังไม่มี Key นี้ใน acc
                if (!acc[key]) {
                    acc[key] = { 
                        date: key, // เก็บ key ไว้ข้างในด้วยเพื่อให้เอาไปใช้ง่ายๆ
                        volume: 0, 
                    };
                }

                // 5. รวมค่าเข้า Key นั้นๆ
                acc[key].volume += (Number(curr.volume) || 0);

                return acc;

            }, {}); // เริ่มต้นด้วย {} เสมอสำหรับทุก aggregation

            //======================================================================= result HCI_Transfer_day =======================================================================

            const hci_promises = data_HCI_Transfer_day.map(async (item) => {

                // กำหนดค่าเริ่มต้นสำหรับแต่ละรอบ
                let System_Data_Fill = 0;
                let System_Data_Density = 1;

                // แปลงเวลาให้ถูกต้อง (ใช้ new Date โดยตรง)
                const baseDate = new Date(Date(item.start_time));
                const startOfDay = new Date(baseDate).setHours(0, 0, 0, 0);
                const endOfDay = new Date(baseDate).setHours(23, 59, 59, 999);

                const startTimeSec = Math.floor(startOfDay / 1000);
                const endTimeSec = Math.floor(endOfDay / 1000);

                // Query ข้อมูลจากตาราง SD
                const rows = await db('acidrecievedSD')
                    .select("Fill_Kg", "Density")
                    .where('date_time', '>=', startTimeSec)
                    .where('date_time', '<=', endTimeSec)
                    .orderBy('date_time', 'desc')
                    .first(); // เอาแถวล่าสุดแถวเดียว

                if (rows) {
                    System_Data_Fill = rows.Fill_Kg || 0;
                    System_Data_Density = rows.Density || 1;

                    // item.volume = (item.volume || 0) * System_Data_Density;
                    item.volume = (item.volume || 0) * 1;

                }

                // ส่งค่ากลับไปในแต่ละ item เพื่อนำไปบวกเพิ่มภายหลัง
                return {
                    ...item,
                    System_Data_Fill,
                    System_Data_Density
                };
            });

            const final_HCI_items = await Promise.all(hci_promises);

            const HCI_Total = final_HCI_items.reduce((acc, curr) => {
                // 1. แปลง start_time ให้เป็น Date Object ที่ถูกต้อง
                // ถ้า start_time เป็น Unix Timestamp (วินาที) อย่าลืมคูณ 1000
                const dateObj = new Date(curr.start_time*1000); 
                // console.log("Original start_time:", curr.start_time, "Converted Date Object:", dateObj);
                let key;    


                // 2. กำหนด Key ตามเงื่อนไข
                if (aggregation === 'thismonth') {

                    key = format(dateObj, 'yyyy-MM-dd'); // ผลรวมรายวัน

                } else if (aggregation === 'thisyear') {

                    key = format(dateObj, 'yyyy-MM');    // ผลรวมรายเดือน

                }else{ // aggregation === 'today'
                    
                    key = format(dateObj, 'HH:mm'); 

                }

                // 3. ถ้าไม่มี key (กรณีข้อมูลผิดพลาด) ให้ข้ามไป
                if (!key) return acc;

                // 4. สร้างโครงสร้าง Object ถ้ายังไม่มี Key นี้ใน acc
                if (!acc[key]) {
                    acc[key] = {
                        date: key, // เก็บ key ไว้ข้างในด้วยเพื่อให้เอาไปใช้ง่ายๆ
                        volume: 0, 
                    };
                }

                // 5. รวมค่าเข้า Key นั้นๆ
                acc[key].volume += (Number(curr.volume) || 0);

                return acc;

            }, {}); // เริ่มต้นด้วย {} เสมอสำหรับทุก aggregation

            resolve({
                "msg": "success",
                "data": {
                    "NaOH_Transfer": NaOH_Total,
                    "HCI_Transfer": HCI_Total,
                }
            });

        } catch (error) {
            reject(error);
        }

    });

    // try {
    
        const result = await Promise.race([chartoverviewDataListLogic, timeoutPromise]);
    
        return c.json(result);
    
    // } catch (error) {
        // reject(error);
    // }
};
