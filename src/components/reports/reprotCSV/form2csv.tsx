"use client";
// import { useEffect } from 'react';
// import ReactDOM from 'react-dom/client';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,LabelList, LineChart, Line, Cell } from 'recharts';
// import axios from 'axios';
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
  dateTime:string;
  Total_ALL_FT_101: number;
  Total_ALL_FT_201: number;
  chemical_between_day: number;
  ro_between_day: number;
  data_remaining_tank_Mix: number;
  tank_Mix_between_day: number;
  data_remaining_tank_Store: number;
  tank_Store_between_day: number;
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
    var nameTank1 = "FT101N";
    var nameTank2 = "FT102N";

    if(plantName_ === "NaOH"){
        C1 = 4;
        C2 = 50;
        nameTank1 = "FT101N";
        nameTank2 = "FT102N";
    }else if(plantName_ === "HCl"){
        C1 = 6;
        C2 = 35;
        nameTank1 = "FT101H";
        nameTank2 = "FT102H";
    }

    const HEADERS: { [key in keyof Data]: string } = {
        dateTime: "วันที่",
        Total_ALL_FT_101: `ตัวเลขมิเตอร์ (${nameTank1}) ${plantName_} (${C2}%) (L)`,
        Total_ALL_FT_201: `ตัวเลขมิเตอร์ (${nameTank2}) นํ้า RO (L)`,
        chemical_between_day: `ผลต่างมิเตอร์ระหว่างวัน (${nameTank1}) ${plantName_} (${C2}%) (L)`,
        ro_between_day: `ผลต่างมิเตอร์ระหว่างวัน (${nameTank2}) นํ้า RO  (L)`,
        data_remaining_tank_Mix: `คงเหลือ Tank Mix (L)`,
        tank_Mix_between_day: `ผลต่างใน Tank Mix ระหว่างวัน (L)`,
        data_remaining_tank_Store: `คงเหลือ Tank Store (L)`,
        tank_Store_between_day: `ผลต่างใน Tank Store ระหว่างวัน (L)`,
    };

    // 1. สร้างแถวหัวตารางจากค่าใน HEADERS
    // const headers = Object.keys(data[0]) as (keyof Data)[];
    // const headerRow = headers.map(key => HEADERS[key]).join(',');
    const headerRow = Object.values(HEADERS).join(',');

    let tableRows = [] as any;

    if (data.length === 0) {
        // return '';
        data.forEach((item) => {

            tableRows.push([

                item.dateTime, // วันที่
                item.Total_ALL_FT_101,
                item.Total_ALL_FT_201,
                item.chemical_between_day,
                item.ro_between_day,
                item.data_remaining_tank_Mix,
                item.tank_Mix_between_day,
                item.data_remaining_tank_Store,
                item.tank_Store_between_day

            ]);
        });
    }

    // 2. สร้างแถวข้อมูลตามลำดับของ headers
    // const dataRows = data.map(row => 
    //     headers.map(fieldName => {
    //         // ดึงค่าตามชื่อคีย์เดิม
    //         const value = row[fieldName];
    //         return String(value);
    //     }).join(',')
    // );

    // 3. รวมหัวตารางและข้อมูลเข้าด้วยกัน
    return [`${reportName_}\nperiod : ${period_},Time Start : ${date_start_== "--"?date_start_.replace(/-/g, '/'): date_start_},Time End : ${date_end_ == "--"?date_end_.replace(/-/g, '/'):date_end_}`,headerRow, ...tableRows].join('\n');
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
            dateTime: newDate,
            Total_ALL_FT_101: item.Total_ALL_FT_101,
            Total_ALL_FT_201:  item.Total_ALL_FT_201,
            chemical_between_day:  item.chemical_between_day,
            ro_between_day:  item.ro_between_day,
            data_remaining_tank_Mix:  item.data_remaining_tank_Mix,
            tank_Mix_between_day:  item.tank_Mix_between_day,
            data_remaining_tank_Store:  item.data_remaining_tank_Store,
            tank_Store_between_day:  item.tank_Store_between_day
        };
    });
};

export default async function Forms2csv(
    plantName: string,
    unit: string = "Liter",
    aggregation: string = "perday",
    period: string = "1day",
    date_start: string = format(new Date(), 'yyyy-MM-dd'),
    date_end: string = format(new Date(), 'yyyy-MM-dd')
)
{

    var apiUrl = "";
    var period_ = "- Day"
    var start_timeDisplay = "--";
    var end_timeDisplay = "--";

    const geturl = async() => {
    
        if(plantName === "Alkaline"){
        return "reportnaohmixed";
        }else if(plantName === "Acid"){
        return "reporthcimixed";
        }else{
        return "reportnaohmixed";
        }

    }
    
    apiUrl =  await geturl();

    await fetcher(`/api/${apiUrl}?unit=${unit}&aggregation=${aggregation}&period=${period}&date_start=${date_start}&date_end=${date_end}`
    )
    .then((dataresponse) => {
        data = dataresponse.result;
        period_ = dataresponse.period_Display;
        start_timeDisplay = dataresponse.start_timeDisplay;
        end_timeDisplay = dataresponse.end_timeDisplay;
        // console.log(data);
        return;
    })
    .catch((error) => {
        console.error("Failed to fetch data:", error);
        // return;
    });

    try{

        const datatable = convertedData(data);

        var plantName_ = "";
        var bgcolor_ = "#B162AF";

        if(plantName === "Alkaline"){
        plantName_ = "NaOH";
        bgcolor_ = "#B162AF";
        }else if(plantName === "Acid"){
            plantName_ = "HCl";
            bgcolor_ = "#B9792B"; // Set a different background color for Acid
        }

        const unit_value = await Unit(unit);
        const aggregation_value = await Aggregation(aggregation);
        // const period_value = await CheckPeriod(period);

        const today = format(new Date(), 'yyyy-MM-dd');

        const filename: string = `Report Mix ${plantName_}.csv`;

        const csvString = convertToCSV(
            datatable, 
            plantName_,
            "Report Mix "+plantName_,
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

  
}
