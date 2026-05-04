import { PeriodPicker } from "@/components/period-picker";
import { cn } from "@/lib/utils";
import { getTransferOverviewData } from "@/services/charts.services";
import { TransferOverviewChart } from "./chart";

type PropsType = {
  timeFrame?: string;
  className?: string;
};

export async function TransferOverview({ className, timeFrame = "monthly" }: PropsType) {

  // ดึงข้อมูล
  const result = await getTransferOverviewData(timeFrame);

  // Fallback: ถ้า result เป็น null/undefined ให้ส่ง Array ว่างไปแทน
  // (สมมติว่าโครงสร้างข้อมูลเป็น array หรือ object ที่ Chart ต้องการ)
  const data = result || [];

  return (
    <div
      className={cn(
        "rounded-[10px] bg-white px-7.5 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-body-2xlg font-bold text-dark dark:text-white">
          Transfer Overview
        </h2>

        <PeriodPicker defaultValue={timeFrame} sectionKey="transfer_overview" />
      </div>

      <TransferOverviewChart data={data} />
    </div>
  );
}
