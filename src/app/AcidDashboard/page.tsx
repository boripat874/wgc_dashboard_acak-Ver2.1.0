"use client";
import { FillOverview } from "@/components/Charts/fill-overview";
import { UsedDevices } from "@/components/Charts/used-devices";
import { TransferOverview } from "@/components/Charts/transfer-overview";
import { TopChannels } from "@/components/Tables/top-channels";
import { TopChannelsSkeleton } from "@/components/Tables/top-channels/skeleton";
import { createTimeFrameExtractor } from "@/utils/timeframe-extractor";
import { Suspense } from "react";
import { OverviewCardsGroup } from "./_components/overview-cards";

import SectionChooseDate from "./_components/SectionChooseDate";

import { OverviewCardsSkeleton } from "./_components/overview-cards/skeleton";

import {checkMode,checkStatusMotor,generate24HourTimeline} from '@/app/ModuleFuntion';
import { useState, useEffect} from "react";

import {Wgcacak} from "@/app/interface";

import {
  ChartRecieve,
  ChartMix,
  CharttankMix,
  CharttankStore,
  ChartPieUsed,
  ChartlineUsed

} from "@/components/Charts/chart"

import useSWR from 'swr';
import {format, set, subHours} from 'date-fns';
import { fetcher } from "@/app/utils/fetcher";
import Null from "tedious/lib/data-types/null";

interface ModeCardData {
  title: string;
  value: string;
  bgColor: string;
  textColor: string;
}

type PropsType = {
  searchParams: Promise<{
    selected_time_frame?: string;
  }>;
};

interface ChartDataPoint {
  name: string;
  value?: number;
  acid?: number;
  alkali?: number;
  ro?: number;
}

interface PieDataPoint {
  name: string;
  value: number;
  color: string;
}


