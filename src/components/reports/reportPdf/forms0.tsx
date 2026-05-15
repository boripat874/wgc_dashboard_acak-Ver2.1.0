import React from 'react'
import { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,LabelList, LineChart, Line, Cell } from 'recharts';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import Logo from '../../../../public/images/report/logo-wgc.png';

import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
import {CheckPeriod,Aggregation,Unit} from './funtionComponents';
import { fetcher } from "@/app/utils/fetcher";
import "../../../../public/fonts/thsarabun-normal";
import "../../../../public/fonts/thsarabunbold-normal";


// Call applyPlugin to extend the jsPDF object
applyPlugin(jsPDF);

interface Data {
  dateTime: string;
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

export default async function Forms0(
  setPdfPreviewUrl: (pdfDataUri: string) => void, 
  plantName: string,
  unit: string = "kg",
  tank: string = "12",
  aggregation: string = "perday",
  period: string = "1day",
  date_start: string = format(new Date(), 'yyyy-MM-dd'),
  date_end: string = format(new Date(), 'yyyy-MM-dd')
) {

    // แสดง Loader ทันทีเมื่อฟังก์ชันเริ่มทำงาน
    Swal.fire({
        title: 'กำลังสร้างรายงาน PDF...',
        html: 'กรุณารอสักครู่ ระบบกำลังประมวลผลข้อมูลและกราฟ',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading(); // แสดง Spinner ของ SweetAlert2
        }
    });

    // const [receiptOrder, setReceipt] = useState<report>();
    var period_Display = "- Day";
    var start_timeDisplay = "--";
    var end_timeDisplay = "--";


    const apiUrl =  "reportoverview";

      await fetcher(`/api/${apiUrl}?period=${period}&date_start=${date_start}&date_end=${date_end}`
    )
    .then((datareponse) => {
      
      // data = datareponse.result;
      // start_timeDisplay = datareponse.start_timeDisplay;
      // end_timeDisplay = datareponse.end_timeDisplay;

      // data = []
      // start_timeDisplay = "2026-03-25";
      // end_timeDisplay = "2026-03-31";

      // ตรวจสอบว่า datareponse และ datareponse.result มีค่าอยู่จริง
      if (datareponse && datareponse.result) {
        data = datareponse.result;
        period_Display = datareponse.period_Display;
        start_timeDisplay = datareponse.start_timeDisplay;
        end_timeDisplay = datareponse.end_timeDisplay;
      } else {
        // กรณีไม่มีข้อมูล ให้กำหนดเป็น Array ว่าง หรือจัดการตามเหมาะสม
        data = [];
        console.warn("API returned empty or invalid data:", datareponse);
        
        // แจ้งเตือนผู้ใช้ว่าไม่พบข้อมูล
        Swal.fire({
          icon: 'warning',
          title: 'ไม่พบข้อมูล',
          text: 'ในช่วงเวลาที่เลือกไม่มีข้อมูลการใช้งาน',
        });
      }

      return;
    })
    .catch((error) => {
      console.error("Failed to fetch data:", error);
      // return;

      data = []
      start_timeDisplay = "2026-01-01";
      end_timeDisplay = "2026-01-01";
    
      return;
    });

    // const period_value = await CheckPeriod(period);

