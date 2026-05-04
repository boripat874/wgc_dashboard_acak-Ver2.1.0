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
import {CheckPeriod,Aggregation,Unit} from '../reportPdf/funtionComponents';
import { fetcher } from "@/app/utils/fetcher";

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
  Before_Fill?: number;
  After_Fill?: number;
  Error_Fill?: number;
  result_Before_Fill?: number;
  result_After_Fill?: number;
  result_Error_Fill?: number;
  System_Data_Fill?: number;
  System_Data_Density?: number;
  
  number?: number;
  tank1: number;
  tank2: number;
}

// Sample data for the chart
var data: Data[] = [];

export default async function Forms1(
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
      
      // data = datareponse.result;
      // start_timeDisplay = datareponse.start_timeDisplay;
      // end_timeDisplay = datareponse.end_timeDisplay;

      // data = []
      // start_timeDisplay = "2026-03-25";
      // end_timeDisplay = "2026-03-31";

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

      return;
    })
    .catch((error) => {
      console.error("Failed to fetch data:", error);
      // return;

      data = []
      start_timeDisplay = "2026-03-25";
      end_timeDisplay = "2026-03-31";
      
      return;
    });

    const period_value = await CheckPeriod(period);

    // console.log("aggregation", aggregation);

    const aggregation_value = await Aggregation(aggregation);

    console.log("unit_value >>",unit);

    const unit_value = await Unit(unit);

      var plantName_ = "";
      var bgcolor_ = "#B162AF";

      if(plantName === "Alkaline"){

        plantName_ = "NaOH";
        bgcolor_ = "#B162AF";

      }else if(plantName === "Acid"){

        plantName_ = "HCl";
        bgcolor_ = "#B9792B"; // Set a different background color for Acid

      }

    try {

      // var datachart = data;
      // var datatable = data;

      // --- การประมวลผลสำหรับ datachart เสร็จสมบูรณ์แล้ว ---
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

          tank = tank === "12" ? "1+2" : tank;
          
          // คืนค่าอ็อบเจกต์ใหม่ (พร้อมดึง properties อื่นๆ ถ้ามี)
          // NOTE: If you need to keep other properties, you must spread them: {...item, number: i, date_time: newDate}
          return { 
            ...item, 
            number: i, 
            date_time: newDate, 
            Before_Fill: Number(item.Before_Fill),
            After_Fill: Number(item.After_Fill),
            Error_Fill: Number(item.Error_Fill),
            result_Before_Fill: Number(item.result_Before_Fill),
            result_After_Fill: Number(item.result_After_Fill),
            result_Error_Fill: Number(item.result_Error_Fill),
            System_Data_Fill: Number(item.System_Data_Fill),
            System_Data_Density: Number(item.System_Data_Density),
          };

        });

      };

      // 4. Assign the result back to datatable
      const datatable = await convertedData(data);

      // =========================================================================== การประมวลผลสำหรับ Main chart ---

      // 1. Corrected function for datachart conversion (synchronous)
      const convertedDatachart = async(originalData: Data[]) => {
        // Use map and return the NEW array it creates
        // console.log("originalData >>", originalData);

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
          return { 
            ...item, 
            date_time: newDate , 
            value: Number(item.System_Data_Fill)
          }; 

        });
      };

      // 2. Assign the result back to datachart (this completes the operation)
      // console.log("data >>", data);

      const datachart = await convertedDatachart(data);

      // const linechart = await convertedDatalinechart(data);

      // console.log(datachart);

      
      
      // console.log("period_value", aggregation_value);

      // console.log("period_value", period_value);

      // <option value="1day">1 Day</option>
      // <option value="7day">7 Day</option>
      // <option value="1months">1 Month</option>
      // <option value="3months">3 Months</option>
      // <option value="6months">6 Months</option>
      // <option value="1year">1 Year</option>
      // <option value="bydate">By Date</option>

      // setIsLoading(true);
     const chartContainer = document.createElement('div');

      chartContainer.style.position = 'absolute';
      chartContainer.style.left = '-9999px';
      chartContainer.style.width = '1000px'; // Set width for the chart
      chartContainer.style.height = '300px'; // Set height for the chart
      // chartContainer.style.border = '1px solid #000';
      chartContainer.style.color = '#000';
      chartContainer.style.padding = '10px';

      document.body.appendChild(chartContainer);

      const root = ReactDOM.createRoot(chartContainer);

      const CustomLegend = (props: { payload: any[] } ) => {
          const { payload } = props;
          return (
              <ul data-component-id="src\components\reportPdf\forms1.tsx:253:14" data-component-path="src\components\reportPdf\forms1.tsx" data-component-line="253" data-component-file="forms1.tsx" data-component-name="ul" data-component-content="%7B%22elementName%22%3A%22ul%22%7D" style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 0,
                  margin: '0 0 10px 0' // เพิ่ม margin ด้านล่างเพื่อเว้นช่องว่าง
              }}>
                  {payload.map((entry, index) => (
                      <li data-component-id="src\components\reportPdf\forms1.tsx:261:22" data-component-path="src\components\reportPdf\forms1.tsx" data-component-line="261" data-component-file="forms1.tsx" data-component-name="li" data-component-content="%7B%22elementName%22%3A%22li%22%7D"
                          key={`item-${index}`}
                          style={{ display: 'flex', alignItems: 'center', marginRight: '20px' }}
                      >
                          {/* ไอคอนที่กำหนดเอง */}
                          <svg data-component-id="src\components\reportPdf\forms1.tsx:266:26" data-component-path="src\components\reportPdf\forms1.tsx" data-component-line="266" data-component-file="forms1.tsx" data-component-name="svg" data-component-content="%7B%22elementName%22%3A%22svg%22%7D" width="16" height="16" viewBox="0 0 32 32" style={{ marginRight: '5px' }}>
                              <rect data-component-id="src\components\reportPdf\forms1.tsx:267:30" data-component-path="src\components\reportPdf\forms1.tsx" data-component-line="267" data-component-file="forms1.tsx" data-component-name="rect" data-component-content="%7B%22elementName%22%3A%22rect%22%7D" x="0" y="0" width="32" height="50" fill={entry.color} />
                          </svg>
                          {/* ข้อความที่กำหนดเอง */}
                          <span data-component-id="src\components\reportPdf\forms1.tsx:270:26" data-component-path="src\components\reportPdf\forms1.tsx" data-component-line="270" data-component-file="forms1.tsx" data-component-name="span" data-component-content="%7B%22elementName%22%3A%22span%22%2C%22className%22%3A%22pb-3%22%7D" className='pb-3'>{`System Data Fill (kg)`}</span>
                      </li>
                  ))}
              </ul>
          );
      };

       // Define the React component to be rendered
      const ChartToRender = () => {

        // Custom Label component to display the value on top of the bars
        const CustomBarLabel = (props: any) => {
            const { x, y, width, height, value } = props;
            return (
                <text data-component-id="src\components\reportPdf\forms1.tsx:284:16" data-component-path="src\components\reportPdf\forms1.tsx" data-component-line="284" data-component-file="forms1.tsx" data-component-name="text" data-component-content="%7B%22elementName%22%3A%22text%22%7D" x={x + width / 2} y={y} dy={-6} fill="rgba(0, 0, 0, 0.8)" textAnchor="middle" fontSize={14}>
                    {/* {value} */}
                </text>
            );
        };

        return (
          <ResponsiveContainer data-component-id="src\components\reportPdf\forms1.tsx:291:10" data-component-path="src\components\reportPdf\forms1.tsx" data-component-line="291" data-component-file="forms1.tsx" data-component-name="ResponsiveContainer" data-component-content="%7B%22elementName%22%3A%22ResponsiveContainer%22%7D" width="100%" height="100%">
              <BarChart data-component-id="src\components\reportPdf\forms1.tsx:292:14" data-component-path="src\components\reportPdf\forms1.tsx" data-component-line="292" data-component-file="forms1.tsx" data-component-name="BarChart" data-component-content="%7B%22elementName%22%3A%22BarChart%22%7D" data={datachart}>
                  <CartesianGrid data-component-id="src\components\reportPdf\forms1.tsx:293:18" data-component-path="src\components\reportPdf\forms1.tsx" data-component-line="293" data-component-file="forms1.tsx" data-component-name="CartesianGrid" data-component-content="%7B%22elementName%22%3A%22CartesianGrid%22%7D" strokeDasharray="1 1" stroke="#D9D9D9" />
                  <XAxis data-component-id="src\components\reportPdf\forms1.tsx:294:18" data-component-path="src\components\reportPdf\forms1.tsx" data-component-line="294" data-component-file="forms1.tsx" data-component-name="XAxis" data-component-content="%7B%22elementName%22%3A%22XAxis%22%7D" dataKey="date_time" stroke="#000" fontSize={16} />
                  <YAxis data-component-id="src\components\reportPdf\forms1.tsx:295:18" data-component-path="src\components\reportPdf\forms1.tsx" data-component-line="295" data-component-file="forms1.tsx" data-component-name="YAxis" data-component-content="%7B%22elementName%22%3A%22YAxis%22%7D" stroke="#000" fontSize={16} tickFormatter={(value) => value.toLocaleString()} />
                  <Bar data-component-id="src\components\reportPdf\forms1.tsx:296:18" data-component-path="src\components\reportPdf\forms1.tsx" data-component-line="296" data-component-file="forms1.tsx" data-component-name="Bar" data-component-content="%7B%22elementName%22%3A%22Bar%22%7D" dataKey="value" fill={`${bgcolor_}`} label={<CustomBarLabel data-component-id="src\components\reportPdf\forms1.tsx:296:67" data-component-path="src\components\reportPdf\forms1.tsx" data-component-line="296" data-component-file="forms1.tsx" data-component-name="CustomBarLabel" data-component-content="%7B%22elementName%22%3A%22CustomBarLabel%22%7D" />}>
                      {/* The LabelList component is removed */}
                  </Bar>
                  <Legend data-component-id="src\components\reportPdf\forms1.tsx:299:18" data-component-path="src\components\reportPdf\forms1.tsx" data-component-line="299" data-component-file="forms1.tsx" data-component-name="Legend" data-component-content="%7B%22elementName%22%3A%22Legend%22%7D"
                    verticalAlign="top"
                    align="center"
                    content={<CustomLegend data-component-id="src\components\reportPdf\forms1.tsx:302:29" data-component-path="src\components\reportPdf\forms1.tsx" data-component-line="302" data-component-file="forms1.tsx" data-component-name="CustomLegend" data-component-content="%7B%22elementName%22%3A%22CustomLegend%22%7D" payload={[{ color: `${bgcolor_}` }]} />}
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
      root.render(<ChartToRender data-component-id="src\components\reportPdf\forms1.tsx:314:18" data-component-path="src\components\reportPdf\forms1.tsx" data-component-line="314" data-component-file="forms1.tsx" data-component-name="ChartToRender" data-component-content="%7B%22elementName%22%3A%22ChartToRender%22%7D" />);

      // Wait for a short moment to ensure the chart is rendered
      await new Promise(resolve => setTimeout(resolve, 1000)); 

      // Use html2canvas to convert the div to a canvas image
      const canvas = await html2canvas(chartContainer, { 
        // logging: true,
        scale: 0.6, // Adjust the scale as needed
        useCORS: true,
      });
      
      const chartImage = await canvas.toDataURL('image/png');

      // Clean up the temporary div
      root.unmount(); // Unmount the component first
      document.body.removeChild(chartContainer);
      
      // =========================================================================== การประมวลผลสำหรับ Main Line chart ---

      const lineconvertedDatachart = async(originalData: Data[]) => {
        
        // Use map and return the NEW array it creates
        // console.log("originalData >>", originalData);

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
          return { 
            ...item, 
            date_time: newDate , 
            value: Number(item.result_Error_Fill)
          }; 

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
              <ul data-component-id="src\components\reportPdf\forms1.tsx:390:14" data-component-path="src\components\reportPdf\forms1.tsx" data-component-line="390" data-component-file="forms1.tsx" data-component-name="ul" data-component-content="%7B%22elementName%22%3A%22ul%22%7D" style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 0,
                  margin: '0 0 10px 0' // เพิ่ม margin ด้านล่างเพื่อเว้นช่องว่าง
              }}>
                  {payload.map((entry, index) => (
                      <li data-component-id="src\components\reportPdf\forms1.tsx:398:22" data-component-path="src\components\reportPdf\forms1.tsx" data-component-line="398" data-component-file="forms1.tsx" data-component-name="li" data-component-content="%7B%22elementName%22%3A%22li%22%7D"
                          key={`item-${index}`}
                          style={{ display: 'flex', alignItems: 'center', marginRight: '20px' }}
                      >
                          {/* ไอคอนที่กำหนดเอง */}
                          <svg data-component-id="src\components\reportPdf\forms1.tsx:403:26" data-component-path="src\components\reportPdf\forms1.tsx" data-component-line="403" data-component-file="forms1.tsx" data-component-name="svg" data-component-content="%7B%22elementName%22%3A%22svg%22%7D" width="16" height="16" viewBox="0 0 32 32" style={{ marginRight: '5px' }}>
                              <rect data-component-id="src\components\reportPdf\forms1.tsx:404:30" data-component-path="src\components\reportPdf\forms1.tsx" data-component-line="404" data-component-file="forms1.tsx" data-component-name="rect" data-component-content="%7B%22elementName%22%3A%22rect%22%7D" x="0" y="0" width="32" height="100" fill={entry.color} />
                          </svg>
                          {/* ข้อความที่กำหนดเอง */}
                          <span data-component-id="src\components\reportPdf\forms1.tsx:407:26" data-component-path="src\components\reportPdf\forms1.tsx" data-component-line="407" data-component-file="forms1.tsx" data-component-name="span" data-component-content="%7B%22elementName%22%3A%22span%22%2C%22className%22%3A%22pb-3%22%7D" className='pb-3'>{`Error Fill (${unit_value})`}</span>
                      </li>
                  ))}
              </ul>
            );
        };

        const LineChartToRender = () => {

          return (
            <ResponsiveContainer data-component-id="src\components\reportPdf\forms1.tsx:417:12" data-component-path="src\components\reportPdf\forms1.tsx" data-component-line="417" data-component-file="forms1.tsx" data-component-name="ResponsiveContainer" data-component-content="%7B%22elementName%22%3A%22ResponsiveContainer%22%7D" width="100%" height="100%">
                <LineChart data-component-id="src\components\reportPdf\forms1.tsx:418:16" data-component-path="src\components\reportPdf\forms1.tsx" data-component-line="418" data-component-file="forms1.tsx" data-component-name="LineChart" data-component-content="%7B%22elementName%22%3A%22LineChart%22%7D" data={linedatachart} >
                    <CartesianGrid data-component-id="src\components\reportPdf\forms1.tsx:419:20" data-component-path="src\components\reportPdf\forms1.tsx" data-component-line="419" data-component-file="forms1.tsx" data-component-name="CartesianGrid" data-component-content="%7B%22elementName%22%3A%22CartesianGrid%22%7D" strokeDasharray="1 1" stroke="#D9D9D9" />
                    <XAxis data-component-id="src\components\reportPdf\forms1.tsx:420:20" data-component-path="src\components\reportPdf\forms1.tsx" data-component-line="420" data-component-file="forms1.tsx" data-component-name="XAxis" data-component-content="%7B%22elementName%22%3A%22XAxis%22%7D" dataKey="date_time" stroke="#000" fontSize={16} />
                    <YAxis data-component-id="src\components\reportPdf\forms1.tsx:421:20" data-component-path="src\components\reportPdf\forms1.tsx" data-component-line="421" data-component-file="forms1.tsx" data-component-name="YAxis" data-component-content="%7B%22elementName%22%3A%22YAxis%22%7D" stroke="#000" fontSize={16} tickFormatter={(value) => value.toLocaleString()} />
                    
                    {/* === FIX: Change <Bar> to <Line> === */}
                    <Line data-component-id="src\components\reportPdf\forms1.tsx:424:20" data-component-path="src\components\reportPdf\forms1.tsx" data-component-line="424" data-component-file="forms1.tsx" data-component-name="Line" data-component-content="%7B%22elementName%22%3A%22Line%22%2C%22type%22%3A%22monotone%22%7D" 
                        type="monotone" // Optional: makes the line smooth
                        dataKey="value" 
                        stroke={`#FF0000`} // Use stroke for line color
                        strokeWidth={2}
                        dot={false} // Optional: removes dots at data points
                        // label={<CustomBarLabel />} // Remove or adapt the label component
                    />
                    
                    {/* Optional: Add Tooltip for value display on hover */}
                    {/* <Tooltip /> */}

                    <Legend data-component-id="src\components\reportPdf\forms1.tsx:436:20" data-component-path="src\components\reportPdf\forms1.tsx" data-component-line="436" data-component-file="forms1.tsx" data-component-name="Legend" data-component-content="%7B%22elementName%22%3A%22Legend%22%7D"
                      verticalAlign="top"
                      align="center"
                      content={<LinecustomLegend data-component-id="src\components\reportPdf\forms1.tsx:439:31" data-component-path="src\components\reportPdf\forms1.tsx" data-component-line="439" data-component-file="forms1.tsx" data-component-name="LinecustomLegend" data-component-content="%7B%22elementName%22%3A%22LinecustomLegend%22%7D" payload={[{ color: `${bgcolor_}` }]} />
                      } 
                      iconSize={16}
                    />
                </LineChart>
            </ResponsiveContainer>
          );
      };

      lineroot.render(<LineChartToRender data-component-id="src\components\reportPdf\forms1.tsx:448:22" data-component-path="src\components\reportPdf\forms1.tsx" data-component-line="448" data-component-file="forms1.tsx" data-component-name="LineChartToRender" data-component-content="%7B%22elementName%22%3A%22LineChartToRender%22%7D" />);

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
          title: `Report Fill ${plantName_} ${format(new Date(), 'yyyy-MM-dd')}`,
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
        doc.addFont("/fonts/Sarabun-ExtraBold.ttf", "Sarabun", "extrabold");

  
        doc.setFont("Sarabun", "normal");
        fontLoaded = true;
        
        // --- Content ---
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 5;
        let yPosition = 20;
        

        
        doc.setFontSize(16);
        // doc.setFontStyle('bold');

        if (fontLoaded) {
          doc.setFont("Sarabun", "extrabold"); // Use Sarabun for header if loaded
        } else {
          doc.setFont("helvetica", "bold"); // Fallback
        }

        doc.rect(5, yPosition-12, (pageWidth - 2 * margin), 20);


        const imgWidth = imgLogo.width;
        const imgHeight = imgLogo.height;

        // Add the image to the PDF
        doc.addImage(imgLogo, 'PNG', 10, 13, 30, 10); // Adjust position and dimensions

        doc.text(`Report Fill ${plantName_}`, pageWidth / 2, yPosition, { align: 'center'});
        
  
        doc.setFontSize(16);

        if (fontLoaded) {
          doc.setFont("Sarabun", "normal"); // Use Sarabun for body text
        } else {
          doc.setFont("helvetica", "normal"); // Fallback
        }

        // if (receiptOrder) {
          

          yPosition += lineHeight + 12;
    
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

          doc.text(`Tank : ${tank}`, margin+10, yPosition);
          
          // yPosition += lineHeight;
          
          doc.text(`Unit : ${unit_value}`, rows2, yPosition);
          doc.text(`Data aggregation : ${aggregation_value}`, rows3, yPosition);
          doc.text(`Period : ${period_value}`, rows4, yPosition);
          // doc.text(`Period : 1 Day`, rows3, yPosition);

          // yPosition += lineHeight;

          doc.text(`Time Start : ${start_timeDisplay}`, rows5, yPosition);
          doc.text(`Time End : ${end_timeDisplay}`, rows6, yPosition);
          // doc.text(`Time Start : 2025-08-08`, margin, yPosition);
          // doc.text(`Time End : 2025-08-12`, rows2, yPosition);

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
          //   { id: 1, date: "-/-/-", timeStart: "00:00", timeStop: "00:00", value: 0 },
          // ];

          // Define columns and rows for the table
          const tableColumn = [
            "Date", 
            "Time start", 
            "Time stop", 
            `Before Fill \n(${unit_value})`, 
            `After Fill \n(${unit_value})`, 
            `Error Fill \n(${unit_value})`, 
            `Before Fill \n(${unit_value})`, 
            `After Fill \n(${unit_value})`, 
            `Error Fill \n(${unit_value})`, 
            `System Data Fill \n(kg)`, 
            "System Data Density"];
          const tableRows = datatable.map((item) => [
            item.date_time, 
            item.start_time, 
            item.end_time, 
            Number(item.Before_Fill).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            Number(item.After_Fill).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            Number(item.Error_Fill).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            Number(item.result_Before_Fill).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            Number(item.result_After_Fill).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            Number(item.result_Error_Fill).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            Number(item.System_Data_Fill).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            Number(item.System_Data_Density).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
              fontSize: 8,
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