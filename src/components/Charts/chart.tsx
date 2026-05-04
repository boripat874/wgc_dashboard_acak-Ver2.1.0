import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,LabelList, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import React, { useState } from 'react';

interface IF_ChartRecieve {
    Iitlename:string,
    key_value:string,
    Data:any[],
    ColorChart:string,
    bgColorChartContainer:string,
    ColorHeaderChart:string,
    chartColor:string
}

interface IF_ChartMix {
    Iitlename:string,
    key_value:string,
    Data:any[],
    ColorChart:string,
    bgColorChartContainer:string,
    ColorHeaderChart:string,
    chartColor1:string,
    chartColor2:string

}

interface IF_ChartPieUsed {
    Iitlename:string,
    key_value:string,
    Data:any[],
    ColorChart:string,
    bgColorChartContainer:string,
    ColorHeaderChart:string,
    chartColor:string
}

interface IF_ChartlineUsed {
    Iitlename:string,
    key_value:string,
    Data:any[],
    ColorChart:string,
    bgColorChartContainer:string,
    ColorHeaderChart:string,
    chartColor:string
}

export const ChartRecieve: React.FC<{ tank: IF_ChartRecieve }> = ({ tank }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

    const ChartContainer: React.FC<{ title: string; children: React.ReactNode; className?: string, chartClassName?: string }> = ({ 
        title, 
        children, 
        className = '' ,
        chartClassName = '' 
    }) => (
        <div className={`
            ${tank.bgColorChartContainer} rounded-[5px] flex flex-col gap-2 sm:gap-3 lg:gap-4 justify-start items-start w-full 
            ${className}
            ${isFullscreen ? 'fixed inset-0 z-[9999] h-screen w-screen p-4' : 'relative'} 
        `}>
            <div className="flex justify-between items-center w-full p-2">
                <h3 className={`text-sm sm:text-sm font-inter font-bold leading-5 sm:leading-6 text-left ${tank.ColorHeaderChart} ml-2 sm:ml-3`}>
                    {title}
                </h3>
                
                {/* ปุ่ม Icon สำหรับ Fullscreen / Exit */}
                <button
                    onClick={toggleFullscreen}
                    className={`p-2 rounded-full hover:bg-gray-300 transition-colors ${tank.ColorHeaderChart}`}
                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                    {isFullscreen ? (
                        // Icon สำหรับตอนกด "ย่อหน้าจอ" (Minimize)
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                        </svg>
                    ) : (
                        // Icon สำหรับตอนกด "ขยายหน้าจอ" (Maximize)
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                        </svg>
                    )}
                </button>
            </div>

            <div className={`
                ${chartClassName != '' ? chartClassName : 'w-full h-[180px] p-2'}
                ${isFullscreen ? '!h-[calc(100vh-100px)]' : ''} 
            `}>
                {children}
            </div>
        </div>
    );

    return (
        <div>
            <ChartContainer title={tank.Iitlename}>
                {tank.Data && (tank.Data as any[]).length > 0 ? (
                    <ResponsiveContainer className={'w-full h-full'}>
                            <BarChart data={tank.Data}>

                                <CartesianGrid strokeDasharray="3 3" stroke="#444" />

                                <XAxis dataKey="name" stroke={tank.ColorChart} fontSize={12} />

                                <YAxis stroke={tank.ColorChart} fontSize={12} 
                                tickFormatter={(value) => 
                                    new Intl.NumberFormat('en-US', {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0,
                                    }).format(value)
                                } />

                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '5px' }}
                                    labelStyle={{ color: '#fff' }}
                                    formatter={(value: any) => {
                                        const numValue = Number(value);
                                        if (isNaN(numValue)) return [value, tank.key_value];

                                        const formattedValue = new Intl.NumberFormat('en-US', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        }).format(numValue);
                                        
                                        return [formattedValue, tank.key_value];
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="value" fill={`${tank.chartColor}`} name={tank.key_value} >
                                    {/* <LabelList dataKey="value" position="top" /> */}
                                </Bar>
                            </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className={`w-full h-full flex justify-center items-center text-2xl text-center  ${tank.ColorHeaderChart}`}>
                        No data

                    </div>
                )}
            </ChartContainer>
            
            {/* Overlay สีดำจางๆ เมื่อกดเต็มจอ เพื่อป้องกันการกดปุ่มด้านหลัง */}
            {isFullscreen && <div className="fixed inset-0 bg-black/50 z-999" onClick={toggleFullscreen}></div>}
        </div>
    );
};

