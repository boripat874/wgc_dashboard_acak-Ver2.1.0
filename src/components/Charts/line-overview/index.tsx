// "use client"
// 
// import useSWR from 'swr';
// import { fetcher } from "@/app/utils/fetcher";

import { PeriodPicker } from "@/components/period-picker";
import { standardFormat } from "@/lib/format-number";
import { cn } from "@/lib/utils";
import {getFillOverviewData, getStoreOverviewData, getUsedOverviewData} from "@/services/charts.services";
import { FillOverviewChart } from "./chart";

type PropsType = {
  timeFrame?: string;
  className?: string;
  department?: string;
};

export async function LineOverview({
  timeFrame = "monthly",
  className,
  department = "fill"
}: PropsType) {
  // const actualTimeFrame = timeFrame
  //   .split(",") // แยกส่วนประกอบ [ "fill_overview:daily", "transfer_overview:daily" ]
  //   .find((s) => s.startsWith("fill_overview:")) // หาอันที่เป็นของกราฟนี้
  //   ?.split(":")[1] || "monthly"; // ถ้าเจอ ให้เอาค่าหลัง : ถ้าไม่เจอให้ใช้ "monthly"
  
  // ดึงข้อมูล
  const rawData = await getFillOverviewData(timeFrame, department);

  // Fallback Data: ถ้า rawData เป็น null หรือไม่มี properties ที่ต้องการ ให้ใช้ค่าเริ่มต้น
  const data = {
    received: rawData?.received ?? [],
    due: rawData?.due ?? []
  };

  const title = department === "fill" ? "Fill Overview" : department === "store" ? "Store Overview" : department === "used" ? "Used Overview" : "???? Overview";

  const sectionkey = department === "fill" ? "fill_overview" : department === "store" ? "store_overview" : department === "used" ? "used_overview" : "????_overview";

  // if (department === "fill") {
    

  // }else if (department === "Mix") {

  // }else if (department === "used") {

  // }

  // คำนวณยอดรวมแบบปลอดภัย (ใส่ ? และ ?? 0)
  // const totalNaOH = data.received?.reduce((acc, curr) => acc + (curr.y || 0), 0) ?? 0;
  // const totalHCI = data.due?.reduce((acc, curr) => acc + (curr.y || 0), 0) ?? 0;


    // const { data: overviewData } = useSWR('/api/chartfilloverview', fetcher);
 
  return (

    <div
      className={cn(
        "grid gap-2 rounded-[10px] bg-white px-7.5 pb-6 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card",
        className,
      )}
    >

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-body-2xlg font-bold text-dark dark:text-white">
          {title}
        </h2>
 
        <PeriodPicker defaultValue={timeFrame} sectionKey={sectionkey} />
      </div>

      <FillOverviewChart data={data} />

      <dl className="grid divide-stroke text-center dark:divide-dark-3 sm:grid-cols-2 sm:divide-x [&>div]:flex [&>div]:flex-col-reverse [&>div]:gap-1">

        <div className="dark:border-dark-3 max-sm:mb-3 max-sm:border-b max-sm:pb-3">
          <dt className="text-xl font-bold text-dark dark:text-white">
            {standardFormat(data.received?.reduce((acc, curr) => acc + (curr.y || 0), 0) ?? 0)}
          </dt>
          <dd className="font-medium dark:text-dark-6">Total NaOH Fill</dd>
        </div>

        <div>
          <dt className="text-xl font-bold text-dark dark:text-white">
            {standardFormat(data.due?.reduce((acc, curr) => acc + (curr.y || 0), 0) ?? 0)}
          </dt>
          <dd className="font-medium dark:text-dark-6">Total HCI Fill</dd>
        </div>
      </dl>
      
    </div>
  );
}
