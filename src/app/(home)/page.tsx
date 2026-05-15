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

  return (
    <>

      <Suspense fallback={<OverviewCardsSkeleton />}>
        <OverviewCardsGroup 
          timeFrame={extractTimeFrame("card_overview")?.split(":")[1] || "daily"}
        />
      </Suspense>

      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7 2xl:gap-6.5">

        {/* <FillOverview
          className="col-span-12 xl:col-span-7"
          key={extractTimeFrame("fill_overview")}
          timeFrame={extractTimeFrame("fill_overview")?.split(":")[1]}
        /> */}

        <LineOverview
          className="col-span-12 xl:col-span-6"
          key={extractTimeFrame("fill_overview")}
          timeFrame={extractTimeFrame("fill_overview")?.split(":")[1]}
          department="fill"
          fixedDate={2}
        />

        <LineOverview
          className="col-span-12 xl:col-span-6"
          key={extractTimeFrame("store_overview")}
          timeFrame={extractTimeFrame("store_overview")?.split(":")[1]}
          department="store"
          fixedDate={2}
        />

        <LineOverview
          className="col-span-12 xl:col-span-12"
          key={extractTimeFrame("used_overview")}
          timeFrame={extractTimeFrame("used_overview")?.split(":")[1]}
          department="used"
          fixedDate={2}
        />

        {/* <TransferOverview
          key={extractTimeFrame("transfer_overview")}
          timeFrame={extractTimeFrame("transfer_overview")?.split(":")[1]}
          className="col-span-12 xl:col-span-5"
        /> */}

        {/* <UsedDevices
          className="col-span-12 xl:col-span-5"
          key={extractTimeFrame("used_devices")}
          timeFrame={extractTimeFrame("used_devices")?.split(":")[1]}
        /> */}

        {/* <RegionLabels /> */}

        {/* <div className="col-span-12 grid xl:col-span-8">
          <Suspense fallback={<TopChannelsSkeleton />}>
            <TopChannels />
          </Suspense>
        </div> */}

        {/* <Suspense fallback={null}>
          <ChatsCard />
        </Suspense> */}

      </div>
    </>
  );
}