export default function AlkalineDashboard({ searchParams }: PropsType) {
  // const { selected_time_frame } = searchParams;
  // const extractTimeFrame = createTimeFrameExtractor(selected_time_frame);

  const bgColorHeader = "bg-[#ED9832]";
  const bgColorChartContainer = "bg-[#FFFFFF] dark:bg-gray-dark";

  const ColorHeader = "text-global-10 dark:text-dark-8";
  const ColorHeaderChart = "text-[#000000] dark:text-dark-6";
  const ColorChart = "#000000";

  const chartColor1 = "#ED9832";
  const chartColor2 = "#0077c8";

  const chartColor3 = "#239BA7";
  const chartColor4 = "#60B813";
  const chartColor5 = "#E1AA36";
  const chartColor6 = "#E13F7C";

  const [ReceiveData, setReceiveData] = useState<ChartDataPoint[]>([]);
  const [ReceiveTank1, setReceiveTank1] = useState<ChartDataPoint[]>([]);
  const [ReceiveTank2, setReceiveTank2] = useState<ChartDataPoint[]>([]);

  const [wgcacak, setWgcacak] = useState<Wgcacak | null>(null);
  const [period, setPeriod] = useState<string>("thisweek");
  const [date_start, setDate_start] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [date_end, setDate_end] = useState(format(new Date(), 'yyyy-MM-dd'));


  
  const {data:Acidrecieved} = useSWR(`/api/acidrecieved?period=${period}&date_start=${date_start}&date_end=${date_end}`, fetcher)
  const {data:Acidmixed} = useSWR(`/api/acidmixed?period=${period}&date_start=${date_start}&date_end=${date_end}`, fetcher)
  const {data:Acidtankmixed} = useSWR(`/api/acidtankmixed?period=${period}&date_start=${date_start}&date_end=${date_end}`, fetcher)
  const {data:Acidtankstore} = useSWR(`/api/acidtankstore?period=${period}&date_start=${date_start}&date_end=${date_end}`, fetcher)
  const {data: Wgcacak} = useSWR(`/api/wgcacak`, fetcher)

  useEffect(() => {

    // if (Wgcacak) {
    //   setWgcacak(Wgcacak);
    // }

    if (Wgcacak) {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const lastUpdate = Number(Wgcacak.Lastupdate) || 0;
    const diffSeconds = nowSeconds - lastUpdate;

    if (diffSeconds > 60) {
      
      // ระบุ Record<string, number> เพื่อให้ยอมรับการ index ด้วย string
      const offlineData = Object.keys(Wgcacak).reduce((acc, key) => {
        acc[key] = 0;
        return acc;
      }, {} as Record<string, any>) as Wgcacak; // cast กลับเป็น Wgcacak ตอนจบ
      
      setWgcacak(offlineData);
    } else {
      setWgcacak(Wgcacak);
    }
  }

  }, [Wgcacak]);

  useEffect(() => {
 
    if (Acidrecieved) {

      setReceiveData(Acidrecieved.result.map((item: any) => ({
        name: format((Number(item.UnixTimestamp) * 1000), 'yyyy-MM-dd HH:mm'),
        value: item.total_tank_fill,
      })));

      setReceiveTank1(Acidrecieved.result.map((item: any) => ({
        name: format((Number(item.UnixTimestamp) * 1000), 'yyyy-MM-dd HH:mm'),
        value: item.kg_101H,
      })));

      setReceiveTank2(Acidrecieved.result.map((item: any) => ({
        name: format((Number(item.UnixTimestamp) * 1000), 'yyyy-MM-dd HH:mm'),
        value: item.kg_102H,
      })));
    }

  }, [Acidrecieved]);

  // Mixed 
  const [acidRoMixData, setAcidRoMixData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {

    if (Acidmixed) {
      setAcidRoMixData(Acidmixed.result.map((item: any) => ({
        name: format((Number(item.UnixTimestamp) * 1000), 'yyyy-MM-dd HH:mm'),
        main_volume: item.chemical_data,
        ro_volume: item.ro_data,
      })));
    }

  }, [Acidmixed]);

  // tank mixed
  const [acidTankMixedData, setAcidTankMixedData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {

    if (Acidtankmixed) {
      setAcidTankMixedData(Acidtankmixed.result.map((item: any) => ({
        name: format((Number(item.UnixTimestamp) * 1000), 'yyyy-MM-dd HH:mm'),
        data_remaining_tank_Mix: item.data_remaining_tank_Mix,
        tank_Mix_between_day: item.tank_Mix_between_day,
      })));
    }

  }, [Acidtankmixed]);

  // tank store
  const [acidTankStoreData, setAcidTankStoreData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {

    if (Acidtankstore) {
      setAcidTankStoreData(Acidtankstore.result.map((item: any) => ({
        name: format((Number(item.UnixTimestamp) * 1000), 'yyyy-MM-dd HH:mm'),
        data_remaining_tank_Store: item.data_remaining_tank_Store,
        tank_Store_between_day: item.tank_Store_between_day,
      })));
    }

  }, [Acidtankstore]);

  // Consumed
  const [acidPieData, setAcidPieData] = useState<PieDataPoint[]>([]);

  const {data:Acidconsumed} = useSWR(`/api/acidconsumed?plant=PD1&period=${period}&date_start=${date_start}&date_end=${date_end}`, fetcher);

  const [pd1AcidLineConsumedData, setPd1AcidLineConsumedData] = useState<ChartDataPoint[]>([]);
  const [pd2AcidLineConsumedData, setPd2AcidLineConsumedData] = useState<ChartDataPoint[]>([]);
  const [pd3AcidLineConsumedData, setPd3AcidLineConsumedData] = useState<ChartDataPoint[]>([]);
  const [esAcidLineConsumedData, setEsAcidLineConsumedData] = useState<ChartDataPoint[]>([]);

    useEffect(() => {

        if (!Acidconsumed || !Acidconsumed.result || Acidconsumed.result.length === 0) {
          setAcidPieData([]);
          setPd1AcidLineConsumedData([]);
          setPd2AcidLineConsumedData([]);
          setPd3AcidLineConsumedData([]);
          setEsAcidLineConsumedData([]);
          return;
        }

        const results = Acidconsumed.result;

        // --- 1. แยกข้อมูลสำหรับ Line Chart ตาม Plant ---
        // const pd1Raw = results.filter((item: any) => item.plant === "PD1");
        // const pd2Raw = results.filter((item: any) => item.plant === "PD2");
        // const pd3Raw = results.filter((item: any) => item.plant === "PD3");

        const mapData = (dataArray: any[] ,plant: string) => dataArray.map((item: any) => ({
          name: format((Number(item.UnixTimestamp) * 1000), 'yyyy-MM-dd HH:mm'),
          value: item[plant] || 0, // ใช้คีย์ volume ตาม JSON
        }));

        setPd1AcidLineConsumedData(mapData(results, 'usepd1'));
        setPd2AcidLineConsumedData(mapData(results, 'usepd2'));
        setPd3AcidLineConsumedData(mapData(results, 'usepd3'));
        setEsAcidLineConsumedData(mapData(results, 'usees'));

        // --- 2. คำนวณ Pie Chart (เปลี่ยนจากค่าล่าสุด เป็นค่า SUM) ---

      // ใช้ reduce เพื่อรวมค่า volume ทั้งหมดใน array ของแต่ละ Plant
      const pd1Sum = results.reduce((acc: number, curr: any) => acc + (Number(curr.usepd1) || 0), 0);
      const pd2Sum = results.reduce((acc: number, curr: any) => acc + (Number(curr.usepd2) || 0), 0);
      const pd3Sum = results.reduce((acc: number, curr: any) => acc + (Number(curr.usepd3) || 0), 0);
      const esSum = results.reduce((acc: number, curr: any) => acc + (Number(curr.usees) || 0), 0);


      const sumTotal = pd1Sum + pd2Sum + pd3Sum + esSum;

      if (sumTotal > 0) {
        setAcidPieData([
          { name: 'PD1', value: (100 * pd1Sum / sumTotal), color: chartColor3 },
          { name: 'PD2', value: (100 * pd2Sum / sumTotal), color: chartColor4 },
          { name: 'PD3', value: (100 * pd3Sum / sumTotal), color: chartColor5 },
          { name: 'ES', value: (100 * esSum / sumTotal), color: chartColor6 }
        ]);
      } else {
        setAcidPieData([]);
      }
    
      }, [Acidconsumed]); // dependency array


  const ModeCard: React.FC<{ mode: ModeCardData }> = ({ mode }) => (

    <div className={`${mode.bgColor} card_realtime_mode`}>

      <div className={`${mode.bgColor} ${mode.textColor} text-base lg:text-2xl`}>
          <p>Acid Mixer</p>
      </div>

      <div className='card_realtime_text_value_Headerlayer'>
        <h3 className={`card_realtime_text_title_HeaderMode ${mode.textColor}`}>
          {mode.title} :
        </h3>
        <p className={`card_realtime_text_value_HeaderMode ${mode.value === 'Auto Start' ? 'text-green-500' : 'text-red-500'}`}>
            {mode.value}
          </p>

      </div>

    </div>
      );

  const ChartContainer: React.FC<{ title: string; children: React.ReactNode; className?: string, chartClassName?: string }> = ({ 
      title, 
      children, 
      className = '' ,
      chartClassName = '' 
    }) => (
      <div className={`${bgColorChartContainer} rounded-[5px] flex flex-col gap-2 sm:gap-3 lg:gap-4 justify-start items-start w-full ${className}`}>
        <div className="flex justify-start items-center w-full p-2 sm:p-3 lg:p-4">
          <h3 className={`text-base sm:text-lg lg:text-lg font-inter font-normal leading-5 sm:leading-6 text-left ${ColorHeaderChart} ml-2 sm:ml-3`}>
            {title}
          </h3>
        </div>
        <div className={`${chartClassName != ''? chartClassName : 'w-full h-[200px] sm:h-[250px] lg:h-[300px] p-2 sm:p-4'}`} >
          {children}
        </div>
      </div>
    );

    // console.log("wgcacak :: ",wgcacak)

  return (
    <>

      <ModeCard mode={{ 
      
        title: 'LINE A Mode', 
        value: checkMode(wgcacak?.Auto_Mode_N || 0, wgcacak?.PB_Start_Auto_N || 0), 
        bgColor: `${bgColorHeader}`, 
        textColor: `${ColorHeader}`,

      }} />

       

      <h1 className="font-bold">Read time</h1>

      <hr className="my-4"/>

      <Suspense fallback={<OverviewCardsSkeleton />}>
          <OverviewCardsGroup />
      </Suspense>

      <h1 className="font-bold mt-4">Chart history</h1>

      <hr className="mt-4"/>

      <SectionChooseDate
        period={period}
        date_start={date_start}
        date_end={date_end}
        onChangePeriod={setPeriod}
        onChangeDate_start={setDate_start}
        onChangeDate_end={setDate_end}
      />
      {/* <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-9 2xl:gap-7.5">

        <FillOverview
          className="col-span-12 xl:col-span-7"
          key={extractTimeFrame("payments_overview")}
          timeFrame={extractTimeFrame("payments_overview")?.split(":")[1]}
        />

        <TransferOverview
          key={extractTimeFrame("weeks_profit")}
          timeFrame={extractTimeFrame("weeks_profit")?.split(":")[1]}
          className="col-span-12 xl:col-span-5"
        />

      </div> */}

      <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-2 mt-4 lg:gap-2 w-full">

          {/* Recieve */}
          <ChartRecieve

            tank = {{
              Iitlename: "คงเหลือ HCI รวมสูตร (kg)",
              key_value:"HCI",
              Data: ReceiveData,
              ColorChart: ColorChart,
              bgColorChartContainer: bgColorChartContainer,
              ColorHeaderChart: ColorHeaderChart,
              chartColor: chartColor1
            }}
          />

          <ChartRecieve

            tank = {{
              Iitlename: "คงเหลือ HCI TANK 1 (LT101H) รวมสูตร (kg)",
              key_value:"HCI",
              Data: ReceiveTank1,
              ColorChart: ColorChart,
              bgColorChartContainer: bgColorChartContainer,
              ColorHeaderChart: ColorHeaderChart,
              chartColor: chartColor1
            }}
          />

          <ChartRecieve

            tank = {{
              Iitlename: "คงเหลือ HCI TANK 2 (LT102H) รวมสูตร (kg)",
              key_value:"HCI",
              Data: ReceiveTank2,
              ColorChart: ColorChart,
              bgColorChartContainer: bgColorChartContainer,
              ColorHeaderChart: ColorHeaderChart,
              chartColor: chartColor1
            }}
          />

          {/* <div className='h-[420px]'> */}
            {/* Mix */}
            <ChartMix
              tank = {{
                Iitlename: "HCI & RO Used in Mixer (Liter) TANK 3",
                subTitle: "ผสมเข้า",
                key_value:"HCI",
                Data: acidRoMixData,
                ColorChart: ColorChart,
                bgColorChartContainer: bgColorChartContainer,
                ColorHeaderChart: ColorHeaderChart,
                chartColor1: chartColor1,
                chartColor2: chartColor2,
              }}
            />

          {/* </div> */}

          <CharttankMix
            tank = {{
              Iitlename: "คงเหลือ HCI Mixer (Liter) TANK 3",
              subTitle: "",
              key_value:"HCI",
              Data: acidTankMixedData,  
              ColorChart: ColorChart,
              bgColorChartContainer: bgColorChartContainer,
              ColorHeaderChart: ColorHeaderChart,
              chartColor1: chartColor2,
              chartColor2: chartColor3,
            }}
          />

          <CharttankStore
            tank = {{
              Iitlename: "คงเหลือ HCI Store (Liter) TANK 4",
              subTitle: "",
              key_value:"HCI",
              Data: acidTankStoreData,
              ColorChart: ColorChart,
              bgColorChartContainer: bgColorChartContainer,
              ColorHeaderChart: ColorHeaderChart,
              chartColor1: chartColor2,
              chartColor2: chartColor3,
            }}
          />

          {/* Used */}
          {/* <div className='h-[420px]'> */}
            {/* Acid Used */}
            <ChartPieUsed
              tank = {{
                Iitlename: "PD1 PD2 PD3 ES HCI Used (Liter)",
                subTitle: "สัดส่วนที่ใช้ไปจาก Tank Store",
                key_value:"HCI",
                Data: acidPieData,
                ColorChart: ColorChart,
                bgColorChartContainer: bgColorChartContainer,
                ColorHeaderChart: ColorHeaderChart,
                chartColor: chartColor1,
              }}
            />

          {/* </div> */}


          <div className='grid grid-cols-1 gap-2 lg:max-h-[400px] xl:max-h-[409px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-500'>
          
            <ChartlineUsed
              tank = {{
                Iitlename: "PD1 HCI Used (Liter) ",
                subTitle: "ที่ใช้ไปจาก Tank Store",
                key_value:"HCI",
                Data: pd1AcidLineConsumedData,
                ColorChart: ColorChart,
                bgColorChartContainer: bgColorChartContainer,
                ColorHeaderChart: ColorHeaderChart,
                chartColor: chartColor3,
              }}
            />

            <ChartlineUsed
              tank = {{
                Iitlename: "PD2 HCI Used (Liter)",
                subTitle: "ที่ใช้ไปจาก Tank Store",
                key_value:"HCI",
                Data: pd2AcidLineConsumedData,
                ColorChart: ColorChart,
                bgColorChartContainer: bgColorChartContainer,
                ColorHeaderChart: ColorHeaderChart,
                chartColor: chartColor4,
              }}
            />

            <ChartlineUsed
              tank = {{
                Iitlename: "PD3 HCI Used (Liter)",
                subTitle: "ที่ใช้ไปจาก Tank Store",
                key_value:"HCI",
                Data: pd3AcidLineConsumedData,
                ColorChart: ColorChart,
                bgColorChartContainer: bgColorChartContainer,
                ColorHeaderChart: ColorHeaderChart,
                chartColor: chartColor5,
              }}
            />

            <ChartlineUsed
              tank = {{
                Iitlename: "ES HCI Used (Liter)",
                subTitle: "ที่ใช้ไปจาก Tank Store",
                key_value:"HCI",
                Data: esAcidLineConsumedData,
                ColorChart: ColorChart,
                bgColorChartContainer: bgColorChartContainer,
                ColorHeaderChart: ColorHeaderChart,
                chartColor: chartColor6,
              }}
            />

          </div>

        </div>
    </>
  );
}
