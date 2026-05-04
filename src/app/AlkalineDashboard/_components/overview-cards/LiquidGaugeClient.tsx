import React from 'react';
import dynamic from 'next/dynamic';
// import { color } from 'd3-color';
// import { interpolateRgb } from 'd3-interpolate';

// // Use the interface from your .d.ts file
// import { LiquidFillGaugeProps } from 'react-liquid-gauge';

// // Dynamically import the LiquidFillGauge component with ssr: false
// // This will check for both named and default exports
// const LiquidFillGauge = dynamic<LiquidFillGaugeProps>(
//   () => import('react-liquid-gauge').then((mod) => mod.LiquidFillGauge || mod.default),
//   {
//     ssr: false,
//   }
// );

// // The rest of your wrapper component code
// interface LiquidGaugeWrapperProps extends Omit<LiquidFillGaugeProps, 'value'> {
//   value: number;
// }

// const LiquidGauge: React.FC<LiquidGaugeWrapperProps> = ({ value, ...props }) => {

//   const startColor = '#6495ed'; // cornflowerblue
//   const endColor = '#6495ed'; // crimson

//   const state = {
//     value: 50
//   };

//   const width = props.width || 250;
//   const height = props.height || 250;

//   const interpolate = interpolateRgb(startColor, endColor);
//   const fillColor = interpolate(state.value / 100);

//   return (
//     <LiquidFillGauge
    
//       style={{ margin: '0 auto' }}
//       width={width}
//       height={height}
//       value={value}
//       percent="%"
//       textSize={0}
//       riseAnimation
//       waveAnimation
//       waveFrequency={2}
//       waveAmplitude={1}
//       gradient
//       {...props}
//       circleStyle={{
//           fill: fillColor
//       }}
//       waveStyle={{
//           fill: fillColor
//       }}
//       textStyle={{
//           fill: color('#fff')?.toString(),
//           fontFamily: 'Arial'
//       }}
//       waveTextStyle={{
//           fill: color('#fff')?.toString(),
//           fontFamily: 'Arial'
//       }}
//     />
//   );
// };



interface RectangularGaugeProps {
  /** ค่าปัจจุบันของมาตรวัด (0 - 100) */
  value: number;
  /** ความสูงรวมของมาตรวัด */
  height: number;
  /** ความกว้างรวมของมาตรวัด */
  width?: number;
  /** สีของแถบที่เติมเต็ม */
  fillColor?: string;
  /** สีของกรอบมาตรวัด */
  borderColor?: string;
  /** แสดงตัวเลขเปอร์เซ็นต์กำกับหรือไม่ */
  showLabel?: boolean;
  className?: string;
}

export const LiquidGauge: React.FC<RectangularGaugeProps> = ({ 
  value,
  height = 300, // กำหนดความสูงเริ่มต้นสำหรับมาตรวัดแนวตั้ง
  width = 50,
  fillColor = '#178BCA',
  borderColor = '#ccc',
  showLabel = true,
}) => {
    const clampedValue = Math.min(100, Math.max(0, value));
  const fillPercentage = `${clampedValue}%`;

  return (
    <div
      // สไตล์ภายนอก: กำหนดขนาด, กรอบ, และทำให้เป็น Container หลักแบบ Relative
      className="rounded-sm overflow-hidden relative mx-auto" // mx-auto ใช้จัดให้อยู่กลาง
      style={{
        width: width,
        height: height,
        border: `2px solid ${borderColor}`,
        backgroundColor: '#f0f0f0', 
      }}
    >
      {/* แถบสีเติมเต็ม (Fill Bar) */}
      <div
        style={{
          // *** ส่วนสำคัญ: ควบคุมความสูง (Height) ตามค่า Value ***
          width: '100%', 
          height: fillPercentage,
          backgroundColor: fillColor,
          transition: 'height 0.8s ease-out',
          
          // *** ส่วนสำคัญที่ 2: ตั้งค่าให้อยู่ที่ขอบล่าง (Bottom: 0) ***
          position: 'absolute',
          bottom: 0, 
        }}
      />

      {/* Label ตัวเลขแสดงค่าเปอร์เซ็นต์ */}
      {showLabel && (
        <div
          // ใช้ Tailwind ในการจัดตำแหน่งและสไตล์ข้อความ
          className="absolute inset-0 flex items-center justify-center font-bold text-lg pointer-events-none"
          style={{
            // ปรับสีข้อความตามความสว่างของพื้นหลังที่ถูกเติม
            color: clampedValue > 50 ? 'white' : 'black', 
            textShadow: clampedValue > 50 ? '0 0 3px rgba(0,0,0,0.5)' : 'none',
          }}
        >
          {clampedValue}%
        </div>
      )}
    </div>
  );
};