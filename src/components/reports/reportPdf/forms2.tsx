"use client";
import React from 'react'
import { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,LabelList, LineChart, Line, Cell } from 'recharts';
import axios from 'axios';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import Logo from '../../../../public/images/report/logo-wgc.png';

import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
// import { rgba } from 'framer-motion';
import { fetcher } from "@/app/utils/fetcher";

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
  
  tank1: number;
  tank2: number;
}

// Sample data for the chart
// const data = [
//   { date: '08/08', NaOH: 400 , RO: 2400 },
//   { date: '08/09', NaOH: 300 , RO: 2200 },
//   { date: '08/10', NaOH: 500 , RO: 2200 },
//   { date: '08/11', NaOH: 270 , RO: 2000 },
//   { date: '08/12', NaOH: 180 , RO: 2100 }, 
// ];

var data: Data[] = [];

export default async function Forms2(
  setPdfPreviewUrl: (pdfDataUri: string) => void, 
  plantName: string,
  unit: string = "kg",
  tank: string = "3",
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

    // if (typeof window !== 'undefined') {

      apiUrl =  await geturl();
  
      await fetcher(`/api/${apiUrl}?unit=${unit}&aggregation=${aggregation}&period=${period}&date_start=${date_start}&date_end=${date_end}`)
      .then((datareponse) => {
  
        // data = datareponse.result;
        // start_timeDisplay = datareponse.start_timeDisplay;
        // end_timeDisplay = datareponse.end_timeDisplay;
        
        // ตรวจสอบว่า datareponse และ datareponse.result มีค่าอยู่จริง
        if (datareponse && datareponse.result) {
          data = datareponse.result;
          start_timeDisplay = datareponse.start_timeDisplay || date_start;
          end_timeDisplay = datareponse.end_timeDisplay || date_end;
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
        
        // console.log(data);
        return;
      })
      .catch((error) => {
        console.error("Failed to fetch data:", error);
        // return;
      });
    // }
    


    try {

      var plantName_ = "";
      var bgcolor_ = "#B162AF";
      // var bgcolorRo_ = "#0077c8";


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

      //======================================================================= การประมวลผลสำหรับ datachart เสร็จสมบูรณ์แล้ว ---
      // The program will wait here because convertedDatachart is synchronous.

      // 3. Corrected function for datatable conversion (synchronous)
      const convertedData = async (originalData: Data[]) => {
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
            ...item, 
            number: i, 
            date_time: newDate, 
            total: Number(item.total),
            main_value: Number(item.main_value),
            ro_value: Number(item.ro_value),
            tank3: Number(item.tank3),
            error_value: Number(item.error_value),
          };

        });

      };

      // 4. Assign the result back to datatable
      const datatable = await convertedData(data);


      // =========================================================================== การประมวลผลสำหรับ Main chart ---

      const convertedDatachart = async(originalData: Data[]) => {
        // Use map and return the NEW array it creates
        return originalData.map(item => {

          var originalDate = "-/-";
          let monthAndDay = "-/-";

          if (aggregation === "perday") {

            originalDate = item.date_time; // เช่น: '2025/01/20'

            // 1. ตัดสตริงจากตำแหน่งที่ 5 (index 5 คือตำแหน่งของเดือน) -> ผลลัพธ์: '01/20'
            monthAndDay = originalDate.slice(5); 

          }else{
            monthAndDay = item.date_time+" "+item.start_time; // เช่น: '2025/01/20 01:00'
          }

          // 2. แทนที่ตัวคั่น '/' ด้วยขีดกลาง '-' -> ผลลัพธ์: '01-20'
          const newDate = monthAndDay.replace('-', '/'); 

          // console.log("newDate --> ",newDate);
          
          // คืนค่าอ็อบเจกต์ใหม่ (พร้อมดึง properties อื่นๆ ถ้ามี)
          // NOTE: If you need to keep other properties, you must spread them: {...item, date_time: newDate}
          return { 
            ...item, 
            date_time: newDate , 
            main_value: Number(item.main_value)
          }; 

        });
      };

      // 2. Assign the result back to datachart (this completes the operation)
      const datachart = await convertedDatachart(data);
      // console.log("datachart", datachart);

      // setIsLoading(true);
      const chartContainer = document.createElement('div');

      chartContainer.style.position = 'absolute';
      chartContainer.style.left = '-9999px';
      chartContainer.style.width = '1000px'; // Set width for the chart
      chartContainer.style.height = '300px'; // Set height for the chart
      // chartContainer.style.border = '1px solid #000';
      chartContainer.style.padding = '10px';

      document.body.appendChild(chartContainer);

      const root = ReactDOM.createRoot(chartContainer);

      const CustomLegend = (props: { payload: any[] } ) => {
          const { payload } = props;
          return (
              <ul data-component-id="src\components\reportPdf\forms2.tsx:223:14" data-component-path="src\components\reportPdf\forms2.tsx" data-component-line="223" data-component-file="forms2.tsx" data-component-name="ul" data-component-content="%7B%22elementName%22%3A%22ul%22%7D" style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 0,
                  margin: '0 0 10px 0' // เพิ่ม margin ด้านล่างเพื่อเว้นช่องว่าง
              }}>
                  {payload.map((entry, index) => (
                      <li data-component-id="src\components\reportPdf\forms2.tsx:231:22" data-component-path="src\components\reportPdf\forms2.tsx" data-component-line="231" data-component-file="forms2.tsx" data-component-name="li" data-component-content="%7B%22elementName%22%3A%22li%22%7D"
                          key={`item-${index}`}
                          style={{ display: 'flex', alignItems: 'center', marginRight: '20px' }}
                      >
                          {/* ไอคอนที่กำหนดเอง */}
                          <svg data-component-id="src\components\reportPdf\forms2.tsx:236:26" data-component-path="src\components\reportPdf\forms2.tsx" data-component-line="236" data-component-file="forms2.tsx" data-component-name="svg" data-component-content="%7B%22elementName%22%3A%22svg%22%7D" width="16" height="16" viewBox="0 0 32 32" style={{ marginRight: '5px' }}>
                              <rect data-component-id="src\components\reportPdf\forms2.tsx:237:30" data-component-path="src\components\reportPdf\forms2.tsx" data-component-line="237" data-component-file="forms2.tsx" data-component-name="rect" data-component-content="%7B%22elementName%22%3A%22rect%22%7D" x="0" y="0" width="32" height="100" fill={entry.color} />
                          </svg>
                          {/* ข้อความที่กำหนดเอง */}
                          <span data-component-id="src\components\reportPdf\forms2.tsx:240:26" data-component-path="src\components\reportPdf\forms2.tsx" data-component-line="240" data-component-file="forms2.tsx" data-component-name="span" data-component-content="%7B%22elementName%22%3A%22span%22%2C%22className%22%3A%22pb-3%22%7D" className='pb-3'>{`Mixer TANK 3 (${unit_value})`}</span>
                      </li>
                  ))}
              </ul>
          );
      };

      // console.log("datachart for chart image --> ",datachart);

       // Define the React component to be rendered
      const ChartToRender = () => {

        // Custom Label component to display the value on top of the bars
        const CustomBarLabel = (props: any) => {
            const { x, y, width, height, value } = props;
            return (
                <text data-component-id="src\components\reportPdf\forms2.tsx:256:16" data-component-path="src\components\reportPdf\forms2.tsx" data-component-line="256" data-component-file="forms2.tsx" data-component-name="text" data-component-content="%7B%22elementName%22%3A%22text%22%7D" x={x + width / 2} y={y} dy={-6} fill="rgba(0, 0, 0, 0.8)" textAnchor="middle" fontSize={14}>
                    {/* {value} */}
                </text>
            );
        };

        return (
          <ResponsiveContainer data-component-id="src\components\reportPdf\forms2.tsx:263:10" data-component-path="src\components\reportPdf\forms2.tsx" data-component-line="263" data-component-file="forms2.tsx" data-component-name="ResponsiveContainer" data-component-content="%7B%22elementName%22%3A%22ResponsiveContainer%22%7D" width="100%" height="100%">
              <BarChart data-component-id="src\components\reportPdf\forms2.tsx:264:14" data-component-path="src\components\reportPdf\forms2.tsx" data-component-line="264" data-component-file="forms2.tsx" data-component-name="BarChart" data-component-content="%7B%22elementName%22%3A%22BarChart%22%7D" data={datachart}>
                  <CartesianGrid data-component-id="src\components\reportPdf\forms2.tsx:265:18" data-component-path="src\components\reportPdf\forms2.tsx" data-component-line="265" data-component-file="forms2.tsx" data-component-name="CartesianGrid" data-component-content="%7B%22elementName%22%3A%22CartesianGrid%22%7D" strokeDasharray="1 1" stroke="#D9D9D9" />
                  <XAxis data-component-id="src\components\reportPdf\forms2.tsx:266:18" data-component-path="src\components\reportPdf\forms2.tsx" data-component-line="266" data-component-file="forms2.tsx" data-component-name="XAxis" data-component-content="%7B%22elementName%22%3A%22XAxis%22%7D" dataKey="date_time" stroke="#000" fontSize={16} />
                  <YAxis data-component-id="src\components\reportPdf\forms2.tsx:267:18" data-component-path="src\components\reportPdf\forms2.tsx" data-component-line="267" data-component-file="forms2.tsx" data-component-name="YAxis" data-component-content="%7B%22elementName%22%3A%22YAxis%22%7D" stroke="#000" fontSize={16} tickFormatter={(value) => value.toLocaleString()}/>
                  <Bar data-component-id="src\components\reportPdf\forms2.tsx:268:18" data-component-path="src\components\reportPdf\forms2.tsx" data-component-line="268" data-component-file="forms2.tsx" data-component-name="Bar" data-component-content="%7B%22elementName%22%3A%22Bar%22%7D" dataKey="main_value" fill={`${bgcolor_}`} label={<CustomBarLabel data-component-id="src\components\reportPdf\forms2.tsx:268:72" data-component-path="src\components\reportPdf\forms2.tsx" data-component-line="268" data-component-file="forms2.tsx" data-component-name="CustomBarLabel" data-component-content="%7B%22elementName%22%3A%22CustomBarLabel%22%7D" />}>
                  </Bar>
                  {/* <Bar dataKey="RO" fill={`${bgcolorRo_}`} label={<CustomBarLabel />}>
                  </Bar>                   */}
                  <Legend data-component-id="src\components\reportPdf\forms2.tsx:272:18" data-component-path="src\components\reportPdf\forms2.tsx" data-component-line="272" data-component-file="forms2.tsx" data-component-name="Legend" data-component-content="%7B%22elementName%22%3A%22Legend%22%7D"
                    verticalAlign="top"
                    align="center"
                    content={<CustomLegend data-component-id="src\components\reportPdf\forms2.tsx:275:29" data-component-path="src\components\reportPdf\forms2.tsx" data-component-line="275" data-component-file="forms2.tsx" data-component-name="CustomLegend" data-component-content="%7B%22elementName%22%3A%22CustomLegend%22%7D" payload={[{ color: `${bgcolor_}` }]} />}
                    iconSize={16}
                    // formatter={() => (
                    //     <span style={{ color: '#000', fontSize: 16, paddingBottom: '10px' }}>{`NaOH (m³)`}</span>
                    // )}
                  />
              </BarChart>
          </ResponsiveContainer>
        );
      };

      // Render the component into the container
      root.render(<ChartToRender data-component-id="src\components\reportPdf\forms2.tsx:287:18" data-component-path="src\components\reportPdf\forms2.tsx" data-component-line="287" data-component-file="forms2.tsx" data-component-name="ChartToRender" data-component-content="%7B%22elementName%22%3A%22ChartToRender%22%7D" />);

      // Wait for a short moment to ensure the chart is rendered
      await new Promise(resolve => setTimeout(resolve, 1500)); 

      // Use html2canvas to convert the div to a canvas image
      const canvas = await html2canvas(chartContainer, { 
        // logging: true,
        scale: 0.8, // Adjust the scale as needed
        useCORS: true,
      });

      const chartImage = canvas.toDataURL('image/png');

      // Clean up the temporary div
      root.unmount(); // Unmount the component first
      document.body.removeChild(chartContainer);

      // =========================================================================== การประมวลผลสำหรับ Main Line chart ---

      const lineconvertedDatachart = async(originalData: Data[]) => {
        
        return originalData.map(item => {

          var originalDate = "-/-";
          let monthAndDay = "-/-";

          if (aggregation === "perday") {

            originalDate = item.date_time; // เช่น: '2025/01/20'

            // 1. ตัดสตริงจากตำแหน่งที่ 5 (index 5 คือตำแหน่งของเดือน) -> ผลลัพธ์: '01/20'
            monthAndDay = originalDate.slice(5); 

          }else{
            monthAndDay = item.date_time+" "+item.start_time; // เช่น: '2025/01/20 01:00'
          }

          // 2. แทนที่ตัวคั่น '/' ด้วยขีดกลาง '-' -> ผลลัพธ์: '01-20'
          const newDate = monthAndDay.replace('-', '/'); 
          
          // คืนค่าอ็อบเจกต์ใหม่ (พร้อมดึง properties อื่นๆ ถ้ามี)
          // NOTE: If you need to keep other properties, you must spread them: {...item, date_time: newDate}
          return { ...item, date_time: newDate , main_value: Number(item.main_value) }; 

        });

      };

      const linedatachart = await lineconvertedDatachart(data);

      const lineChartContainer = document.createElement('div');

        lineChartContainer.style.position = 'absolute';
        lineChartContainer.style.left = '-1999px';
        lineChartContainer.style.width = '1000px'; // Set width for the chart
        lineChartContainer.style.height = '200px'; // Set height for the chart
        // lineChartContainer.style.border = '1px solid #000';
        lineChartContainer.style.padding = '10px';

        document.body.appendChild(lineChartContainer);

        const lineroot = ReactDOM.createRoot(lineChartContainer);

        const LinecustomLegend = (props: { payload: any[] } ) => {

          const { payload } = props;

          return (
              <ul data-component-id="src\components\reportPdf\forms2.tsx:356:14" data-component-path="src\components\reportPdf\forms2.tsx" data-component-line="356" data-component-file="forms2.tsx" data-component-name="ul" data-component-content="%7B%22elementName%22%3A%22ul%22%7D" style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 0,
                  margin: '0 0 10px 0' // เพิ่ม margin ด้านล่างเพื่อเว้นช่องว่าง
              }}>
                  {payload.map((entry, index) => (
                      <li data-component-id="src\components\reportPdf\forms2.tsx:364:22" data-component-path="src\components\reportPdf\forms2.tsx" data-component-line="364" data-component-file="forms2.tsx" data-component-name="li" data-component-content="%7B%22elementName%22%3A%22li%22%7D"
                          key={`item-${index}`}
                          style={{ display: 'flex', alignItems: 'center', marginRight: '20px' }}
                      >
                          {/* ไอคอนที่กำหนดเอง */}
                          <svg data-component-id="src\components\reportPdf\forms2.tsx:369:26" data-component-path="src\components\reportPdf\forms2.tsx" data-component-line="369" data-component-file="forms2.tsx" data-component-name="svg" data-component-content="%7B%22elementName%22%3A%22svg%22%7D" width="16" height="16" viewBox="0 0 32 32" style={{ marginRight: '5px' }}>
                              <rect data-component-id="src\components\reportPdf\forms2.tsx:370:30" data-component-path="src\components\reportPdf\forms2.tsx" data-component-line="370" data-component-file="forms2.tsx" data-component-name="rect" data-component-content="%7B%22elementName%22%3A%22rect%22%7D" x="0" y="0" width="32" height="100" fill={entry.color} />
                          </svg>
                          {/* ข้อความที่กำหนดเอง */}
                          <span data-component-id="src\components\reportPdf\forms2.tsx:373:26" data-component-path="src\components\reportPdf\forms2.tsx" data-component-line="373" data-component-file="forms2.tsx" data-component-name="span" data-component-content="%7B%22elementName%22%3A%22span%22%2C%22className%22%3A%22pb-3%22%7D" className='pb-3'>{`Error Fill (${unit_value})`}</span>
                      </li>
                  ))}
              </ul>
            );
        };

        const LineChartToRender = () => {

          return (
            <ResponsiveContainer data-component-id="src\components\reportPdf\forms2.tsx:383:12" data-component-path="src\components\reportPdf\forms2.tsx" data-component-line="383" data-component-file="forms2.tsx" data-component-name="ResponsiveContainer" data-component-content="%7B%22elementName%22%3A%22ResponsiveContainer%22%7D" width="100%" height="100%">
                <LineChart data-component-id="src\components\reportPdf\forms2.tsx:384:16" data-component-path="src\components\reportPdf\forms2.tsx" data-component-line="384" data-component-file="forms2.tsx" data-component-name="LineChart" data-component-content="%7B%22elementName%22%3A%22LineChart%22%7D" data={linedatachart} >
                    <CartesianGrid data-component-id="src\components\reportPdf\forms2.tsx:385:20" data-component-path="src\components\reportPdf\forms2.tsx" data-component-line="385" data-component-file="forms2.tsx" data-component-name="CartesianGrid" data-component-content="%7B%22elementName%22%3A%22CartesianGrid%22%7D" strokeDasharray="1 1" stroke="#D9D9D9" />
                    <XAxis data-component-id="src\components\reportPdf\forms2.tsx:386:20" data-component-path="src\components\reportPdf\forms2.tsx" data-component-line="386" data-component-file="forms2.tsx" data-component-name="XAxis" data-component-content="%7B%22elementName%22%3A%22XAxis%22%7D" dataKey="date_time" stroke="#000" fontSize={16} />
                    <YAxis data-component-id="src\components\reportPdf\forms2.tsx:387:20" data-component-path="src\components\reportPdf\forms2.tsx" data-component-line="387" data-component-file="forms2.tsx" data-component-name="YAxis" data-component-content="%7B%22elementName%22%3A%22YAxis%22%7D" stroke="#000" fontSize={16} tickFormatter={(value) => value.toLocaleString()}/>
                    
                    {/* === FIX: Change <Bar> to <Line> === */}
                    <Line data-component-id="src\components\reportPdf\forms2.tsx:390:20" data-component-path="src\components\reportPdf\forms2.tsx" data-component-line="390" data-component-file="forms2.tsx" data-component-name="Line" data-component-content="%7B%22elementName%22%3A%22Line%22%2C%22type%22%3A%22monotone%22%7D" 
                        type="monotone" // Optional: makes the line smooth
                        dataKey="main_value" 
                        stroke={`#FF0000`} // Use stroke for line color
                        strokeWidth={2}
                        dot={false} // Optional: removes dots at data points
                        // label={<CustomBarLabel />} // Remove or adapt the label component
                    />
                    
                    {/* Optional: Add Tooltip for value display on hover */}
                    {/* <Tooltip /> */}

                    <Legend data-component-id="src\components\reportPdf\forms2.tsx:402:20" data-component-path="src\components\reportPdf\forms2.tsx" data-component-line="402" data-component-file="forms2.tsx" data-component-name="Legend" data-component-content="%7B%22elementName%22%3A%22Legend%22%7D"
                      verticalAlign="top"
                      align="center"
                      content={<LinecustomLegend data-component-id="src\components\reportPdf\forms2.tsx:405:31" data-component-path="src\components\reportPdf\forms2.tsx" data-component-line="405" data-component-file="forms2.tsx" data-component-name="LinecustomLegend" data-component-content="%7B%22elementName%22%3A%22LinecustomLegend%22%7D" payload={[{ color: `${bgcolor_}` }]} />
                      } 
                      iconSize={16}
                    />
                </LineChart>
            </ResponsiveContainer>
          );
      };

      lineroot.render(<LineChartToRender data-component-id="src\components\reportPdf\forms2.tsx:414:22" data-component-path="src\components\reportPdf\forms2.tsx" data-component-line="414" data-component-file="forms2.tsx" data-component-name="LineChartToRender" data-component-content="%7B%22elementName%22%3A%22LineChartToRender%22%7D" />);

      // Wait for a short moment to ensure the chart is rendered
      await new Promise(resolve => setTimeout(resolve, 1500)); 

      const linecanvas = await html2canvas(lineChartContainer, { 
        // logging: true,
        scale: 0.6, // Adjust the scale as needed
        useCORS: true,
      });

      const linechartImage = linecanvas.toDataURL('image/png');

      lineroot.unmount(); // Unmount the component first
      document.body.removeChild(lineChartContainer);

      const imgLogo = new Image();
      imgLogo.src = Logo.src;

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      };

      // --- Load receiptOrder data from the API ---

      // await axios.post(`/backoffice/receiptorder`, {

      //   ordernumber: ordernumber_,

      // },{

      //   headers,

      // }).then(async(res) => {
        // setReceipt(res.data);
        // const receiptOrder = res.data;

        // คำนวณความสูงอัตโนมัติ
        const baseHeight = 90; // ความสูงพื้นฐาน (header, footer ฯลฯ)
        const lineHeight = 5;  // ความสูงแต่ละบรรทัด
        // const productLines = receiptOrder?.products?.length || 0;
        const productLines = 0;
        const extraHeight = productLines * lineHeight;
        const totalHeight = baseHeight + extraHeight;

        const doc = new jsPDF({
          unit: "mm",
          // format: [80, totalHeight], // 80mm กว้าง, 297mm สูง (หรือปรับความสูงตามต้องการ)
          format: "a4",
          orientation: "landscape",
        });

        doc.setProperties({
          title: `Report Mix ${plantName_} ${format(new Date(), 'yyyy-MM-dd')}`,
          subject: 'WGC Dashboard PDF',
          // author: 'Your Name',
          // keywords: 'jsPDF, example, tutorial',
          creator: 'WGC Dashboard system',
        });

        let fontLoaded = false;

        // --- Alternative: Load font file at runtime and convert to Base64 ---
        const fontUrl = '/fonts/thsarabunitalic.ttf'; // Path relative to the public folder
        // const boldFontUrl = '/fonts/THSarabunNew-Bold.ttf'; // Example for bold
  
        const response = await fetch(fontUrl);

        if (!response.ok) {
          throw new Error(`ไม่สามารถโหลดไฟล์ฟอนต์ได้: ${response.statusText}`);
        }

        const fontBlob = await response.blob();
  
        // Convert Blob to Base64
        const base64Font = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result.split(',')[1]); // Get only the Base64 part
            } else {
              reject(new Error("ไม่สามารถอ่านไฟล์ฟอนต์เป็น Base64 ได้"));
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(fontBlob);
        });
  
        if (!base64Font) {
          throw new Error("การแปลงฟอนต์เป็น Base64 ล้มเหลว");
        }
  
        // doc.addFileToVFS("/fonts/thsarabunitalic.ttf", base64Font);
        doc.addFont("/fonts/thsarabun.ttf", "Sarabun", "normal");
        doc.addFont("/fonts/thsarabunitalic.ttf", "Sarabun", "italic");
        doc.addFont("/fonts/thsarabunbold.ttf", "Sarabun", "bold");
        doc.addFont("/fonts/thsarabunbolditalic.ttf", "Sarabun", "bolditalic");
  
        doc.setFont("Sarabun", "normal");
        fontLoaded = true;
        
        // --- Content ---
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 5;
        let yPosition = 20;

        
        doc.setFontSize(18);
        // doc.setFontStyle('bold');

        if (fontLoaded) {
          doc.setFont("Sarabun", "bold"); // Use Sarabun for header if loaded
        } else {
          doc.setFont("helvetica", "bold"); // Fallback
        }

        doc.rect(5, yPosition-12, (pageWidth - 2 * margin), 20);


        const imgWidth = imgLogo.width;
        const imgHeight = imgLogo.height;

        // Add the image to the PDF
        doc.addImage(imgLogo, 'PNG', 10, 13, 30, 10); // Adjust position and dimensions

        doc.text(`Report Mix ${plantName_}`, pageWidth / 2, yPosition, { align: 'center'});
        yPosition += lineHeight + 12;
  
        doc.setFontSize(16);

        if (fontLoaded) {
          doc.setFont("Sarabun", "normal"); // Use Sarabun for body text
        } else {
          doc.setFont("helvetica", "normal"); // Fallback
        }

        // if (receiptOrder) {
    
          // Date and Time
          // const orderDate = new Date(receiptOrder.create_at*1000);
          const orderDate = new Date();

          const formattedOrderDate = `${orderDate.getDate()}/${orderDate.getMonth() + 1}/${orderDate.getFullYear()}`;
          const formattedOrderTime = `${orderDate.getHours()}:${orderDate.getMinutes()}`;

          const rows2 = margin+40;
          const rows3 = margin+70;
          const rows4 = margin+130;
          const rows5 = margin+170;
          const rows6 = margin+220;

          doc.setFontSize(12);

          // doc.text(`Tank : ${tank}`, margin+10, yPosition);
          
          // yPosition += lineHeight+5;
          
          doc.text(`Unit : ${unit_value}`, rows2, yPosition);
          doc.text(`Data aggregation : ${aggregation_value}`, rows3, yPosition);
          // doc.text(`Period : ${period}`, rows3, yPosition);
          doc.text(`Period : ${period_value}`, rows4, yPosition);

          // yPosition += lineHeight+5;

          // doc.text(`Time Start : ${date_start}`, margin, yPosition);
          // doc.text(`Time End : ${date_end}`, rows2, yPosition);
          doc.text(`Time Start : ${start_timeDisplay}`, rows5, yPosition);
          doc.text(`Time End : ${end_timeDisplay}`, rows6, yPosition);

          yPosition += lineHeight;

          // Add the chart image to the PDF
          const chartWidth = 200; // mm
          const chartX = (doc.internal.pageSize.getWidth() - chartWidth) / 2;

          const chartHeight = (canvas.height / canvas.width) * chartWidth;
          
          // yPosition += 10;
          doc.addImage(chartImage, 'PNG', chartX, yPosition, chartWidth, chartHeight);

          const linechartHeight = (linecanvas.height / linecanvas.width) * chartWidth;

          doc.addImage(linechartImage, 'PNG', chartX, yPosition+chartHeight, chartWidth, linechartHeight);

          yPosition += lineHeight+30;

          //===============================================================================
          yPosition += 8;

          doc.setFontSize(12);

          // const datatable = [

          //   { id: 1, date: "2025/08/08", timeStart: "00:00", timeStop: "23:59", NaOH: "400", RO: "2400" },
          //   { id: 2, date: "2025/08/09", timeStart: "00:00", timeStop: "23:59", NaOH: "300", RO: "2200" },
          //   { id: 3, date: "2025/08/10", timeStart: "00:00", timeStop: "23:59", NaOH: "500", RO: "2200" },
          //   { id: 4, date: "2025/08/11", timeStart: "00:00", timeStop: "23:59", NaOH: "270", RO: "2000" },
          //   { id: 5, date: "2025/08/12", timeStart: "00:00", timeStop: "23:59", NaOH: "100", RO: "2100" },
          // ];

          // Define columns and rows for the table
          const tableColumn = ["Date", "Time start", "Time stop", `Total \n(${unit_value})`, `${plantName_} \n(${unit_value})`, `RO \n(${unit_value})`, `Mixer \nTANK 3 \n(${unit_value})`, `Error \n(${unit_value})`];
          const tableRows = datatable.map((item) => [ 
            (item.date_time), 
            item.start_time, 
            item.end_time, 
            Number(item.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 
            Number(item.main_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 
            Number(item.ro_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 
            Number(item.tank3).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 
            Number(item.error_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          ]);

          // Add the table to the document
          (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            // showFooter: 'everyPage',
            startY: yPosition+chartHeight,
             // กำหนดความกว้างรวมของตาราง
            tableWidth: 'auto', // 'wrap' (พอดีเนื้อหา), 'auto' (เต็มหน้ากระดาษ), หรือกำหนดเป็นตัวเลข
            // กำหนดความกว้างของแต่ละคอลัมน์
            margin: { top: 20, left: 5, right: 5 },
            headStyles: {
              halign: 'center', // This aligns the text in the header cells to the center
              valign: 'middle', // Vertical center alignment
              fillColor: [242, 242, 242], // Light gray background for the header
              textColor: [0, 0, 0] // Black text for the header
            },
            bodyStyles: {
              halign: 'center' // This aligns the text in the body cells to the center
            },
            styles: {
              fontSize: 10,
              cellPadding: 2,
              lineColor: [0, 0, 0], // Light gray borders for all cells
              lineWidth: 0.1 // Thin lines
            },
          });

          //===============================================================================

          yPosition += lineHeight+chartHeight;

          // Get the total number of pages after all content has been added
          const totalPages = doc.getNumberOfPages();

          // Get the current date in a desired format
          const today = new Date();
          const date = today.getDate() + '/' + (today.getMonth() + 1) + '/' + today.getFullYear();
          let startyPosition = 8;

          // Loop through each page and add the footer
          for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(12); // Set font size for the footer

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
          const pdfDataUri = doc.output('datauristring');
          // window.open(pdfDataUri);
          
          // doc.save(`Report Mix ${plantName_} ${format(new Date(), 'yyyy-MM-dd')}.pdf`);
          
          setPdfPreviewUrl(pdfDataUri);

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
