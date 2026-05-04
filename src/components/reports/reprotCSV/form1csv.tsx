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

interface report{
  ordernumber: string;
  receiptnumber: string;
  paymentType : number;
  receiptcash: number;
  receiptchange: number;
  receiptdiscount: number;
  totalprice: number;
  create_at: string;
  orderid: string;
}

interface Data {
  date_time: string;
  start_time: string;
  end_time: string;
  Before_Fill: number;
  After_Fill: number;
  Error_Fill: number;
  result_Before_Fill: number;
  result_After_Fill: number;
  result_Error_Fill: number;
  System_Data_Fill: number;
  System_Data_Density: number;
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

    const unit_value = await Unit(UnitName_);

    const HEADERS: { [key in keyof Data]: string } = {
        date_time: 'Date',
        start_time: 'Time start',
        end_time: 'Time stop',
        Before_Fill: `Before Fill (${UnitName_})`,
        After_Fill: `After Fill (${UnitName_})`,
        Error_Fill: `Error Fill (${UnitName_})`,
        result_Before_Fill: `Before Fill (${UnitName_})`,
        result_After_Fill: `After Fill (${UnitName_})`,
        result_Error_Fill: `Error Fill (${UnitName_})`,
        System_Data_Fill: `System Data Fill (${UnitName_})`,
        System_Data_Density: 'System Data Density'
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
    return [`${reportName_},tank_ : ${tank_},Aggregation : ${aggregation_},Unit : ${unit_value},Period : ${period_},Time Start : ${date_start_},Time End : ${date_end_}`,headerRow, ...dataRows].join('\n');
}

const convertedData = (originalData: Data[]) => {
    let i = 0;

    // Use map and return the NEW array it creates
    return originalData.map(item => { 

        i++;

        const originalDate = item.date_time; // เช่น: '2025-01-20'
        
        // 1. แทนที่ตัวคั่น '-' ด้วยขีดกลาง '/'
        const newDate = originalDate.replace(/-/g, '/'); 
        
        // คืนค่าอ็อบเจกต์ใหม่ (พร้อมดึง properties อื่นๆ ถ้ามี)
        // NOTE: If you need to keep other properties, you must spread them: {...item, number: i, date_time: newDate}
        return {  
            date_time: newDate ,
            start_time: item.start_time,
            end_time: item.end_time,
            Before_Fill: Number(item.Before_Fill),
            After_Fill: Number(item.After_Fill),
            Error_Fill: Number(item.Error_Fill),
            result_Before_Fill: Number(item.result_Before_Fill),
            result_After_Fill: Number(item.result_After_Fill),
            result_Error_Fill: Number(item.result_Error_Fill),
            System_Data_Fill: Number(item.System_Data_Fill),
            System_Data_Density: Number(item.System_Data_Density)
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

    var start_timeDisplay = date_start;
    var end_timeDisplay = date_end;
    
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
        start_timeDisplay = datareponse.start_timeDisplay;
        end_timeDisplay = datareponse.end_timeDisplay;
        // console.log(data);
        return;
    })
    .catch((error) => {
        console.error("Failed to fetch data:", error);
        // return;
    });

    if(tank === "12"){
        tank = "1+2";
    }

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

        const filename: string = `Report Fill ${plantName_} ${today} .csv`;

        const csvString = await convertToCSV(
            datatable, 
            "Report Fill "+plantName_, 
            unit_value,
            tank,
            aggregation_value,
            period_value,
            start_timeDisplay,
            end_timeDisplay
        );
    
        // Create a Blob from the CSV string
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        
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
