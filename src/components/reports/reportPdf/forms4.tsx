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

  tank1: number;
  tank2: number;
}

// Sample data for the chart
// const data = [
//   { date: '08/08', value: 4000 },
//   { date: '08/09', value: 3000 },
//   { date: '08/10', value: 5000 },
//   { date: '08/11', value: 2780 },
//   { date: '08/12', value: 1890 },
// ]; 

var data: Data[] = [];

export default async function Forms4(
  setPdfPreviewUrl: (pdfDataUri: string) => void, 
  plantName: string,
  plantUse: string = "PD1", 
  unit: string = "kg",
  tank: string = "4",
  aggregation: string = "perday",
  period: string = "1day",
  date_start: string = format(new Date(), 'yyyy-MM-dd'),
  date_end: string = format(new Date(), 'yyyy-MM-dd')
) {

  // const [receiptOrder, setReceipt] = useState<report>();

    // แสดง Loader ทันทีเมื่อฟังก์ชันเริ่มทำงาน
    Swal.fire({
        title: 'กำลังสร้างรายงาน PDF...',
        html: 'กรุณารอสักครู่ ระบบกำลังประมวลผลข้อมูลและกราฟ',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading(); // แสดง Spinner ของ SweetAlert2
        }
    });

    try {

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

      // console.log("Fetching data from API:", `/api/${apiUrl}?unit=${unit}&aggregation=${aggregation}&period=${period}&date_start=${date_start}&date_end=${date_end}`);
  
      await fetcher(`/api/${apiUrl}?unit=${unit}&aggregation=${aggregation}&period=${period}&date_start=${date_start}&date_end=${date_end}`
      )
      .then((datareponse) => {


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

        // start_timeDisplay = datareponse.start_timeDisplay;
        // end_timeDisplay = datareponse.end_timeDisplay;
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
            remaining_tank3: Number(item.remaining_tank3),
            remaining_tank4: Number(item.remaining_tank4),
            total_use: Number(item.total_use),
            error: Number(item.error),
            pd1_total: Number(item.pd1_total),
            pd1_value: Number(item.pd1_value),
            pd1_ro: Number(item.pd1_ro),
            pd2_total: Number(item.pd2_total),
            pd2_value: Number(item.pd2_value),
            pd2_ro: Number(item.pd2_ro),
            pd3_total: Number(item.pd3_total),
            pd3_value: Number(item.pd3_value),
            pd3_ro: Number(item.pd3_ro),
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
          
          // คืนค่าอ็อบเจกต์ใหม่ (พร้อมดึง properties อื่นๆ ถ้ามี)
          // NOTE: If you need to keep other properties, you must spread them: {...item, date_time: newDate}
          return { 
            ...item, 
            date_time: newDate || "-/-", 
            pd1_total: Number(item.pd1_total),
            pd2_total: Number(item.pd2_total),
            pd3_total: Number(item.pd3_total),
          }; 

        });
      };

      // 2. Assign the result back to datachart (this completes the operation)
      const datachart = await convertedDatachart(data);

      // console.log("Data prepared for chart:", datachart);

      // setIsLoading(true);
     const chartContainer = document.createElement('div');

      chartContainer.style.position = 'absolute';
      chartContainer.style.left = '-9999px';
      chartContainer.style.width = '1000px'; // Set width for the chart
      chartContainer.style.height = '300px'; // Set height for the chart
      // chartContainer.style.border = '1px solid #000';
      chartContainer.style.padding = '10px';
      chartContainer.style.zIndex = '9999';

      document.body.appendChild(chartContainer);

      const root = ReactDOM.createRoot(chartContainer);

      const CustomLegend = (props: { payload: any[] } ) => {

          const { payload } = props;

          return (
              <ul style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 0,
                  margin: '0 0 10px 0' // เพิ่ม margin ด้านล่างเพื่อเว้นช่องว่าง
              }}>

                {payload.map((entry, index) => {

                  let displayName = entry.value;
                
                if (entry.value === "pd1_total") {
                    displayName = "PD1 Total";
                } else if (entry.value === "pd2_total") {
                    displayName = "PD2 Total";
                } else if (entry.value === "pd3_total") {
                    displayName = "PD3 Total";
                } else if (entry.value === "error") {
                    displayName = "Error";
                }

                  return (
                    (                      
                      <li key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', marginRight: '20px' }}>
                        {/* ไอคอนที่กำหนดเอง */}
                        <svg width="16" height="16" viewBox="0 0 32 32" style={{ marginRight: '5px' }}>
                            <rect  x="0" y="0" width="32" height="100" fill={entry.color} />
                        </svg>
                        {/* ข้อความที่กำหนดเอง */}
                        <span className='pb-3'>{`${displayName} (${unit_value})`}</span>
                      </li>
                    )
                  )
                })}
              </ul>
          );
      };

       // Define the React component to be rendered
      const ChartToRender = () => {

        // Custom Label component to display the value on top of the bars
        const CustomBarLabel = (props: any) => {
            const { x, y, width, height, value } = props;

            return (
                <text x={x + width / 2} y={y} dy={-6} fill="rgba(0, 0, 0, 0.8)" textAnchor="middle" fontSize={14}>
                    {/* {value} */}
                </text>
            );
        };

        return (
          <ResponsiveContainer  width="100%" height="100%">
              <BarChart data={datachart} >

                  <CartesianGrid strokeDasharray="1 1" stroke="#D9D9D9" />
                  <XAxis dataKey="date_time" stroke="#000" fontSize={16} />
                  <YAxis stroke="#000" fontSize={16} tickFormatter={(value) => value.toLocaleString()} />
                  <Bar dataKey="pd1_total" fill={`#6FD195`} label={<CustomBarLabel />}></Bar>
                  <Bar dataKey="pd2_total" fill={`#63C1C1`} label={<CustomBarLabel />}></Bar>
                  <Bar dataKey="pd3_total" fill={`#D8A66B`} label={<CustomBarLabel />}></Bar>
                  
                  <Tooltip />
                  
                  <Legend
                    verticalAlign="top"
                    align="center"
                    content={<CustomLegend payload={[{ color: `${bgcolor_}` }]} />}
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
      root.render(<ChartToRender />);

      // Wait for a short moment to ensure the chart is rendered
      await new Promise(resolve => setTimeout(resolve, 1000)); 

      // Use html2canvas to convert the div to a canvas image
      const canvas = await html2canvas(chartContainer, { 
        logging:false,
        scale: 0.8, // Adjust the scale as needed
        useCORS: true,
        backgroundColor: null,
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
          return { 
            ...item, 
            date_time: newDate , 
            error: Number(item.error)
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
              <ul data-component-id="src\components\reportPdf\forms4.tsx:383:14" data-component-path="src\components\reportPdf\forms4.tsx" data-component-line="383" data-component-file="forms4.tsx" data-component-name="ul" data-component-content="%7B%22elementName%22%3A%22ul%22%7D" style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 0,
                  margin: '0 0 10px 0' // เพิ่ม margin ด้านล่างเพื่อเว้นช่องว่าง
              }}>
                  {payload.map((entry, index) => {

                      if(entry.value === "pd1_total"){
                        entry.value = "Error PD1 ";
                      }else if(entry.value === "pd2_total"){
                        entry.value = "Error PD2 ";
                      }else if(entry.value === "pd3_total"){
                        entry.value = "Error PD3 ";
                      }

                    return (
                        <li data-component-id="src\components\reportPdf\forms4.tsx:401:24" data-component-path="src\components\reportPdf\forms4.tsx" data-component-line="401" data-component-file="forms4.tsx" data-component-name="li" data-component-content="%7B%22elementName%22%3A%22li%22%7D"
                            key={`item-${index}`}
                            style={{ display: 'flex', alignItems: 'center', marginRight: '20px' }}
                        >
                            {/* ไอคอนที่กำหนดเอง */}
                            <svg data-component-id="src\components\reportPdf\forms4.tsx:406:28" data-component-path="src\components\reportPdf\forms4.tsx" data-component-line="406" data-component-file="forms4.tsx" data-component-name="svg" data-component-content="%7B%22elementName%22%3A%22svg%22%7D" width="16" height="16" viewBox="0 0 32 32" style={{ marginRight: '5px' }}>
                                <rect data-component-id="src\components\reportPdf\forms4.tsx:407:32" data-component-path="src\components\reportPdf\forms4.tsx" data-component-line="407" data-component-file="forms4.tsx" data-component-name="rect" data-component-content="%7B%22elementName%22%3A%22rect%22%7D" x="0" y="0" width="32" height="100" fill={entry.color} />
                            </svg>
                            {/* ข้อความที่กำหนดเอง */}
                            <span data-component-id="src\components\reportPdf\forms4.tsx:410:28" data-component-path="src\components\reportPdf\forms4.tsx" data-component-line="410" data-component-file="forms4.tsx" data-component-name="span" data-component-content="%7B%22elementName%22%3A%22span%22%2C%22className%22%3A%22pb-3%22%7D" className='pb-3'>{`Error (${unit_value})`}</span>
                        </li>
                      )                  
                  })}
              </ul>
            );
        };

        const LineChartToRender = () => {

          return (
            <ResponsiveContainer data-component-id="src\components\reportPdf\forms4.tsx:421:12" data-component-path="src\components\reportPdf\forms4.tsx" data-component-line="421" data-component-file="forms4.tsx" data-component-name="ResponsiveContainer" data-component-content="%7B%22elementName%22%3A%22ResponsiveContainer%22%7D" width="100%" height="100%">
                <LineChart data-component-id="src\components\reportPdf\forms4.tsx:422:16" data-component-path="src\components\reportPdf\forms4.tsx" data-component-line="422" data-component-file="forms4.tsx" data-component-name="LineChart" data-component-content="%7B%22elementName%22%3A%22LineChart%22%7D" data={linedatachart} >
                    <CartesianGrid data-component-id="src\components\reportPdf\forms4.tsx:423:20" data-component-path="src\components\reportPdf\forms4.tsx" data-component-line="423" data-component-file="forms4.tsx" data-component-name="CartesianGrid" data-component-content="%7B%22elementName%22%3A%22CartesianGrid%22%7D" strokeDasharray="1 1" stroke="#D9D9D9" />
                    <XAxis data-component-id="src\components\reportPdf\forms4.tsx:424:20" data-component-path="src\components\reportPdf\forms4.tsx" data-component-line="424" data-component-file="forms4.tsx" data-component-name="XAxis" data-component-content="%7B%22elementName%22%3A%22XAxis%22%7D" dataKey="date_time" stroke="#000" fontSize={16}/>
                    <YAxis data-component-id="src\components\reportPdf\forms4.tsx:425:20" data-component-path="src\components\reportPdf\forms4.tsx" data-component-line="425" data-component-file="forms4.tsx" data-component-name="YAxis" data-component-content="%7B%22elementName%22%3A%22YAxis%22%7D" stroke="#000" fontSize={16} tickFormatter={(value) => value.toLocaleString()}/>
                    
                    {/* === FIX: Change <Bar> to <Line> === */}
                    <Line data-component-id="src\components\reportPdf\forms4.tsx:428:20" data-component-path="src\components\reportPdf\forms4.tsx" data-component-line="428" data-component-file="forms4.tsx" data-component-name="Line" data-component-content="%7B%22elementName%22%3A%22Line%22%2C%22type%22%3A%22monotone%22%7D" type="monotone" // Optional: makes the line smooth
                        dataKey="error" 
                        stroke={`#FF0000`} // Use stroke for line color
                        strokeWidth={2}
                        dot={false} // Optional: removes dots at data points
                        // label={<CustomBarLabel />} // Remove or adapt the label component
                    />
                    {/* <Line type="monotone" // Optional: makes the line smooth
                        dataKey="pd2_total" 
                        stroke={`#63C1C1`} // Use stroke for line color
                        strokeWidth={2}
                        dot={false} // Optional: removes dots at data points
                        // label={<CustomBarLabel />} // Remove or adapt the label component
                    />
                    <Line type="monotone" // Optional: makes the line smooth
                        dataKey="pd3_total" 
                        stroke={`#D8A66B`} // Use stroke for line color
                        strokeWidth={2}
                        dot={false} // Optional: removes dots at data points
                        // label={<CustomBarLabel />} // Remove or adapt the label component
                    /> */}
                    
                    {/* Optional: Add Tooltip for value display on hover */}
                    {/* <Tooltip /> */}

                    <Legend data-component-id="src\components\reportPdf\forms4.tsx:453:20" data-component-path="src\components\reportPdf\forms4.tsx" data-component-line="453" data-component-file="forms4.tsx" data-component-name="Legend" data-component-content="%7B%22elementName%22%3A%22Legend%22%7D"
                      verticalAlign="top"
                      align="center"
                      content={<LinecustomLegend data-component-id="src\components\reportPdf\forms4.tsx:456:31" data-component-path="src\components\reportPdf\forms4.tsx" data-component-line="456" data-component-file="forms4.tsx" data-component-name="LinecustomLegend" data-component-content="%7B%22elementName%22%3A%22LinecustomLegend%22%7D" payload={[{ color: `${bgcolor_}` }]} />
                      } 
                      iconSize={16}
                    />
                </LineChart>
           </ResponsiveContainer>
          );
      };

      lineroot.render(<LineChartToRender data-component-id="src\components\reportPdf\forms4.tsx:465:22" data-component-path="src\components\reportPdf\forms4.tsx" data-component-line="465" data-component-file="forms4.tsx" data-component-name="LineChartToRender" data-component-content="%7B%22elementName%22%3A%22LineChartToRender%22%7D" />);

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
          title: `Report Used ${plantName_} ${format(new Date(), 'yyyy-MM-dd')}`,
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

        doc.text(`Report Used ${plantName_}`, pageWidth / 2, yPosition, { align: 'center'});
        yPosition += 17;
  
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

          // doc.text(`Tank : ${tank}`, margin, yPosition);
          // doc.text(`Plant : ${plantUse}`, rows2, yPosition);
          
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
          //   { id: 1, date: "2025/08/08", timeStart: "00:00", timeStop: "23:59", value: 4000 },
          //   { id: 2, date: "2025/08/09", timeStart: "00:00", timeStop: "23:59", value: 3000 },
          //   { id: 3, date: "2025/08/10", timeStart: "00:00", timeStop: "23:59", value: 5000 },
          //   { id: 4, date: "2025/08/11", timeStart: "00:00", timeStop: "23:59", value: 2780 },
          //   { id: 5, date: "2025/08/12", timeStart: "00:00", timeStop: "23:59", value: 1890 },
          // ];

          // หัวตารางแถวที่ 1: กำหนดหัวข้อหลักและการรวมแถว (rowSpan)
          const headerRow1 = [
              { content: 'Date', rowSpan: 2, styles: { minCellWidth: 15 } }, // รวม 2 แถว
              // { content: 'Time start', rowSpan: 2 },                     // รวม 2 แถว
              // { content: 'Time stop', rowSpan: 2 },                      // รวม 2 แถว
              { content: `Mixer \nRemaining \nTANK 3 \n(${unit_value})`, rowSpan: 2 }, // รวม 2 แถว
              { content: `Store \nRemaining \nTANK 4 \n(${unit_value})`, rowSpan: 2 }, // **แก้ไขตามรูป** - ชื่อเดิมคือ "After Fill"
              { content: `Total use \n(${unit_value})`, rowSpan: 2 },     // รวม 2 แถว
              { content: `Error \n(${unit_value})`, rowSpan: 2 },         // รวม 2 แถว
              { content: 'PD1', colSpan: 3 },                           // รวม 3 คอลัมน์
              { content: 'PD2', colSpan: 3 },                           // รวม 3 คอลัมน์
              { content: 'PD3', colSpan: 3 },                           // รวม 3 คอลัมน์
          ];

          // หัวตารางแถวที่ 2: กำหนดหัวข้อย่อย
          const headerRow2 = [
              `Total \n(${unit_value})`, `${plantName_} \n(${unit_value})`, `RO \n(${unit_value})`, // ใต้ PD1
              `Total \n(${unit_value})`, `${plantName_} \n(${unit_value})`, `RO \n(${unit_value})`, // ใต้ PD2
              `Total \n(${unit_value})`, `${plantName_} \n(${unit_value})`, `RO \n(${unit_value})`, // ใต้ PD3
          ];

          // แถวข้อมูล (tableRows) - ใช้ตามที่คุณกำหนดไว้ แต่ต้องตรวจสอบการจัดเรียงข้อมูลให้ตรงกับหัวตารางใหม่
          // **ข้อควรระวัง:** `tableRows` ที่คุณสร้างไว้มี 16 คอลัมน์ (นับจาก array items) ซึ่งไม่ตรงกับรูปภาพที่มี 17 คอลัมน์ (17 หัวข้อในแถวที่ 2)
          // ตารางในรูปมี 17 คอลัมน์ (Date, Time start, Time stop, TANK 3, TANK 4, Total use, Error, PD1 x 3, PD2 x 3, PD3 x 3)
          // โค้ด `tableRows` เดิมของคุณมี 16 รายการ:
          /*
          item.date_time,       // 1. Date
          item.start_time,      // 2. Time start
          item.end_time,        // 3. Time stop
          item.remaining_tank3.toFixed(2), // 4. Mixer Remaining TANK 3
          item.remaining_tank4.toFixed(2),      // 5. Store Remaining TANK 4 (ตามรูปคือ Store Remaining, แต่โค้ดคุณใช้ remaining_tank4)
          item.total_use.toFixed(2),       // 6. Total use
          item.error.toFixed(2),           // 7. Error
          item.pd1_total.toFixed(2),       // 8. PD1 Total
          item.pd1_value.toFixed(2),       // 9. PD1 NaOH (ตามรูปคือ NaOH, โค้ดคุณคือ pd1_value)
          item.pd1_ro.toFixed(2),          // 10. PD1 RO
          item.pd2_total.toFixed(2),       // 11. PD2 Total
          item.pd2_value.toFixed(2),       // 12. PD2 NaOH
          item.pd2_ro.toFixed(2),          // 13. PD2 RO
          item.pd3_total.toFixed(2),       // 14. PD3 Total
          item.pd3_value.toFixed(2),       // 15. PD3 NaOH
          item.pd3_ro.toFixed(2),          // 16. PD3 RO
          */
          // ***ขาดคอลัมน์ "Number" ไปในโค้ดของคุณ*** หากต้องการ "Number" ต้องเพิ่มเข้าไปใน `tableRows` และ `headerRow1`

          // ปรับ `tableRows` ให้ตรงกับหัวตาราง 17 คอลัมน์ (ถ้ามี Number) หรือ 16 คอลัมน์ (ถ้าไม่มี Number)
          // สมมติว่าใช้ 16 คอลัมน์ตามที่คุณเขียนมา และตัด "Number" ออกจาก `tableColumn` เดิม
          const tableRows = datatable.map((item) => [
              item.date_time,
              // item.start_time,
              // item.end_time,
              Number(item.remaining_tank3).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), // Mixer Remaining TANK 3
              Number(item.remaining_tank4).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),      // Store Remaining TANK 4
              Number(item.total_use).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              Number(item.error).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              Number(item.pd1_total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              Number(item.pd1_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              Number(item.pd1_ro).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              Number(item.pd2_total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              Number(item.pd2_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              Number(item.pd2_ro).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              Number(item.pd3_total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              Number(item.pd3_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              Number(item.pd3_ro).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          ]);


          // Add the table to the document
          (doc as any).autoTable({
              // ใช้หัวตาราง 2 แถว
              head: [headerRow1, headerRow2], 
              body: tableRows,
              theme: 'grid',
              startY: yPosition+chartHeight,
              tableWidth: 'auto',
              margin: { top: 20, left: 5, right: 5 },
              headStyles: {
                  halign: 'center',
                  valign: 'middle', // เพิ่ม valign: 'middle' เพื่อให้หัวตารางอยู่ตรงกลางแนวตั้ง
                  fillColor: [242, 242, 242], 
                  textColor: [0, 0, 0],
                  fontSize: 8, // กำหนด fontSize ใน headStyles เพื่อควบคุมขนาดเฉพาะส่วนหัว
              },
              bodyStyles: {
                  halign: 'center'
              },
              styles: {
                  fontSize: 8, // ลดขนาดตัวอักษรเพื่อช่วยให้ตารางกว้างพอดี
                  cellPadding: 2,
                  lineColor: [0, 0, 0],
                  lineWidth: 0.1
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
          // doc.save(`Report Used ${plantName_} ${format(new Date(), 'yyyy-MM-dd')}.pdf`);
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
