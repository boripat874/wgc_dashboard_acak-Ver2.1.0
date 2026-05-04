exports.convertTotimestamp = async function name(params) {

    let period = params.period || "today"; // ค่าที่เป็นไปได้: "today", "thisweek", "thismonth", "thisyear" , "bydate"

    const now = new Date(); // รับวันที่และเวลาปัจจุบัน *เมื่อโค้ดทำงาน*

    // Calculate default for date_start: timestamp in seconds for the beginning of the current day
    const defaultStartTimestamp = Math.floor(new Date(now).setHours(0, 0, 0, 0) / 1000);

    // Calculate default for date_end: timestamp in seconds for the beginning of the next day
    const Endtime = new Date(now);
    Endtime.setDate(Endtime.getDate() + 1);
    Endtime.setHours(0, 0, 0, 0);
    const defaultEndTimestamp = Math.floor(Endtime.getTime() / 1000);

    let date_start = params.date_start || defaultStartTimestamp;
    let date_end = params.date_end || defaultEndTimestamp;

    // console.log(date_start);
    // console.log(date_end);
    

    let startTimestamp;
    let endTimestamp;

    // console.log("period -->",params.period);

    // --- คำนวณ timestamp เริ่มต้นและสิ้นสุดตามช่วงเวลา (period) ---
    if (period === "this7days") {

        // 1. จุดเริ่มต้น: ย้อนกลับไป 6 วันนับจากวันนี้ (รวมวันนี้ด้วย = 7 วัน) เริ่มที่ 00:00:00
        const startOf7Days = new Date(now);
        startOf7Days.setDate(now.getDate() - 6); 
        startOf7Days.setHours(0, 0, 0, 0);
        startTimestamp = Math.floor(startOf7Days.getTime() / 1000);

        // 2. จุดสิ้นสุด: ต้องเป็นสิ้นสุดของ "วันนี้" (23:59:59)
        const endOfToday = new Date(now);
        endOfToday.setDate(now.getDate() + 1); // ขยับไปเป็นวันพรุ่งนี้ 00:00:00
        endOfToday.setHours(0, 0, 0, 0);
        
        // ลบ 1 วินาที เพื่อให้ได้ 23:59:59 ของวันนี้
        endTimestamp = Math.floor(endOfToday.getTime() / 1000) - 1;

        // เช็คผลลัพธ์ (สมมติวันนี้คือ 14 Feb)
        // Start: 08 Feb 00:00:00
        // End:   14 Feb 23:59:59
    } else if (period === "thisyear") {

        // จุดเริ่มต้นของปีปัจจุบัน (1 มกราคม, 00:00:00)
        const startOfYear = new Date(now.getFullYear(), 0, 1); // เดือนเป็นแบบ 0-indexed (0 = มกราคม)
        startOfYear.setHours(0, 0, 0, 0);
        startTimestamp = Math.floor(startOfYear.getTime() / 1000);

        // จุดเริ่มต้นของปีถัดไป (1 มกราคม ของปีถัดไป, 00:00:00)
        const startOfNextYear = new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0, 0); // เดือนเป็นแบบ 0-indexed (0 = มกราคม)

        endTimestamp = Math.floor(startOfNextYear.getTime() / 1000) -1;

    }else if (period === "thismonth") {

        // จุดเริ่มต้นของเดือนปัจจุบัน (วันที่ 1, 00:00:00)
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        startTimestamp = Math.floor(startOfMonth.getTime() / 1000);

        // จุดเริ่มต้นของเดือนถัดไป (วันที่ 1 ของเดือนถัดไป, 00:00:00)
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0); // JS จัดการการเปลี่ยนเดือน/ปีอัตโนมัติ
        endTimestamp = Math.floor(startOfNextMonth.getTime() / 1000) -1;

    }else if(period === "3months"){

        // จุดเริ่มต้นของเดือนปัจจุบัน (วันที่ 1, 00:00:00)
        const startOfMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        startOfMonth.setHours(0, 0, 0, 0);
        startTimestamp = Math.floor(startOfMonth.getTime() / 1000);

        // จุดเริ่มต้นของเดือนถัดไป (วันที่ 1 ของเดือนถัดไป, 00:00:00)
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
 
        endTimestamp = Math.floor(startOfNextMonth.getTime() / 1000) - 1;

    }else if(period === "6months"){

        // จุดเริ่มต้นของเดือนปัจจุบัน (วันที่ 1, 00:00:00)
        const startOfMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        startOfMonth.setHours(0, 0, 0, 0);
        startTimestamp = Math.floor(startOfMonth.getTime() / 1000);

        // จุดเริ่มต้นของเดือนถัดไป (วันที่ 1 ของเดือนถัดไป, 00:00:00)
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
        endTimestamp = Math.floor(startOfNextMonth.getTime() / 1000) - 1;

    } else if (period === "thisweek") {
        const currentDayOfWeek = now.getDay(); 
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - currentDayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);
        startTimestamp = Math.floor(startOfWeek.getTime() / 1000);

        const startOfNextWeek = new Date(startOfWeek);
        startOfNextWeek.setDate(startOfWeek.getDate() + 7);
        // ลบ 1 วินาที เพื่อให้ได้ 23:59:59 ของวันเสาร์ (สิ้นสุดสัปดาห์)
        endTimestamp = Math.floor(startOfNextWeek.getTime() / 1000) - 1;

    } else if (period === "bydate") {
        const startDate = new Date(date_start);
        startDate.setHours(0, 0, 0, 0);
        startTimestamp = Math.floor(startDate.getTime() / 1000);

        const endDate = new Date(date_end);
        // ขยับไปวันถัดไป 1 วัน แล้วลบ 1 วินาที เพื่อให้ได้ 23:59:59 ของวันที่เลือก (endDate)
        endDate.setDate(endDate.getDate() + 1);
        endDate.setHours(0, 0, 0, 0);
        endTimestamp = Math.floor(endDate.getTime() / 1000) - 1;

    } else {
        // กรณี today หรือเริ่มต้น
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        startTimestamp = Math.floor(today.getTime() / 1000);

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        // ลบ 1 วินาที เพื่อให้ได้ 23:59:59 ของวันนี้
        endTimestamp = Math.floor(tomorrow.getTime() / 1000) - 1;
    }

    // console.log(startTimestamp);
    // console.log(endTimestamp);

    return {
        startTimestamp,
        endTimestamp,
    };
}

