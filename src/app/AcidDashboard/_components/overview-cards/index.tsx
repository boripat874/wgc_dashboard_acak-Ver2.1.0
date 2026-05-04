"use client";
import { compactFormat } from "@/lib/format-number";
import { getOverviewData } from "../../fetch";
import { OverviewCard } from "./card";
import * as icons from "./icons";

import {  TankCardSummary,TankCard,MotorCard} from './card-Tank';
import { useState, useEffect} from "react";
import { Wgcacak } from "@/app/interface";

import useSWR from 'swr';
import {format} from 'date-fns';
import { fetcher } from "@/app/utils/fetcher";

export function OverviewCardsGroup() {

  // const { views, profit, products, users } = getOverviewData();
  const [wgcacak, setWgcacak] = useState<Wgcacak | null>(null);

  const bgColorCard1 = "bg-[#FFFFFF]";
  const bgColorCard2 = "bg-[#FFFFFF]";
  const bgColorCard3 = "bg-[#FFFFFF]";
  const bgColorCard4 = "bg-[#FFFFFF]";
  const bgColorCard5 = "bg-[#FFFFFF]";

  const ColorCard1 = "text-[#000000] dark:text-dark-6";
  const ColorCard2 = "text-[#000000] dark:text-dark-6";
  const ColorCard3 = "text-[#000000] dark:text-dark-6";
  const ColorCard4 = "text-[#000000] dark:text-dark-6";
  const ColorCard5 = "text-[#000000] dark:text-dark-6";

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

  return (

    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-5 2xl:gap-7.5">

      {/* NaOH Fill */}
      {/* <OverviewCard
        label="Total NaOH Fill today"
        data={{
          ...views,
          value: compactFormat(views.value),
        }}
        Icon={icons.NaOH}
      /> */}

      {/* Total NaOH Used */}
      {/* <OverviewCard
        label="Total NaOH Transfers today"
        data={{
          ...profit,
          value: compactFormat(profit.value),
        }}
        Icon={icons.NaOH_2}
      /> */}

      {/* <OverviewCard
        label="Total HCI Fill today"
        data={{
          ...products,
          value: compactFormat(products.value),
        }}
        Icon={icons.HCI}
      /> */}

      {/* <OverviewCard
        label="Total HCI Transfers today"
        data={{
          ...users,
          value: compactFormat(users.value),
        }}
        Icon={icons.HCI_2}
      /> */}

      <TankCard tank={{ 
        title: 'HCI Fill TANK 1 (101H)', 
        subtitle:'TANK 1 (101H)', 
        value_kg: wgcacak?.LT_PV_Kg_LT_101H?.toFixed(2) || '0.00', 
        value_m3: wgcacak?.LT_PV_m3_LT_101H?.toFixed(2) || '0.00', 
        value_mm: wgcacak?.AAA_LT_101H_Output?.toFixed(2) || '0.00', 
        bgColor: `${bgColorCard1}`, 
        textColor: `${ColorCard1}` 
        }} 
      />

      <TankCard tank={{ 
        title: 'HCI Fill TANK 2 (102H)', 
        subtitle:'TANK 2 (102H)', 
        value_kg: wgcacak?.LT_PV_Kg_LT_102H?.toFixed(2) || '0.00', 
        value_m3: wgcacak?.LT_PV_m3_LT_102H?.toFixed(2) || '0.00', 
        value_mm: wgcacak?.AAA_LT_102H_Output?.toFixed(2) || '0.00', 
        bgColor: `${bgColorCard2}`, 
        textColor: `${ColorCard2}`  
        }} 
      />

      <TankCardSummary tank={{ 
        title: 'HCI Fill TANK 1 + TANK 2', 
        subtitle:'TANK 1 + TANK 2', 
        func: 'Summary',
        value_kg: ((wgcacak?.LT_PV_Kg_LT_101H || 0) + (wgcacak?.LT_PV_Kg_LT_102H || 0)).toFixed(2) || '0.00', 
        value_m3: ((wgcacak?.LT_PV_m3_LT_101H || 0) + (wgcacak?.LT_PV_m3_LT_102H || 0)).toFixed(2) || '0.00', 
        bgColor: `${bgColorCard3}`, 
        textColor: `${ColorCard3}` 
        }} 
      />

      <TankCard tank={{ 
        title: 'HCI Mixer TANK 3 (301H)', 
        subtitle:'TANK 3 (301H)', 
        value_kg: wgcacak?.LT_PV_Kg_LT_301H?.toFixed(2) || '0.00', 
        value_m3: wgcacak?.LT_PV_m3_LT_301H?.toFixed(2) || '0.00', 
        value_mm: wgcacak?.AAA_LT_301H_Output?.toFixed(2) || '0.00', 
        bgColor: `${bgColorCard4}`, 
        textColor: `${ColorCard4}` 
        }} 
      />

      <TankCard tank={{ 
        title: 'HCI Store TANK 4 (401H)', 
        subtitle:'TANK 4 (401H)', 
        value_kg: wgcacak?.LT_PV_Kg_LT_401H?.toFixed(2) || '0.00', 
        value_m3: wgcacak?.LT_PV_m3_LT_401H?.toFixed(2) || '0.00', 
        value_mm: wgcacak?.AAA_LT_401H_Output?.toFixed(2) || '0.00', 
        bgColor: `${bgColorCard5}`, 
        textColor: `${ColorCard5}` 
        
        }} 
      />

    </div>
  );
}
