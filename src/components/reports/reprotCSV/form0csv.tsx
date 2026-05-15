import React from 'react'
// import { useEffect } from 'react';
// import ReactDOM from 'react-dom/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,LabelList, LineChart, Line, Cell } from 'recharts';
import axios from 'axios';
import Swal from 'sweetalert2';
import { format, set } from 'date-fns';
import html2canvas from 'html2canvas';
import Logo from 'public/report/Logo.png';
import { fetcher } from "@/app/utils/fetcher";

import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
import { rgba } from 'framer-motion';
import {CheckPeriod,Aggregation,Unit} from '../reportPdf/funtionComponents';
import { time } from 'console';

// Call applyPlugin to extend the jsPDF object
applyPlugin(jsPDF);

// import CustomLegendProps from '@/components/reportPdf/legendcustent';

interface Data {
  dateTime: string;
  menu_: string;
  density_N: string;
  data_remaining_fill_N: string;
  data_remaining_fill_total_N?: number;
  Fill_between_day_N?: number;
  data_Fill_N?: number;
  Total_ALL_FT_101_N?: number;
  Total_ALL_FT_201_N?: number;
  chemical_between_day_N?: number;
  ro_between_day_N?: number;
  data_remaining_tank_Mix_N?:number;
  tank_Mix_between_day_N?: number;
  data_remaining_tank_Store_N?:number;
  tank_Store_between_day_N?: number;
  span_?: string;
  Total_ALL_FT_401_N?: number;
  Total_ALL_FT_402_N?: number;
  Total_ALL_FT_403_N?: number;
  pd1_between_day_N?: number;
  pd2_between_day_N?: number;
  pd3_between_day_N?: number;
  totalAll_use_between_day_N?: number;
  

  density_H?: number;
  data_remaining_fill_H?: number;
  data_remaining_fill_total_H?: number;
  Fill_between_day_H?: number;
  data_Fill_H?: number;
  Total_ALL_FT_101_H?: number;
  Total_ALL_FT_201_H?: number;
  chemical_between_day_H?: number;
  ro_between_day_H?: number;
  data_remaining_tank_Mix_H?:number;
  tank_Mix_between_day_H?: number;
  data_remaining_tank_Store_H?:number;
  tank_Store_between_day_H?: number;
  Total_ALL_FT_401_H?: number;
  Total_ALL_FT_402_H?: number;
  Total_ALL_FT_403_H?: number;
  Total_ALL_FT_501_H?: number;
  pd1_between_day_H?: number;
  pd2_between_day_H?: number;
  pd3_between_day_H?: number;
  es_between_day_H?: number;
  total_use_between_day_H?: number;
  totalAll_use_between_day_H?: number;
}

// Sample data for the chart
var data: Data[] = [];


