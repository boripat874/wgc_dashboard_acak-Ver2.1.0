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

// Call applyPlugin to extend the jsPDF object
applyPlugin(jsPDF);

// import CustomLegendProps from '@/components/reportPdf/legendcustent';

interface Data {
  dateTime: string;
  density: number;
  data_remaining_fill: number;
  data_remaining_fill_total: number;
  Fill_between_day: number;
  data_Fill: number;
}

// Sample data for the chart
var data: Data[] = [];


async function convertToCSV(
    data: Data[], 
    plantName_: string,
    reportName_: string,
    UnitName_: string,
    tank_: string,
    aggregation_: string,
    period_: string,
    date_start_: string,
    date_end_: string,
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

    var C1 = 4;
    var C2 = 50;

    if(plantName_ === "NaOH"){
        C1 = 4;
        C2 = 50;
    }else if(plantName_ === "HCl"){
        C1 = 6;
        C2 = 35;

    }

    // const unit_value = await Unit(UnitName_);

    const HEADERS: { [key in keyof Data]: string } = {
        dateTime: 'วันที่',
        density: 'Density',
        data_remaining_fill: `คงเหลือ Tank ${plantName_} (${C2}%) (L)`,
        data_remaining_fill_total: `คงเหลือ ${plantName_} (${C2}%) รวมสูตร (kg)`,
        Fill_between_day: `ผลต่าง ${plantName_} (${C2}%) ใน Tank ระหว่างวัน (kg)`,
        data_Fill: `รับเข้าใหม่ (kg)`
    };

    // 1. สร้างแถวหัวตารางจากค่าใน HEADERS
    // const headers = Object.keys(data[0]) as (keyof Data)[];
    // const headerRow = headers.map(key => HEADERS[key]).join(',');

    const headerRow = Object.values(HEADERS).join(',');

    let tableRows = [] as any;


    if (data.length !== 0) {
        // return '';
        // 2. สร้างแถวข้อมูลตามลำดับของ headers
        // const dataRows = data.map(row => 
            
        //     headers.map(fieldName => {
        //         // ดึงค่าตามชื่อคีย์เดิม
        //         const value = row[fieldName];
        //         return String(value);
        //     }).join(',')
        // );
        data.forEach((item) => {

            tableRows.push([

                item.dateTime, // วันที่
                item.density,
                item.data_remaining_fill,
                item.data_remaining_fill_total,
                item.Fill_between_day,
                item.data_Fill
            ]);
        });
        
    }


    // 3. รวมหัวตารางและข้อมูลเข้าด้วยกัน
    return [`${reportName_}\nPeriod : ${period_},Time Start : ${date_start_== "--"?date_start_.replace(/-/g, '/'): date_start_},Time End : ${date_end_ == "--"?date_end_.replace(/-/g, '/'):date_end_}`,headerRow, ...tableRows].join('\n');
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
            density: Number(item.density),
            data_remaining_fill: Number(item.data_remaining_fill),
            data_remaining_fill_total: Number(item.data_remaining_fill_total),
            Fill_between_day: Number(item.Fill_between_day),
            data_Fill: Number(item.data_Fill)
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

    var apiUrl = "reportnaohrecieved"

    var period_ = "- Day"
    var start_timeDisplay = "--";
    var end_timeDisplay = "--";
    
    const geturl = async() => {

        if(plantName === "Alkaline"){
        return "reportnaohrecieved";
        }else if(plantName === "Acid"){
        return "reporthcirecieved";
        }else{
        return "reportnaohrecieved";
        }

    }

    apiUrl =  await geturl();

        await fetcher(`/api/${apiUrl}?tank=${tank}&unit=${unit}&aggregation=${aggregation}&period=${period}&date_start=${date_start}&date_end=${date_end}`
    )
    .then((datareponse) => {
        
        data = datareponse.result;
        period_ = datareponse.period_Display;
        start_timeDisplay = datareponse.start_timeDisplay;
        end_timeDisplay = datareponse.end_timeDisplay;
        // console.log(data);
        return;
    })
    .catch((error) => {
        console.error("Failed to fetch data:", error);
        // return;
    });

    // if(tank === "12"){
    //     tank = "1+2";
    // }

    // console.log("aggregation", aggregation);

    const aggregation_value = await Aggregation(aggregation);

    const unit_value = await Unit(unit);

    try{

        const datatable = convertedData(data);

        const period_value = await CheckPeriod(period);

        var plantName_ = "";
        // var bgcolor_ = "#6FD195";

        if(plantName === "Alkaline"){
            plantName_ = "NaOH";
            // bgcolor_ = "#6FD195";
        }else if(plantName === "Acid"){
            plantName_ = "HCl";
            // bgcolor_ = "#537FF1"; // Set a different background color for Acid
        }

        const today = format(new Date(), 'yyyy-MM-dd');

        const filename: string = `Report Fill ${plantName_}.csv`;

        const csvString = await convertToCSV(
            datatable, 
            plantName_,
            "Report Fill "+plantName_, 
            unit_value,
            tank,
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
