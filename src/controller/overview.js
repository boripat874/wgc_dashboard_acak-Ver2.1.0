import knexfile from '@/lib/configKnex.ts';
import { convertTotimestamp } from '@/controller/funtion.js';

import knex from 'knex';
import { format } from 'date-fns';
import { select } from '@heroui/react';
import { NaOH } from '@/app/(home)/_components/overview-cards/icons';
import { resolve } from 'path';

const db = knex(knexfile.development);

const timeout = 5000; // กำหนดค่า timeout (หน่วยมิลลิวินาที)

export const CardOverview = async (c) => {

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out")), timeout);
    });

    const cardoverviewDataListLogic = new Promise(async (resolve, reject) => {

        try {

            const timestamp = await convertTotimestamp(c.req.query()); // แปลง timestamp

            const aggregation  =  c.req.query('period') || 'today'; // รับค่าการจัดกลุ่มจาก query parameter

            // console.log(timestamp);
            
            const data_NaOH_ = await db('ScadaDataLogAlkaline')
            .select('*')
            .where('UnixTimestamp', '>=', timestamp.startTimestamp)
            .where('UnixTimestamp', '<', timestamp.endTimestamp)
            .orderBy('UnixTimestamp', 'asc');

            // console.log("data_NaOH_ >>:", data_NaOH_);


            const data_HCI_ = await db('ScadaDataLogAcid')
            .select('*')
            .where('UnixTimestamp', '>=', timestamp.startTimestamp)
            .where('UnixTimestamp', '<', timestamp.endTimestamp)
            .orderBy('UnixTimestamp', 'asc');

            //======================================================================= result NaOH_ =======================================================================

            // 1. สร้าง Array ของ Promises จากการ Map ข้อมูล
            const naoh_promises = data_NaOH_.map(async (item) => {

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

                    const LT_PV_m3_LT_301N = item.LT_PV_m3_LT_301N || 0;
                    const data_remaining_tank_Mix = (LT_PV_m3_LT_301N + 0.3) * 1000;

                    const LT_PV_m3_LT_401N = item.LT_PV_m3_LT_401N || 0;
                    const data_remaining_tank_Store = (LT_PV_m3_LT_401N + 1.3) * 1000;

                    const data_tank1 = ((((item.LT_PV_m3_LT_101N || 0) + 0.8)));
                    const data_tank2 = ((((item.LT_PV_m3_LT_102N || 0) + 0.8)));
                    
                    const data_remaining_tank_fill = ((data_tank1 + data_tank2) * 1000);

                    const data_remaining_tank_fill_formula = data_remaining_tank_fill * System_Data_Density;
                    
                    const data_tank1_lastday = ((((rows.LT_PV_m3_LT_101N || 0) + 0.8)));
                    const data_tank2_lastday = ((((rows.LT_PV_m3_LT_102N || 0) + 0.8)));

                    const data_remaining_tank_fill_lastday = ((data_tank1_lastday + data_tank2_lastday) * 1000);

                    const data_remaining_tank_fill_lastday_formula = data_remaining_tank_fill_lastday * System_Data_Density_lastday;
                    
                    item.Fill_between_day =  (data_remaining_tank_fill_lastday_formula + System_Data_Fill_lastday) - data_remaining_tank_fill_formula;

                    //=== Total NaOH Fill today (แปลงเป็น kg โดยคูณด้วยความหนาแน่น)
                    item.data_fill = System_Data_Fill;

                    const LT_PV_m3_LT_301N_lastday = rows.LT_PV_m3_LT_301N || 0;
                    const data_remaining_tank_Mix_lastday = (LT_PV_m3_LT_301N_lastday + 0.3) * 1000;
                    
                    item.data_tank_Mix_between_day = (data_remaining_tank_Mix - data_remaining_tank_Mix_lastday);

                    const LT_PV_m3_LT_401N_lastday = rows.LT_PV_m3_LT_401N || 0;
                    const data_remaining_tank_Store_lastday = (LT_PV_m3_LT_401N_lastday + 1.3) * 1000;

                    item.data_tank_Store_between_day = (data_remaining_tank_Store - data_remaining_tank_Store_lastday);

                    //=== Total NaOH Store today
                    item.data_store = data_remaining_tank_Mix + data_remaining_tank_Store;

                    const Aka_Total_ALL_FT_401N = (item.Aka_Total_ALL_FT_401N || 0) - (rows.Aka_Total_ALL_FT_401N || 0);
                    const Aka_Total_ALL_FT_402N = (item.Aka_Total_ALL_FT_402N || 0) - (rows.Aka_Total_ALL_FT_402N || 0);
                    const Aka_Total_ALL_FT_403N = (item.Aka_Total_ALL_FT_403N || 0) - (rows.Aka_Total_ALL_FT_403N || 0);
                    const Aka_Total_ALL_FT_501N = (item.Aka_Total_ALL_FT_501N || 0) - (rows.Aka_Total_ALL_FT_501N || 0);

                    //===  Total NaOH Used today
                    item.data_used = (Aka_Total_ALL_FT_401N + Aka_Total_ALL_FT_402N + Aka_Total_ALL_FT_403N + Aka_Total_ALL_FT_501N);

                }else{
                    const System_Data_Fill = item.Fill_Kg_N || 0;
                    const System_Data_Density = item.Density_N || 1;

                    const LT_PV_m3_LT_301N = item.LT_PV_m3_LT_301N || 0;
                    const data_remaining_tank_Mix = (LT_PV_m3_LT_301N + 0.3) * 1000;

                    const LT_PV_m3_LT_401N = item.LT_PV_m3_LT_401N || 0;
                    const data_remaining_tank_Store = (LT_PV_m3_LT_401N + 1.3) * 1000;

                    item.data_fill = System_Data_Fill;
                    item.data_store = data_remaining_tank_Mix + data_remaining_tank_Store;
                    item.data_used = 0;
                }

                // ส่งค่ากลับไปในแต่ละ item เพื่อนำไปบวกเพิ่มภายหลัง
                return {
                    ...item,
                };
            });

            // console.log("naoh_promises >>:", await Promise.all(naoh_promises));

            // 2. รอให้ Query ของทุก Item ทำงานเสร็จพร้อมกัน
            const final_NaOH_items = await Promise.all(naoh_promises);

            // 3. ใช้ .reduce() เพื่อรวมค่า Total ทั้งหมด (วิธีนี้ปลอดภัยและแม่นยำกว่า)
            const NaOH_Total = final_NaOH_items.reduce((acc, curr) => {
                // console.log("curr >>:", curr);
                return {
                    total_fill: acc.total_fill + (curr.data_fill || 0),
                    total_store: acc.total_store + (curr.data_store || 0),
                    total_used: acc.total_used + (curr.data_used || 0),
                };
            }, {
                total_fill: 0, total_store: 0, total_used: 0
            });

            // console.log("NaOH_Total >>:", NaOH_Total);

            //======================================================================= result NaOH_ Used =======================================================================
            // const NaOH_Transfer_day = data_NaOH_Transfer_day ? data_NaOH_Transfer_day.total_volume || 0 : 0;

            //======================================================================= result HCI_Fill_day =======================================================================
            const hci_promises = data_HCI_.map(async (item) => {

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

                // Query ข้อมูลจากตาราง ScadaDataLogAcid วันก่อน
                const rows = await db('ScadaDataLogAcid')
                    .select("*")
                    .where('UnixTimestamp', '>=', prevStartSec)
                    .where('UnixTimestamp', '<=', prevEndSec)
                    .orderBy('UnixTimestamp', 'desc')
                    .first(); // เอาแถวล่าสุดแถวเดียว

                    
                if (rows) {

                    // console.log("before HCI item >>:", item);

                    const System_Data_Fill = item.Fill_Kg_H || 0;
                    const System_Data_Density = item.Density_H || 1;
                    const System_Data_Fill_lastday = rows.Fill_Kg_H || 0;
                    const System_Data_Density_lastday = rows.Density_H || 1;

                    const data_tank1 = ((((item.LT_PV_m3_LT_101H || 0) + 0.8)));
                    const data_tank2 = ((((item.LT_PV_m3_LT_102H || 0) + 0.8)));
                    
                    const data_remaining_tank_fill = ((data_tank1 + data_tank2) * 1000);

                    const data_remaining_tank_fill_formula = data_remaining_tank_fill * System_Data_Density;
                    
                    const data_tank1_lastday = ((((rows.LT_PV_m3_LT_101H || 0) + 0.8)));
                    const data_tank2_lastday = ((((rows.LT_PV_m3_LT_102H || 0) + 0.8)));

                    const data_remaining_tank_fill_lastday = ((data_tank1_lastday + data_tank2_lastday) * 1000);

                    const data_remaining_tank_fill_lastday_formula = data_remaining_tank_fill_lastday * System_Data_Density_lastday;
                    
                    item.Fill_between_day =  (data_remaining_tank_fill_lastday_formula + System_Data_Fill_lastday) - data_remaining_tank_fill_formula;

                    //=== Total NaOH Fill today (แปลงเป็น kg โดยคูณด้วยความหนาแน่น)
                    item.data_fill = System_Data_Fill;

                    const LT_PV_m3_LT_301H = item.LT_PV_m3_LT_301H || 0;
                    const data_remaining_tank_Mix = (LT_PV_m3_LT_301H + 0.8) * 1000;

                    const LT_PV_m3_LT_301H_lastday = rows.LT_PV_m3_LT_301H || 0;
                    const data_remaining_tank_Mix_lastday = (LT_PV_m3_LT_301H_lastday + 0.8) * 1000;
                    
                    item.data_tank_Mix_between_day = (data_remaining_tank_Mix - data_remaining_tank_Mix_lastday);

                    const LT_PV_m3_LT_401H = item.LT_PV_m3_LT_401H || 0;
                    const data_remaining_tank_Store = (LT_PV_m3_LT_401H + 1.3) * 1000;

                    const LT_PV_m3_LT_401H_lastday = rows.LT_PV_m3_LT_401H || 0;
                    const data_remaining_tank_Store_lastday = (LT_PV_m3_LT_401H_lastday + 1.3) * 1000;

                    item.data_tank_Store_between_day = (data_remaining_tank_Store - data_remaining_tank_Store_lastday);

                    //=== Total NaOH Store today
                    item.data_store = data_remaining_tank_Mix + data_remaining_tank_Store;

                    const Aka_Total_ALL_FT_401H = (item.Aka_Total_ALL_FT_401H || 0) - (rows.Aka_Total_ALL_FT_401H || 0);
                    const Aka_Total_ALL_FT_402H = (item.Aka_Total_ALL_FT_402H || 0) - (rows.Aka_Total_ALL_FT_402H || 0);
                    const Aka_Total_ALL_FT_403H = (item.Aka_Total_ALL_FT_403H || 0) - (rows.Aka_Total_ALL_FT_403H || 0);
                    const Aka_Total_ALL_FT_501H = (item.Aka_Total_ALL_FT_501H || 0) - (rows.Aka_Total_ALL_FT_501H || 0);

                    //===  Total NaOH Used today
                    item.data_used = (Aka_Total_ALL_FT_401H + Aka_Total_ALL_FT_402H + Aka_Total_ALL_FT_403H + Aka_Total_ALL_FT_501H);


                    // console.log("after HCI item >>:", item);


                }else{
                    const System_Data_Fill = item.Fill_Kg_H || 0;
                    const LT_PV_m3_LT_301H = item.LT_PV_m3_LT_301H || 0;
                    const data_remaining_tank_Mix = (LT_PV_m3_LT_301H + 0.8) * 1000;
                    const LT_PV_m3_LT_401H = item.LT_PV_m3_LT_401H || 0;
                    const data_remaining_tank_Store = (LT_PV_m3_LT_401H + 1.3) * 1000;

                    item.data_fill = System_Data_Fill;
                    item.data_store = data_remaining_tank_Mix + data_remaining_tank_Store;
                    item.data_used = 0;
                }

                return item;
            });

            // console.log("hci_promises >>:", await Promise.all(hci_promises));

            const final_HCI_items = await Promise.all(hci_promises);

            const HCI_Total = final_HCI_items.reduce((acc, curr) => {

                
                return {
                    total_fill: acc.total_fill + (curr.data_fill || 0),
                    total_store: acc.total_store + (curr.data_store || 0),
                    total_used: acc.total_used + (curr.data_used || 0)
                };
            }, {
                total_fill: 0, total_store: 0, total_used: 0
            });

             //======================================================================= result NaOH_Transfer_day =======================================================================
            // const HCI_Used = data_HCI_ ? data_HCI_Transfer_day.total_volume || 0 : 0;

            resolve({
                "msg": "success",
                "data": {
                    "NaOH_Fill": NaOH_Total.total_fill || 0,
                    "NaOH_Store": NaOH_Total.total_store || 0,
                    "NaOH_Used": NaOH_Total.total_used || 0,
                    "HCI_Fill": HCI_Total.total_fill || 0,
                    "HCI_Store": HCI_Total.total_store || 0,
                    "HCI_Used": HCI_Total.total_used || 0,
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
            
            const data_NaOH_Fill_ = await db('ScadaDataLogAlkaline')
            .select("*")
            .where('UnixTimestamp', '>=', timestamp.startTimestamp)
            .where('UnixTimestamp', '<', timestamp.endTimestamp)
            .orderBy('UnixTimestamp', 'asc');

            const data_HCI_Fill_ = await db('ScadaDataLogAcid')
            .select('*')
            .where('UnixTimestamp', '>=', timestamp.startTimestamp)
            .where('UnixTimestamp', '<', timestamp.endTimestamp)
            .orderBy('UnixTimestamp', 'asc');

            const aggregation  =  c.req.query('period') || 'today'; // รับค่าการจัดกลุ่มจาก query parameter

            //======================================================================= result NaOH_Fill_day =======================================================================

            // 1. สร้าง Array ของ Promises จากการ Map ข้อมูล
            const naoh_promises = data_NaOH_Fill_.map(async (item) => {

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

                const System_Data_Fill = item.Fill_Kg_N || 0;
                const System_Data_Density = item.Density_N || 1;

                item.data_fill = System_Data_Fill;

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
                        total_fill: 0,
                    };
                }

                // 5. รวมค่าเข้า Key นั้นๆ
                acc[key].total_fill += (Number(curr.data_fill) || 0);

                return acc;

            }, {}); // เริ่มต้นด้วย {} เสมอสำหรับทุก aggregation

            // console.log("NaOH_Total >>:",NaOH_Total);

            //======================================================================= result HCI_Fill_day =======================================================================
            const hci_promises = data_HCI_Fill_.map(async (item) => {

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

                const System_Data_Fill = item.Fill_Kg_H || 0;
                const System_Data_Density = item.Density_H || 1;

                item.data_fill = System_Data_Fill;

                return item;
            });

            const final_HCI_items = await Promise.all(hci_promises);

            const HCI_Total = final_HCI_items.reduce((acc, curr) => {
                
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
                        total_fill: 0, 
                    };
                }

                // 5. รวมค่าเข้า Key นั้นๆ
                acc[key].total_fill += (Number(curr.data_fill) || 0);

                return acc;

            }, {}); // เริ่มต้นด้วย {} เสมอสำหรับทุก aggregation

            // console.log("NaOH_Total >>:",NaOH_Total);
            // console.log("HCI_Total >>:",HCI_Total);

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

export const chartStoreOverview = async (c) => {

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out")), timeout);
    });

    const chartStoreDataListLogic = new Promise(async (resolve, reject) => {

        try {
            
            const timestamp = await convertTotimestamp(c.req.query()); // แปลง timestamp  
            
            const data_NaOH_Fill_ = await db('ScadaDataLogAlkaline')
            .select("*")
            .where('UnixTimestamp', '>=', timestamp.startTimestamp)
            .where('UnixTimestamp', '<', timestamp.endTimestamp)
            .orderBy('UnixTimestamp', 'asc');

            const data_HCI_Fill_ = await db('ScadaDataLogAcid')
            .select('*')
            .where('UnixTimestamp', '>=', timestamp.startTimestamp)
            .where('UnixTimestamp', '<', timestamp.endTimestamp)
            .orderBy('UnixTimestamp', 'asc');

            const aggregation  =  c.req.query('period') || 'today'; // รับค่าการจัดกลุ่มจาก query parameter

            //======================================================================= result NaOH_Fill_day =======================================================================

            // 1. สร้าง Array ของ Promises จากการ Map ข้อมูล
            const naoh_promises = data_NaOH_Fill_.map(async (item) => {

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
                // const rows = await db('ScadaDataLogAlkaline')
                //     .select("*")
                //     .where('UnixTimestamp', '>=', prevStartSec)
                //     .where('UnixTimestamp', '<=', prevEndSec)
                //     .orderBy('UnixTimestamp', 'desc')
                //     .first(); // เอาแถวล่าสุดแถวเดียว

                // if (rows) {

                //     const System_Data_Fill = item.Fill_Kg_N || 0;
                //     const System_Data_Density = item.Density_N || 1;
                //     const System_Data_Fill_lastday = rows.Fill_Kg_N || 0;
                //     const System_Data_Density_lastday = rows.Density_N || 1;

                //     const LT_PV_m3_LT_301N = item.LT_PV_m3_LT_301N || 0;
                //     const data_remaining_tank_Mix = (LT_PV_m3_LT_301N + 0.3) * 1000;

                //     const LT_PV_m3_LT_301N_lastday = rows.LT_PV_m3_LT_301N || 0;
                //     const data_remaining_tank_Mix_lastday = (LT_PV_m3_LT_301N_lastday + 0.3) * 1000;
                    
                //     item.data_tank_Mix_between_day = (data_remaining_tank_Mix - data_remaining_tank_Mix_lastday);

                //     const LT_PV_m3_LT_401N = item.LT_PV_m3_LT_401N || 0;
                //     const data_remaining_tank_Store = (LT_PV_m3_LT_401N + 1.3) * 1000;

                //     const LT_PV_m3_LT_401N_lastday = rows.LT_PV_m3_LT_401N || 0;
                //     const data_remaining_tank_Store_lastday = (LT_PV_m3_LT_401N_lastday + 1.3) * 1000;

                //     item.data_tank_Store_between_day = (data_remaining_tank_Store - data_remaining_tank_Store_lastday);

                //     //=== Total NaOH Store today
                //     item.data_store = data_remaining_tank_Mix + data_remaining_tank_Store;

                // }

                const LT_PV_m3_LT_301N = item.LT_PV_m3_LT_301N || 0;
                const data_remaining_tank_Mix = (LT_PV_m3_LT_301N + 0.3) * 1000;

                const LT_PV_m3_LT_401N = item.LT_PV_m3_LT_401N || 0;
                const data_remaining_tank_Store = (LT_PV_m3_LT_401N + 1.3) * 1000;

                //=== Total NaOH Store today
                item.data_store = data_remaining_tank_Mix + data_remaining_tank_Store;

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
                        total_store: 0,
                    };
                }

                // 5. รวมค่าเข้า Key นั้นๆ
                acc[key].total_store += (Number(curr.data_store) || 0);

                return acc;

            }, {}); // เริ่มต้นด้วย {} เสมอสำหรับทุก aggregation

            // console.log("NaOH_Total >>:",NaOH_Total);

            //======================================================================= result HCI_Fill_day =======================================================================
            const hci_promises = data_HCI_Fill_.map(async (item) => {

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
                // const rows = await db('ScadaDataLogAcid')
                //     .select("*")
                //     .where('UnixTimestamp', '>=', prevStartSec)
                //     .where('UnixTimestamp', '<=', prevEndSec)
                //     .orderBy('UnixTimestamp', 'desc')
                //     .first(); // เอาแถวล่าสุดแถวเดียว

                // if (rows) {

                //     const System_Data_Fill = item.Fill_Kg_H || 0;
                //     const System_Data_Density = item.Density_H || 1;
                //     const System_Data_Fill_lastday = rows.Fill_Kg_H || 0;
                //     const System_Data_Density_lastday = rows.Density_H || 1;

                //     const LT_PV_m3_LT_301H = item.LT_PV_m3_LT_301H || 0;
                //     const data_remaining_tank_Mix = (LT_PV_m3_LT_301H + 0.8) * 1000;

                //     const LT_PV_m3_LT_301H_lastday = rows.LT_PV_m3_LT_301H || 0;
                //     const data_remaining_tank_Mix_lastday = (LT_PV_m3_LT_301H_lastday + 0.8) * 1000;
                    
                //     item.data_tank_Mix_between_day = (data_remaining_tank_Mix - data_remaining_tank_Mix_lastday);

                //     const LT_PV_m3_LT_401H = item.LT_PV_m3_LT_401H || 0;
                //     const data_remaining_tank_Store = (LT_PV_m3_LT_401H + 1.3) * 1000;

                //     const LT_PV_m3_LT_401H_lastday = rows.LT_PV_m3_LT_401H || 0;
                //     const data_remaining_tank_Store_lastday = (LT_PV_m3_LT_401H_lastday + 1.3) * 1000;

                //     item.data_tank_Store_between_day = (data_remaining_tank_Store - data_remaining_tank_Store_lastday);

                //     //=== Total NaOH Store today
                //     item.data_store = data_remaining_tank_Mix + data_remaining_tank_Store;

                // }

                const LT_PV_m3_LT_301H = item.LT_PV_m3_LT_301H || 0;
                const data_remaining_tank_Mix = (LT_PV_m3_LT_301H + 0.8) * 1000;

                const LT_PV_m3_LT_401H = item.LT_PV_m3_LT_401H || 0;
                const data_remaining_tank_Store = (LT_PV_m3_LT_401H + 1.3) * 1000;

                //=== Total NaOH Store today
                item.data_store = data_remaining_tank_Mix + data_remaining_tank_Store;

                return item;
            });

            const final_HCI_items = await Promise.all(hci_promises);

            const HCI_Total = final_HCI_items.reduce((acc, curr) => {
                
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
                        total_store: 0, 
                    };
                }

                // 5. รวมค่าเข้า Key นั้นๆ
                acc[key].total_store += (Number(curr.data_store) || 0);

                return acc;

            }, {}); // เริ่มต้นด้วย {} เสมอสำหรับทุก aggregation

            resolve({
                "msg": "success",
                "data": {
                    "NaOH_Store": NaOH_Total,
                    "HCI_Store": HCI_Total,
                }
            })

        } catch (error) {
            reject(error);
        }

    });

    // try {
    
    const result = await Promise.race([chartStoreDataListLogic, timeoutPromise]);

    return c.json(result);
    
    // } catch (error) {
    //     reject(error.message);
    // }
};

