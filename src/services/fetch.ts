const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:80';

// app/utils/fetch-data-server.js
export async function fetchDataFillchart(timeFrame?: string) {

    let period = "today";

    if(timeFrame == "monthly"){
        period = "thismonth";
    }else if(timeFrame == "yearly"){
        period = "thisyear";
    }

    // 1. ถ้าดึงจาก API ตัวเอง (Internal API) - แนะนำให้เรียก Logic/DB โดยตรง
    // 2. ถ้าดึงจาก API ภายนอก หรือต้องการใช้ fetch:
    const res = await fetch(`${baseUrl}/api/chartfilloverview?period=${period}`, {
    // const res = await fetch(`/api/chartfilloverview?period=${period}`, {
        next: { revalidate: 60 } // ตั้งค่าการ Revalidate (คล้าย refreshInterval ของ SWR)
    });

    if (!res.ok) return null;

    // console.log("fetchDataFillchart >>:", res);

    return res.json();
}

export async function fetchDataStorechart(timeFrame?: string) {

    let period = "today";

    if(timeFrame == "monthly"){
        period = "thismonth";
    }else if(timeFrame == "yearly"){
        period = "thisyear";
    }

    // 1. ถ้าดึงจาก API ตัวเอง (Internal API) - แนะนำให้เรียก Logic/DB โดยตรง
    // 2. ถ้าดึงจาก API ภายนอก หรือต้องการใช้ fetch:
    const res = await fetch(`${baseUrl}/api/chartstoreoverview?period=${period}`, {
    // const res = await fetch(`/api/chartstoreoverview?period=${period}`, {
        next: { revalidate: 60 } // ตั้งค่าการ Revalidate (คล้าย refreshInterval ของ SWR)
    });

    if (!res.ok) return null;

    return res.json();
}

export async function fetchDataUsedchart(timeFrame?: string) {

    let period = "today";

    if(timeFrame == "monthly"){
        period = "thismonth";
    }else if(timeFrame == "yearly"){
        period = "thisyear";
    }

    // 1. ถ้าดึงจาก API ตัวเอง (Internal API) - แนะนำให้เรียก Logic/DB โดยตรง
    // 2. ถ้าดึงจาก API ภายนอก หรือต้องการใช้ fetch:
    const res = await fetch(`${baseUrl}/api/chartusedoverview?period=${period}`, {
    // const res = await fetch(`/api/chartusedoverview?period=${period}`, {
        next: { revalidate: 60 } // ตั้งค่าการ Revalidate (คล้าย refreshInterval ของ SWR)
    });

    if (!res.ok) return null;

    return res.json();
}

export async function fetchDataTransferchart(timeFrame?: string) {

    let period = "today";

    if(timeFrame == "monthly"){
        period = "thismonth";
    }else if(timeFrame == "yearly"){
        period = "thisyear";
    }
    
    // 1. ถ้าดึงจาก API ตัวเอง (Internal API) - แนะนำให้เรียก Logic/DB โดยตรง
    // 2. ถ้าดึงจาก API ภายนอก หรือต้องการใช้ fetch:
    const res = await fetch(`${baseUrl}/api/charttransferoverview?period=${period}`, {
    // const res = await fetch(`/api/charttransferoverview?period=${period}`, {
    // const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/charttransferoverview?period=${period}`, {
        next: { revalidate: 60 } // ตั้งค่าการ Revalidate (คล้าย refreshInterval ของ SWR)
    });

    if (!res.ok) return null;

    return res.json();
}