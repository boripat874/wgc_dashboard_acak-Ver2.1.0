import knexfile from '@/lib/configKnex.ts';
import { convertTotimestamp } from '@/controller/funtion.js';

import knex from 'knex';
import { format } from 'date-fns';
import { select } from '@heroui/react';
import { NaOH } from '@/app/(home)/_components/overview-cards/icons';

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
