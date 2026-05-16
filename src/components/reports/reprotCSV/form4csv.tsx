import React from 'react'
// import { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,LabelList, LineChart, Line, Cell } from 'recharts';
import axios from 'axios';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import Logo from 'public/report/Logo.png';
import { fetcher } from "@/app/utils/fetcher";

import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
import { rgba } from 'framer-motion';
import {CheckPeriod,Aggregation,Unit} from '../reportPdf/funtionComponents';


// Call applyPlugin to extend the jsPDF object
applyPlugin(jsPDF);

// import CustomLegendProps from '@/components/reportPdf/legendcustent';

interface Data {

  dateTime: string;
  data_remaining_tank_Mix: number;
  data_remaining_tank_Mix_chemical: number;
  data_remaining_tank_Mix_ro: number;
  tank_Mix_between_day: number;
  data_remaining_tank_Store: number;
  data_remaining_tank_Store_chemical: number;
  data_remaining_tank_Store_ro: number;
  tank_Store_between_day: number;
  Total_ALL_FT_401: number;
  Total_ALL_FT_401_chemical: number;
  Total_ALL_FT_401_ro: number;
  Total_ALL_FT_402: number;
  Total_ALL_FT_402_chemical: number;
  Total_ALL_FT_402_ro: number;
  Total_ALL_FT_403: number;
  Total_ALL_FT_403_chemical: number;
  Total_ALL_FT_403_ro: number;
  Total_ALL_FT_501: number;
  Total_ALL_FT_501_chemical: number;
  Total_ALL_FT_501_ro: number;
  Total_ALL_Used: number;
  Total_ALL_Used_chemical: number;
  Total_ALL_Used_ro: number;

}

// Sample data for the chart
var data: Data[] = [];


function convertToCSV(
    data: Data[], 
    plantName_: string, 
    reportName_: string,
    UnitName_: string,
    aggregation_: string,
    period_: string,
    date_start_: string,
    date_end_: string,
): string {

    // if (data.length === 0) {
    //     return '';
    // }

    let C1 = 0;
    let C2 = 0;

    if (plantName_ === "NaOH") {
        C1 = 4;
        C2 = 50;
    } else if (plantName_ === "HCl") {
        C1 = 6;
        C2 = 35;
    }

    // 1. กำหนดโครงสร้างคอลัมน์พื้นฐาน (Base Headers) เพื่อใช้ควบคุมลำดับ (Order)
    const baseHeaders: { [key: string]: string } = {
        dateTime: "วันที่",
        data_remaining_tank_Mix: `คงเหลือ Tank Mix ${plantName_} (${C1}%) (L)`,
        data_remaining_tank_Mix_chemical: `คงเหลือ Tank Mix คิดเป็น ${plantName_} (${C2}%) (L)`,
        data_remaining_tank_Mix_ro: `คงเหลือ Tank Mix คิดเป็น RO (L)`,
        tank_Mix_between_day: `ผลต่างใน Tank Mix ระหว่างวัน (${C1}%) (L)`,
        data_remaining_tank_Store: `คงเหลือ Tank Store ${plantName_} (${C1}%) (L)`,
        data_remaining_tank_Store_chemical: `คงเหลือ Tank Store คิดเป็น ${plantName_} (${C2}%) (L)`,
        data_remaining_tank_Store_ro: `คงเหลือ Tank Store คิดเป็น RO (L)`,
        tank_Store_between_day: `ผลต่างใน Tank Store ระหว่างวัน (${C1}%) (L)`,
        Total_ALL_FT_401: `ผลต่างมิเตอร์ระหว่างวัน PD1 ${plantName_} (${C1}%) (L)`,
        Total_ALL_FT_401_chemical: `ผลต่างมิเตอร์ระหว่างวัน PD1 คิดเป็น ${plantName_} (${C2}%) (L)`,
        Total_ALL_FT_401_ro: `ผลต่างมิเตอร์ระหว่างวัน PD1 คิดเป็น RO (L)`,
        Total_ALL_FT_402: `ผลต่างมิเตอร์ระหว่างวัน PD2 ${plantName_} (${C1}%) (L)`,
        Total_ALL_FT_402_chemical: `ผลต่างมิเตอร์ระหว่างวัน PD2 คิดเป็น ${plantName_} (${C2}%) (L)`,
        Total_ALL_FT_402_ro: `ผลต่างมิเตอร์ระหว่างวัน PD2 คิดเป็น RO (L)`,
        Total_ALL_FT_403: `ผลต่างมิเตอร์ระหว่างวัน PD3 ${plantName_} (${C1}%) (L)`,
        Total_ALL_FT_403_chemical: `ผลต่างมิเตอร์ระหว่างวัน PD3 คิดเป็น ${plantName_} (${C2}%) (L)`,
        Total_ALL_FT_403_ro: `ผลต่างมิเตอร์ระหว่างวัน PD3 คิดเป็น RO (L)`,
    };

    // 2. ถ้าเป็น HCl ให้เพิ่ม FT_501 แทรกเข้าไปในตำแหน่งที่ต้องการ (ตัวอย่างนี้เอาไว้ก่อน Total_Used)
    if (plantName_ === "HCl") {
        baseHeaders.Total_ALL_FT_501 = `ผลต่างมิเตอร์ระหว่างวัน ES ${plantName_} (${C1}%) (L)`;
        baseHeaders.Total_ALL_FT_501_chemical = `ผลต่างมิเตอร์ระหว่างวัน ES คิดเป็น ${plantName_} (${C2}%) (L)`;
        baseHeaders.Total_ALL_FT_501_ro = `ผลต่างมิเตอร์ระหว่างวัน ES คิดเป็น RO (L)`;
    }

    // ฟิลด์ปิดท้ายสำหรับทุก Plant
    baseHeaders.Total_ALL_Used = `Used total ${plantName_} (${C1}%) (L)`;
    baseHeaders.Total_ALL_Used_chemical = `Used total ${plantName_} (${C2}%) (L)`;
    baseHeaders.Total_ALL_Used_ro = `Used total RO (L)`;


    // ฟังก์ชันช่วยสำหรับการครอบฟิลด์ด้วย "" และ escape เครื่องหมาย " (ป้องกัน CSV พัง)
    const escapeCSV = (val: any) => {
        if (val === null || val === undefined) return '""';
        let str = String(val);
        // ถ้ามีเครื่องหมาย " ให้เปลี่ยนเป็น "" ซ้อนกันตามมาตรฐาน CSV
        if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
            str = `"${str.replace(/"/g, '""')}"`;
        } else {
            str = `"${str}"`; // ครอบไว้เพื่อความปลอดภัย
        }
        return str;
    };

    // 3. ดึง Keys ทั้งหมดจากที่เราจัดระเบียบไว้ เพื่อบังคับลำดับคอลัมน์ให้ตรงกันเสมอ
    const targetKeys = Object.keys(baseHeaders) as (keyof Data)[];

    // 4. สร้างแถวหัวตาราง (Header Row)
    const headerRow = targetKeys.map(key => escapeCSV(baseHeaders[key as string])).join(',');

    // 5. สร้างแถวข้อมูล (Data Rows) โดยวิ่งตามลำดับของ targetKeys
    const dataRows = data.map(row => 
        targetKeys.map(fieldName => escapeCSV(row[fieldName])).join(',')
    );

    // 6. จัดการ Metadata หัวไฟล์ (หลีกเลี่ยงการใช้เครื่องหมายจุลภาคในบรรทัด Metadata ตรงๆ)
    const metadataHeader = [
        escapeCSV(reportName_),
        `Period : ${period_}, Time Start : ${date_start_}, Time End : ${date_end_}`
    ].join('\n');

    // 7. รวมทั้งหมดเข้าด้วยกัน
    return [metadataHeader, headerRow, ...dataRows].join('\n');
}

