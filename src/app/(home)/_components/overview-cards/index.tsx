"use client";

// import { compactFormat } from "@/lib/format-number";
import { standardFormat } from "@/lib/format-number";
// import { getOverviewData } from "../../fetch";
import { OverviewCard } from "./card";
import * as icons from "./icons";

import useSWR from 'swr';
import { fetcher } from "@/app/utils/fetcher";
import { PeriodPicker } from "@/components/period-picker";

 
export function OverviewCardsGroup({timeFrame}: {timeFrame: string}) {

  // const { views, profit, products, users } = await getOverviewData();

  let timeFrameOptions = timeFrame == "daily" ? "today" : timeFrame == "monthly" ? "thismonth" : timeFrame == "yearly" ? "thisyear" : "today"; // กำหนดค่าเริ่มต้นเป็น "daily" หากไม่ได้รับค่า timeFrame

  const { data: overviewData } = useSWR(`/api/cardoverview?period=${timeFrameOptions}`, fetcher);

  const data_fetched = {
    NaOH_Fill: overviewData?.data.NaOH_Fill || 0,
    NaOH_Store: overviewData?.data.NaOH_Store || 0,
    NaOH_Used: overviewData?.data.NaOH_Used || 0,
    HCI_Fill: overviewData?.data.HCI_Fill || 0,
    HCI_Store: overviewData?.data.HCI_Store || 0,
    HCI_Used: overviewData?.data.HCI_Used || 0,
  };

  const sumNaOH_Fill = data_fetched.NaOH_Fill;
  const sumHCI_Fill = data_fetched.HCI_Fill;

  const sumNaOH_Store = data_fetched.NaOH_Store;
  const sumHCI_Store = data_fetched.HCI_Store;

  const sumNaOH_Used = data_fetched.NaOH_Used;
  const sumHCI_Used = data_fetched.HCI_Used;

  const sectionkey = "card_overview"; // กำหนดค่าเริ่มต้นถ้าไม่ได้รับมา

  return (
    <div>

      {/* ส่วนจัดการตำแหน่งของ PeriodPicker */}
      <div className="mb-2 flex justify-end">
        <div className="">
          <PeriodPicker defaultValue={timeFrame} sectionKey={sectionkey} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-6 2xl:gap-7.5">

        {/* NaOH Fill */}
        <OverviewCard
          label="Total NaOH Fill"
          data={{
            action: "fill",
            // value: compactFormat(sumNaOH_Fill),
            value: standardFormat(Number(sumNaOH_Fill)),

          }}
          Icon={icons.NaOH}
        />

        {/* NaOH Store */}
        <OverviewCard
          label="Total NaOH Store"
          data={{
            action: "store",
            // value: compactFormat(sumNaOH_Store),
            value: standardFormat(Number(sumNaOH_Store)),
          }}
          Icon={icons.NaOH_4}
        />

        {/* Total NaOH Used */}
        <OverviewCard
          label="Total NaOH Used"
          data={{
            action: "used",
            // value: compactFormat(overviewData?.data.NaOH_Transfer_day.total_volume || 0),
            value: standardFormat(Number(sumNaOH_Used))
          }}
          Icon={icons.NaOH_2}
        />

        <OverviewCard
          label="Total HCI Fill"
          data={{
            action: "fill",
            // value: compactFormat(sumHCI_Fill),
            value: standardFormat(Number(sumHCI_Fill)),
          }}
          Icon={icons.HCI}
        />

        <OverviewCard
          label="Total HCI Store"
          data={{
            action: "store",
            // value: compactFormat(sumHCI_Store),
            value: standardFormat(Number(sumHCI_Store)),
          }}
          Icon={icons.HCI_4}
        />

        <OverviewCard
          label="Total HCI Used"
          data={{
            action: "used",
            // value: compactFormat(overviewData?.data.HCI_Transfer_day.total_volume || 0),
            value: standardFormat(Number(sumHCI_Used)),
          }} 
          Icon={icons.HCI_2}
        />

      </div>
    </div>
  );
}
