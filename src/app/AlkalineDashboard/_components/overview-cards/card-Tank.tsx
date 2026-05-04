import {LiquidGauge} from "./LiquidGaugeClient";

interface TankCardData {
  title: string;
  subtitle?: string;
  func?: string;
  bgColor: string;
  textColor: string;
  value_kg: string;
  value_m3: string;
  value_mm?: string;
}

interface MotorCardData {
  title: string;
  subtitle?: string;
  value: string;
  bgColor: string;
  textColor: string;
  request?: string;
  pv_L?: string;
  SP_total?: string;
  PV_total?: string;
  Timer_SP?: string;
  Timer_PV?: string;
}

interface ModeCardData {
  title: string;
  value: string;
  bgColor: string;
  textColor: string;
}
 
export const TankCard: React.FC<{ tank: TankCardData }> = ({ tank }) => (
    <div className={`${tank.bgColor} card_realtime_tank`}>

      <div className="flex flex-col">

        <div className="mb-2">

          <p className={`card_realtime_text_title ${tank.textColor}`}>
              {tank.title}
          </p>

          {/* <p className={`card_realtime_text_subtitle ${tank.textColor}`}>
            {tank.subtitle}
          </p> */}
        </div>

        <div className='flex flex-col justify-end items-end'>
          <div className='flex flex-row'>

              <p className={`card_realtime_value_tank ${tank.textColor}`}> {Number(tank.value_kg).toLocaleString('en-US', {minimumFractionDigits: 2,maximumFractionDigits: 2})} </p>
              <p className={`w-10 pl-3 text-start ${tank.textColor}`}>kg</p>

          </div>

          <div className='flex flex-row '>

              <p className={`card_realtime_value_tank ${tank.textColor}`}> {Number(tank.value_m3).toLocaleString('en-US', {minimumFractionDigits: 2,maximumFractionDigits: 2})} </p>
              <p className={`w-10 pl-3 text-start ${tank.textColor}`}>m³</p>

          </div>
          {tank.value_mm && (
            <div className='flex flex-row '>

                <p className={`card_realtime_value_tank ${tank.textColor}`}> {Number(tank.value_mm).toLocaleString('en-US', {minimumFractionDigits: 2,maximumFractionDigits: 2})} </p>
                <p className={`w-10 pl-3 text-start ${tank.textColor}`}>mm</p>

            </div>
          )}
        </div>

      </div>


      {tank.value_mm && (
        <div className="ml-3 pt-3">
          <LiquidGauge
            value={Number(tank.value_mm) / 38}
            // className="w-[50px] h-[200px]"
            height={100}
            width={25}
            fillColor="#178BCA"
            showLabel={false}
          />
        </div>
      )}
    </div>
  );

export const TankCardSummary: React.FC<{ tank: TankCardData }> = ({ tank }) => (
  <div className={`${tank.bgColor} card_realtime_tank`}>
      
      <div className="flex flex-col">

        <div>

          <p className={`${tank.textColor} text-xs sm:text-sm font-inter font-bold leading-5 sm:leading-6 text-center `}>
            {tank.title}
          </p>

          {/* <p className={` ${tank.textColor} text-[10px] sm:text-sm pb-2 font-inter font-bold text-center`}>
            {tank.subtitle}
          </p> */}

          <p className={` ${tank.textColor} text-[14px] sm:text-sm pb-2 font-inter font-bold text-center`}>
            {tank.func}
          </p>

        </div>

        <div className='flex flex-col justify-end items-end gap-y-1 pr-9'>

          <div className='flex flex-row'>

              <p className={` ${tank.textColor} w-[100px] text-2xl sm:text-base pr-2 font-inter font-normal leading-8 sm:leading-4 lg:leading-[25px] text-end`}> {Number(tank.value_kg).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} </p>
              <p className={`w-10 pl-3 text-start ${tank.textColor}`}>kg</p>

          </div>

          <div className='flex flex-row '>

              <p className={` ${tank.textColor} w-[100px] text-2xl sm:text-base pr-2 font-inter font-normal leading-8 sm:leading-4 lg:leading-[25px] text-end`}> {Number(tank.value_m3).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} </p>
              <p className={`w-10 pl-3 text-start ${tank.textColor}`}>m³</p>

          </div>

        </div>

      </div>

  </div>
);

export const MotorCard: React.FC<{ motor: MotorCardData }> = ({ motor }) => (
    <div className={`${motor.bgColor} card_realtime`}>
      <div>
        <h3 className={`card_realtime_text_title ${motor.textColor}`}>
          {motor.title}
        </h3>
        <div className={`card_realtime_text_subtitle ${motor.textColor}`}>
          {motor.subtitle}
        </div>
      </div>
      <p className={`card_realtime_value ${motor.value !== 'Not Ready' ? 'text-green-500' : 'text-red-500'}`}>
      {/* <p className={`card_realtime_value text-global-3`}> */}

        {motor.value}
      </p>
      

      <div className='flex flex-col justify-end items-end'>
        <div className='flex flex-row'>

            <p className={`w-10 text-start ${motor.textColor}`}>PV</p>
            <p className={`card_realtime_value_tank ${motor.textColor}`}> {Number(motor.pv_L).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} </p>
            <p className={`w-10 text-start ${motor.textColor}`}>L</p>

        </div>

        <div className='flex flex-row '>

            <p className={`w-10 text-start ${motor.textColor}`}>SV</p>
            <p className={`card_realtime_value_tank ${motor.textColor}`}> {Number(motor.SP_total).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} </p>
            <p className={`w-10 text-start ${motor.textColor}`}>Total</p>

        </div>
        {/* {motor.PV_total && ( */}
          <div className='flex flex-row '>

              <p className={`w-10 text-start ${motor.textColor}`}>PV</p>
              <p className={`card_realtime_value_tank ${motor.textColor}`}> {Number(motor.PV_total).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} </p>
              <p className={`w-10 text-start ${motor.textColor}`}>Total</p>

          </div>
        {/* )} */}
      </div>

      <p className={`text-sm pt-1 ${motor.textColor}`}>Timer Transfer</p>

      <div className='flex flex-row '>

          <p className={`w-10 text-start ${motor.textColor}`}>SP</p>
          <p className={`card_realtime_value_tank ${motor.textColor}`}> {Number(motor.Timer_SP).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} </p>
          <p className={`w-10 text-start ${motor.textColor}`}>Min</p>

      </div>

      <div className='flex flex-col justify-end items-end'>
        <div className='flex flex-row'>

            <p className={`w-10 text-start ${motor.textColor}`}>PV</p>
            <p className={`card_realtime_value_tank ${motor.textColor}`}> {Number(motor.Timer_PV).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} </p>
            <p className={`w-10 text-start ${motor.textColor}`}>Min</p>

        </div>
      </div>
        {(motor.request == 'request') && 

        <div className='text-2xl font-bold py-4 text-green-600'>
          {motor.request}
        </div>
        }
    </div>
);

