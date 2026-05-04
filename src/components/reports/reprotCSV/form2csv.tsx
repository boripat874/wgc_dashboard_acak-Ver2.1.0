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
  number?: number;
  date_time: string;
  start_time: string;
  end_time: string;
  total: number;
  main_value?: number;
  ro_value?: number;
  tank3: number;
  error_value?: number;
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
        start_time: "Time Start",
        end_time: "Time Stop",
        total: `Total (${UnitName_})`,
        main_value: `${plantName_} (${UnitName_})`,
        ro_value: `RO (${UnitName_})`,
        tank3: `Mixer Tank 3 (${UnitName_})`,
        error_value: `Error (${UnitName_})`,
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
            start_time: item.start_time,
            end_time: item.end_time,
            total: item.total,
            main_value: item.main_value,
            ro_value: item.ro_value,
            tank3: item.tank3,
            error_value: item.error_value
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
    var start_timeDisplay = date_start;
    var end_timeDisplay = date_end;


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
        const period_value = await CheckPeriod(period);

        const today = format(new Date(), 'yyyy-MM-dd');

        const filename: string = `Report Mix ${plantName_} ${today} .csv`;

        const csvString = convertToCSV(
            datatable, 
            plantName_,
            "Report Mix "+plantName_,
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

  
}
