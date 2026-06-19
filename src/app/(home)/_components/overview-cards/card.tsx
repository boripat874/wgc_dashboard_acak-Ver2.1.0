import { ArrowDownIcon, ArrowUpIcon } from "@/assets/icons";
import { cn } from "@/lib/utils";
import type { JSX, SVGProps } from "react";


type PropsType = {
  label: string;
  data: {
    value: number | string;
    action: string;
    // growthRate: number;
  };
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
};

export function OverviewCard({ label, data, Icon }: PropsType) {
  // const isDecreasing = data.growthRate < 0;

  return (

    <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark">

      <Icon />

      <div className="mt-4 flex items-end justify-between">

        <div>
          <div className="mb-1.5 text-lg font-bold text-dark dark:text-white">
            {/* {data.value}  {`${data.action == "fill" ? "kg" : data.action == "store" ? "kg" : "Liter"}`} */}
            {data.value}  {`${data.action == "fill" ? "kg" : "Liter"}`}

          </div>

          <div className="text-lg font-medium bg-gradient-to-r from-black dark:from-white to-[#e0764c] bg-clip-text text-transparent">{label}</div>
          {data.action == "fill" && <p className="text-xs">ค่าที่กรอกช่วงที่ Fill</p>}
          {data.action == "store" && <p className="text-xs">ผลต่างระหว่างวันของ Mixer + Store</p>}
          {data.action == "used" && <p className="text-xs">ใช้ไปจาก Tank Store</p>}
        </div>

        

        {/* <dlv
          className={cn(
            "text-sm font-medium",
            isDecreasing ? "text-red" : "text-green",
          )}
        >
          <dt className="flex items-center gap-1.5">
            {data.growthRate}%
            {isDecreasing ? (
              <ArrowDownIcon aria-hidden />
            ) : (
              <ArrowUpIcon aria-hidden />
            )}
          </dt>

          <dd className="sr-only">
            {label} {isDecreasing ? "Decreased" : "Increased"} by{" "}
            {data.growthRate}%
          </dd>
        </dlv> */}
      </div>
    </div>
  );
}
