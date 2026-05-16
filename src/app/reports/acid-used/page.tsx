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

    // 4. Transfers
    const [acidUsedUnit, setAcidUsedUnit] = useState("--");
    const [acidUsedPlant, setAcidUsedPlant] = useState("--");
    const [acidUsedAgg, setAcidUsedAgg] = useState("--");
    const [acidUsedPeriod, setAcidUsedPeriod] = useState("--");
    const [acidUsedStart, setAcidUsedStart] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [acidUsedEnd, setAcidUsedEnd] = useState(format(new Date(), 'yyyy-MM-dd'));

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

                // Forms4(renderReport, "Acid", acidUsedPlant, acidUsedUnit, "4", acidUsedAgg, acidUsedPeriod, acidUsedStart, acidUsedEnd)
                Forms4(renderReport, "Acid", "PD", "kg", "4", "perday", "1day", format(new Date(), 'yyyy-MM-dd'), format(new Date(), 'yyyy-MM-dd'))


            }, 1000); // ปิดหลังจาก 1 วินาที

            return () => clearTimeout(timer);
        }

        if (acidUsedPeriod !== "--") {

            Forms4(renderReport, "Acid", acidUsedPlant, acidUsedUnit, "4", acidUsedAgg, acidUsedPeriod, acidUsedStart, acidUsedEnd)
        }

    }, [acidUsedUnit, acidUsedPlant, acidUsedAgg, acidUsedPeriod, acidUsedStart, acidUsedEnd]);

    const downloadReport = (url: string) => {
        if (!url) return;

        // สร้าง Element <a> ขึ้นมาใน Memory
        const link = document.createElement('a');
        link.href = url;
        
        // ตั้งชื่อไฟล์ที่จะถูกดาวน์โหลด (ปรับเปลี่ยนได้ตามต้องการ)
        link.download = `Acid_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
        
        // จำลองการคลิก
        document.body.appendChild(link);
        link.click();
        
        // ลบทิ้งเมื่อเสร็จสิ้น
        document.body.removeChild(link);
    };

    return (
        <>
            <div>
                <h1>Acid Used Report</h1>

                <SectionChoose 
                    plantName="Acid" sectionName="Used" title="HCI Used"
                    unit={acidUsedUnit} plantUse={acidUsedPlant} aggregation={acidUsedAgg} period={acidUsedPeriod} date_start={acidUsedStart} date_end={acidUsedEnd}
                    onChangeUnit={setAcidUsedUnit} onChangePlantUse={setAcidUsedPlant} onChangeAggregation={setAcidUsedAgg} onChangePeriod={setAcidUsedPeriod} onChangeDate_start={setAcidUsedStart} onChangeDate_end={setAcidUsedEnd}
                    onClickPDF={() => downloadReport(pdfUrl || '')} 
                    onClickCSV={() => Forms4csv("Acid", acidUsedPlant, acidUsedUnit, acidUsedAgg, acidUsedPeriod, acidUsedStart, acidUsedEnd)}
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

