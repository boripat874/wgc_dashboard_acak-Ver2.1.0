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

    // 1. แสดง Loading ทันที
    Swal.fire({
        title: 'กำลังเตรียมไฟล์ CSV...',
        html: 'ระบบกำลังดึงข้อมูลและจัดทำรูปแบบไฟล์',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    var C1 = 4;
    var C2 = 50;

    if(plantName_ === "NaOH"){
        C1 = 4;
        C2 = 50;
    }else if(plantName_ === "HCl"){
        C1 = 6;
        C2 = 35;

    }

    const HEADERS: { [key in keyof Data]: string } = {

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
        Total_ALL_Used: `Used total ${plantName_} (${C1}%) (L)`,
        Total_ALL_Used_chemical: `Used total ${plantName_} (${C2}%) (L)`,
        Total_ALL_Used_ro: `Used total RO (L)`
        
    };

    if (data.length === 0) {
        return '';
    }

    // 1. สร้างแถวหัวตารางจากค่าใน HEADERS
    const headers = Object.keys(data[0]) as (keyof Data)[];
    const headerRow = headers.map(key => HEADERS[key]).join(',');

    // 2. สร้างแถวข้อมูลตามลำดับของ headers
    const dataRows = data.map(row => 
        headers.map(fieldName => {
            // ดึงค่าตามชื่อคีย์เดิม
            const value = row[fieldName];
            return String(value);
        }).join(',')
    );

    // 3. รวมหัวตารางและข้อมูลเข้าด้วยกัน
    return [`${reportName_}\nPeriod : ${period_},Time Start : ${date_start_},Time End : ${date_end_}`,headerRow, ...dataRows].join('\n');
}

const convertedData = (originalData: Data[]) => {
    let i = 0;

    // Use map and return the NEW array it creates
    return originalData.map(item => { 

        i++;

        const originalDate = item.dateTime; // เช่น: '2025-01-20'
        
        // 1. แทนที่ตัวคั่น '-' ด้วยขีดกลาง '/'
        const newDate = originalDate.replaceAll(/-/g, '/'); 
        
        // คืนค่าอ็อบเจกต์ใหม่ (พร้อมดึง properties อื่นๆ ถ้ามี)
        // NOTE: If you need to keep other properties, you must spread them: {...item, number: i, date_time: newDate}
        return { 
            dateTime: newDate, 
            data_remaining_tank_Mix: Number(item.data_remaining_tank_Mix),
            data_remaining_tank_Mix_chemical: Number(item.data_remaining_tank_Mix_chemical),
            data_remaining_tank_Mix_ro: Number(item.data_remaining_tank_Mix_ro),
            tank_Mix_between_day: Number(item.tank_Mix_between_day),
            data_remaining_tank_Store: Number(item.data_remaining_tank_Store),
            data_remaining_tank_Store_chemical: Number(item.data_remaining_tank_Store_chemical),
            data_remaining_tank_Store_ro: Number(item.data_remaining_tank_Store_ro),
            tank_Store_between_day: Number(item.tank_Store_between_day) ,
            Total_ALL_FT_401: Number(item.Total_ALL_FT_401) ,
            Total_ALL_FT_401_chemical: Number(item.Total_ALL_FT_401_chemical) ,
            Total_ALL_FT_401_ro: Number(item.Total_ALL_FT_401_ro) ,
            Total_ALL_FT_402: Number(item.Total_ALL_FT_402) ,
            Total_ALL_FT_402_chemical: Number(item.Total_ALL_FT_402_chemical) ,
            Total_ALL_FT_402_ro: Number(item.Total_ALL_FT_402_ro) ,
            Total_ALL_FT_403: Number(item.Total_ALL_FT_403) ,
            Total_ALL_FT_403_chemical: Number(item.Total_ALL_FT_403_chemical) ,
            Total_ALL_FT_403_ro: Number(item.Total_ALL_FT_403_ro) ,
            Total_ALL_Used: Number(item.Total_ALL_Used) ,
            Total_ALL_Used_chemical: Number(item.Total_ALL_Used_chemical) ,
            Total_ALL_Used_ro: Number(item.Total_ALL_Used_ro)
        };
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

    var start_timeDisplay = date_start;
    var end_timeDisplay = date_end;
          
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

    console.log("Fetching data from API:", `/api/${apiUrl}?unit=${unit}&aggregation=${aggregation}&period=${period}&date_start=${date_start}&date_end=${date_end}`);
    
    await fetcher(`/api/${apiUrl}?unit=${unit}&aggregation=${aggregation}&period=${period}&date_start=${date_start}&date_end=${date_end}`
    )
    .then((dataresponse) => {

        data = dataresponse.result;
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

    const datatable = convertedData(data);

    // console.log("start_timeDisplay :", start_timeDisplay);
    // console.log("end_timeDisplay :", end_timeDisplay);
    // setIsLoading(true);

    try {

        const today = format(new Date(), 'yyyy-MM-dd');

        const filename: string = `Report Used ${plantName_}.csv`;

        const csvString = convertToCSV(
            datatable, 
            plantName_,
            "Report Used "+plantName_,
            unit_value,
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

  

};