async function convertToCSV(
    data: Data[], 
    reportName_: string,
    UnitName_: string,
    tank_: string,
    aggregation_: string,
    period_: string,
    date_start_: string,
    date_end_: string
): Promise<string> {

    // 1. แสดง Loading ทันที
    Swal.fire({
        title: 'กำลังเตรียมไฟล์ CSV...',
        html: 'ระบบกำลังดึงข้อมูลและจัดทำรูปแบบไฟล์',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    // const unit_value = await Unit(UnitName_);
    const unit_value = "kg";


    const HEADERS: { [key in keyof any]: string } = {
        dateTime: 'วันที่',
        menu_: 'รายการ' ,
        density_N: 'Density',
        data_remaining_fill_N: 'คงเหลือ Tank เข้มข้น (L)',
        data_remaining_fill_total_N: 'คงเหลือเข้มข้นรวมสูตร (Kg)',
        Fill_between_day_N: 'ผลต่างเข้มข้นใน Tank ระหว่างวัน (Kg)',
        data_Fill_N: 'รับเข้าใหม่ (Kg)',
        Total_ALL_FT_101_N: 'ตัวเลขมิเตอร์ เคมี (L)',
        Total_ALL_FT_201_N: 'ตัวเลขมิเตอร์น้ำ RO (L)',
        chemical_between_day_N: 'ผลต่างมิเตอร์ระหว่างวัน เคมี (L)',
        ro_between_day_N: 'ผลต่างมิเตอร์ระหว่างวัน น้ำ RO (L)',
        data_remaining_tank_Mix_N: 'คงเหลือ Tank Mix (L)',
        tank_Mix_between_day_N: 'ผลต่างใน Tank Mix ระหว่างวัน (L)',
        data_remaining_tank_Store_N: 'คงเหลือ Tank Store (L)',
        tank_Store_between_day_N: 'ผลต่างใน Tank Store ระหว่างวัน (L)',
        span_: " ",
        Total_ALL_FT_401_N: 'ตัวเลขมิเตอร์ (L)',
        Total_ALL_FT_402_N: 'ผลต่างมิเตอร์ ระหว่างวัน (L)',
        Total_ALL_FT_403_N: 'ผลต่างมิเตอร์ ทั้งวัน (L)'
    };
 
    if (data.length === 0) {
        return '';
    }

    // 1. สร้างแถวหัวตารางจากค่าใน HEADERS
    const headers = Object.keys(data[0]) as (keyof Data)[];

    // console.log(headers);

    const headerRow = headers.map(key => HEADERS[key]).join(',');

    // console.log("headers >>>",headers);

    let tableRows = [] as any;

    data.forEach((item) => {
            // --- ส่วนของ กรดเกลือ (N) ---
            // แถวแรกของกรดเกลือ จะมีข้อมูลหลัก + ข้อมูล PD1

            tableRows.push([
                item.dateTime, // วันที่
                "กรดเกลือ",    // รายการ
                item.density_N, // Density
                item.data_remaining_fill_N,
                item.data_remaining_fill_total_N,
                item.Fill_between_day_N,
                item.data_Fill_N,
                item.Total_ALL_FT_101_N,
                item.Total_ALL_FT_201_N,
                item.chemical_between_day_N,
                item.ro_between_day_N,
                item.data_remaining_tank_Mix_N,
                item.tank_Mix_between_day_N,
                item.data_remaining_tank_Store_N,
                item.tank_Store_between_day_N,
                "PD1", item.Total_ALL_FT_401_N, item.pd1_between_day_N, 
                "", // ผลต่างมิเตอร์ทั้งวัน (ว่างไว้รอแถวสุดท้าย)
            ]);
            tableRows.push(["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "PD2", item.Total_ALL_FT_402_N, item.pd2_between_day_N]);
            tableRows.push(["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "PD3", item.Total_ALL_FT_403_N, item.pd3_between_day_N, item.totalAll_use_between_day_N]);

            // // --- ส่วนของ โซดาไฟ (H) ---
            // // ทำเหมือนกัน แต่เพิ่มแถว ES เข้าไปด้วยตามรูป
            
            tableRows.push([
                item.dateTime,
                "โซดาไฟ",
                item.density_H,
                item.data_remaining_fill_H,
                item.data_remaining_fill_total_H,
                item.Fill_between_day_H,
                item.data_Fill_H,
                item.Total_ALL_FT_101_H,
                item.Total_ALL_FT_201_H,
                item.chemical_between_day_H,
                item.ro_between_day_H,
                item.data_remaining_tank_Mix_H,
                item.tank_Mix_between_day_H,
                item.data_remaining_tank_Store_H,
                item.tank_Store_between_day_H,
                "PD1", item.Total_ALL_FT_401_H, item.pd1_between_day_H, 
                "",
            ]);
            tableRows.push(["", "", "", "", "", "", "", "", "", "", "", "", "", "", "","PD2", item.Total_ALL_FT_402_H, item.pd2_between_day_H]);
            tableRows.push(["", "", "", "", "", "", "", "", "", "", "", "", "", "", "","PD3", item.Total_ALL_FT_403_H, item.pd3_between_day_H, item.total_use_between_day_H]);
            tableRows.push(["", "", "", "", "", "", "", "", "", "", "", "", "", "", "","ES", item.Total_ALL_FT_501_H, item.es_between_day_H, item.totalAll_use_between_day_H]);
          
          });

    // // 2. สร้างแถวข้อมูลตามลำดับของ headers
    // const dataRows = data.map(row => 
        

    //     // headers.map(fieldName => {
    //     //     // ดึงค่าตามชื่อคีย์เดิม
    //     //     const value = row[fieldName];
    //     //     return String(value);
    //     // }).join(',')
    //     []
    // );

    // 3. รวมหัวตารางและข้อมูลเข้าด้วยกัน
    return [`${reportName_},\nPeriod : ${period_},Time Start : ${date_start_},Time End : ${date_end_}`,headerRow, ...tableRows].join('\n');
}

const convertedData = (originalData: Data[]) => {
    let i = 0;

    // Use map and return the NEW array it creates
    return originalData.map(item => { 

        i++;

        const originalDate = item.dateTime; // เช่น: '2025-01-20'
        
        // 1. แทนที่ตัวคั่น '-' ด้วยขีดกลาง '/'
        const newDate = originalDate.replace(/-/g, '/'); 
        
        // คืนค่าอ็อบเจกต์ใหม่ (พร้อมดึง properties อื่นๆ ถ้ามี)
        // NOTE: If you need to keep other properties, you must spread them: {...item, number: i, date_time: newDate}
        return {  
            dateTime: newDate ,
            menu_: "-", 
            density_N: Number(item.density_N).toFixed(2),
            data_remaining_fill_N: Number(item.data_remaining_fill_N).toFixed(2),
            data_remaining_fill_total_N: Number(item.data_remaining_fill_total_N).toFixed(2),
            Fill_between_day_N: Number(item.Fill_between_day_N).toFixed(2),
            data_Fill_N: Number(item.data_Fill_N).toFixed(2),
            Total_ALL_FT_101_N: Number(item.Total_ALL_FT_101_N).toFixed(2),
            Total_ALL_FT_201_N: Number(item.Total_ALL_FT_201_N).toFixed(2),
            chemical_between_day_N: Number(item.chemical_between_day_N).toFixed(2),
            ro_between_day_N: Number(item.ro_between_day_N).toFixed(2),
            data_remaining_tank_Mix_N: Number(item.data_remaining_tank_Mix_N).toFixed(2),
            tank_Mix_between_day_N: Number(item.tank_Mix_between_day_N).toFixed(2),
            data_remaining_tank_Store_N: Number(item.data_remaining_tank_Store_N).toFixed(2),
            tank_Store_between_day_N: Number(item.tank_Store_between_day_N).toFixed(2),
            span_: "-",
            Total_ALL_FT_401_N: Number(item.Total_ALL_FT_401_N).toFixed(2),
            Total_ALL_FT_402_N: Number(item.Total_ALL_FT_402_N).toFixed(2),
            Total_ALL_FT_403_N: Number(item.Total_ALL_FT_403_N).toFixed(2),
            pd1_between_day_N: Number(item.pd1_between_day_N).toFixed(2),
            pd2_between_day_N: Number(item.pd2_between_day_N).toFixed(2),
            pd3_between_day_N: Number(item.pd3_between_day_N).toFixed(2),
            totalAll_use_between_day_N: Number(item.totalAll_use_between_day_N).toFixed(2),
            density_H: Number(item.density_H).toFixed(2),
            data_remaining_fill_H: Number(item.data_remaining_fill_H).toFixed(2),
            data_remaining_fill_total_H: Number(item.data_remaining_fill_total_H).toFixed(2),
            Fill_between_day_H: Number(item.Fill_between_day_H).toFixed(2),
            data_Fill_H: Number(item.data_Fill_H).toFixed(2),
            Total_ALL_FT_101_H: Number(item.Total_ALL_FT_101_H).toFixed(2),
            Total_ALL_FT_201_H: Number(item.Total_ALL_FT_201_H).toFixed(2),
            chemical_between_day_H: Number(item.chemical_between_day_H).toFixed(2),
            ro_between_day_H: Number(item.ro_between_day_H).toFixed(2),
            data_remaining_tank_Mix_H: Number(item.data_remaining_tank_Mix_H).toFixed(2),
            tank_Mix_between_day_H: Number(item.tank_Mix_between_day_H).toFixed(2),
            data_remaining_tank_Store_H: Number(item.data_remaining_tank_Store_H).toFixed(2),
            tank_Store_between_day_H: Number(item.tank_Store_between_day_H).toFixed(2),
            Total_ALL_FT_401_H: Number(item.Total_ALL_FT_401_H).toFixed(2),
            Total_ALL_FT_402_H: Number(item.Total_ALL_FT_402_H).toFixed(2),
            Total_ALL_FT_403_H: Number(item.Total_ALL_FT_403_H).toFixed(2),
            Total_ALL_FT_501_H: Number(item.Total_ALL_FT_501_H).toFixed(2),
            pd1_between_day_H: Number(item.pd1_between_day_H).toFixed(2),
            pd2_between_day_H: Number(item.pd2_between_day_H).toFixed(2),
            pd3_between_day_H: Number(item.pd3_between_day_H).toFixed(2),
            es_between_day_H: Number(item.es_between_day_H).toFixed(2),
            total_use_between_day_H: Number(item.total_use_between_day_H).toFixed(2),
            totalAll_use_between_day_H: Number(item.totalAll_use_between_day_H).toFixed(2),
        };
    });
};

export default async function Forms1csv(
    plantName: string,
    unit: string = "Liter",
    tank: string = "1+2",
    aggregation: string = "perday",
    period: string = "1day",
    date_start: string = format(new Date(), 'yyyy-MM-dd'),
    date_end: string = format(new Date(), 'yyyy-MM-dd')
)
{

    var start_timeDisplay = date_start;
    var end_timeDisplay = date_end;

    const apiUrl =  "reportoverview";

        await fetcher(`/api/${apiUrl}?tank=${tank}&unit=${unit}&aggregation=${aggregation}&period=${period}&date_start=${date_start}&date_end=${date_end}`
    )
    .then((datareponse) => {
        
        data = datareponse.result;
        start_timeDisplay = datareponse.start_timeDisplay;
        end_timeDisplay = datareponse.end_timeDisplay;
        // console.log(data);
        return;
    })
    .catch((error) => {
        console.error("Failed to fetch data:", error);
        // return;
    });

    // console.log("aggregation", aggregation);

    const aggregation_value = await Aggregation(aggregation);

    const unit_value = await Unit(unit);

    try{

        const datatable = convertedData(data);

        const period_value = await CheckPeriod(period);

        const today = format(new Date(), 'yyyy-MM-dd');

        const filename: string = `Report ${plantName}.csv`;
        
        const csvString = await convertToCSV(
            datatable as any, 
            "Report "+plantName, 
            unit_value,
            tank,
            aggregation_value,
            period_value,
            start_timeDisplay,
            end_timeDisplay
        );
    
        // Create a Blob from the CSV string
        const BOM = '\uFEFF';
        const blob = new Blob([BOM+csvString], { type: 'text/csv;charset=utf-8;' });
        
        // Create a temporary link element
        const link = document.createElement('a');
        if (link.download !== undefined) { // Feature detection for the download attribute
            // Create a URL for the blob and set the download link
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            
            // Append to the document body, click it, and then remove it
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up the URL object
            URL.revokeObjectURL(url);
        }

        // 2. ปิด Loading เมื่อสั่ง Download สำเร็จ
        Swal.close();
        return "New CSV Generated";
      
      // setIsLoading(false);
    } catch (error) {

      console.error("Error loading or adding font to jsPDF:", error);
      // Swal.fire('ข้อผิดพลาด', `${error instanceof Error ? error.message : String(error)}`, 'error');

    }

  
}
