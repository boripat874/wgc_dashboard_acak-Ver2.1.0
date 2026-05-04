"use client"

import { format } from "date-fns";
import { useEffect, useState } from "react";
import SectionChoose from '@/components/sectionChoose';

import Forms2 from '@/components/reports/reportPdf/forms2'; // Received
import Forms2csv from '@/components/reports/reprotCSV/form2csv'; // Received
import { ReportFillOverview } from "@/components/Charts/report-fill-overview";
import { ReportTransferOverview } from "@/components/Charts/report-transfer-overview";
import { Suspense } from "react";
import { OverviewCardsSkeleton } from "../_components/skeleton";


interface Props {}

export default function Page(props: Props) {
    const {} = props

    // 2. Mixer
    const [acidMixUnit, setAcidMixUnit] = useState("--");
    const [acidMixAgg, setAcidMixAgg] = useState("--");
    const [acidMixPeriod, setAcidMixPeriod] = useState("--");
    const [acidMixStart, setAcidMixStart] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [acidMixEnd, setAcidMixEnd] = useState(format(new Date(), 'yyyy-MM-dd'));

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

                // Forms2(renderReport, "Acid", acidMixUnit, "3",  acidMixAgg, acidMixPeriod, acidMixStart, acidMixEnd)
                Forms2(renderReport, "Acid", "kg", "3", "perday", "1day", format(new Date(), 'yyyy-MM-dd'), format(new Date(), 'yyyy-MM-dd'))


            }, 1000); // ปิดหลังจาก 1 วินาที

            return () => clearTimeout(timer);
        }

        if (acidMixUnit !== "--" && acidMixAgg !== "--" && acidMixPeriod !== "--") {

            Forms2(renderReport, "Acid", acidMixUnit, "3",  acidMixAgg, acidMixPeriod, acidMixStart, acidMixEnd)
        }

    }, [acidMixUnit, acidMixAgg, acidMixPeriod, acidMixStart, acidMixEnd]);

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
                <h1>Acid Mixer Report</h1>

                <SectionChoose 
                    plantName="Acid" sectionName="Mixer" title="HCI Mixer"
                    unit={acidMixUnit} aggregation={acidMixAgg} period={acidMixPeriod} date_start={acidMixStart} date_end={acidMixEnd}
                    onChangeUnit={setAcidMixUnit} onChangeAggregation={setAcidMixAgg} onChangePeriod={setAcidMixPeriod} onChangeDate_start={setAcidMixStart} onChangeDate_end={setAcidMixEnd}
                    onClickPDF={() => downloadReport(pdfUrl || '')} 
                    onClickCSV={() => Forms2csv("Acid", acidMixUnit, acidMixAgg, acidMixPeriod, acidMixStart, acidMixEnd)}
                />
                {/* Add your report content here */}
            </div>

            <div className=" mt-3 grid xl:grid-cols-3 2xl:gap-7.5">

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

