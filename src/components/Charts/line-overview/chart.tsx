"use client";

import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

type PropsType = {
  data: {
    received: { x: unknown; y: number }[];
    due: { x: unknown; y: number }[];
  };
};

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export function FillOverviewChart({ data }: PropsType) {
  const isMobile = useIsMobile();
  
  // สเตตสำหรับควบคุมการเรนเดอร์ชาร์ตแบบล้างไพ่
  const [renderData, setRenderData] = React.useState<PropsType["data"] | null>(null);

  // เอฟเฟกต์ดักจับการเปลี่ยนโครงสร้างข้อมูล (เมื่อเปลี่ยนโหมดเวลา)
  React.useEffect(() => {
    // 1. สั่งเคลียร์เป็น null เพื่อบีบให้คอมโพเนนต์ชาร์ตตัวเก่า Unmount ออกไปจาก DOM ทันที
    setRenderData(null); 

    // 2. รอให้ DOM เคลียร์ตัวเองเรียบร้อยในเฟรมถัดไป แล้วค่อยใส่ข้อมูลใหม่เข้าไปวาดใหม่ทั้งหมด
    const timer = setTimeout(() => {
      setRenderData(data);
    }, 16); // 16ms เท่ากับเวลา 1 เฟรม (60fps) มนุษย์จะมองไม่ทันการกระพริบนี้

    return () => clearTimeout(timer);
  }, [data]);

  const options: ApexOptions = React.useMemo(() => ({
    legend: {
      show: false,
    },
    colors: ["#5750F1", "#0ABEF9"],
    chart: {
      height: 310,
      type: "area",
      toolbar: {
        show: false,
      },
      fontFamily: "inherit",
      // เพิ่มการปิดแอนิเมชันตอนโหลดครั้งแรกเพื่อความปลอดภัยสูงสุด
      animations: {
        enabled: true,
        dynamicAnimation: {
          enabled: false // ปิดเฉพาะตอนข้อมูลเปลี่ยนโครงสร้างกระทันหัน
        }
      }
    },
    fill: {
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    responsive: [
      {
        breakpoint: 1024,
        options: { chart: { height: 300 } },
      },
      {
        breakpoint: 1366,
        options: { chart: { height: 320 } },
      },
    ],
    stroke: {
      curve: "smooth",
      width: isMobile ? 2 : 3,
    },
    grid: {
      strokeDashArray: 5,
      yaxis: {
        lines: { show: true },
      },
    },
    dataLabels: {
      enabled: false,
    },
    yaxis: {
      labels: {
        formatter: (value) => {
          return value.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        },
      },
    },
    tooltip: {
      marker: { show: true },
      y: {
        formatter: (value) => {
          return value.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) + " Kg";
        },
      },
    },
    xaxis: {
      type: "category", // บังคับให้แกน X มองทุกอย่างเป็น Category (ไม่ว่าจะเป็นวันที่ หรือ ชื่อเดือนสั้น-ยาว) ป้องกัน SVG เพี้ยน
      tickAmount: isMobile ? 7 : 7,
      labels: {
        hideOverlappingLabels: true,
      },
      axisBorder: { show: true },
      axisTicks: { show: true },
    },
  }), [isMobile]);

  return (
    <div className="-ml-4 -mr-5 h-[310px]">
      {renderData ? (
        <Chart
          options={options}
          series={[
            {
              name: "NaOH",
              data: renderData.received,
            },
            {
              name: "HCl",
              data: renderData.due,
            },
          ]}
          type="area"
          height={310}
        />
      ) : (
        // ช่วงที่สลับเวลาระหว่างเฟรม (16ms) จะแสดงบล็อกว่างขนาดเท่าเดิมไว้ หน้าจอจะไม่เด้ง
        <div className="w-full h-full" />
      )}
    </div>
  );
}