export const chartUsedOverview = async (c) => {

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out")), timeout);
    });

    const chartoverviewDataListLogic = new Promise(async (resolve, reject) => {

        try {

            const timestamp = await convertTotimestamp(c.req.query()); // แปลง timestamp

            const aggregation  =  c.req.query('period') || 'today'; // รับค่าการจัดกลุ่มจาก query parameter
            
            const data_NaOH_Used = await db('ScadaDataLogAlkaline')
            .select("*")
            .where('UnixTimestamp', '>=', timestamp.startTimestamp)
            .where('UnixTimestamp', '<', timestamp.endTimestamp)
            .orderBy('UnixTimestamp', 'asc');

            const data_HCI_Used = await db('ScadaDataLogAcid')
            .select("*")
            .where('UnixTimestamp', '>=', timestamp.startTimestamp)
            .where('UnixTimestamp', '<', timestamp.endTimestamp)
            .orderBy('UnixTimestamp', 'asc');

            // console.log("data_NaOH_Used ==>>",data_NaOH_Used)
            //======================================================================= result NaOH_Transfer_day =======================================================================

            // 1. สร้าง Array ของ Promises จากการ Map ข้อมูล
            const naoh_promises = await Promise.all(data_NaOH_Used.map(async (item) => {

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

                if (rows) {

                    const System_Data_Fill = item.Fill_Kg_N || 0;
                    const System_Data_Density = item.Density_N || 1;
                    const System_Data_Fill_lastday = rows.Fill_Kg_N || 0;
                    const System_Data_Density_lastday = rows.Density_N || 1;

                    const Aka_Total_ALL_FT_401N = (item.Aka_Total_ALL_FT_401N || 0) - (rows.Aka_Total_ALL_FT_401N || 0);
                    const Aka_Total_ALL_FT_402N = (item.Aka_Total_ALL_FT_402N || 0) - (rows.Aka_Total_ALL_FT_402N || 0);
                    const Aka_Total_ALL_FT_403N = (item.Aka_Total_ALL_FT_403N || 0) - (rows.Aka_Total_ALL_FT_403N || 0);

                    //===  Total NaOH Used today
                    item.data_used = (Aka_Total_ALL_FT_401N + Aka_Total_ALL_FT_402N + Aka_Total_ALL_FT_403N);

                    // ส่งค่ากลับไปในแต่ละ item เพื่อนำไปบวกเพิ่มภายหลัง
                    return {
                        ...item
                    };

                }
                
                return null; // ถ้าไม่มีข้อมูลของวันก่อน ให้ส่งกลับเป็น null หรือค่าเริ่มต้นที่เหมาะสม

            }));

            // 2. รอให้ Query ของทุก Item ทำงานเสร็จพร้อมกัน
            const final_NaOH_items = naoh_promises.filter(item => item !== null);

            // 3. ใช้ .reduce() เพื่อรวมค่า Total ทั้งหมด (วิธีนี้ปลอดภัยและแม่นยำกว่า)
            const NaOH_Total = final_NaOH_items.reduce((acc, curr) => {

                // console.log("Current item:", curr);

                // 1. แปลง start_time ให้เป็น Date Object ที่ถูกต้อง
                // ถ้า start_time เป็น Unix Timestamp (วินาที) อย่าลืมคูณ 1000
                const dateObj = new Date(curr.UnixTimestamp*1000); 
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
                        total_used: 0, 
                    };
                }

                // 5. รวมค่าเข้า Key นั้นๆ
                acc[key].total_used += (Number(curr.data_used) || 0);

                return acc;

            }, {}); // เริ่มต้นด้วย {} เสมอสำหรับทุก aggregation

            //======================================================================= result HCI_Transfer_day =======================================================================

            const hci_promises = await Promise.all(data_HCI_Used.map(async (item) => {

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

                // Query ข้อมูลจากตาราง ScadaDataLogAcid วันก่อน
                const rows = await db('ScadaDataLogAcid')
                    .select("*")
                    .where('UnixTimestamp', '>=', prevStartSec)
                    .where('UnixTimestamp', '<=', prevEndSec)
                    .orderBy('UnixTimestamp', 'desc')
                    .first(); // เอาแถวล่าสุดแถวเดียว

                if (rows) {

                    // console.log("item >>",item)
                    // console.log("rows >>",rows)


                    const System_Data_Fill = item.Fill_Kg_N || 0;
                    const System_Data_Density = item.Density_N || 1;
                    const System_Data_Fill_lastday = rows.Fill_Kg_N || 0;
                    const System_Data_Density_lastday = rows.Density_N || 1;

                    const Aka_Total_ALL_FT_401H = (item.Aka_Total_ALL_FT_401H || 0) - (rows.Aka_Total_ALL_FT_401H || 0);
                    const Aka_Total_ALL_FT_402H = (item.Aka_Total_ALL_FT_402H || 0) - (rows.Aka_Total_ALL_FT_402H || 0);
                    const Aka_Total_ALL_FT_403H = (item.Aka_Total_ALL_FT_403H || 0) - (rows.Aka_Total_ALL_FT_403H || 0);
                    const Aka_Total_ALL_FT_501N = (item.Aka_Total_ALL_FT_501H || 0) - (rows.Aka_Total_ALL_FT_501H || 0);

                    // console.log("Aka_Total_ALL_FT_401H ==>>",Aka_Total_ALL_FT_401H);
                    // console.log("Aka_Total_ALL_FT_402H ==>>",Aka_Total_ALL_FT_402H);
                    // console.log("Aka_Total_ALL_FT_403H ==>>",Aka_Total_ALL_FT_403H);
                    // console.log("Aka_Total_ALL_FT_501N ==>>",Aka_Total_ALL_FT_501N);

                    //===  Total NaOH Used today
                    item.data_used = (Aka_Total_ALL_FT_401H + Aka_Total_ALL_FT_402H + Aka_Total_ALL_FT_403H + Aka_Total_ALL_FT_501N);

                    // ส่งค่ากลับไปในแต่ละ item เพื่อนำไปบวกเพิ่มภายหลัง
                    return {
                        ...item
                    };

                }

                return null; // หรือค่าเริ่มต้นที่เหมาะสม
                
            }));

            const final_HCI_items = hci_promises.filter(item => item !== null);

            const HCI_Total = final_HCI_items.reduce((acc, curr) => {
                // 1. แปลง start_time ให้เป็น Date Object ที่ถูกต้อง
                // ถ้า start_time เป็น Unix Timestamp (วินาที) อย่าลืมคูณ 1000
                const dateObj = new Date(curr.UnixTimestamp*1000); 
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
                        total_used: 0, 
                    };
                }

                // 5. รวมค่าเข้า Key นั้นๆ
                acc[key].total_used += (Number(curr.data_used) || 0);

                return acc;

            }, {}); // เริ่มต้นด้วย {} เสมอสำหรับทุก aggregation

            resolve({
                "msg": "success",
                "data": {
                    "NaOH_Used": NaOH_Total,
                    "HCI_Used": HCI_Total,
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

export const reprotoverview = async (c) => {

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out")), timeout);
    });

    const reportoverviewDataLogic = new Promise(async (resolve, reject) => {

        const timestamp = await convertTotimestamp(c.req.query()); // แปลง timestamp

        const data_NaOH_ = await db('ScadaDataLogAlkaline')
            .select('*')
            .where('UnixTimestamp', '>=', timestamp.startTimestamp)
            .where('UnixTimestamp', '<', timestamp.endTimestamp)
            .orderBy('UnixTimestamp', 'asc');

        // console.log("data_NaOH_ >>:", data_NaOH_);

        const data_HCI_ = await db('ScadaDataLogAcid')
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

                // const C1_N = 4;
                // const C2_N = 50;

                // const C1_H = 6;
                // const C2_H = 35;

                const Timestamp_data = new Date(item.UnixTimestamp * 1000);

                // col A
                item.dateTime = format(Timestamp_data, 'yyyy-MM-dd');

                const LT_PV_m3_LT_101 = item.LT_PV_m3_LT_101N || 0;
                const data_remaining_tank1_fill = (LT_PV_m3_LT_101 + 0.8) * 1000;
                // const data_remaining_tank1_fill_total = (data_remaining_tank1_fill * System_Data_Density);
    
                const LT_PV_m3_LT_102 = item.LT_PV_m3_LT_102N || 0;
                const data_remaining_tank2_fill = (LT_PV_m3_LT_102 + 0.8) * 1000;
                // const data_remaining_tank2_fill_total = (data_remaining_tank2_fill * System_Data_Density);

                const LT_PV_m3_LT_101_lastday = rows.LT_PV_m3_LT_101N || 0;
                const data_remaining_tank1_fill_lastday = (LT_PV_m3_LT_101_lastday + 0.8) * 1000;
                // const data_remaining_tank1_fill_total_lastday = (data_remaining_tank1_fill_lastday * System_Data_Density_lastday);
    
                const LT_PV_m3_LT_102_lastday = rows.LT_PV_m3_LT_102N || 0;
                const data_remaining_tank2_fill_lastday = (LT_PV_m3_LT_102_lastday + 0.8) * 1000;
                // const data_remaining_tank2_fill_total_lastday = (data_remaining_tank2_fill_lastday * System_Data_Density_lastday);
    
                // console.log("data_remaining_tank1_fill_total >>", data_remaining     
                // col C
                item.density_N = System_Data_Density;
                
                // col D
                const data_remaining_fill = (data_remaining_tank1_fill + data_remaining_tank2_fill);
                item.data_remaining_fill_N = data_remaining_fill;

                // col E
                const data_remaining_fill_total = data_remaining_fill * System_Data_Density;
                item.data_remaining_fill_total_N = data_remaining_fill_total;

                const data_remaining_fill_lastday =  (data_remaining_tank1_fill_lastday + data_remaining_tank2_fill_lastday);
                const data_remaining_fill_total_lastday = data_remaining_fill_lastday * System_Data_Density_lastday;

                // col F
                const Fill_between_day = (data_remaining_fill_total_lastday + System_Data_Fill_lastday) - data_remaining_fill_total;
                item.Fill_between_day_N = Fill_between_day;

                // col G
                item.data_Fill_N =  System_Data_Fill;

                
                // col H
                const Total_ALL_FT_101 = (item.Aka_Total_ALL_FT_101N || 0);
                item.Total_ALL_FT_101_N = Total_ALL_FT_101;

                // col I
                const Total_ALL_FT_201 = (item.Aka_Total_ALL_FT_201N || 0);
                item.Total_ALL_FT_201_N = Total_ALL_FT_201;

                const Total_ALL_FT_101_lastday = (rows.Aka_Total_ALL_FT_101N || 0);
                const Total_ALL_FT_201_lastday = (rows.Aka_Total_ALL_FT_201N || 0);

                // col J
                item.chemical_between_day_N = (Total_ALL_FT_101 - Total_ALL_FT_101_lastday);

                // col K
                item.ro_between_day_N = (Total_ALL_FT_201 - Total_ALL_FT_201_lastday);

                // col L
                const LT_PV_m3_LT_301 = item.LT_PV_m3_LT_301N || 0;
                const data_remaining_tank_Mix = (LT_PV_m3_LT_301 + 0.3) * 1000;
                item.data_remaining_tank_Mix_N = data_remaining_tank_Mix;

                // col M
                const LT_PV_m3_LT_301_lastday = rows.LT_PV_m3_LT_301N || 0;
                const data_remaining_tank_Mix_lastday = (LT_PV_m3_LT_301_lastday + 0.3) * 1000;

                item.tank_Mix_between_day_N = (data_remaining_tank_Mix - data_remaining_tank_Mix_lastday);

                // col N
                const LT_PV_m3_LT_401 = (item.LT_PV_m3_LT_401N || 0);
                const data_remaining_tank_Store = (LT_PV_m3_LT_401 + 1.3) * 1000;
                item.data_remaining_tank_Store_N = data_remaining_tank_Store;

                // col O
                const LT_PV_m3_LT_401_lastday = (rows.LT_PV_m3_LT_401N || 0);
                const data_remaining_tank_Store_lastday = (LT_PV_m3_LT_401_lastday + 1.3) * 1000;

                item.tank_Store_between_day_N = (data_remaining_tank_Store - data_remaining_tank_Store_lastday);

                // col Q (PD1)
                const Total_ALL_FT_401 = (item.Aka_Total_ALL_FT_401N || 0);
                
                item.Total_ALL_FT_401_N = Total_ALL_FT_401;
                
                // col Q (PD2)
                const Total_ALL_FT_402 = (item.Aka_Total_ALL_FT_402N || 0);

                item.Total_ALL_FT_402_N = Total_ALL_FT_402;

                // col Q (PD3)
                const Total_ALL_FT_403 = (item.Aka_Total_ALL_FT_403N || 0);

                item.Total_ALL_FT_403_N = Total_ALL_FT_403;

                // col R (PD1)
                const Total_ALL_FT_401_lastday = (rows.Aka_Total_ALL_FT_401N || 0);
                const pd1_between_day = (Total_ALL_FT_401 - Total_ALL_FT_401_lastday);
                item.pd1_between_day_N = pd1_between_day;
                
                // col R (PD2)
                const Total_ALL_FT_402_lastday = (rows.Aka_Total_ALL_FT_402N || 0);
                const pd2_between_day = (Total_ALL_FT_402 - Total_ALL_FT_402_lastday);
                item.pd2_between_day_N = pd2_between_day;

                // col R (PD3)
                const Total_ALL_FT_403_lastday = (rows.Aka_Total_ALL_FT_403N || 0);
                const pd3_between_day = (Total_ALL_FT_403 - Total_ALL_FT_403_lastday);
                item.pd3_between_day_N = pd3_between_day;

                // col S
                item.totalAll_use_between_day_N = (pd1_between_day + pd2_between_day + pd3_between_day);

                // ส่งค่ากลับไปในแต่ละ item เพื่อนำไปบวกเพิ่มภายหลัง
                return {
                    ...item,
                };
            }

            return null;
        }))

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

                const System_Data_Fill = item.Fill_Kg_H || 0;
                const System_Data_Density = item.Density_H || 1;
                const System_Data_Fill_lastday = rows.Fill_Kg_H || 0;
                const System_Data_Density_lastday = rows.Density_H || 1;

                const Timestamp_data = new Date(item.UnixTimestamp * 1000);

                // col A
                item.dateTime = format(Timestamp_data, 'yyyy-MM-dd');

                const LT_PV_m3_LT_101 = item.LT_PV_m3_LT_101H || 0;
                const data_remaining_tank1_fill = (LT_PV_m3_LT_101 + 0.8) * 1000;
                // const data_remaining_tank1_fill_total = (data_remaining_tank1_fill * System_Data_Density);
    
                const LT_PV_m3_LT_102 = item.LT_PV_m3_LT_102H || 0;
                const data_remaining_tank2_fill = (LT_PV_m3_LT_102 + 0.8) * 1000;
                // const data_remaining_tank2_fill_total = (data_remaining_tank2_fill * System_Data_Density);

                const LT_PV_m3_LT_101_lastday = rows.LT_PV_m3_LT_101H || 0;
                const data_remaining_tank1_fill_lastday = (LT_PV_m3_LT_101_lastday + 0.8) * 1000;
                // const data_remaining_tank1_fill_total_lastday = (data_remaining_tank1_fill_lastday * System_Data_Density_lastday);
    
                const LT_PV_m3_LT_102_lastday = rows.LT_PV_m3_LT_102H || 0;
                const data_remaining_tank2_fill_lastday = (LT_PV_m3_LT_102_lastday + 0.8) * 1000;
                // const data_remaining_tank2_fill_total_lastday = (data_remaining_tank2_fill_lastday * System_Data_Density_lastday);
    
                // console.log("data_remaining_tank1_fill_total >>", data_remaining     
                // col C
                item.density_H = System_Data_Density;

                // col D
                const data_remaining_fill = (data_remaining_tank1_fill + data_remaining_tank2_fill);
                item.data_remaining_fill_H = data_remaining_fill;

                // col E
                const data_remaining_fill_total = data_remaining_fill * System_Data_Density;
                item.data_remaining_fill_total_H = data_remaining_fill_total;

                const data_remaining_fill_lastday =  (data_remaining_tank1_fill_lastday + data_remaining_tank2_fill_lastday);
                const data_remaining_fill_total_lastday = data_remaining_fill_lastday * System_Data_Density_lastday;

                // col F
                const Fill_between_day = (data_remaining_fill_total_lastday + System_Data_Fill_lastday) - data_remaining_fill_total;
                item.Fill_between_day_H = Fill_between_day;

                // col G
                item.data_Fill_H =  System_Data_Fill;
                
                // col H
                const Total_ALL_FT_101 = (item.Aka_Total_ALL_FT_101H || 0);
                item.Total_ALL_FT_101_H = Total_ALL_FT_101;

                // col I
                const Total_ALL_FT_201 = (item.Aka_Total_ALL_FT_201H || 0);
                item.Total_ALL_FT_201_H = Total_ALL_FT_201;

                const Total_ALL_FT_101_lastday = (rows.Aka_Total_ALL_FT_101H || 0);
                const Total_ALL_FT_201_lastday = (rows.Aka_Total_ALL_FT_201H || 0);

                // col J
                item.chemical_between_day_H = (Total_ALL_FT_101 - Total_ALL_FT_101_lastday);

                // col K
                item.ro_between_day_H = (Total_ALL_FT_201 - Total_ALL_FT_201_lastday);

                // col L
                const LT_PV_m3_LT_301 = item.LT_PV_m3_LT_301H || 0;
                // item.LT_PV_m3_LT_301_H = LT_PV_m3_LT_301;
                const data_remaining_tank_Mix = (LT_PV_m3_LT_301 + 0.8) * 1000;
                item.data_remaining_tank_Mix_H = data_remaining_tank_Mix;

                // col M
                const LT_PV_m3_LT_301_lastday = rows.LT_PV_m3_LT_301H || 0;
                const data_remaining_tank_Mix_lastday = (LT_PV_m3_LT_301_lastday + 0.8) * 1000;

                item.tank_Mix_between_day_H = (data_remaining_tank_Mix - data_remaining_tank_Mix_lastday);

                // col N
                const LT_PV_m3_LT_401 = (item.LT_PV_m3_LT_401H || 0);
                const data_remaining_tank_Store = (LT_PV_m3_LT_401 + 1.3) * 1000;
                // item.LT_PV_m3_LT_401_H = LT_PV_m3_LT_401;
                item.data_remaining_tank_Store_H = data_remaining_tank_Store;
                
                // col O
                const LT_PV_m3_LT_401_lastday = (rows.LT_PV_m3_LT_401H || 0);
                const data_remaining_tank_Store_lastday = (LT_PV_m3_LT_401_lastday + 1.3) * 1000;

                item.tank_Store_between_day_H = (data_remaining_tank_Store - data_remaining_tank_Store_lastday);

                // col Q (PD1)
                const Total_ALL_FT_401 = (item.Aka_Total_ALL_FT_401H || 0);
                
                item.Total_ALL_FT_401_H = Total_ALL_FT_401;
                
                // col Q (PD2)
                const Total_ALL_FT_402 = (item.Aka_Total_ALL_FT_402H || 0);

                item.Total_ALL_FT_402_H = Total_ALL_FT_402;

                // col Q (PD3)
                const Total_ALL_FT_403 = (item.Aka_Total_ALL_FT_403H || 0);

                item.Total_ALL_FT_403_H = Total_ALL_FT_403;

                // col Q (PD3)
                const Total_ALL_FT_501 = (item.Aka_Total_ALL_FT_501H || 0);

                item.Total_ALL_FT_501_H = Total_ALL_FT_501;

                // col R (PD1)
                const Total_ALL_FT_401_lastday = (rows.Aka_Total_ALL_FT_401H || 0);
                const pd1_between_day = (Total_ALL_FT_401 - Total_ALL_FT_401_lastday)

                item.pd1_between_day_H = pd1_between_day;
                
                // col R (PD2)
                const Total_ALL_FT_402_lastday = (rows.Aka_Total_ALL_FT_402H || 0);
                const pd2_between_day = (Total_ALL_FT_402 - Total_ALL_FT_402_lastday);

                item.pd2_between_day_H = pd2_between_day;

                // col R (PD3)
                const Total_ALL_FT_403_lastday = (rows.Aka_Total_ALL_FT_403H || 0);
                const pd3_between_day = (Total_ALL_FT_403 - Total_ALL_FT_403_lastday);
                item.pd3_between_day_H = pd3_between_day;

                // col R (ES)
                const Total_ALL_FT_501_lastday = (rows.Aka_Total_ALL_FT_501H || 0);
                const es_between_day = (Total_ALL_FT_501 - Total_ALL_FT_501_lastday);
                item.es_between_day_H = es_between_day;

                // col S
                item.total_use_between_day_H = (pd1_between_day + pd2_between_day + pd3_between_day);

                item.totalAll_use_between_day_H = (pd1_between_day + pd2_between_day + pd3_between_day + es_between_day);


                // ส่งค่ากลับไปในแต่ละ item เพื่อนำไปบวกเพิ่มภายหลัง
                return {
                    ...item,
                };
            }

            return null;
        }))

        // console.log("data_NaOH_ __> ",hci_promises)

        // 1. รอให้ Promises ทั้งหมดทำงานเสร็จสิ้น และกรองค่าที่เป็น null ออก
        const naoh_results = naoh_promises.filter(Boolean);
        const hci_results = hci_promises.filter(Boolean);

        // 2. ใช้ Object หรือ Map ในการรวมข้อมูลโดยใช้ dateTime เป็น Key
        const mergedMap = {};

        // จัดการข้อมูลจากฝั่ง NaOH
        naoh_results.forEach(item => {

            const date = item.dateTime;
            if (!mergedMap[date]) {
                mergedMap[date] = { dateTime: date };
            }
            // รวม Property ทั้งหมดของ NaOH เข้าไป
            Object.assign(mergedMap[date], item);
        });

        // จัดการข้อมูลจากฝั่ง HCI
        hci_results.forEach(item => {

            // if (index_hci_results === 0) {
                
            //     startTimestamp_ = item.dateTime;
            // }else if(naoh_results.length === index_hci_results - 1){
                
            //     endTimestamp_ = item.dateTime;
            // }

            const date = item.dateTime;
            if (!mergedMap[date]) {
                mergedMap[date] = { dateTime: date };
            }
            // รวม Property ทั้งหมดของ HCI เข้าไป
            Object.assign(mergedMap[date], item);
        });

        // 3. แปลง Map กลับเป็น Array และจัดการ Default Value (0) สำหรับฟิลด์ที่หายไป
        const final_results = Object.values(mergedMap).map(item => {
            // รายการ Field ทั้งหมดที่คุณต้องการตรวจสอบ (ตัวอย่าง)
            const fieldsToCheck = [
                'density_N', 'data_remaining_fill_N', 'data_remaining_fill_total_N', 'Fill_between_day_N','data_Fill_N',
                'Total_ALL_FT_101_N', 'Total_ALL_FT_201_N', 'chemical_between_day_N', 'ro_between_day_N', 'data_remaining_tank_Mix_N','data_remaining_tank_Store_N','tank_Mix_between_day_N',
                'tank_Store_between_day_N', 'Total_ALL_FT_401_N', 'Total_ALL_FT_402_N', 'Total_ALL_FT_403_N', 'pd1_between_day_N',
                'pd2_between_day_N', 'pd3_between_day_N', 'totalAll_use_between_day_N',
                'density_H', 'data_remaining_fill_H', 'data_remaining_fill_total_H', 'Fill_between_day_H', 'data_Fill_H',
                'Total_ALL_FT_101_H', 'Total_ALL_FT_201_H', 'chemical_between_day_H', 'ro_between_day_H', 'data_remaining_tank_Mix_H','data_remaining_tank_Store_H', 'tank_Mix_between_day_H',
                'tank_Store_between_day_H', 'Total_ALL_FT_401_H', 'Total_ALL_FT_402_H', 'Total_ALL_FT_403_H', 'Total_ALL_FT_501_H', 'pd1_between_day_H',
                'pd2_between_day_H', 'pd3_between_day_H', 'es_between_day_H', 'total_use_between_day_H' , 'totalAll_use_between_day_H',
            ];

            fieldsToCheck.forEach(field => {
                if (item[field] === undefined || item[field] === null) {
                    item[field] = 0;
                }
            });

            return item;
        });

        // const final_items = promises_.filter(item => item !== null);
        return resolve({ 

            period_Display: `${final_results.length == 0 ? "-" : final_results.length} Day`,
            start_timeDisplay: final_results[0]?.dateTime || "--",
            end_timeDisplay: final_results[final_results.length - 1]?.dateTime || '--',
            total: final_results.length,
            result: final_results 
            // message: 'Hello, Smart Automation Thailand!',
        });

    })

    try {

        const result = await Promise.race([reportoverviewDataLogic, timeoutPromise]);

        return c.json(result);

    } catch (error){

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
