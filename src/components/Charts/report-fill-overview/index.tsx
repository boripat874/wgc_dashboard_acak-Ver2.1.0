"use client";

// import { PeriodPicker } from "@/components/period-picker";
import { standardFormat } from "@/lib/format-number";
import { cn } from "@/lib/utils";
// import { getFillOverviewData } from "@/services/charts.services";
import { FillOverviewChart } from "./chart";
import useSWR from "swr"; // 2. ใช้ SWR เพื่อทำ Cache
import { fetcher } from "@/app/utils/fetcher"; // fetcher ที่คุณสร้างไว้
 
type PropsType = {
  timeFrame?: string;
  className?: string;
};

// const data = {
//     received: [
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
//   };

export function fetchDataFillchart(timeFrame?: string) {

    let period = "today";

  // 3. ใช้ SWR แทนการเรียก Service ตรงๆ บน Server
  // SWR จะฉลาดพอที่จะไม่ยิง API ซ้ำถ้าข้อมูลเดิมยังอยู่ (Deduplication)
  const { data, isLoading } = useSWR(`/api/chartfilloverview?period=${period}`, fetcher);

    if (data  === undefined) return null;

    return data;
}

const getFillOverviewData = (timeFrame: string) => {

    // console.log("timeFrame?service >>> ",timeFrame)

  const response = fetchDataFillchart(timeFrame);
  const rawData = response?.data;

    // console.log("rawData?service >>> ",rawData)


  if (!rawData) {
    return { received: [], due: [] };
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
            mapped[xLabel] = Number(item.total_T1_Kg || 0) + (Number(item.total_T2_Kg || 0  )) ;
        });
        return mapped;
    };

    const naohMapped = processRaw(rawData.NaOH_Fill);
    const hciMapped = processRaw(rawData.HCI_Fill);

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

}

export function ReportFillOverview({
  timeFrame = "today",
  className,
}: PropsType) {

  const data = getFillOverviewData(timeFrame);
  
  return (
    <div
      className={cn(
        "grid gap-2 rounded-[10px] bg-white px-7.5 pb-6 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-dark dark:text-white">
          Fill Overview
        </h2>

        {/* <PeriodPicker defaultValue={timeFrame} sectionKey="fill_overview" /> */}
      </div>

      <FillOverviewChart data={data} />

      <dl className="grid divide-stroke text-center dark:divide-dark-3 sm:divide-x [&>div]:flex [&>div]:flex-col-reverse [&>div]:gap-1">

        <div className="dark:border-dark-3 max-sm:mb-3 max-sm:border-b max-sm:pb-3">
          <dt className="text-sm font-bold text-dark dark:text-white">
            {standardFormat(data.received.reduce((acc, { y }) => acc + y, 0))}
          </dt>
          <dd className="font-medium dark:text-dark-6">NaOH Fill</dd>
        </div>

        {/* <div>
          <dt className="text-lg font-bold text-dark dark:text-white">
            {standardFormat(data.due.reduce((acc, { y }) => acc + y, 0))}
          </dt>
          <dd className="font-medium dark:text-dark-6">HCI Fill</dd>
        </div> */}

      </dl>
    </div>
  );
}
