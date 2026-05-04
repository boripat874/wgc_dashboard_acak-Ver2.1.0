'use client';
import React from 'react';
import { DateRangePicker } from "@heroui/react"; // ตรวจสอบว่าลง package นี้แล้ว
import { parseDate } from "@internationalized/date";
import { addDays, subDays, startOfMonth, startOfYear, format, subMonths } from 'date-fns';

interface SectionChooseProps {
  valueName?: string;
  plantName: string;
  sectionName: string;
  title: string;
  tank?: string;
  unit?: string;
  plantUse?: string;
  aggregation?: string;
  period?: string;
  date_start: string;
  date_end: string;
  onClickPDF: () => void;
  onClickCSV: () => void;
  onOpenModal?: () => void;
  onChangeValueName?: (val: string) => void;
  onChangeTank?: (val: string) => void;
  onChangeUnit?: (val: string) => void;
  onChangePlantUse?: (val: string) => void;
  onChangeAggregation?: (val: string) => void;
  onChangePeriod?: (val: string) => void;
  onChangeDate_start: (val: string) => void;
  onChangeDate_end: (val: string) => void;
}

const SectionChoose: React.FC<SectionChooseProps> = ({
  plantName,
  sectionName,
  title,
  tank,
  unit,
  aggregation,
  period,
  date_start,
  date_end,
  onClickPDF,
  onClickCSV,
  onChangeTank,
  onChangeUnit,
  onChangeAggregation,
  onChangePeriod,
  onChangeDate_start,
  onChangeDate_end,
  onChangePlantUse,
  plantUse
}) => {
  
  // Logic สำหรับเปลี่ยนวันที่อัตโนมัติตาม Period ที่เลือก
  const handlePeriodChange = (val: string) => {
    if (onChangePeriod) onChangePeriod(val);
    
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    
    if (val === "1day") {
      onChangeDate_start(todayStr);
      onChangeDate_end(todayStr);
    } else if (val === "this7days") {
      onChangeDate_end(todayStr);
      const prevDate = subDays(today, 7);
      onChangeDate_start(format(prevDate, "yyyy-MM-dd"));
    } else if (val === "thismonth") {
        onChangeDate_end(todayStr);
        const start = startOfMonth(today);
        onChangeDate_start(format(start, "yyyy-MM-dd"));
    } else if (val === "3months") {
        onChangeDate_end(todayStr);
        const start = startOfMonth(subMonths(today, 3));
        onChangeDate_start(format(start, "yyyy-MM-dd"));
    } else if (val === "6months") {
        onChangeDate_end(todayStr);
        const start = startOfMonth(subMonths(today, 6));
        onChangeDate_start(format(start, "yyyy-MM-dd"));
    } else if (val === "thisyear") {
        onChangeDate_end(todayStr);
        const start = startOfYear(today);
        onChangeDate_start(format(start, "yyyy-MM-dd"));
    }
  };
 
  return (
    // เอา overflow-hidden ออก เพื่อไม่ให้ DatePicker ถูกตัด หรือไปทับขอบ
    <div className={`report-section bg-white dark:bg-gray-dark rounded-lg shadow-sm flex flex-col dark:border-gray-dark`}>
      
      {/* Title Bar */}
      <div className={`report-title text-white p-2 font-bold text-center rounded-t-lg ${plantName === 'Alkaline' ? 'bg-[#C558C4] dark:bg-[#C558C4]' : 'bg-[#ED9832] dark:bg-[#ED9832]'}`}>
        <p>{title}</p>
      </div>

      <div className="report-choose p-4 flex flex-col gap-4">

        {/* Row 1: Tank Selector (Only for Received) */}
        {sectionName === 'Received' && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-800 dark:text-gray-4">TANK</label>
            <select 
              className="border border-gray-300 dark:border-gray-600 rounded p-2 text-sm dark:text-gray-4"
              value={tank}
              onChange={(e) => onChangeTank && onChangeTank(e.target.value)}
            >
              <option value="--" disabled>
                -- Select TANK --
              </option>
              <option value="1">TANK 1</option>
              <option value="2">TANK 2</option>
              <option value="12">TANK 1 + TANK 2</option>
            </select>
          </div>
        )}

        {/* Row 2: Unit Selector */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-800 dark:text-gray-4">Unit</label>

          <select 
            className="border border-gray-300 dark:border-gray-600 rounded p-2 text-sm dark:text-gray-4"
            value={unit}
            onChange={(e) => onChangeUnit && onChangeUnit(e.target.value)}
          >
            <option value="--" disabled>
              -- Select Unit --
            </option>
            <option value="kg">kg</option>
            <option value="m3">m³</option>
            <option value="Liter">Liter</option>
          </select>

        </div>

        {/* Row 3: Plant Use (Only for Used) */}
        {/* {sectionName === 'Used' && (
            <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700">Plant</label>
                <select 
                  className="border border-gray-300 rounded p-2 text-sm"
                  value={plantUse}
                  onChange={(e) => onChangePlantUse && onChangePlantUse(e.target.value)}
                >
                  <option value="PD1">PD1</option>
                  <option value="PD2">PD2</option>
                  <option value="PD3">PD3</option>
                </select>
            </div>
        )} */}

        {/* Row 4: Aggregation */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-800 dark:text-gray-4">Data aggregation</label>
          <select 
            className="border border-gray-300 dark:border-gray-600 dark:text-gray-4 rounded p-2 text-sm"
            value={aggregation}
            onChange={(e) => onChangeAggregation && onChangeAggregation(e.target.value)}
          >
            <option value="--" disabled>
              -- Select Aggregation --
            </option>
            <option value="perday">Per Day</option>
            {sectionName !== 'Used' && <option value="usage">Usage</option>}
          </select>
        </div>

        {/* Row 5: Period */}
        <div className="flex flex-col gap-1 ">
          <label className="text-sm font-semibold text-gray-800 dark:text-gray-4">Period</label>
          <select 
            className="border border-gray-300 dark:border-gray-600 dark:text-gray-4 rounded p-2 text-sm"
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value)}
          >
            <option value="--" disabled>
              -- Select Period --
            </option>
            <option value="1day">1 Day</option>
            <option value="this7days">7 Days</option>
            <option value="thismonth">1 Month</option>
            <option value="3months">3 Months</option>
            <option value="6months">6 Months</option>
            <option value="thisyear">1 Year</option>
            <option value="bydate">By Date</option>
          </select>
        </div>

        {/* Row 6: Date Range Picker (Only if 'bydate') */}
        {period === 'bydate' && (
            <div className="flex flex-col gap-1 w-full">
                 <label className="text-sm font-semibold text-gray-800 dark:text-gray-4">Duration</label>
                 <div className="w-full relative z-10"> {/* เพิ่ม z-index ให้ DatePicker อยู่บนสุด */}
                    <DateRangePicker 
                        aria-label="Duration"
                        disableAnimation={true}
                        
                        value={{
                            start: parseDate(date_start), 
                            end: parseDate(date_end)
                        }}
                        onChange={(val) => {
                            if (val) {
                                onChangeDate_start(val.start.toString());
                                onChangeDate_end(val.end.toString());
                            }
                        }}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-dark"
                    />
                 </div>
            </div>
        )}


      </div>
 
      {/* Buttons: ย้ายมาอยู่ด้านล่างสุดและจัดกึ่งกลาง */}
      <div className="mt-2 p-4 pt-0 flex flex-row justify-end gap-2">
        <div 
          className="w-[100px] bg-gray-200 hover:bg-[#2e2d2d] hover:text-gray-200 dark:bg-gray-600 text-[#2e2d2d] dark:text-gray-4 text-center  py-2  rounded cursor-pointer hover:bg-opacity-90 font-bold text-xs shadow-sm"
          onClick={onClickPDF}
        >
          Export PDF
        </div>
        <div 
          className="w-[100px] bg-gray-200 hover:bg-[#2e2d2d] hover:text-gray-200 dark:bg-gray-600 text-[#2e2d2d] dark:text-gray-4 text-center  py-2 rounded cursor-pointer hover:bg-opacity-90 font-bold text-xs shadow-sm"
          onClick={onClickCSV}
        >
          Export CSV
        </div>
      </div>

    </div>
  );
};

export default SectionChoose;