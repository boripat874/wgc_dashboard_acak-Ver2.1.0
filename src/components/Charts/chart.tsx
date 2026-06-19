import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import React, { useEffect, useState } from 'react';

// === Interfaces ===
interface IF_ChartRecieve {
    Iitlename: string;
    key_value: string;
    Data: any[];
    ColorChart: string;
    bgColorChartContainer: string;
    ColorHeaderChart: string;
    chartColor: string;
}

interface IF_ChartMix {
    Iitlename: string;
    subTitle: string;
    key_value: string;
    Data: any[];
    ColorChart: string;
    bgColorChartContainer: string;
    ColorHeaderChart: string;
    chartColor1: string;
    chartColor2: string;
}

interface IF_ChartPieUsed {
    Iitlename: string;
    subTitle: string;
    key_value: string;
    Data: any[];
    ColorChart: string;
    bgColorChartContainer: string;
    ColorHeaderChart: string;
    chartColor: string;
}

interface IF_ChartlineUsed {
    Iitlename: string;
    subTitle: string;
    key_value: string;
    Data: any[];
    ColorChart: string;
    bgColorChartContainer: string;
    ColorHeaderChart: string;
    chartColor: string;
}

// === Custom Hooks ===
export const useDarkMode = () => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        setIsDark(document.documentElement.classList.contains('dark'));

        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'));
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => observer.disconnect();
    }, []);

    return isDark;
};

// === Shared Chart Container Component ===
interface ChartContainerProps {
    title: string;
    subTitle?: string;
    bgColor: string;
    headerColor: string;
    className?: string;
    chartClassName?: string;
    children: React.ReactNode;
}

const ChartContainer: React.FC<ChartContainerProps> = ({
    title,
    subTitle,
    bgColor,
    headerColor,
    className = '',
    chartClassName = '',
    children
}) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

    return (
        <div>
            <div className={`
                ${bgColor} rounded-[5px] flex flex-col gap-2 sm:gap-3 lg:gap-4 justify-start items-start w-full 
                ${className}
                ${isFullscreen ? 'fixed inset-0 z-[9999] h-screen w-screen p-4' : 'relative'} 
            `}>
                <div className="flex justify-between items-center w-full p-2">
                    <h3 className={`text-sm sm:text-sm font-inter font-bold leading-5 sm:leading-6 text-left ${headerColor} ml-2 sm:ml-3`}>
                        {title} {subTitle && <span className='text-sm font-normal'>{subTitle}</span>}
                    </h3>
                    
                    <button
                        onClick={toggleFullscreen}
                        className={`p-2 rounded-full hover:bg-gray-300 transition-colors ${headerColor}`}
                        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    >
                        {isFullscreen ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                            </svg>
                        )}
                    </button>
                </div>

                <div className={`
                    ${chartClassName !== '' ? chartClassName : 'w-full h-[180px] p-2'}
                    ${isFullscreen ? '!h-[calc(100vh-100px)]' : ''} 
                `}>
                    {children}
                </div>
            </div>
            {/* แก้ไข z-index ตรงนี้ให้ถูกต้องสำหรับกรณี fullscreen */}
            {isFullscreen && <div className="fixed inset-0 bg-black/50 z-[9990]" onClick={toggleFullscreen}></div>}
        </div>
    );
};

// === Exported Components ===

