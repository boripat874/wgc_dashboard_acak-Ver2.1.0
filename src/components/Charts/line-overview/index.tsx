import { PeriodPicker } from "@/components/period-picker";
import { standardFormat } from "@/lib/format-number";
import { cn } from "@/lib/utils";
import { getOverviewData } from "@/services/charts.services";
import { FillOverviewChart } from "./chart";

type PropsType = {
  timeFrame?: string;
  className?: string;
  department?: string;
  fixedDate?: number;
};

export async function LineOverview({
  timeFrame = "monthly",
  className,
  department = "fill",
  fixedDate = 3
}: PropsType) {
  
  // 1. แยกเอา timeframe เฉพาะของกราฟนี้อย่างปลอดภัย หากส่งมาเป็น string ที่มีเครื่องหมายคอมมา
  const actualTimeFrame = timeFrame.includes(":")
  ? timeFrame.split(",").find((s) => s.startsWith(`${department}_overview:`))?.split(":")[1] || "monthly"
  : timeFrame || "monthly";

  const rawData = await getOverviewData(actualTimeFrame, department);

  // ดักจับและแปลงค่า y ให้เป็นตัวเลข (Number) เสมอ เพื่อไม่ให้ ApexCharts แครช
  const data = {
    received: rawData?.received?.map((item: any) => ({
      ...item,
      y: Number(item.y) || 0 // ถ้า y เป็น null หรือแปลงเป็นเลขไม่ได้ ให้เป็น 0
    })) ?? [],
    due: rawData?.due?.map((item: any) => ({
      ...item,
      y: Number(item.y) || 0 
    })) ?? []
  };

  const title = department === "fill" 
    ? "Fill Overview" 
    : department === "store" 
      ? "Store Overview" 
      : department === "used" 
        ? "Used Overview" 
        : "Fill Overview";

  const sectionkey = department === "fill" 
    ? "fill_overview" 
    : department === "store" 
      ? "store_overview" 
      : department === "used" 
        ? "used_overview" 
        : "fill_overview";

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
          {department === "fill" && (<span className="text-sm font-normal"> ค่าที่กรอกช่วงที่ Fill</span>)}
          {department === "store" && (<span className="text-sm font-normal"> ผลต่างระหว่างวันของ Mixer + Store</span>)}
          {department === "used" && (<span className="text-sm font-normal"> ใช้ไปจาก Tank Store</span>)}
        </h2>
 
        <PeriodPicker defaultValue={actualTimeFrame} sectionKey={sectionkey} fixedDate={fixedDate} />
      </div>

      <FillOverviewChart data={data} />

      {department !== "store" && (
        <dl className="grid divide-stroke text-center dark:divide-dark-3 sm:grid-cols-2 sm:divide-x [&>div]:flex [&>div]:flex-col-reverse [&>div]:gap-1">
          <div className="dark:border-dark-3 max-sm:mb-3 max-sm:border-b max-sm:pb-3">
            <dt className="text-xl font-bold text-dark dark:text-white">
              {standardFormat(data.received?.reduce((acc, curr) => acc + (curr.y || 0), 0) ?? 0)}
            </dt>
            <dd className="font-medium dark:text-dark-6">Total NaOH</dd>
          </div>

          <div>
            <dt className="text-xl font-bold text-dark dark:text-white">
              {standardFormat(data.due?.reduce((acc, curr) => acc + (curr.y || 0), 0) ?? 0)}
            </dt>
            <dd className="font-medium dark:text-dark-6">Total HCl</dd>
          </div>
        </dl>
      )}
    </div>
  );
}