    try {

      // --- การประมวลผลสำหรับ datachart เสร็จสมบูรณ์แล้ว ---
      // The program will wait here because convertedDatachart is synchronous.

      // 3. Corrected function for datatable conversion (synchronous)
      const convertedData = async (originalData: Data[]) => {
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
            // ...item, 
            dateTime: newDate, 
            density_N: Number(item.density_N).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            data_remaining_fill_N: Number(item.data_remaining_fill_N).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            data_remaining_fill_total_N: Number(item.data_remaining_fill_total_N).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            Fill_between_day_N: Number(item.Fill_between_day_N).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            data_Fill_N: Number(item.data_Fill_N).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            Total_ALL_FT_101_N: Number(item.Total_ALL_FT_101_N).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            Total_ALL_FT_201_N: Number(item.Total_ALL_FT_201_N).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            chemical_between_day_N: Number(item.chemical_between_day_N).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            ro_between_day_N: Number(item.ro_between_day_N).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            data_remaining_tank_Mix_N: Number(item.data_remaining_tank_Mix_N).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 
            tank_Mix_between_day_N: Number(item.tank_Mix_between_day_N).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            data_remaining_tank_Store_N: Number(item.data_remaining_tank_Store_N).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 
            tank_Store_between_day_N: Number(item.tank_Store_between_day_N).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            Total_ALL_FT_401_N: Number(item.Total_ALL_FT_401_N).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            Total_ALL_FT_402_N: Number(item.Total_ALL_FT_402_N).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            Total_ALL_FT_403_N: Number(item.Total_ALL_FT_403_N).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),

            pd1_between_day_N: Number(item.pd1_between_day_N).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            pd2_between_day_N: Number(item.pd2_between_day_N).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            pd3_between_day_N: Number(item.pd3_between_day_N).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            totalAll_use_between_day_N: Number(item.totalAll_use_between_day_N).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            density_H: Number(item.density_H).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            data_remaining_fill_H: Number(item.data_remaining_fill_H).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            data_remaining_fill_total_H: Number(item.data_remaining_fill_total_H).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            Fill_between_day_H: Number(item.Fill_between_day_H).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            data_Fill_H: Number(item.data_Fill_H).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            Total_ALL_FT_101_H: Number(item.Total_ALL_FT_101_H).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            Total_ALL_FT_201_H: Number(item.Total_ALL_FT_201_H).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            chemical_between_day_H: Number(item.chemical_between_day_H).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            ro_between_day_H: Number(item.ro_between_day_H).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            data_remaining_tank_Mix_H: Number(item.data_remaining_tank_Mix_H).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 
            tank_Mix_between_day_H: Number(item.tank_Mix_between_day_H).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            data_remaining_tank_Store_H: Number(item.data_remaining_tank_Store_H).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 
            tank_Store_between_day_H: Number(item.tank_Store_between_day_H).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            Total_ALL_FT_401_H: Number(item.Total_ALL_FT_401_H).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            Total_ALL_FT_402_H: Number(item.Total_ALL_FT_402_H).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            Total_ALL_FT_403_H: Number(item.Total_ALL_FT_403_H).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            Total_ALL_FT_501_H: Number(item.Total_ALL_FT_501_H).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            pd1_between_day_H: Number(item.pd1_between_day_H).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            pd2_between_day_H: Number(item.pd2_between_day_H).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            pd3_between_day_H: Number(item.pd3_between_day_H).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            es_between_day_H: Number(item.es_between_day_H).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            total_use_between_day_H: Number(item.total_use_between_day_H).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            totalAll_use_between_day_H: Number(item.totalAll_use_between_day_H).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

          };

        });

      };

      // 4. Assign the result back to datatable
      const datatable = await convertedData(data);

        // คำนวณความสูงอัตโนมัติ
        const baseHeight = 90; // ความสูงพื้นฐาน (header, footer ฯลฯ)
        const lineHeight = 5;  // ความสูงแต่ละบรรทัด
        // const productLines = receiptOrder?.products?.length || 0;
        const productLines = 0;
        const extraHeight = productLines * lineHeight;
        const totalHeight = baseHeight + extraHeight;

        const imgLogo = new Image();
        imgLogo.src = Logo.src;

        // 2. สร้างเอกสาร
        const doc = new jsPDF({
          unit: "mm",
          format: "a4",
          orientation: "landscape",
        });

        // 3. ลงทะเบียนฟอนต์ (หัวใจสำคัญคือบรรทัดนี้ครับ)
        // doc.addFileToVFS(fontFileName, sarabunBase64);
        // doc.addFont(fontFileName, "Sarabun", "normal");
        // doc.addFont(fontFileName, "Sarabun", "bold"); // ใช้ไฟล์เดียวกันไปก่อนถ้าไม่มีไฟล์ Bold แยก

        doc.setProperties({
          title: `Report ${plantName} ${format(new Date(), 'yyyy-MM-dd')}`,
          subject: 'WGC Dashboard PDF',
          // author: 'Your Name',d
          // keywords: 'jsPDF, example, tutorial',
          creator: 'WGC Dashboard system',
        });
  
        doc.setFont("Sarabun", "bold");

        // doc.text("ทดสอบภาษาไทย", 10, 10);
        
        // --- Content ---
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 5;
        let yPosition = 20;
        
        doc.setFontSize(16);
        // doc.setFontStyle('bold');

        doc.rect(5, yPosition-12, (pageWidth - 2 * margin), 20);

        // Add the image to the PDF
        doc.addImage(imgLogo, 'PNG', 10, 13, 30, 10); // Adjust position and dimensions

        doc.text(`Report ${plantName}`, pageWidth / 2, yPosition, { align: 'center'});
        
        doc.setFont("Sarabun", "normal");
        // if (receiptOrder) {

          yPosition += lineHeight + 12;
    
          // Date and Time
          // const orderDate = new Date(receiptOrder.create_at*1000);
          const orderDate = new Date();

          const formattedOrderDate = `${orderDate.getDate()}/${orderDate.getMonth() + 1}/${orderDate.getFullYear()}`;
          const formattedOrderTime = `${orderDate.getHours()}:${orderDate.getMinutes()}`;

          const rows2 = margin+40;
          const rows3 = margin+80;
          const rows4 = margin+130;
          const rows5 = margin+170;
          const rows6 = margin+220;

          doc.setFontSize(8);

          // doc.text(`Tank : ${tank}`, margin+10, yPosition);
          
          // yPosition += lineHeight;
          
          // doc.text(`Unit : ${unit_value}`, rows2, yPosition);
          // doc.text(`Data aggregation : ${aggregation_value}`, rows3, yPosition);
          doc.text(`Period : ${period_Display}`, margin+10, yPosition);
          // doc.text(`Period : 1 Day`, rows3, yPosition);

          // yPosition += lineHeight;

          doc.text(`Time Start : ${start_timeDisplay == "--"?start_timeDisplay : start_timeDisplay.replace(/-/g, '/')}`, rows2, yPosition);
          doc.text(`Time End : ${end_timeDisplay == "--"?end_timeDisplay : end_timeDisplay.replace(/-/g, '/')}`, rows3, yPosition);

          // doc.text(`Time Start : 2025-08-08`, margin, yPosition);
          // doc.text(`Time End : 2025-08-12`, rows2, yPosition);

          // yPosition += lineHeight;

          // Add the chart image to the PDF
          const chartWidth = 200; // mm
          // const chartX = (doc.internal.pageSize.getWidth() - chartWidth) / 2;

          // yPosition += lineHeight+30;

          //===============================================================================
          yPosition += 5;

          doc.setFontSize(12);

          // const datatable = [
          //   { id: 1, date: "-/-/-", timeStart: "00:00", timeStop: "00:00", value: 0 },
          // ];

          // Define columns and rows for the table
          const tableColumn = [
            "วันที่", 
            "รายการ", 
            "Density", 
            `คงเหลือ Tank เข้มข้น\n(L)`, 
            `คงเหลือเข้มข้นรวมสูตร\n(kg)`, 
            `ผลต่างเข้มข้นใน Tank\nระหว่างวัน (kg)`, 
            `รับเข้าใหม่\n(kg)`, 
            `ตัวเลขมิเตอร์\nเคมี (L)`, 
            `ตัวเลขมิเตอร์น้ำ\nRO (L)`, 
            `ผลต่างมิเตอร์ระหว่างวัน\nเคมี RO (L) `, 
            `ผลต่างมิเตอร์ระหว่างวัน\nน้ำ RO (L) `, 
            "คงเหลือ Tank Mix\n(L)",
            "ผลต่างใน Tank Mix\nระหว่างวัน (L)",
            "คงเหลือ Tank Store\n(L)",
            "ผลต่างใน Tank Store\nระหว่างวัน (L)",
            " ",
            "ตัวเลขมิเตอร์\n(L)",
            "ผลต่างมิเตอร์\nระหว่างวัน (L)",
            "ผลต่างมิเตอร์\nทั้งวัน(L)"
          ];

          let tableRows = [] as any;

          datatable.forEach((item) => {
            // --- ส่วนของ กรดเกลือ (N) ---
            // แถวแรกของกรดเกลือ จะมีข้อมูลหลัก + ข้อมูล PD1

            tableRows.push([
                { content: item.dateTime, rowSpan: 3 }, // วันที่
                { content: "กรดเกลือ", rowSpan: 3 },    // รายการ
                { content: item.density_N, rowSpan: 3 }, // Density
                { content: item.data_remaining_fill_N, rowSpan: 3 },
                { content: item.data_remaining_fill_total_N, rowSpan: 3 },
                { content: item.Fill_between_day_N, rowSpan: 3 },
                { content: item.data_Fill_N, rowSpan: 3 },
                { content: item.Total_ALL_FT_101_N, rowSpan: 3 },
                { content: item.Total_ALL_FT_201_N, rowSpan: 3 },
                { content: item.chemical_between_day_N, rowSpan: 3 },
                { content: item.ro_between_day_N, rowSpan: 3 },
                { content: item.data_remaining_tank_Mix_N, rowSpan: 3 },
                { content: item.tank_Mix_between_day_N, rowSpan: 3 },
                { content: item.data_remaining_tank_Store_N, rowSpan: 3 },
                { content: item.tank_Store_between_day_N, rowSpan: 3 },
                "PD1", item.Total_ALL_FT_401_N, item.pd1_between_day_N, 
                { content: "", rowSpan: 2 } // ผลต่างมิเตอร์ทั้งวัน (ว่างไว้รอแถวสุดท้าย)
            ]);
            tableRows.push(["PD2", item.Total_ALL_FT_402_N, item.pd2_between_day_N]);
            tableRows.push(["PD3", item.Total_ALL_FT_403_N, item.pd3_between_day_N, item.totalAll_use_between_day_N]);

            // // --- ส่วนของ โซดาไฟ (H) ---
            // // ทำเหมือนกัน แต่เพิ่มแถว ES เข้าไปด้วยตามรูป
            
            tableRows.push([
                { content: item.dateTime, rowSpan: 4 },
                { content: "โซดาไฟ", rowSpan: 4 },
                { content: item.density_H, rowSpan: 4 },
                { content: item.data_remaining_fill_H, rowSpan: 4 },
                { content: item.data_remaining_fill_total_H, rowSpan: 4 },
                { content: item.Fill_between_day_H, rowSpan: 4 },
                { content: item.data_Fill_H, rowSpan: 4 },
                { content: item.Total_ALL_FT_101_H, rowSpan: 4 },
                { content: item.Total_ALL_FT_201_H, rowSpan: 4 },
                { content: item.chemical_between_day_H, rowSpan: 4 },
                { content: item.ro_between_day_H, rowSpan: 4 },
                { content: item.data_remaining_tank_Mix_H, rowSpan: 4 },
                { content: item.tank_Mix_between_day_H, rowSpan: 4 },
                { content: item.data_remaining_tank_Store_H, rowSpan: 4 },
                { content: item.tank_Store_between_day_H, rowSpan: 4 },
                "PD1", item.Total_ALL_FT_401_H, item.pd1_between_day_H, 
                { content: "", rowSpan: 2 }
            ]);
            tableRows.push(["PD2", item.Total_ALL_FT_402_H, item.pd2_between_day_H]);
            tableRows.push(["PD3", item.Total_ALL_FT_403_H, item.pd3_between_day_H, item.total_use_between_day_H]);
            tableRows.push(["ES", item.Total_ALL_FT_501_H, item.es_between_day_H, item.totalAll_use_between_day_H]);
          
          });

          (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            startY: yPosition,
            margin: { left: 5, right: 5 },
            styles: {
              font: "Sarabun",
              fontSize: 7, // ลดขนาดฟอนต์ลงเพื่อให้พอดีกับแนวนอน
              cellPadding: 1,
              halign: 'center',
              valign: 'middle',
              lineColor: [0, 0, 0],
              lineWidth: 0.1,
              overflow: 'linebreak'
            },
            headStyles: {
              fillColor: [230, 240, 255], // สีฟ้าอ่อนตามหัวตาราง
              textColor: [0, 0, 0],
              fontStyle: 'bold'
            },
            
            didParseCell: function(data: any) {
              // 1. จัดการสีตัวอักษรสีแดงสำหรับคอลัมน์ที่เป็นค่า "ผลต่าง" หรือ "คงเหลือ" บางส่วน
              const redColumns = [3, 4, 5, 9,10, 12, 14]; 
              if (data.section === 'head' && redColumns.includes(data.column.index)) {
                data.cell.styles.textColor = [255, 0, 0];
              }

              // 2. จัดการพื้นหลังสีเหลืองสำหรับคอลัมน์ PD
              if (data.section === 'body' && data.column.index === 15) {
                data.cell.styles.fillColor = [255, 255, 200];
              }

              // 3. Logic การรวมเซลล์ (Rowspan)
              // ตัวอย่าง: ถ้าค่าในเซลล์ว่าง ให้ทำการยุบรวมกับข้างบน (ต้องเขียน Logic เพิ่มเติมตามจำนวน Row ของ PD)
              // if (data.section === 'body') {
              //   const rowspanColumns = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
                
              //   if (rowspanColumns.includes(data.column.index)) {

              //     // data.cell.styles.fillColor = [255, 255, 0];

              //     const text = data.cell.text[0];
              //     const rowIndex = data.row.index;
              //     const allRows = data.table.body;

              //     // ตรวจสอบว่านี่คือแถวแรกของกลุ่มข้อมูลหรือไม่
              //     // ถ้าแถวก่อนหน้า (rowIndex - 1) มีค่าเหมือนกับแถวนี้ แสดงว่าตัวนี้ต้องโดนยุบ
              //     if (rowIndex > 0 && text === allRows[rowIndex - 1].cells[data.column.index].text[0] && text !== "-") {
              //       data.cell.rowSpan = 0; // ใน autoTable การเซ็ต 0 หรือลบทิ้งจะใช้ logic ร่วมกับตัวบน
              //       // แต่ทางที่ดีที่สุดคือการกำหนดค่าที่ "แถวเริ่มแรก" ครับ
              //     }
              //   }
              // }
            }
          });

          //===============================================================================

          yPosition += lineHeight;

          // Get the total number of pages after all content has been added
          const totalPages = doc.getNumberOfPages();

          // Get the current date in a desired format
          const today = new Date();
          const date = today.getDate() + '/' + (today.getMonth() + 1) + '/' + today.getFullYear();
          let startyPosition = 8;
          
          // doc.setDrawColor(0);

          // Loop through each page and add the footer
          for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(12); // Set font size for the footer

            // doc.setFillColor(0);
            doc.setDrawColor(0);

            if (i == 1) {
              // doc.rect(5, startyPosition, (pageWidth - 2 * margin), yPosition);
              const W = (pageWidth - 2 * margin);
              const H = yPosition;
              const X_start = 5;
              const Y_start = startyPosition;
              const X_end = X_start + W;
              const Y_end = Y_start + H; // ตำแหน่ง Y ของเส้นล่าง (ที่เราจะไม่วาด)

              // 1. วาดเส้นบน (Top Line)
              // จาก (X_start, Y_start) ไปยัง (X_end, Y_start)
              doc.line(
                  X_start, Y_start,  
                  X_end, Y_start     
              );

              // 2. วาดเส้นซ้าย (Left Line)
              // จาก (X_start, Y_start) ไปยัง (X_start, Y_end)
              doc.line(
                  X_start, Y_start, 
                  X_start, Y_end     
              );

              // 3. วาดเส้นขวา (Right Line)
              // จาก (X_end, Y_start) ไปยัง (X_end, Y_end)
              doc.line(
                  X_end, Y_start,  
                  X_end, Y_end       
              );
            }else{
              // doc.rect(5, startyPosition+12, (pageWidth - 2 * margin), (tableRows.length-3)*8);
            }

            // Add the page number on the right
            doc.text(`Page ${i} of ${totalPages}`, doc.internal.pageSize.getWidth()-7, doc.internal.pageSize.getHeight() - 6, { align: 'right' });

            // Add the date on the left
            // doc.text(`Date: ${date}`, 10, doc.internal.pageSize.getHeight() - 10);
          }

          
          // doc.save(`my_document${format(new Date(), 'yyyy-MM-dd')}.pdf`);
          // --- Save the PDF ---
          // doc.save(`receipt_${receiptOrder.receiptnumber}.pdf`);
          // doc.output('dataurlnewwindow', { filename: `receipt_${receiptOrder.receiptnumber}.pdf` }); // Use output for preview
          // const pdfDataUri = doc.output('datauristring');

          // --- Alternative: Open PDF in a new window/tab ---
          // doc.save(`Report Fill ${plantName_} ${format(new Date(), 'yyyy-MM-dd')}.pdf`);

          const pdfDataUri = doc.output('datauristring');
          // window.open(pdfDataUri);
          
          setPdfPreviewUrl(pdfDataUri)

          // ปิด Loader เมื่อสร้าง PDF และ set URL เสร็จเรียบร้อย
          Swal.close();
    
          // setIsLoading(false);
    
          // setIsPdfModalOpen(true);
        // }
      // });
        return "New PDF Generated";
      
      // setIsLoading(false);
    } catch (error) {

      console.error("Error loading or adding font to jsPDF:", error);
      // Swal.fire('ข้อผิดพลาด', `${error instanceof Error ? error.message : String(error)}`, 'error');

    }

  
}