// "use client";

// import useSWR from 'swr';
// import { fetcher } from "@/app/utils/fetcher";
import {fetchDataFillchart} from '@/services/fetch';
import {fetchDataStorechart} from '@/services/fetch';
import {fetchDataUsedchart} from '@/services/fetch';
import {fetchDataTransferchart} from '@/services/fetch';
import { cache } from 'react';

export const getOverviewData = cache(async (timeFrame: string, department: string) => {
  let response = [];

  if (department === "fill") {
    response = await fetchDataFillchart(timeFrame);
  } else if (department === "store") {
    response = await fetchDataStorechart(timeFrame);
  } else if (department === "used") {
    response = await fetchDataUsedchart(timeFrame);
  }

  const rawData = response?.data;

  if (!rawData) {
    return { received: [], due: [] };
  }

  // 1. ฟังก์ชันช่วยสร้าง Label และจัดการ Object แบบปลอดภัยสูง
  const processRaw = (source: any, namedata: string) => {
    if (!source) return {};
    const mapped: Record<string, number> = {};
    
    Object.values(source).forEach((item: any) => {
      if (!item) return;

      let xLabel = item.date;
      const isFullDate = item.date && String(item.date).includes("-");

      if (isFullDate) {
        const d = new Date(item.date);
        if (!isNaN(d.getTime())) {
          if (timeFrame === "monthly") {
            xLabel = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
          } else if (timeFrame === "yearly") {
            xLabel = d.toLocaleString('en-US', { month: 'short' });
          } else {
            // แก้ไข: สำหรับ daily / today หรืออื่นๆ ให้แปลงเป็นเวลา HH:mm เสมอ เพื่อให้ ApexCharts อ่านได้ราบรื่น
            xLabel = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          }
        }
      }

      // ดักจับค่าตัวเลข: ตรวจสอบทั้งคีย์รวม (total_*) และคีย์ตรงชื่อ (namedata) ป้องกันคีย์หาย
      const value = item.total_fill ?? item.total_store ?? item.total_used ?? item[namedata] ?? 0;
      mapped[xLabel] = Number(value) || 0;
    });
    return mapped;
  };

  // ดึงข้อมูล NaOH แยกตามแผนก
  const naohMapped = department === "fill" 
    ? processRaw(rawData.NaOH_Fill, "NaOH_Fill") 
    : department === "store" 
      ? processRaw(rawData.NaOH_Store, "NaOH_Store") 
      : processRaw(rawData.NaOH_Used, "NaOH_Used");

  // ดึงข้อมูล HCI: เพิ่ม Fallback หากแผนก store หรือ used ไม่มีคีย์ HCI ให้กลับไปใช้คีย์ NaOH แทนตามโค้ดเดิมของคุณ
  const hciMapped = department === "fill" 
    ? processRaw(rawData.HCI_Fill, "HCI_Fill") 
    : department === "store" 
      ? processRaw(rawData.HCI_Store || rawData.NaOH_Store, "HCI_Store") 
      : processRaw(rawData.HCI_Used || rawData.NaOH_Used, "HCI_Used");

  // 2. สร้าง Set ของแกน X ทั้งหมด
  const allLabels = Array.from(new Set([
    ...Object.keys(naohMapped),
    ...Object.keys(hciMapped)
  ])).sort();

  // 3. สร้าง Result
  const received = allLabels.map(label => ({
    x: label,
    y: naohMapped[label] || 0
  }));

  const due = allLabels.map(label => ({
    x: label,
    y: hciMapped[label] || 0
  }));

  return { received, due };
});

export const getStoreOverviewData = cache(async (timeFrame: string, department: string) => {
  // Fake delay
  // await new Promise((resolve) => setTimeout(resolve, 500));

  // const data = await fetch(`http://localhost:3000/api/chartfilloverview?period=today`)
  // .then(res => res.json());

    // console.log("timeFrame?service >>> ",timeFrame)

  const response = await fetchDataStorechart(timeFrame);
  const rawData = response?.data;

    // console.log("rawData?service >>> ",rawData)


  if (!rawData) {
    return { received: [], due: [] };
  }

  // 1. ฟังก์ชันช่วยสร้าง Label และจัดการ Object เบื้องต้น
    const processRaw = (source: any, namedata:string) => {
        if (!source) return {};
        const mapped: Record<string, number> = {};
        
        Object.values(source).forEach((item: any) => {
            let xLabel = item.date;
            const isFullDate = item.date && item.date.includes("-");

            if (isFullDate) {
                const d = new Date(item.date);
                if (!isNaN(d.getTime())) {
                    if (timeFrame === "monthly") {
                        xLabel = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
                    } else if (timeFrame === "yearly") {
                        xLabel = d.toLocaleString('en-US', { month: 'short' });
                    }
                }
            }
            // เก็บข้อมูลในรูปแบบ { "10:32": 100, "10:35": 200 }
            mapped[xLabel] = Number(item[namedata] || 0);

        });
        return mapped;
    };

    const naohMapped = processRaw(rawData.NaOH_Store,"NaOH_Store");
    const hciMapped = processRaw(rawData.NaOH_Store, "NaOH_Store");

    // 2. สร้าง Set ของแกน X ทั้งหมด (รวมชื่อวันที่/เวลาจากทั้งสองฝั่งไม่ให้ซ้ำกัน)
    const allLabels = Array.from(new Set([
        ...Object.keys(naohMapped),
        ...Object.keys(hciMapped)
    ])).sort(); // sort เพื่อให้เวลาเรียงลำดับ

    // 3. สร้าง Result โดยเช็คว่าถ้าไม่มีข้อมูลใน Label นั้นๆ ให้เป็น 0
    const received = allLabels.map(label => ({
        x: label,
        y: naohMapped[label] || 0 // ถ้าไม่มีค่าใน Naoh ให้เป็น 0
    }));

    const due = allLabels.map(label => ({
        x: label,
        y: hciMapped[label] || 0 // ถ้าไม่มีค่าใน Hci ให้เป็น 0
    }));

    // console.log(sales);
    // console.log(revenue);


    return { received, due };

});