export const ChartRecieve: React.FC<{ tank: IF_ChartRecieve }> = ({ tank }) => {
    const isDarkMode = useDarkMode();
    const colorChart = isDarkMode ? '#F1F5F9' : '#000000';

    return (
        <ChartContainer title={tank.Iitlename} bgColor={tank.bgColorChartContainer} headerColor={tank.ColorHeaderChart}>
            {tank.Data && tank.Data.length > 0 ? (
                <ResponsiveContainer className='w-full h-full'>
                    <BarChart data={tank.Data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="name" fontSize={12} tick={{ fill: colorChart }} axisLine={{ stroke: "#fff", opacity: 0.5 }} />
                        <YAxis 
                            fontSize={12} 
                            tick={{ fill: colorChart }} 
                            axisLine={{ stroke: tank.ColorHeaderChart, opacity: 0.5 }}
                            tickFormatter={(value) => new Intl.NumberFormat('en-US').format(value)} 
                        />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '5px' }}
                            labelStyle={{ color: '#fff' }}
                            formatter={(value: any) => {
                                const numValue = Number(value);
                                if (isNaN(numValue)) return [value, tank.key_value];
                                return [new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numValue), tank.key_value];
                            }}
                        />
                        <Legend />
                        <Bar dataKey="value" fill={tank.chartColor} name={tank.key_value} />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className={`w-full h-full flex justify-center items-center text-2xl text-center ${tank.ColorHeaderChart}`}>No data</div>
            )}
        </ChartContainer>
    );
};

export const ChartMix: React.FC<{ tank: IF_ChartMix }> = ({ tank }) => {
    const isDarkMode = useDarkMode();
    const colorChart = isDarkMode ? '#F1F5F9' : '#000000';

    return (
        <ChartContainer title={tank.Iitlename} subTitle={tank.subTitle} bgColor={tank.bgColorChartContainer} headerColor={tank.ColorHeaderChart} className='h-full' chartClassName='w-full h-[340px] p-2 sm:p-4'>
            {tank.Data && tank.Data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tank.Data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="name" stroke={colorChart} fontSize={12} />
                        <YAxis stroke={colorChart} fontSize={12} tickFormatter={(value) => new Intl.NumberFormat('en-US').format(value)} />
                        <Tooltip
                            wrapperStyle={{ zIndex: 10000 }}
                            contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '5px' }}
                            labelStyle={{ color: '#fff' }}
                            shared={true}
                            formatter={(value: any, name: any) => {
                                const numValue = Number(value);
                                if (isNaN(numValue)) return [value, name];
                                return [numValue.toLocaleString('en-US'), name];
                            }}
                        />
                        <Legend />
                        <Bar dataKey="main_volume" fill={tank.chartColor1} name={tank.key_value} />
                        <Bar dataKey="ro_volume" fill={tank.chartColor2} name="RO" />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className={`flex justify-center items-center w-full h-full ${tank.ColorHeaderChart} text-2xl`}>No data</div>
            )}
        </ChartContainer>
    );
};

export const CharttankMix: React.FC<{ tank: IF_ChartMix }> = ({ tank }) => {
    const isDarkMode = useDarkMode();
    const colorChart = isDarkMode ? '#F1F5F9' : '#000000';

    return (
        <ChartContainer title={tank.Iitlename} bgColor={tank.bgColorChartContainer} headerColor={tank.ColorHeaderChart} className='h-full' chartClassName='w-full h-[340px] p-2 sm:p-4'>
            {tank.Data && tank.Data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tank.Data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="name" stroke={colorChart} fontSize={12} />
                        <YAxis stroke={colorChart} fontSize={12} tickFormatter={(value) => new Intl.NumberFormat('en-US').format(value)} />
                        <Tooltip
                            wrapperStyle={{ zIndex: 10000 }}
                            contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '5px' }}
                            labelStyle={{ color: '#fff' }}
                            shared={true}
                            formatter={(value: any, name: any) => {
                                const numValue = Number(value);
                                if (isNaN(numValue)) return [value, name];
                                return [numValue.toLocaleString('en-US'), name];
                            }}
                        />
                        <Legend />
                        <Bar dataKey="data_remaining_tank_Mix" fill={tank.chartColor1} name={tank.key_value} />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className={`flex justify-center items-center w-full h-full ${tank.ColorHeaderChart} text-2xl`}>No data</div>
            )}
        </ChartContainer>
    );
};