export const ChartMix: React.FC<{ tank: IF_ChartMix }> = ({ tank }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

    const ChartContainer: React.FC<{ title: string; children: React.ReactNode; className?: string, chartClassName?: string }> = ({ 
        title, 
        children, 
        className = '' ,
        chartClassName = '' 
    }) => (
        <div className={`
            ${tank.bgColorChartContainer} rounded-[5px] flex flex-col gap-2 sm:gap-3 lg:gap-4 justify-start items-start w-full 
            ${className}
            ${isFullscreen ? 'fixed inset-0 z-[9999] h-screen w-screen p-4' : 'relative'} 
        `}>
            <div className="flex justify-between items-center w-full p-2">
                <h3 className={`text-sm sm:text-sm font-inter font-bold leading-5 sm:leading-6 text-left ${tank.ColorHeaderChart} ml-2 sm:ml-3`}>
                    {title}
                </h3>
                
                {/* ปุ่ม Icon สำหรับ Fullscreen / Exit */}
                <button
                    onClick={toggleFullscreen}
                    className={`p-2 rounded-full hover:bg-gray-300 transition-colors ${tank.ColorHeaderChart}`}
                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                    {isFullscreen ? (
                        // Icon สำหรับตอนกด "ย่อหน้าจอ" (Minimize)
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                        </svg>
                    ) : (
                        // Icon สำหรับตอนกด "ขยายหน้าจอ" (Maximize)
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                        </svg>
                    )}
                </button>
            </div>

            <div className={`
                ${chartClassName != '' ? chartClassName : 'w-full h-[180px] p-2'}
                ${isFullscreen ? '!h-[calc(100vh-100px)]' : ''} 
            `}>
                {children}
            </div>
        </div>
    );

    return (
        <div>
            <ChartContainer title={tank.Iitlename} className='h-full'
                chartClassName='w-full h-[340px] p-2 sm:p-4'>
    
                {tank.Data && tank.Data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={tank.Data} >
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="name" stroke={tank.ColorChart} fontSize={12} />
                            <YAxis stroke={tank.ColorChart} fontSize={12} 
                                tickFormatter={(value) => 
                                new Intl.NumberFormat('en-US', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                                }).format(value)
                            }/>
                            <Tooltip
                                wrapperStyle={{ zIndex: 10000 }}
                                contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '5px' }}
                                labelStyle={{ color: '#fff' }}
                                trigger="hover" 
                                shared={true}
                                formatter={(value: any, name: any) => {
                                    const numValue = Number(value);
                                    if (isNaN(numValue)) return [value, name];

                                    const formattedValue = numValue.toLocaleString('en-US', {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0,
                                    });
                                    
                                    // คืนค่าแบบ 2 ตำแหน่งใน Array: [Value, Name]
                                    return [formattedValue, name]; 
                                }}
                        
                            
                            />
                            <Legend />
                            <Bar dataKey="main_volume" fill={`${tank.chartColor1}`}  name={tank.key_value} >
                            {/* <LabelList dataKey="main_volume" position="top" /> */}
                            </Bar>
                            <Bar dataKey="ro_volume" fill={`${tank.chartColor2}`}  name="RO" >
                            {/* <LabelList dataKey="ro" position="top" /> */}
                            </Bar>

                        </BarChart>
                     </ResponsiveContainer>  
                ) : (
                <div className={`flex justify-center items-center w-full h-full ${tank.ColorHeaderChart} text-2xl`}>
                    No data
                </div>
                )}
                </ChartContainer>
            
            {/* Overlay สีดำจางๆ เมื่อกดเต็มจอ เพื่อป้องกันการกดปุ่มด้านหลัง */}
            {isFullscreen && <div className="fixed inset-0 bg-black/50 z-[9990]" onClick={toggleFullscreen}></div>}
        </div>
    );
};

