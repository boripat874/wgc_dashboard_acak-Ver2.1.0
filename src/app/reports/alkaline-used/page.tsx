"use client"

import { format } from "date-fns";
import { useEffect, useState } from "react";
import SectionChoose from '@/components/sectionChoose';

import Forms4 from '@/components/reports/reportPdf/forms4'; // Received
import Forms4csv from '@/components/reports/reprotCSV/form4csv'; // Received
import { ReportFillOverview } from "@/components/Charts/report-fill-overview";
import { ReportTransferOverview } from "@/components/Charts/report-transfer-overview";
import { Suspense } from "react";
import { OverviewCardsSkeleton } from "../_components/skeleton";

interface Props {}

export default function Page(props: Props) {
    const {} = props

    // 4. Used
    const [alkUsedUnit, setAlkUsedUnit] = useState("--");
    const [alkUsedPlant, setAlkUsedPlant] = useState("--");
    const [alkUsedAgg, setAlkUsedAgg] = useState("--");
    const [alkUsedPeriod, setAlkUsedPeriod] = useState("--");
    const [alkUsedStart, setAlkUsedStart] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [alkUsedEnd, setAlkUsedEnd] = useState(format(new Date(), 'yyyy-MM-dd'));

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

                // Forms4(renderReport, "Alkaline", alkUsedPlant, alkUsedUnit, "4", alkUsedAgg, alkUsedPeriod, alkUsedStart, alkUsedEnd)
                Forms4(renderReport, "Alkaline", "PD", "kg", "4", "perday", "1day", format(new Date(), 'yyyy-MM-dd'), format(new Date(), 'yyyy-MM-dd'))

            }, 1000); // ปิดหลังจาก 1 วินาที

            return () => clearTimeout(timer);
        }

        if (alkUsedUnit !== "--" && alkUsedAgg !== "--" && alkUsedPeriod !== "--") {

            Forms4(renderReport, "Alkaline", alkUsedPlant, alkUsedUnit, "4", alkUsedAgg, alkUsedPeriod, alkUsedStart, alkUsedEnd)
        }

    }, [alkUsedUnit, alkUsedPlant, alkUsedAgg, alkUsedPeriod, alkUsedStart, alkUsedEnd]);

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
                <h1>Alkaline Used Report</h1>

                <SectionChoose 
                    plantName="Alkaline" sectionName="Used" title="NaOH Used"
                    unit={alkUsedUnit} plantUse={alkUsedPlant} aggregation={alkUsedAgg} period={alkUsedPeriod} date_start={alkUsedStart} date_end={alkUsedEnd}
                    onChangeUnit={setAlkUsedUnit} onChangePlantUse={setAlkUsedPlant} onChangeAggregation={setAlkUsedAgg} onChangePeriod={setAlkUsedPeriod} onChangeDate_start={setAlkUsedStart} onChangeDate_end={setAlkUsedEnd}
                    onClickPDF={() => downloadReport(pdfUrl || '')} 
                    onClickCSV={() => Forms4csv("Alkaline", alkUsedPlant, alkUsedUnit, alkUsedAgg, alkUsedPeriod, alkUsedStart, alkUsedEnd)}
                />
                {/* Add your report content here */}
            </div>

            <div className=" mt-3 grid xl:grid-cols-3 2xl:gap-7.5">
{/* 
                <div className="grid gap-y-3">

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
                    
                    <div className="col-span-2 bg-white dark:bg-gray-dark mt-2 xl:mt-0 h-800px xl:h-auto rounded-lg p-2">

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

