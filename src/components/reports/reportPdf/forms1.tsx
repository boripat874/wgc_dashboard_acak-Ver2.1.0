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
import "../../../../public/fonts/thsarabun-normal";
import "../../../../public/fonts/thsarabunbold-normal";

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
    var period_Display = "- Day";
    var start_timeDisplay = "--";
    var end_timeDisplay = "--";

    var C1 = 4;
    var C2 = 50;
    
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
      start_timeDisplay = "--";
      end_timeDisplay = "--";
      
      return;
    });

    const period_value = await CheckPeriod(period);

    // console.log("aggregation", aggregation);

    const aggregation_value = await Aggregation(aggregation);

    // console.log("unit_value >>",unit);

    const unit_value = await Unit(unit);

      var plantName_ = "";
      var bgcolor_ = "#B162AF";
      var C1 = 4;
      var C2 = 50;

      if(plantName === "Alkaline"){
        plantName_ = "NaOH";
        bgcolor_ = "#B162AF";
        C1 = 4;
        C2 = 50;
      }else if(plantName === "Acid"){
        plantName_ = "HCl";
        bgcolor_ = "#B9792B"; // Set a different background color for Acid
        C1 = 6;
        C2 = 35;
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

          const originalDate = item.dateTime; // เช่น: '2025-01-20'

          
          // 1. แทนที่ตัวคั่น '-' ด้วยขีดกลาง '/'
          const newDate = originalDate.replaceAll(/-/g, '/'); 

          // tank = tank === "12" ? "1+2" : tank;
          
          // คืนค่าอ็อบเจกต์ใหม่ (พร้อมดึง properties อื่นๆ ถ้ามี)
          // NOTE: If you need to keep other properties, you must spread them: {...item, number: i, date_time: newDate}
          return { 
            // ...item, 
            dateTime: newDate, 
            density: Number(item.density).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            data_remaining_fill: Number(item.data_remaining_fill).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            data_remaining_fill_total: Number(item.data_remaining_fill_total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            Fill_between_day: Number(item.Fill_between_day).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            data_Fill: Number(item.data_Fill).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          };

        });

      };

      // 4. Assign the result back to datatable
      const datatable = await convertedData(data);

      // console.log("datatable >>>",datatable)

      // =========================================================================== การประมวลผลสำหรับ Main chart ---

      // 1. Corrected function for datachart conversion (synchronous)
      const convertedDatachart = async(originalData: Data[]) => {
        // Use map and return the NEW array it creates
        // console.log("originalData >>", originalData);

        return originalData.map(item => {

          var originalDate = "-/-";
          let monthAndDay = "-/-";

          // if (aggregation === "perday") {

          //   originalDate = item.dateTime; // เช่น: '2025/01/20'

          //   // 1. ตัดสตริงจากตำแหน่งที่ 5 (index 5 คือตำแหน่งของเดือน) -> ผลลัพธ์: '01/20'
          //   monthAndDay = originalDate.slice(5); 

          // }else{
          //   // monthAndDay = item.dateTime+" "+item.start_time; // เช่น: '2025/01/20 01:00'
          //   monthAndDay = item.dateTime; // เช่น: '2025/01/20 01:00'

          // }

          monthAndDay = item.dateTime; // เช่น: '2025/01/20 01:00'

          // 2. แทนที่ตัวคั่น '/' ด้วยขีดกลาง '-' -> ผลลัพธ์: '01-20'
          const newDate = monthAndDay.replaceAll('-', '/'); 
          
          // คืนค่าอ็อบเจกต์ใหม่ (พร้อมดึง properties อื่นๆ ถ้ามี)
          // NOTE: If you need to keep other properties, you must spread them: {...item, date_time: newDate}
          return { 
            ...item, 
            date_time: newDate , 
            value: Number(item.data_Fill)
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
      // chartContainer.style.color = '#000';
      chartContainer.style.padding = '10px';

      document.body.appendChild(chartContainer);

      const root = ReactDOM.createRoot(chartContainer);

      const CustomLegend = (props: { payload: any[] } ) => {
          const { payload } = props;
          return (
              <ul  style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 0,
                  margin: '0 0 50px 0' // เพิ่ม margin ด้านล่างเพื่อเว้นช่องว่าง
              }}>
                  {payload.map((entry, index) => (
                      <li 
                          key={`item-${index}`}
                          style={{ display: 'flex', alignItems: 'center', marginRight: '20px' }}
                      >
                          {/* ไอคอนที่กำหนดเอง */}
                          <svg  width="16" height="16" viewBox="0 0 32 32" style={{ marginRight: '5px' }}>
                              <rect  x="0" y="0" width="32" height="50" fill={entry.color} />
                          </svg>
                          {/* ข้อความที่กำหนดเอง */}
                          <span className='pb-3 text-black text-xs'>{`รับเข้าใหม่ (kg)`}</span>
                      </li>
                  ))}
              </ul>
          );
      };

       // Define the React component to be rendered
      const ChartToRender = () => {

        // Custom Label component to display the value on top of the bars
        // const CustomBarLabel = (props: any) => {
        //     const { x, y, width, height, value } = props;
        //     return (
        //         <text x={x + width / 2} y={y} dy={-6} fill="rgba(0, 0, 0, 0.8)" textAnchor="middle" fontSize={12}>
        //             {Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        //         </text>
        //     );
        // };

        const CustomBarLabel = (props: any) => {

          const { x, y, width, value } = props;

          const formattedValue = Number(value).toLocaleString(undefined, { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
          });

          // ==========================================
          // ส่วนคำนวณ Dynamic Font Size และระยะห่าง
          // ==========================================
          // เงื่อนไขที่ 1: แท่งกราฟกว้างพอ (width > 50) แสดงผลเป็น "แนวนอนเหนือกราฟ"
          if (width > 50) {
            // ปรับ font size ตามความกว้าง แต่ล็อกไว้ไม่ให้เกิน 13px และไม่ต่ำกว่า 10px
            const fontSize = Math.min(Math.max(width * 0.18, 10), 13);
            const dyValue = -(fontSize * 0.5); // ขยับช่องไฟด้านบนตามขนาดฟอนต์

            return (
              <text 
                  x={x + width / 2} 
                  y={y} 
                  dy={dyValue} 
                  fill="rgba(0, 0, 0, 0.8)" 
                  textAnchor="middle" 
                  fontSize={fontSize}
                  fontWeight="bold"
              >
                  {formattedValue}
              </text>
            );
          } 
          
          // เงื่อนไขที่ 2: แท่งกราฟแคบ (width <= 50) แสดงผลเป็น "แนวตั้ง 90 องศา เหนือกราฟ"
          else {
            // สำหรับแนวตั้ง ปรับ font size ตามความกว้างแท่ง โดยล็อกช่วงไว้ที่ 8px ถึง 11px
            const fontSize = Math.min(Math.max(width * 0.25, 8), 11);
            
            // ระยะห่างจากยอดกราฟ ยิ่งฟอนต์เล็ก ยิ่งขยับเข้าไปใกล้ขึ้น
            const gap = fontSize * 0.7; 
            const topY = y - gap; 

            return (
              <text 
                  x={x+2 + width / 2} 
                  y={topY} 
                  transform={`rotate(-90, ${(x+3) + width / 2}, ${topY})`}
                  fill="rgba(0, 0, 0, 0.8)" 
                  textAnchor="start" 
                  fontSize={fontSize}
                  fontWeight="bold"
              >
                  {formattedValue}
              </text>
            );
          }
        };

        return (
          <ResponsiveContainer  width="100%" height="100%">
              <BarChart  data={datachart}>
                  <CartesianGrid  strokeDasharray="1 1" stroke="#D9D9D9" />
                  <XAxis dataKey="date_time" stroke="#000" fontSize={12} />
                  <YAxis  stroke="#000" fontSize={12} tickFormatter={(value) => value.toLocaleString()} />
                  <Bar dataKey="value" fill={`${bgcolor_}`} label={<CustomBarLabel data-component-id="src\components\reportPdf\forms1.tsx:296:67"/>}>
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
      root.render(<ChartToRender />);

      // Wait for a short moment to ensure the chart is rendered
      await new Promise(resolve => setTimeout(resolve, 1000)); 

      // Use html2canvas to convert the div to a canvas image
      const canvas = await html2canvas(chartContainer, { 
        // logging: true,
        // scale: 1.0, // Adjust the scale as needed
        // useCORS: true,
        scale: 3, // เพิ่มความละเอียดเป็น 3 เท่า
        useCORS: true,
        logging: false,
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

            originalDate = item.dateTime; // เช่น: '2025/01/20'

            // 1. ตัดสตริงจากตำแหน่งที่ 5 (index 5 คือตำแหน่งของเดือน) -> ผลลัพธ์: '01/20'
            monthAndDay = originalDate.slice(5); 

          }else{
            // monthAndDay = item.dateTime+" "+item.start_time; // เช่น: '2025/01/20 01:00'
            monthAndDay = item.dateTime; // เช่น: '2025/01/20 01:00'

          }

          // 2. แทนที่ตัวคั่น '/' ด้วยขีดกลาง '-' -> ผลลัพธ์: '01-20'
          const newDate = monthAndDay.replaceAll('-', '/'); 
          
          // คืนค่าอ็อบเจกต์ใหม่ (พร้อมดึง properties อื่นๆ ถ้ามี)
          // NOTE: If you need to keep other properties, you must spread them: {...item, date_time: newDate}
          return { 
            ...item, 
            date_time: newDate , 
            value: Number(item.Fill_between_day)
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
              <ul style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 0,
                  margin: '0 0 50px 0' // เพิ่ม margin ด้านล่างเพื่อเว้นช่องว่าง
              }}>
                  {payload.map((entry, index) => (
                      <li 
                          key={`item-${index}`}
                          style={{ display: 'flex', alignItems: 'center', marginRight: '20px' }}
                      >
                          {/* ไอคอนที่กำหนดเอง */}
                          <svg width="16" height="16" viewBox="0 0 32 32" style={{ marginRight: '5px' }}>
                              <rect x="0" y="0" width="32" height="100" fill={entry.color} />
                          </svg>
                          {/* ข้อความที่กำหนดเอง */}
                          <span className='pb-3 text-black text-xs'>{`ผลต่างเข้มข้นใน Tank ระหว่างวัน (kg)`}</span>
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
                    <XAxis data-component-id="src\components\reportPdf\forms1.tsx:420:20" data-component-path="src\components\reportPdf\forms1.tsx" data-component-line="420" data-component-file="forms1.tsx" data-component-name="XAxis" data-component-content="%7B%22elementName%22%3A%22XAxis%22%7D" dataKey="date_time" stroke="#000" fontSize={12} />
                    <YAxis data-component-id="src\components\reportPdf\forms1.tsx:421:20" data-component-path="src\components\reportPdf\forms1.tsx" data-component-line="421" data-component-file="forms1.tsx" data-component-name="YAxis" data-component-content="%7B%22elementName%22%3A%22YAxis%22%7D" stroke="#000" fontSize={12} tickFormatter={(value) => value.toLocaleString()} />
                    
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
        // scale: 0.8, // Adjust the scale as needed
        // useCORS: true,
        scale: 3, // ปรับให้คมชัดเท่ากัน
        useCORS: true,
        logging: false,
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

  
        doc.setFont("Sarabun", "bold");
        
        // --- Content ---
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 5;
        let yPosition = 20;
        
        doc.setFontSize(16);
        // doc.setFontStyle('bold');

        doc.rect(5, yPosition-12, (pageWidth - 2 * margin), 20);


        const imgWidth = imgLogo.width;
        const imgHeight = imgLogo.height;

        // Add the image to the PDF
        doc.addImage(imgLogo, 'PNG', 10, 13, 30, 10); // Adjust position and dimensions

        doc.text(`Report Fill ${plantName_}`, pageWidth / 2, yPosition, { align: 'center'});
        

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

          doc.setFontSize(10);

          // doc.text(`Tank : ${tank}`, margin+10, yPosition);
          
          // yPosition += lineHeight;
          
          // doc.text(`Unit : ${unit_value}`, rows2, yPosition);
          // doc.text(`Data aggregation : ${aggregation_value}`, rows3, yPosition);
          doc.text(`Period : ${period_Display}`, margin+10, yPosition);
          doc.text(`Time Start : ${start_timeDisplay == "--"?start_timeDisplay : start_timeDisplay.replace(/-/g, '/')}`, rows2, yPosition);
          doc.text(`Time End : ${end_timeDisplay == "--"?end_timeDisplay : end_timeDisplay.replace(/-/g, '/')}`, rows3, yPosition);
          // doc.text(`Time Start : 2025-08-08`, margin, yPosition);
          // doc.text(`Time End : 2025-08-12`, rows2, yPosition);

          yPosition += lineHeight;

          // Add the chart image to the PDF
          const chartWidth = 200; // mm
          const chartX = (doc.internal.pageSize.getWidth() - chartWidth) / 2;

          const chartHeight = (canvas.height / canvas.width) * chartWidth;
          
          // yPosition += 10;
          doc.addImage(chartImage, 'PNG', chartX, yPosition, chartWidth, chartHeight,undefined, 'FAST');

          const linechartHeight = (linecanvas.height / linecanvas.width) * chartWidth;

          doc.addImage(linechartImage, 'PNG', chartX, yPosition+chartHeight, chartWidth, linechartHeight,undefined, 'FAST');

          yPosition += lineHeight+30;

          //===============================================================================
          yPosition += 8;

          doc.setFontSize(12);

          // const datatable = [
          //   { id: 1, date: "-/-/-", timeStart: "00:00", timeStop: "00:00", value: 0 },
          // ];

          // Define columns and rows for the table
          const tableColumn = [
            "วันที่", 
            "Density", 
            `คงเหลือ Tank ${plantName_} (${C2}%)\n(L)`, 
            `คงเหลือ ${plantName_} (${C2}%) รวมสูตร\n(kg)`, 
            `ผลต่าง ${plantName_} (${C2}%) ใน Tank\nระหว่างวัน (kg)`, 
            `รับเข้าใหม่ (kg)`, 
          ];

          let tableRows = [] as any;

          datatable.forEach((item) => {

            // console.log("item >>", item);

            tableRows.push([
              item.dateTime,
              item.density,
              item.data_remaining_fill,
              item.data_remaining_fill_total,
              item.Fill_between_day,
              item.data_Fill
            ])

          });

          // console.log("tableRows >>", tableRows);


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
              fillColor: [230, 240, 255], // สีฟ้าอ่อนตามหัวตาราง
              textColor: [0, 0, 0],
              fontStyle: 'bold'
            },
            styles: {
              font: "Sarabun",
              fontSize: 10, // ลดขนาดฟอนต์ลงเพื่อให้พอดีกับแนวนอน
              cellPadding: 1,
              halign: 'center',
              valign: 'middle',
              lineColor: [0, 0, 0],
              lineWidth: 0.1,
              overflow: 'linebreak'
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
              const H = yPosition-4;
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