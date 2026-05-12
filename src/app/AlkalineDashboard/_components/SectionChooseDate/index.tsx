'use client';
import React from 'react';
import { DateRangePicker } from "@heroui/react"; // ตรวจสอบว่าลง package นี้แล้ว
import { parseDate } from "@internationalized/date";
import type { DateValue, RangeValue } from "@heroui/react";
import { addDays, subDays, startOfMonth, startOfYear, format, subMonths } from 'date-fns';

interface SectionChooseDate {
  period?: string;
  date_start: string;
  date_end: string;
  onChangePeriod?: (val: string) => void;
  onChangeDate_start: (val: string) => void;
  onChangeDate_end: (val: string) => void;
}

const SectionChooseDate: React.FC<SectionChooseDate> = ({
  period,
  date_start,
  date_end,
  onChangePeriod,
  onChangeDate_start,
  onChangeDate_end,
}) => {
  
  // Logic สำหรับเปลี่ยนวันที่อัตโนมัติตาม Period ที่เลือก
  const handlePeriodChange = (val: string) => {
    if (onChangePeriod) onChangePeriod(val);
    
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    
    if (val === "1day") {
      onChangeDate_start(todayStr);
      onChangeDate_end(todayStr);
    } else if (val === "thisweek") {
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

  // ใช้การ Cast ผ่าน unknown เพื่อตัดปัญหา Private Property Conflict
  const getSafeValue = (): RangeValue<DateValue> => {
    try {
      // ตรวจสอบว่ามีค่าวันที่หรือไม่ ถ้าไม่มีให้ใช้ค่าวันนี้แทนเพื่อป้องกัน parseDate พัง
      const startStr = date_start || format(new Date(), "yyyy-MM-dd");
      const endStr = date_end || format(new Date(), "yyyy-MM-dd");

      const range = {
        start: parseDate(startStr),
        end: parseDate(endStr),
      };

      // หัวใจสำคัญ: แปลงเป็น unknown ก่อนแล้วค่อยแปลงเป็น RangeValue<DateValue>
      // เพื่อบอก TypeScript ว่า "ไม่ต้องเช็คโครงสร้างเดิม ฉันยืนยันว่าใช้ Type นี้"
      return (range as unknown) as RangeValue<DateValue>;
    } catch (e) {
      // Fallback กรณีเกิด Error ในการ parse
      const today = parseDate(format(new Date(), "yyyy-MM-dd"));
      return ({ start: today, end: today } as unknown) as RangeValue<DateValue>;
    }
  };
 
  return (
    // เอา overflow-hidden ออก เพื่อไม่ให้ DatePicker ถูกตัด หรือไปทับขอบ
    <div className="report-choose p-4 flex flex-col gap-4">

        {/* Row 5: Period */}
        <div className="flex flex-col gap-1 ">

            <label className="text-sm font-semibold text-gray-800 dark:text-gray-4">Period</label>
            <select 
                className="border border-gray-300 dark:border-gray-600 dark:text-gray-4 rounded p-2.5 text-sm bg-white dark:bg-gray-dark"
                value={period}
                onChange={(e) => handlePeriodChange(e.target.value)}
            >
                <option value="thisweek">Week</option>
                <option value="thismonth">Month</option>
                <option value="thisyear">Year</option>
                <option value="bydate">By Date</option>
            </select>

        </div>

        {/* Row 6: Date Range Picker (Only if 'bydate') */}
        {period === 'bydate' && (
        <div className="flex flex-col gap-1 w-full">
          <label className="text-sm font-semibold text-gray-800 dark:text-gray-4">Duration</label>

          <div className="w-full relative z-10">
            <DateRangePicker 
              aria-label="Duration"
              disableAnimation={true}
              value={getSafeValue() as any}
              onChange={(val) => {
                // เช็คความปลอดภัยเผื่อค่าที่ส่งกลับมาเป็น null
                if (val && val.start && val.end) {
                  onChangeDate_start((val.start as any).toString());
                  onChangeDate_end((val.end as any).toString());
                }
              }}
              className="w-full p-0 bg-white dark:bg-gray-dark border border-gray-300 dark:border-gray-600 rounded text-sm"
            />
          </div>
        </div>
      )}

      </div>
  );
};

export default SectionChooseDate;