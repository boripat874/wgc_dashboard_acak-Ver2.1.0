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
  remaining_tank3?: number;
  remaining_tank4?: number;
  total_use?: number;
  error?: number;
  pd1_total?: number;
  pd1_value?: number;
  pd1_ro?: number;
  pd2_total?: number;
  pd2_value?: number;
  pd2_ro?: number;
  pd3_total?: number;
  pd3_value?: number;
  pd3_ro?: number;

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
    date_end_: string

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

    const HEADERS: { [key in keyof Data]: string } = {

        date_time: "Date",
        remaining_tank3: `Remaining Tank 3 (${UnitName_})`,
        remaining_tank4: `Remaining Tank 4 (${UnitName_})`,
        total_use: `Total Use (${UnitName_})`,
        error: `Error (${UnitName_})`,
        pd1_total: `PD1 ${plantName_} Total (${UnitName_})`,
        pd1_value: `PD1 ${plantName_} (${UnitName_})`,
        pd1_ro: `PD1 RO (${UnitName_})`,
        pd2_total: `PD2 ${plantName_} Total (${UnitName_})`,
        pd2_value: `PD2 ${plantName_} (${UnitName_})`,
        pd2_ro: `PD2 RO (${UnitName_})`,
        pd3_total: `PD3 ${plantName_} Total (${UnitName_})`,
        pd3_value: `PD3 ${plantName_} (${UnitName_})`,
        pd3_ro: `PD3 RO (${UnitName_})`,
        
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
    return [`${reportName_},Aggregation : ${aggregation_},Unit : ${UnitName_},Period : ${period_},Time Start : ${date_start_},Time End : ${date_end_}`,headerRow, ...dataRows].join('\n');
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
            date_time: newDate,
            remaining_tank3: item.remaining_tank3,
            remaining_tank4: item.remaining_tank4,
            total_use: item.total_use,
            error: item.error,
            pd1_total: item.pd1_total,
            pd1_value: item.pd1_value,
            pd1_ro: item.pd1_ro,
            pd2_total: item.pd2_total,
            pd2_value: item.pd2_value,
            pd2_ro: item.pd2_ro,
            pd3_total: item.pd3_total,
            pd3_value: item.pd3_value,
            pd3_ro: item.pd3_ro
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

    console.log("start_timeDisplay :", start_timeDisplay);
    console.log("end_timeDisplay :", end_timeDisplay);
    // setIsLoading(true);

    try {

        const today = format(new Date(), 'yyyy-MM-dd');

        const filename: string = `Report Used ${plantName_} ${today} .csv`;

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

  

};