export const getUsedOverviewData = cache(async (timeFrame: string, department: string) => {
  // Fake delay
  // await new Promise((resolve) => setTimeout(resolve, 500));

  // const data = await fetch(`http://localhost:3000/api/chartfilloverview?period=today`)
  // .then(res => res.json());

    // console.log("timeFrame?service >>> ",timeFrame)

  const response = await fetchDataUsedchart(timeFrame);
  const rawData = response?.data;

    // console.log("rawData?service >>> ",rawData)


  if (!rawData) {
    return { received: [], due: [] };
  }

  // 1. ฟังก์ชันช่วยสร้าง Label และจัดการ Object เบื้องต้น
    const processRaw = (source: any, namedata:string) => {
        if (!source) return {};
        const mapped: Record<string, number> = {};
        
        Object.values(source).forEach((item: any) => {
            let xLabel = item.date;
            const isFullDate = item.date && item.date.includes("-");

            if (isFullDate) {
                const d = new Date(item.date);
                if (!isNaN(d.getTime())) {
                    if (timeFrame === "monthly") {
                        xLabel = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
                    } else if (timeFrame === "yearly") {
                        xLabel = d.toLocaleString('en-US', { month: 'short' });
                    }
                }
            }
            // เก็บข้อมูลในรูปแบบ { "10:32": 100, "10:35": 200 }
            mapped[xLabel] = Number(item[namedata] || 0);

        });
        return mapped;
    };

    const naohMapped = processRaw(rawData.NaOH_Used,"NaOH_Used");
    const hciMapped = processRaw(rawData.NaOH_Used, "NaOH_Used");

    // 2. สร้าง Set ของแกน X ทั้งหมด (รวมชื่อวันที่/เวลาจากทั้งสองฝั่งไม่ให้ซ้ำกัน)
    const allLabels = Array.from(new Set([
        ...Object.keys(naohMapped),
        ...Object.keys(hciMapped)
    ])).sort(); // sort เพื่อให้เวลาเรียงลำดับ

    // 3. สร้าง Result โดยเช็คว่าถ้าไม่มีข้อมูลใน Label นั้นๆ ให้เป็น 0
    const received = allLabels.map(label => ({
        x: label,
        y: naohMapped[label] || 0 // ถ้าไม่มีค่าใน Naoh ให้เป็น 0
    }));

    const due = allLabels.map(label => ({
        x: label,
        y: hciMapped[label] || 0 // ถ้าไม่มีค่าใน Hci ให้เป็น 0
    }));

    // console.log(sales);
    // console.log(revenue);
    return { received, due };

});