export const CharttankStore: React.FC<{ tank: IF_ChartMix }> = ({ tank }) => {
    const isDarkMode = useDarkMode();
    const colorChart = isDarkMode ? '#F1F5F9' : '#000000';

    return (
        <ChartContainer title={tank.Iitlename} bgColor={tank.bgColorChartContainer} headerColor={tank.ColorHeaderChart} className='h-full' chartClassName='w-full h-[340px] p-2 sm:p-4'>
            {tank.Data && tank.Data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tank.Data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="name" stroke={colorChart} fontSize={12} />
                        <YAxis stroke={colorChart} fontSize={12} tickFormatter={(value) => new Intl.NumberFormat('en-US').format(value)} />
                        <Tooltip
                            wrapperStyle={{ zIndex: 10000 }}
                            contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '5px' }}
                            labelStyle={{ color: '#fff' }}
                            shared={true}
                            formatter={(value: any, name: any) => {
                                const numValue = Number(value);
                                if (isNaN(numValue)) return [value, name];
                                return [numValue.toLocaleString('en-US'), name];
                            }}
                        />
                        <Legend />
                        <Bar dataKey="data_remaining_tank_Store" fill={tank.chartColor1} name={tank.key_value} />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className={`flex justify-center items-center w-full h-full ${tank.ColorHeaderChart} text-2xl`}>No data</div>
            )}
        </ChartContainer>
    );
};

export const ChartPieUsed: React.FC<{ tank: IF_ChartPieUsed }> = ({ tank }) => {
    return (
        <ChartContainer title={tank.Iitlename} subTitle={tank.subTitle} bgColor={tank.bgColorChartContainer} headerColor={tank.ColorHeaderChart} className='h-full' chartClassName='w-full h-[340px] p-2'>
            {tank.Data && tank.Data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={tank.Data} cx="50%" cy="40%" outerRadius="50%" dataKey="value" label={({ name, value }) => `${name}: ${value.toFixed(2)}%`}>
                            {tank.Data.map((entry, index) => (
                                <Cell key={`data-cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip 
                            labelStyle={{ color: '#fff', fontSize: '12px' , fontWeight: '600'}}
                            formatter={(value: any, name: any) => {
                                const numValue = Number(value);
                                if (isNaN(numValue)) return [value];
                                return [`${name} ${numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`]; 
                            }}
                        /> 
                        <Legend layout="horizontal" verticalAlign="top" align="center"/>
                    </PieChart>
                </ResponsiveContainer>  
            ) : (
                <div className={`flex justify-center items-center w-full h-full ${tank.ColorHeaderChart} text-2xl`}>No data</div>
            )}
        </ChartContainer>
    );
};

export const ChartlineUsed: React.FC<{ tank: IF_ChartlineUsed }> = ({ tank }) => {
    const isDarkMode = useDarkMode();
    const colorChart = isDarkMode ? '#F1F5F9' : '#000000';

    return (
        <ChartContainer title={tank.Iitlename} subTitle={tank.subTitle} bgColor={tank.bgColorChartContainer} headerColor={tank.ColorHeaderChart} className="h-[200px]">
            {tank.Data && tank.Data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tank.Data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="name" stroke={colorChart} fontSize={12} />
                        <YAxis stroke={colorChart} fontSize={12} tickFormatter={(value) => new Intl.NumberFormat('en-US').format(value)} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '5px' }}
                            labelStyle={{ color: '#fff' }}
                            formatter={(value: any, name: any) => {
                                const numValue = Number(value);
                                if (isNaN(numValue)) return [value];
                                return [`${name} ${numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]; 
                            }}
                        />
                        <Line type="monotone" dataKey="value" stroke={tank.chartColor} strokeWidth={2} name={tank.key_value} />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <div className={`flex justify-center items-center w-full h-full ${tank.ColorHeaderChart} text-2xl`}>No data</div>
            )}
        </ChartContainer>
    );
};