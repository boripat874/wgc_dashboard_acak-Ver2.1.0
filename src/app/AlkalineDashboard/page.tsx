"use client";

import { FillOverview } from "@/components/Charts/fill-overview";
import { UsedDevices } from "@/components/Charts/used-devices";
import { TransferOverview } from "@/components/Charts/transfer-overview";
import { TopChannels } from "@/components/Tables/top-channels";
import { TopChannelsSkeleton } from "@/components/Tables/top-channels/skeleton";
import { createTimeFrameExtractor } from "@/utils/timeframe-extractor";
import { Suspense } from "react";
import { OverviewCardsGroup } from "./_components/overview-cards";
import { format, subHours } from 'date-fns';

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
import { fetcher } from "@/app/utils/fetcher";

import SectionChooseDate from "./_components/SectionChooseDate";

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


export default function AlkalineDashboard() {
  // const { selected_time_frame } = searchParams;
  // const extractTimeFrame = createTimeFrameExtractor(selected_time_frame);

  const bgColorHeader = "bg-[#B162AF] dark:bg-[#C558C4]";
  const bgColorChartContainer = "bg-[#FFFFFF] dark:bg-gray-dark";

  const ColorHeader = "text-global-10 dark:text-dark-8";
  const ColorHeaderChart = "text-[#000000] dark:text-dark-6";
  const ColorChart = "#000000";

  const chartColor1 = "#B162AF";
  const chartColor2 = "#0077c8";

  const chartColor3 = "#239BA7";
  const chartColor4 = "#60B813";
  const chartColor5 = "#E1AA36";

  const [ReceiveData, setReceiveData] = useState<ChartDataPoint[]>([]);
  const [ReceiveTank1, setReceiveTank1] = useState<ChartDataPoint[]>([]);
  const [ReceiveTank2, setReceiveTank2] = useState<ChartDataPoint[]>([]);

  const [wgcacak, setWgcacak] = useState<Wgcacak | null>(null);
  const [period, setPeriod] = useState<string>("thisweek");
  const [date_start, setDate_start] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [date_end, setDate_end] = useState(format(new Date(), 'yyyy-MM-dd'));

  const {data:Alkaliconsumed} = useSWR(`/api/alkaliconsumed?period=${period}&date_start=${date_start}&date_end=${date_end}`, fetcher);
  const {data:Alkalirecieved} = useSWR(`/api/alkalirecieved?period=${period}&date_start=${date_start}&date_end=${date_end}`, fetcher)
  const {data:Alkalimixed} = useSWR(`/api/alkalimixed?period=${period}&date_start=${date_start}&date_end=${date_end}`, fetcher)
  const {data:Alkalitankmixed} = useSWR(`/api/alkalitankmixed?period=${period}&date_start=${date_start}&date_end=${date_end}`, fetcher)
  const {data:Alkalitankstore} = useSWR(`/api/alkalitankstore?period=${period}&date_start=${date_start}&date_end=${date_end}`, fetcher)

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
  
  // Consumed
  const [alkaliPieData, setAlkaliPieData] = useState<PieDataPoint[]>([]);

  // Recieved
  useEffect(() => {

    if (Alkalirecieved) {


      setReceiveData(Alkalirecieved.result.map((item: any) => ({
        name: format((Number(item.UnixTimestamp) * 1000), 'yyyy-MM-dd HH:mm'),
        value: item.total_tank_fill,
      })));

      setReceiveTank1(Alkalirecieved.result.map((item: any) => ({
        name: format((Number(item.UnixTimestamp) * 1000), 'yyyy-MM-dd HH:mm'),
        value: item.kg_101N,
      })));

      setReceiveTank2(Alkalirecieved.result.map((item: any) => ({
        name: format((Number(item.UnixTimestamp) * 1000), 'yyyy-MM-dd HH:mm'),
        value: item.kg_102N,
      })));
    }

  }, [Alkalirecieved]);

  // Mixed 
  const [alkaliRoMixData, setAlkaliRoMixData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {

    if (Alkalimixed) {

      setAlkaliRoMixData(Alkalimixed.result.map((item: any) => ({
        name: format((Number(item.UnixTimestamp) * 1000), 'yyyy-MM-dd HH:mm'),
        main_volume: item.chemical_data,
        ro_volume: item.ro_data,
      })));
    }

  }, [Alkalimixed]);

  // tank Mixed
  const [alkaliTankMixData, setAlkaliTankMixData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {

    if (Alkalitankmixed) {
      setAlkaliTankMixData(Alkalitankmixed.result.map((item: any) => ({
        name: format((Number(item.UnixTimestamp) * 1000), 'yyyy-MM-dd HH:mm'),
        data_remaining_tank_Mix: item.data_remaining_tank_Mix,
        tank_Mix_between_day: item.tank_Mix_between_day,
      })));
    }

  }, [Alkalitankmixed]);

  // tank Store
  const [alkaliTankStoreData, setAlkaliTankStoreData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {

    if (Alkalitankstore) {
      setAlkaliTankStoreData(Alkalitankstore.result.map((item: any) => ({
        name: format((Number(item.UnixTimestamp) * 1000), 'yyyy-MM-dd HH:mm'),
        data_remaining_tank_Store: item.data_remaining_tank_Store,
        tank_Store_between_day: item.tank_Store_between_day,
      })));
    }

  }, [Alkalitankstore]);



  const [pd1AlkaliLineConsumedData, setPd1AlkaliLineConsumedData] = useState<ChartDataPoint[]>([]);
  const [pd2AlkaliLineConsumedData, setPd2AlkaliLineConsumedData] = useState<ChartDataPoint[]>([]);
  const [pd3AlkaliLineConsumedData, setPd3AlkaliLineConsumedData] = useState<ChartDataPoint[]>([]);

  // setAlkaliPieData([])

  // if (error) return <div>Failed to load consumed data</div>;
  // if (isLoading) return <div>Loading Chart Data...</div>;

  useEffect( () => {

    // console.log("useEffect [Alkaliconsumed] is triggered");

    if (!Alkaliconsumed || !Alkaliconsumed.result || Alkaliconsumed.result.length === 0) {
      setAlkaliPieData([]);
      setPd1AlkaliLineConsumedData([]);
      setPd2AlkaliLineConsumedData([]);
      setPd3AlkaliLineConsumedData([]);
      return;
    }

      const results = Alkaliconsumed.result;

      // --- 1. แยกข้อมูลสำหรับ Line Chart ตาม Plant ---
      // const pd1Raw = results.filter((item: any) => item);
      // const pd2Raw = results.filter((item: any) => item);
      // const pd3Raw = results.filter((item: any) => item);

      // console.log("pd1Raw >> ",pd1Raw)

      const mapData = (dataArray: any[] ,plant: string) => dataArray.map((item: any) => ({
        name: format((Number(item.UnixTimestamp) * 1000), 'yyyy-MM-dd HH:mm'),
        value: item[plant] || 0, // ใช้คีย์ volume ตาม JSON
      }));
      
      setPd1AlkaliLineConsumedData(mapData(results, "usepd1"));
      setPd2AlkaliLineConsumedData(mapData(results, "usepd2"));
      setPd3AlkaliLineConsumedData(mapData(results, "usepd3"));
      
      // console.log("Results for Pie Chart >> ", results);
      // console.log("Results Pd1AlkaliLineConsumedData >> ", pd1AlkaliLineConsumedData.map((d: any) => d.json()));
      // console.log("Results Pd2AlkaliLineConsumedData >> ", pd2AlkaliLineConsumedData.map((d: any) => d.json()));
      // console.log("Results Pd3AlkaliLineConsumedData >> ", pd3AlkaliLineConsumedData.map((d: any) => d.json()));
      // console.log("Results >> ", results);

      // --- 2. คำนวณ Pie Chart (เปลี่ยนจากค่าล่าสุด เป็นค่า SUM) ---


      // ใช้ reduce เพื่อรวมค่า volume ทั้งหมดใน array ของแต่ละ Plant
      const pd1Sum = results.reduce((acc: number, curr: any) => acc + (Number(curr.usepd1) || 0), 0);
      const pd2Sum = results.reduce((acc: number, curr: any) => acc + (Number(curr.usepd2) || 0), 0);
      const pd3Sum = results.reduce((acc: number, curr: any) => acc + (Number(curr.usepd3) || 0), 0);

      const sumTotal = pd1Sum + pd2Sum + pd3Sum;

      if (sumTotal > 0) {
        setAlkaliPieData([
          { name: 'PD1', value: (100 * pd1Sum / sumTotal), color: chartColor3 },
          { name: 'PD2', value: (100 * pd2Sum / sumTotal), color: chartColor4 },
          { name: 'PD3', value: (100 * pd3Sum / sumTotal), color: chartColor5 }
        ]);
      } else {
        setAlkaliPieData([]);
      }

  }, [Alkaliconsumed]); // dependency array

  const ModeCard: React.FC<{ mode: ModeCardData }> = ({ mode }) => (
    <div className={`${mode.bgColor} card_realtime_mode`}>

      <div className={`${mode.bgColor} ${mode.textColor} text-base lg:text-2xl`}>
          <p>Alkaline Mixer</p>
      </div>
      
      <div className='card_realtime_text_value_Headerlayer'>
        <p className={`card_realtime_text_title_HeaderMode ${mode.textColor}`}>
          {mode.title} :
        </p>
        <p className={`card_realtime_text_value_HeaderMode ${mode.value === 'Auto Start' ? 'text-green-500' : 'text-red-500'}`}>
          {mode.value}
        </p> 

      </div>

    </div>
    );

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

      <h1 className="mt-4 font-bold">Chart history</h1>

      <hr className="mt-4 "></hr>

      <SectionChooseDate
        period={period}
        date_start={date_start}
        date_end={date_end}
        onChangePeriod={(val) => setPeriod(val)}
        onChangeDate_start={(val) => setDate_start(val)}
        onChangeDate_end={(val) => setDate_end(val)}
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

      <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 mt-4 gap-2 lg:gap-2 w-full">

          {/* Recieve */}
          <ChartRecieve

            tank = {{
              Iitlename: "คงเหลือ NaOH รวมสูตร (kg)",
              key_value:"NaOH",
              Data: ReceiveData,
              ColorChart: ColorChart,
              bgColorChartContainer: bgColorChartContainer,
              ColorHeaderChart: ColorHeaderChart,
              chartColor: chartColor1
            }}
          />

          <ChartRecieve

            tank = {{
              Iitlename: "คงเหลือ NaOH TANK 1 (LT101N) รวมสูตร (kg)",
              key_value:"NaOH",
              Data: ReceiveTank1,
              ColorChart: ColorChart,
              bgColorChartContainer: bgColorChartContainer,
              ColorHeaderChart: ColorHeaderChart,
              chartColor: chartColor1
            }}
          />

          <ChartRecieve

            tank = {{
              Iitlename: "คงเหลือ NaOH TANK 2 (LT102N) รวมสูตร (kg)",
              key_value:"NaOH",
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
                Iitlename: "NaOH & RO Used in Mixer (Liter) TANK 3",
                key_value:"NaOH",
                Data: alkaliRoMixData,
                ColorChart: ColorChart,
                bgColorChartContainer: bgColorChartContainer,
                ColorHeaderChart: ColorHeaderChart,
                chartColor1: chartColor1,
                chartColor2: chartColor2,
              }}
            />

          {/* </div> */}

          {/* <div className='h-[420px]'> */}

            <CharttankMix
              tank = {{
                Iitlename: "คงเหลือ NaOH Mixer (Liter) TANK 3",
                key_value:"NaOH",
                Data: alkaliTankMixData,
                ColorChart: ColorChart,
                bgColorChartContainer: bgColorChartContainer,
                ColorHeaderChart: ColorHeaderChart,
                chartColor1: chartColor1,
                chartColor2: chartColor2,
              }}
            />

          {/* </div> */}

          {/* <div className='h-[420px]'> */}

            <CharttankStore
              tank = {{
                Iitlename: "คงเหลือ NaOH Store (Liter) TANK 4",
                key_value:"NaOH",
                Data: alkaliTankStoreData,
                ColorChart: ColorChart,
                bgColorChartContainer: bgColorChartContainer,
                ColorHeaderChart: ColorHeaderChart,
                chartColor1: chartColor1,
                chartColor2: chartColor2,
              }}
            />

          {/* </div> */}

          {/* <div className='h-[420px]'> */}
            {/* Alkali Used */}
            <ChartPieUsed
              tank = {{
                Iitlename: "PD1 PD2 PD3 NaOH Used (Liter)",
                key_value:"NaOH",
                Data: alkaliPieData,
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
                Iitlename: "PD1 NaOH Used (Liter)",
                key_value:"NaOH",
                Data: pd1AlkaliLineConsumedData,
                ColorChart: ColorChart,
                bgColorChartContainer: bgColorChartContainer,
                ColorHeaderChart: ColorHeaderChart,
                chartColor: chartColor3,
              }}
            />

            <ChartlineUsed
              tank = {{
                Iitlename: "PD2 NaOH Used (Liter)",
                key_value:"NaOH",
                Data: pd2AlkaliLineConsumedData,
                ColorChart: ColorChart,
                bgColorChartContainer: bgColorChartContainer,
                ColorHeaderChart: ColorHeaderChart,
                chartColor: chartColor4,
              }}
            />

            <ChartlineUsed
              tank = {{
                Iitlename: "PD3 NaOH Used (Liter)",
                key_value:"NaOH",
                Data: pd3AlkaliLineConsumedData,
                ColorChart: ColorChart,
                bgColorChartContainer: bgColorChartContainer,
                ColorHeaderChart: ColorHeaderChart,
                chartColor: chartColor5,
              }}
            />

          </div>


        </div>
    </>
  );
}