export const getTransferOverviewData = cache(async (timeFrame: string) =>{
  // Fake delay
  // await new Promise((resolve) => setTimeout(resolve, 1000));

  // if (timeFrame === "last week") {
  //   return {
  //     sales: [
  //       { x: "Sat", y: 3300 },
  //       { x: "Sun", y: 4400 },
  //       { x: "Mon", y: 3100 },
  //       { x: "Tue", y: 5700 },
  //       { x: "Wed", y: 1200 },
  //       { x: "Thu", y: 3300 },
  //       { x: "Fri", y: 5500 },
  //     ],
  //     revenue: [
  //       { x: "Sat", y: 1000 },
  //       { x: "Sun", y: 2000 },
  //       { x: "Mon", y: 1700 },
  //       { x: "Tue", y: 700 },
  //       { x: "Wed", y: 1000 },
  //       { x: "Thu", y: 2300 },
  //       { x: "Fri", y: 1300 },
  //     ],
  //   };
  // }

  // return {
  //   sales: [
  //     { x: "Sat", y: 4400 },
  //     { x: "Sun", y: 5500 },
  //     { x: "Mon", y: 4100 },
  //     { x: "Tue", y: 6700 },
  //     { x: "Wed", y: 2200 },
  //     { x: "Thu", y: 4300 },
  //     { x: "Fri", y: 6500 },
  //   ],
  //   revenue: [
  //     { x: "Sat", y: 1300 },
  //     { x: "Sun", y: 2300 },
  //     { x: "Mon", y: 2000 },
  //     { x: "Tue", y: 800 },
  //     { x: "Wed", y: 1300 },
  //     { x: "Thu", y: 2700 },
  //     { x: "Fri", y: 1500 },
  //   ],
  // };

    const response = await fetchDataTransferchart(timeFrame);
    const rawData = response?.data;

    if (!rawData) {
      return { sales: [], revenue: [] };
    }

    // 1. ฟังก์ชันช่วยสร้าง Label และจัดการ Object เบื้องต้น
    const processRaw = (source: any) => {
        if (!source) return {};
        const mapped: Record<string, number> = {};
        
        Object.values(source).forEach((item: any) => {
            let xLabel = item.date;
            const isFullDate = item.date && item.date.includes("-");

            if (isFullDate) {
                const d = new Date(item.date);
                if (!isNaN(d.getTime())) {
                    if (timeFrame === "monthly") {
                        xLabel = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
                    } else if (timeFrame === "yearly") {
                        xLabel = d.toLocaleString('en-US', { month: 'short' });
                    }
                }
            }
            // เก็บข้อมูลในรูปแบบ { "10:32": 100, "10:35": 200 }
            mapped[xLabel] = item.volume || 0;
        });
        return mapped;
    };

    const naohMapped = processRaw(rawData.NaOH_Transfer);
    const hciMapped = processRaw(rawData.HCI_Transfer);

    // 2. สร้าง Set ของแกน X ทั้งหมด (รวมชื่อวันที่/เวลาจากทั้งสองฝั่งไม่ให้ซ้ำกัน)
    const allLabels = Array.from(new Set([
        ...Object.keys(naohMapped),
        ...Object.keys(hciMapped)
    ])).sort(); // sort เพื่อให้เวลาเรียงลำดับ

    // 3. สร้าง Result โดยเช็คว่าถ้าไม่มีข้อมูลใน Label นั้นๆ ให้เป็น 0
    const sales = allLabels.map(label => ({
        x: label,
        y: naohMapped[label] || 0 // ถ้าไม่มีค่าใน Naoh ให้เป็น 0
    }));

    const revenue = allLabels.map(label => ({
        x: label,
        y: hciMapped[label] || 0 // ถ้าไม่มีค่าใน Hci ให้เป็น 0
    }));

    // console.log(sales);
    // console.log(revenue);


    return { sales, revenue };
})

export async function getDevicesUsedData(
  timeFrame?: "monthly" | "yearly" | (string & {}),
) {
  // Fake delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const data = [
    {
      name: "Desktop",
      percentage: 0.65,
      amount: 1625,
    },
    {
      name: "Tablet",
      percentage: 0.1,
      amount: 250,
    },
    {
      name: "Mobile",
      percentage: 0.2,
      amount: 500,
    },
    {
      name: "Unknown",
      percentage: 0.05,
      amount: 125,
    },
  ];

  if (timeFrame === "yearly") {
    data[0].amount = 19500;
    data[1].amount = 3000;
    data[2].amount = 6000;
    data[3].amount = 1500;
  }

  return data;
}

export async function getCampaignVisitorsData() {
  // Fake delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    total_visitors: 784_000,
    performance: -1.5,
    chart: [
      { x: "S", y: 168 },
      { x: "S", y: 385 },
      { x: "M", y: 201 },
      { x: "T", y: 298 },
      { x: "W", y: 187 },
      { x: "T", y: 195 },
      { x: "F", y: 291 },
    ],
  };
}

export async function getVisitorsAnalyticsData() {
  // Fake delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return [
    168, 385, 201, 298, 187, 195, 291, 110, 215, 390, 280, 112, 123, 212, 270,
    190, 310, 115, 90, 380, 112, 223, 292, 170, 290, 110, 115, 290, 380, 312,
  ].map((value, index) => ({ x: index + 1 + "", y: value }));
}

export async function getCostsPerInteractionData() {
  return {
    avg_cost: 560.93,
    growth: 2.5,
    chart: [
      {
        name: "Google Ads",
        data: [
          { x: "Sep", y: 15 },
          { x: "Oct", y: 12 },
          { x: "Nov", y: 61 },
          { x: "Dec", y: 118 },
          { x: "Jan", y: 78 },
          { x: "Feb", y: 125 },
          { x: "Mar", y: 165 },
          { x: "Apr", y: 61 },
          { x: "May", y: 183 },
          { x: "Jun", y: 238 },
          { x: "Jul", y: 237 },
          { x: "Aug", y: 235 },
        ],
      },
      {
        name: "Facebook Ads",
        data: [
          { x: "Sep", y: 75 },
          { x: "Oct", y: 77 },
          { x: "Nov", y: 151 },
          { x: "Dec", y: 72 },
          { x: "Jan", y: 7 },
          { x: "Feb", y: 58 },
          { x: "Mar", y: 60 },
          { x: "Apr", y: 185 },
          { x: "May", y: 239 },
          { x: "Jun", y: 135 },
          { x: "Jul", y: 119 },
          { x: "Aug", y: 124 },
        ],
      },
    ],
  };
}