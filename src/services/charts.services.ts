// "use client";

// import useSWR from 'swr';
// import { fetcher } from "@/app/utils/fetcher";
import {fetchDataFillchart} from '@/services/fetch';
import {fetchDataStorechart} from '@/services/fetch';
import {fetchDataUsedchart} from '@/services/fetch';
import {fetchDataTransferchart} from '@/services/fetch';
import { cache } from 'react';

export const getFillOverviewData = cache(async (timeFrame: string, department: string) => {
  // Fake delay
  // await new Promise((resolve) => setTimeout(resolve, 500));

  // const data = await fetch(`http://localhost:3000/api/chartfilloverview?period=today`)
  // .then(res => res.json());

  // console.log("timeFrame?service >>> ",timeFrame)

  let response = [];

  if(department == "fill"){

    response = await fetchDataFillchart(timeFrame);
    // console.log("fetchDataFillchart?service >>> ",response?.data)
    
  }else if(department == "store"){

    response = await fetchDataStorechart(timeFrame);
    // console.log("fetchDataStorechart?service >>> ",response.data)

  }else if(department == "used"){
    response = await fetchDataUsedchart(timeFrame);
    // console.log("fetchDataUsedchart?service >>> ",response?.data)
  }

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
          // mapped[xLabel] = Number(item.total_T1_Kg || 0) + (Number(item.total_T2_Kg || 0  ))
          // console.log("item[namedata] >>:", item[namedata])

          // mapped[xLabel] = Number(item[namedata] || 0);
          // mapped[xLabel] = Number(item["total_fill"] || 0);

          if(namedata == "NaOH_Fill" || namedata == "HCI_Fill"){

            mapped[xLabel] = Number(item["total_fill"] || 0);

          }else if(namedata == "NaOH_Store" || namedata == "HCI_Store"){

            mapped[xLabel] = Number(item["total_store"] || 0);

          }else if(namedata == "NaOH_Used" || namedata == "HCI_Used"){

            mapped[xLabel] = Number(item["total_used"] || 0);

          }else {

            mapped[xLabel] = 0;
            
          }


        });
        return mapped;
    };

    const naohMapped = department === "fill" ? 
                        processRaw(rawData.NaOH_Fill,"NaOH_Fill") : department === "store" ? 
                        processRaw(rawData.NaOH_Store,"NaOH_Store") : processRaw(rawData.NaOH_Used,"NaOH_Used");

    const hciMapped = department === "fill" ? 
                        processRaw(rawData.HCI_Fill, "HCI_Fill") : department === "store" ? 
                        processRaw(rawData.HCI_Store, "HCI_Store") : processRaw(rawData.HCI_Used, "HCI_Used");

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


  // if (timeFrame === "monthly") {
  //   return {
  //     received: [
  //     { x: "01/04", y: 0 },
  //     { x: "02/04", y: 2000 },
  //     { x: "03/04", y: 3500 },
  //     { x: "04/04", y: 4500 },
  //     { x: "05/04", y: 3500 },
  //     { x: "06/04", y: 5500 },
  //     { x: "07/04", y: 6500 },
  //     { x: "08/04", y: 5000 },
  //     { x: "09/04", y: 6500 },
  //     { x: "10/04", y: 7500 },
  //     { x: "11/04", y: 6000 },
  //     { x: "12/04", y: 7500 },
  //   ],
  //   due: [
  //     { x: "01/04", y: 1500 },
  //     { x: "02/04", y: 900 },
  //     { x: "03/04", y: 1700 },
  //     { x: "04/04", y: 3200 },
  //     { x: "05/04", y: 2500 },
  //     { x: "06/04", y: 6800 },
  //     { x: "07/04", y: 8000 },
  //     { x: "09/04", y: 6800 },
  //     { x: "10/04", y: 8400 },
  //     { x: "11/04", y: 9400 },
  //     { x: "12/04", y: 7400 },
  //     { x: "11/04", y: 6000 },
  //   ],
  //   };

  // }else if(timeFrame === "yearly"){
  //   return {
  //       received: [
  //       { x: "Jan", y: 0 },
  //       { x: "Feb", y: 2000 },
  //       { x: "Mar", y: 3500 },
  //       { x: "Apr", y: 4500 },
  //       { x: "May", y: 3500 },
  //       { x: "Jun", y: 5500 },
  //       { x: "Jul", y: 6500 },
  //       { x: "Aug", y: 5000 },
  //       { x: "Sep", y: 6500 },
  //       { x: "Oct", y: 7500 },
  //       { x: "Nov", y: 6000 },
  //       { x: "Dec", y: 7500 },
  //     ],
  //     due: [
  //       { x: "Jan", y: 1500 },
  //       { x: "Feb", y: 900 },
  //       { x: "Mar", y: 1700 },
  //       { x: "Apr", y: 3200 },
  //       { x: "May", y: 2500 },
  //       { x: "Jun", y: 6800 },
  //       { x: "Jul", y: 8000 },
  //       { x: "Aug", y: 6800 },
  //       { x: "Sep", y: 8400 },
  //       { x: "Oct", y: 9400 },
  //       { x: "Nov", y: 7400 },
  //       { x: "Dec", y: 6200 },
  //     ],
  //   }
  // }else{
  //   return {
  //     received: [
  //       { x: "10:30", y: 0 },
  //       { x: "13:00", y: 2000 },
  //       { x: "16:00", y: 3500 },
  
  //     ],
  //     due: [
  //       { x: "10:30", y: 1500 },
  //       { x: "13:00", y: 900 },
  //       { x: "16:00", y: 1700 },
  
  //     ],
  //   };
    
  // }

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