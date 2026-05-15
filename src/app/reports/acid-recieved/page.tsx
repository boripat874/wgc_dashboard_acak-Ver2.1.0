"use client"

import { format } from "date-fns";
import { useEffect, useState } from "react";
import SectionChoose from '@/components/sectionChoose';

import Forms1 from '@/components/reports/reportPdf/forms1'; // Received
import Forms1csv from '@/components/reports/reprotCSV/form1csv'; // Received
import { ReportFillOverview } from "@/components/Charts/report-fill-overview";
import { ReportTransferOverview } from "@/components/Charts/report-transfer-overview";
import { Suspense } from "react";
import { OverviewCardsSkeleton } from "../_components/skeleton";


interface Props {}

export default function Page(props: Props) {
    const {} = props

    // 1. Received
    const [acidRecTank, setAcidRecTank] = useState("--");
    const [acidRecUnit, setAcidRecUnit] = useState("--");
    const [acidRecAgg, setAcidRecAgg] = useState("--");
    const [acidRecPeriod, setAcidRecPeriod] = useState("--");
    const [acidRecStart, setAcidRecStart] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [acidRecEnd, setAcidRecEnd] = useState(format(new Date(), 'yyyy-MM-dd'));

    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [reportOpen, setReportOpen] = useState(false);

    useEffect(() => {
    
        if (!reportOpen) {
            const timer = setTimeout(() => {

                // Forms1(renderReport, "Acid", acidRecUnit, acidRecTank, acidRecAgg, acidRecPeriod, acidRecStart, acidRecEnd)
                Forms1(renderReport, "Acid", "kg", "12", "perday", "1day", format(new Date(), 'yyyy-MM-dd'), format(new Date(), 'yyyy-MM-dd'))
                
            }, 1000); // ปิดหลังจาก 1 วินาที

            return () => clearTimeout(timer);
        }

        if (acidRecTank !== "--" && acidRecUnit !== "--" && acidRecAgg !== "--" && acidRecPeriod !== "--") {
            Forms1(renderReport, "Acid", acidRecUnit, acidRecTank, acidRecAgg, acidRecPeriod, acidRecStart, acidRecEnd)
        }

    }, [acidRecTank, acidRecUnit, acidRecAgg, acidRecPeriod, acidRecStart, acidRecEnd]);

    // Report Handlers
    const renderReport = (url: string) => {
        setPdfUrl(url);
        setReportOpen(true);
    };

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
                <h1>Acid Fill Report</h1>

                <SectionChoose 
                    plantName="Acid" sectionName="Received" title="Acid Fill"
                    tank={acidRecTank} unit={acidRecUnit} aggregation={acidRecAgg} period={acidRecPeriod} date_start={acidRecStart} date_end={acidRecEnd}
                    onChangeTank={setAcidRecTank} onChangeUnit={setAcidRecUnit} onChangeAggregation={setAcidRecAgg} onChangePeriod={setAcidRecPeriod} onChangeDate_start={setAcidRecStart} onChangeDate_end={setAcidRecEnd}
                    onClickPDF={() => downloadReport(pdfUrl || '')} 
                    onClickCSV={() => Forms1csv("Acid", acidRecUnit, acidRecTank, acidRecAgg, acidRecPeriod, acidRecStart, acidRecEnd)}
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

