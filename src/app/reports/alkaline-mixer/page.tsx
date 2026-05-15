"use client"

import { format } from "date-fns";
import { useEffect, useState } from "react";
import SectionChoose from '@/components/sectionChoose';

import Forms2 from '@/components/reports/reportPdf/forms2'; // Mixer
import Forms2csv from '@/components/reports/reprotCSV/form2csv'; // Mixer
import { ReportFillOverview } from "@/components/Charts/report-fill-overview";
import { ReportTransferOverview } from "@/components/Charts/report-transfer-overview";
import { Suspense } from "react";
import { OverviewCardsSkeleton } from "../_components/skeleton";


interface Props {}

export default function Page(props: Props) {
    const {} = props

    // 2. Mixer
    const [alkMixUnit, setAlkMixUnit] = useState("--");
    const [alkMixAgg, setAlkMixAgg] = useState("--");
    const [alkMixPeriod, setAlkMixPeriod] = useState("--");
    const [alkMixStart, setAlkMixStart] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [alkMixEnd, setAlkMixEnd] = useState(format(new Date(), 'yyyy-MM-dd'));

    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [reportOpen, setReportOpen] = useState(false);

    // Report Handlers
    const renderReport = (url: string) => {
        setPdfUrl(url);
        setReportOpen(true);
    };

    useEffect(() => {
    
        if (!reportOpen) {
            const timer = setTimeout(() => {

                // Forms2(renderReport, "Alkaline", alkMixUnit, "3",  alkMixAgg, alkMixPeriod, alkMixStart, alkMixEnd)
                Forms2(renderReport, "Alkaline", "kg", "3", "perday", "1day", format(new Date(), 'yyyy-MM-dd'), format(new Date(), 'yyyy-MM-dd'))


            }, 1000); // ปิดหลังจาก 1 วินาที

            return () => clearTimeout(timer);
        }

        if (alkMixPeriod !== "--") {

            Forms2(renderReport, "Alkaline", alkMixUnit, "3",  alkMixAgg, alkMixPeriod, alkMixStart, alkMixEnd)
        }

    }, [alkMixUnit, alkMixAgg, alkMixPeriod, alkMixStart, alkMixEnd]);

    const downloadReport = (url: string) => {
        if (!url) return;

        // สร้าง Element <a> ขึ้นมาใน Memory
        const link = document.createElement('a');
        link.href = url;
        
        // ตั้งชื่อไฟล์ที่จะถูกดาวน์โหลด (ปรับเปลี่ยนได้ตามต้องการ)
        link.download = `Alkaline_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
        
        // จำลองการคลิก
        document.body.appendChild(link);
        link.click();
        
        // ลบทิ้งเมื่อเสร็จสิ้น
        document.body.removeChild(link);
    };

    return (

        <>
            <div>
                <h1>Alkaline Mixer Report</h1>

                <SectionChoose 
                    plantName="Alkaline" sectionName="Mixer" title="NaOH Mixer"
                    unit={alkMixUnit} aggregation={alkMixAgg} period={alkMixPeriod} date_start={alkMixStart} date_end={alkMixEnd}
                    onChangeUnit={setAlkMixUnit} onChangeAggregation={setAlkMixAgg} onChangePeriod={setAlkMixPeriod} onChangeDate_start={setAlkMixStart} onChangeDate_end={setAlkMixEnd}
                    onClickPDF={() => downloadReport(pdfUrl || '')} 
                    onClickCSV={() => Forms2csv("Alkaline", alkMixUnit, alkMixAgg, alkMixPeriod, alkMixStart, alkMixEnd)}
                />
                {/* Add your report content here */}

            </div>

            <div className=" mt-3 2xl:gap-7.5">

                {/* <div className="grid gap-y-3">

                    <ReportFillOverview
                        className="col-span-12 xl:col-span-7 h-[550px] xl:h-90"
                        key={"fill_overview"}
                        timeFrame={"today"}
                    />

                    <ReportTransferOverview
                        className="col-span-12 xl:col-span-7 h-[480px]"
                        key={"transfer_overview"}
                        timeFrame={"today"}
                    />

                </div> */}

                <Suspense fallback={<OverviewCardsSkeleton />}>
                    
                    <div className="col-span-2 bg-white dark:bg-gray-dark mt-2 xl:mt-0 h-[900px] rounded-lg p-2">

                        {/* เช็ค pdfUrl ตรงนี้ */}
                        {pdfUrl ? (
                            <iframe 
                                src={pdfUrl} 
                                className="w-full h-full rounded-lg" 
                                title="PDF Preview" 
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-400">
                                <p>Waiting for report data...</p>
                            </div>
                        )}
                        
                    </div>

                </Suspense>

            </div>
        </>

    )
}