const convertedData = (originalData: Data[], plantName_: string) => {
    // ใช้ map เพื่อสร้างและคืนค่า Array ใหม่
    return originalData.map(item => { 
        const result: any = {};

        // วนลูปอ่านทุก Key ที่มีใน item อัตโนมัติ (ไม่ต้องเขียน if-else แยก plantName_ เลย)
        for (const key in item) {
            if (key === 'dateTime') {
                // 1. แทนที่ตัวคั่น '-' ด้วยขีดกลาง '/'
                result[key] = String(item[key]).replaceAll(/-/g, '/');
            } else {
                // 2. แปลงฟิลด์อื่นๆ ทั้งหมดเป็น Number (ถ้าค่าเป็น null/undefined ให้ใส่ 0)
                const value = item[key as keyof Data];
                result[key] = value != null ? Number(value) : 0;
            }
        }

        return result;
    });
};

export default async function Forms4csv(
    
    plantName: string,
    plantUse: string = "PD1",
    unit: string = "Liter",
    aggregation: string = "perday",
    period: string = "1day",
    date_start: string = format(new Date(), 'yyyy-MM-dd'),
    date_end: string = format(new Date(), 'yyyy-MM-dd')
)
{

    var plantName_ = "";
    var bgcolor_ = "#B162AF";

    if(plantName === "Alkaline"){
    plantName_ = "NaOH";
    bgcolor_ = "#B162AF";
    }else if(plantName === "Acid"){
    plantName_ = "HCl";
    bgcolor_ = "#B9792B"; // Set a different background color for Acid
    }

    var apiUrl = ""

    var period_ = "- Day"
    var start_timeDisplay = "--";
    var end_timeDisplay = "--";
          
    const geturl = async() => {
        
        if(plantName === "Alkaline"){

            return "reportnaohused";

        }else if(plantName === "Acid"){

            return "reporthciused";

        }else{

            return "reportnaohused";
        }
    
    }
        
    apiUrl =  await geturl();

    // console.log("Fetching data from API:", `/api/${apiUrl}?unit=${unit}&aggregation=${aggregation}&period=${period}&date_start=${date_start}&date_end=${date_end}`);
    
    await fetcher(`/api/${apiUrl}?unit=${unit}&aggregation=${aggregation}&period=${period}&date_start=${date_start}&date_end=${date_end}`
    )
    .then((dataresponse) => {

        data = dataresponse.result;
        period_ = dataresponse.period_Display;
        start_timeDisplay = dataresponse.start_timeDisplay;
        end_timeDisplay = dataresponse. end_timeDisplay;
        // console.log(data);
        return;
    })
    .catch((error) => {

        console.error("Failed to fetch data:", error);

    // return;
    });

    const unit_value = await Unit(unit);
    const aggregation_value = await Aggregation(aggregation);
    const period_value = await CheckPeriod(period);

    const datatable = convertedData(data, plantName_);

    // console.log("start_timeDisplay :", start_timeDisplay);
    // console.log("end_timeDisplay :", end_timeDisplay);
    // setIsLoading(true);

    try {

        const today = format(new Date(), 'yyyy-MM-dd');

        const filename: string = `Report Used ${plantName_}.csv`;

        const csvString = convertToCSV(
            datatable as any, 
            plantName_,
            "Report Used "+plantName_,
            unit_value,
            aggregation_value,
            period_,
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

  

};
