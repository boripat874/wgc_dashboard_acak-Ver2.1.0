import { FillOverview } from "@/components/Charts/fill-overview";
import { TransferOverview } from "@/components/Charts/transfer-overview";
import { LineOverview } from "@/components/Charts/line-overview";
import { UsedDevices } from "@/components/Charts/used-devices";
import { TopChannels } from "@/components/Tables/top-channels";
import { TopChannelsSkeleton } from "@/components/Tables/top-channels/skeleton";
import { createTimeFrameExtractor } from "@/utils/timeframe-extractor";
import { Suspense } from "react";
import { ChatsCard } from "./_components/chats-card";
import { OverviewCardsGroup } from "./_components/overview-cards";
import { OverviewCardsSkeleton } from "./_components/overview-cards/skeleton";
import { RegionLabels } from "./_components/region-labels";

type PropsType = {
  searchParams: Promise<{
    selected_time_frame?: string;
  }>;
};

export default async function Home({ searchParams }: PropsType) {
  const { selected_time_frame } = await searchParams;
  const extractTimeFrame = createTimeFrameExtractor(selected_time_frame);

  // เตรียมตัวแปรให้พร้อม และใส่ค่า Default ป้องกัน undefined 
  const fillTimeFrame = extractTimeFrame("fill_overview")?.split(":")[1] || "monthly";
  const storeTimeFrame = extractTimeFrame("store_overview")?.split(":")[1] || "monthly";
  const usedTimeFrame = extractTimeFrame("used_overview")?.split(":")[1] || "monthly";

  return (
    <>
      <Suspense fallback={<OverviewCardsSkeleton />}>
        <OverviewCardsGroup 
          timeFrame={extractTimeFrame("card_overview")?.split(":")[1] || "monthly"}
        />
      </Suspense>

      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7 2xl:gap-6.5">

        <LineOverview
          className="col-span-12 xl:col-span-6"
          key={`fill-${fillTimeFrame}`} // ปรับ Key ให้เปลี่ยนตาม timeFrame เพื่อให้ Component รีเซ็ตตัวเอง
          timeFrame={fillTimeFrame}
          department="fill"
          fixedDate={2}
        />

        <LineOverview
          className="col-span-12 xl:col-span-6"
          key={`store-${storeTimeFrame}`}
          timeFrame={storeTimeFrame}
          department="store"
          fixedDate={2}
        />

        <LineOverview
          className="col-span-12 xl:col-span-12"
          key={`used-${usedTimeFrame}`}
          timeFrame={usedTimeFrame}
          department="used"
          fixedDate={2}
        />

      </div>
    </>
  );
}