export const ChartPieUsed: React.FC<{ tank: IF_ChartPieUsed }> = ({ tank }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    // console.log("Pie data >> ",tank)

    const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

    const ChartContainer: React.FC<{ title: string; children: React.ReactNode; className?: string, chartClassName?: string }> = ({ 
        title, 
        children, 
        className = '' ,
        chartClassName = '' 
    }) => (
        <div className={`
            ${tank.bgColorChartContainer} rounded-[5px] flex flex-col gap-2 sm:gap-3 lg:gap-4 justify-start items-start w-full 
            ${className}
            ${isFullscreen ? 'fixed inset-0 z-[9999] h-screen w-screen p-4' : 'relative'} 
        `}>
            <div className="flex justify-between items-center w-full p-2">
                <h3 className={`text-sm sm:text-sm font-inter font-bold leading-5 sm:leading-6 text-left ${tank.ColorHeaderChart} ml-2 sm:ml-3`}>
                    {title}
                </h3>
                
                {/* ปุ่ม Icon สำหรับ Fullscreen / Exit */}
                <button
                    onClick={toggleFullscreen}
                    className={`p-2 rounded-full hover:bg-gray-300 transition-colors ${tank.ColorHeaderChart}`}
                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                    {isFullscreen ? (
                        // Icon สำหรับตอนกด "ย่อหน้าจอ" (Minimize)
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                        </svg>
                    ) : (
                        // Icon สำหรับตอนกด "ขยายหน้าจอ" (Maximize)
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                        </svg>
                    )}
                </button>
            </div>

            <div className={`
                ${chartClassName != '' ? chartClassName : 'w-full h-full p-2'}
                ${isFullscreen ? '!h-[calc(100vh-100px)]' : ''} 
            `}>
                {children}
            </div>
        </div>
    );

    return (

        <div>
            <ChartContainer title={tank.Iitlename} className='h-full'
                chartClassName='w-full h-[340px] p-2'>

                {tank.Data && tank.Data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        
                        <PieChart>
                        <Pie
                            data={tank.Data}
                            cx="50%"
                            cy="40%"
                            // innerRadius={60}
                            outerRadius="50%"
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value.toFixed(2)}%`}
                        >
                            {tank.Data.map((entry, index) => (
                            <Cell key={`data-cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        
                        <Tooltip 
                            // contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '5px' ,color: '#fff'}}
                            labelStyle={{ color: '#fff', fontSize: '12px' , fontWeight: '600'} }
                            formatter={(value: any, name: any) => {
                                // ตรวจสอบก่อนว่า value เป็นตัวเลขหรือไม่ เพื่อป้องกัน runtime error
                                const numValue = Number(value);
                                if (isNaN(numValue)) return [value];

                                const formattedValue = numValue.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                                });
                                
                                return [`${name} ${formattedValue}%`]; 
                            }}
                            
                        /> 
                        <Legend layout="horizontal" verticalAlign="top" align="center"/>
                        </PieChart>
                    </ResponsiveContainer>  
                ) : (
                    <div className={`flex justify-center items-center w-full h-full ${tank.ColorHeaderChart} text-2xl`}>
                        No data
                    </div>
                )}
            </ChartContainer>
            
            {/* Overlay สีดำจางๆ เมื่อกดเต็มจอ เพื่อป้องกันการกดปุ่มด้านหลัง */}
            {isFullscreen && <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={toggleFullscreen}></div>}
        </div>
    );
};

export const ChartlineUsed: React.FC<{ tank: IF_ChartlineUsed }> = ({ tank }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

    const ChartContainer: React.FC<{ title: string; children: React.ReactNode; className?: string, chartClassName?: string }> = ({ 
        title, 
        children, 
        className = '' ,
        chartClassName = '' 
    }) => (
        <div className={`
            ${tank.bgColorChartContainer} rounded-[5px] flex flex-col justify-start items-start w-full h-[200px]
            ${className}
            ${isFullscreen ? 'fixed inset-0 z-[9999] h-screen w-screen' : 'relative'} 
        `}>
            <div className="flex justify-between items-center w-full p-2">

                <h3 className={`text-sm sm:text-sm font-inter font-bold leading-5 sm:leading-6 text-left ${tank.ColorHeaderChart} ml-2 `}>
                    {title}
                </h3>
                
                {/* ปุ่ม Icon สำหรับ Fullscreen / Exit */}
                <button
                    onClick={toggleFullscreen}
                    className={`p-2 rounded-full hover:bg-gray-300 transition-colors ${tank.ColorHeaderChart}`}
                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                    {isFullscreen ? (
                        // Icon สำหรับตอนกด "ย่อหน้าจอ" (Minimize)
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                        </svg>
                    ) : (
                        // Icon สำหรับตอนกด "ขยายหน้าจอ" (Maximize)
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                        </svg>
                    )}
                </button>
            </div>

            <div className={`
                ${chartClassName != '' ? chartClassName : 'w-full h-full p-2'}
                ${isFullscreen ? '!h-[calc(100vh-100px)]' : ''} 
            `}>
                {children}
            </div>
        </div>
    );

    return (

        < >
            
            <ChartContainer title={tank.Iitlename}>
                {tank.Data && tank.Data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={tank.Data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="name" stroke={tank.ColorChart} fontSize={12} />
                        <YAxis stroke={tank.ColorChart} fontSize={12} 
                        tickFormatter={(value) => 
                            new Intl.NumberFormat('en-US', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                            }).format(value)
                        }/>
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '5px' }}
                            labelStyle={{ color: '#fff' }}
                            formatter={(value: any, name: any) => {
                                // ตรวจสอบก่อนว่า value เป็นตัวเลขหรือไม่ เพื่อป้องกัน runtime error
                                const numValue = Number(value);
                                if (isNaN(numValue)) return [value];

                                const formattedValue = numValue.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                                });
                                
                                return [`${name} ${formattedValue}`]; 
                            }}
                            
                        />
                        <Line type="monotone" dataKey="value" stroke={`${tank.chartColor}`} strokeWidth={2} name={tank.key_value} />
                        </LineChart>
                    
                    </ResponsiveContainer>
                ) : (
                    <div className={`flex justify-center items-center w-full h-full ${tank.ColorHeaderChart} text-2xl`}>
                    No data
                    </div>
                )}
            </ChartContainer>
            
            {/* Overlay สีดำจางๆ เมื่อกดเต็มจอ เพื่อป้องกันการกดปุ่มด้านหลัง */}
            {isFullscreen && <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={toggleFullscreen}></div>}
        </>
    );
};