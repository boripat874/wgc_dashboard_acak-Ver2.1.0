// import { PeriodPicker } from "@/components/period-picker";
import { cn } from "@/lib/utils";
// import { getTransferOverviewData } from "@/services/charts.services";
import { TransferOverviewChart } from "./chart";
import useSWR from "swr"; // 2. ใช้ SWR เพื่อทำ Cache
import { fetcher } from "@/app/utils/fetcher"; // fetcher ที่คุณสร้างไว้
import { cache } from 'react';

type PropsType = {
  timeFrame?: string;
  className?: string;
};

export function fetchDataTransferchart(timeFrame?: string) {

    let period = "today";
    
    // 3. ใช้ SWR แทนการเรียก Service ตรงๆ บน Server
    // SWR จะฉลาดพอที่จะไม่ยิง API ซ้ำถ้าข้อมูลเดิมยังอยู่ (Deduplication)
    const { data, isLoading } = useSWR(`/api/chartfilloverview?period=${period}`, fetcher);

    if (data === undefined) return null;

    return data;
}

const getTransferOverviewData = (timeFrame: string) =>{

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

    const response = fetchDataTransferchart(timeFrame);
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
}

// const data = {
//     sales: [
//       { x: "Sat", y: 3300 },
//       { x: "Sun", y: 4400 },
//       { x: "Mon", y: 3100 },
//       { x: "Tue", y: 5700 },
//       { x: "Wed", y: 1200 },
//       { x: "Thu", y: 3300 },
//       { x: "Fri", y: 5500 },
//     ]
//   };

export function ReportTransferOverview({ className, timeFrame = "monthly" }: PropsType) {

  const data = getTransferOverviewData(timeFrame);

  return (
    <div
      className={cn(
        "rounded-[10px] bg-white px-7.5 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-dark dark:text-white">
          Transfer Overview
        </h2>

        {/* <PeriodPicker defaultValue={timeFrame} sectionKey="fill_overview" /> */}
      </div>

      <TransferOverviewChart data={data} />
    </div>
  );
}
