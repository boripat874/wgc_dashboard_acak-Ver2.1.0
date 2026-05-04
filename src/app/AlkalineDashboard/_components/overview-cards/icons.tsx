import type { SVGProps } from "react";

type SVGPropsType = SVGProps<SVGSVGElement>;

export function Views(props: SVGPropsType) {
  return (
    <svg width={58} height={58} viewBox="0 0 58 58" fill="none" {...props}>
      <circle cx={29} cy={29} r={29} fill="#3FD97F" />
      <path
        d="M26.562 29a2.437 2.437 0 114.875 0 2.437 2.437 0 01-4.875 0z"
        fill="#fff"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18.166 29c0 1.776.46 2.374 1.382 3.57 1.838 2.389 4.922 5.097 9.452 5.097s7.614-2.708 9.452-5.096c.92-1.197 1.381-1.795 1.381-3.57 0-1.777-.46-2.375-1.381-3.571-1.838-2.389-4.922-5.096-9.452-5.096s-7.614 2.707-9.452 5.096c-.921 1.196-1.381 1.794-1.381 3.57zM29 24.938a4.063 4.063 0 100 8.125 4.063 4.063 0 000-8.125z"
        fill="#fff"
      />
    </svg>
  );
}

export function Profit(props: SVGPropsType) {
  return (
    <svg width={58} height={58} viewBox="0 0 58 58" fill="none" {...props}>
      <circle cx={29} cy={29} r={29} fill="#FF9C55" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M29 39.833c5.983 0 10.833-4.85 10.833-10.833 0-5.983-4.85-10.834-10.833-10.834-5.983 0-10.834 4.85-10.834 10.834 0 5.983 4.85 10.833 10.834 10.833zm.812-17.333a.812.812 0 10-1.625 0v.343c-1.766.316-3.25 1.643-3.25 3.448 0 2.077 1.964 3.521 4.063 3.521 1.491 0 2.437.982 2.437 1.896 0 .915-.946 1.896-2.437 1.896-1.491 0-2.438-.981-2.438-1.896a.812.812 0 10-1.625 0c0 1.805 1.484 3.132 3.25 3.449v.343a.812.812 0 101.625 0v-.343c1.767-.317 3.25-1.644 3.25-3.449 0-2.077-1.963-3.52-4.062-3.52-1.491 0-2.438-.982-2.438-1.896 0-.915.947-1.896 2.438-1.896s2.437.98 2.437 1.895a.813.813 0 001.625 0c0-1.805-1.483-3.132-3.25-3.448V22.5z"
        fill="#fff"
      />
    </svg>
  );
}

export function Product(props: SVGPropsType) {
  return (
    <svg width={58} height={58} viewBox="0 0 58 58" fill="none" {...props}>
      <circle cx={29} cy={29} r={29} fill="#8155FF" />
      <path
        d="M35.043 20.8l-2.167-1.136c-1.902-.998-2.853-1.498-3.876-1.498-1.023 0-1.974.5-3.876 1.498L22.958 20.8c-1.922 1.008-3.051 1.6-3.752 2.394L29 28.09l9.794-4.896c-.7-.793-1.83-1.386-3.751-2.394zM39.56 24.628l-9.747 4.874v10.227c.777-.194 1.662-.658 3.063-1.393l2.167-1.137c2.33-1.223 3.496-1.835 4.143-2.934.647-1.099.647-2.467.647-5.202v-.127c0-2.05 0-3.332-.272-4.308zM28.188 39.73V29.501l-9.749-4.874c-.272.976-.272 2.258-.272 4.308v.127c0 2.735 0 4.103.647 5.202.647 1.1 1.813 1.71 4.144 2.934l2.166 1.137c1.4.735 2.286 1.2 3.064 1.393z"
        fill="#fff"
      />
    </svg>
  );
}

export function Users(props: SVGPropsType) {
  return (
    <svg width={58} height={58} viewBox="0 0 58 58" fill="none" {...props}>
      <circle cx={29} cy={29} r={29} fill="#18BFFF" />
      <ellipse
        cx={25.7511}
        cy={22.4998}
        rx={4.33333}
        ry={4.33333}
        fill="#fff"
      />
      <ellipse
        cx={25.7511}
        cy={34.4178}
        rx={7.58333}
        ry={4.33333}
        fill="#fff"
      />
      <path
        d="M38.75 34.417c0 1.795-2.206 3.25-4.898 3.25.793-.867 1.339-1.955 1.339-3.248 0-1.295-.547-2.384-1.342-3.252 2.693 0 4.9 1.455 4.9 3.25zM35.5 22.501a3.25 3.25 0 01-4.364 3.054 6.163 6.163 0 00.805-3.055c0-1.11-.293-2.152-.804-3.053A3.25 3.25 0 0135.5 22.5z"
        fill="#fff"
      />
    </svg>
  );
}

export function Water(props: SVGPropsType) {

  let width = 58
  let height = 58

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 508 508"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="254" cy="254" r="254" fill="#324A5E" />
      <path
        fill="#54C0EB"
        d="M252 414h4c62.8 0 115.2-50.4 114-113.2 0-8-1.2-15.6-2.8-22.8C360 246.4 324 210 298 170.8c-27.2-37.6-44-77.6-44-76.4-0.4-0.8-17.2 39.2-44 76.4-25.6 39.2-62 76-69.2 106.8-2 7.2-2.8 14.8-2.8 22.8C136.8 363.2 189.2 414 252 414z"
      />
      <g>
        <path
          fill="#84DBFF"
          d="M177.2 353.6c6-0.4 9.6-6 7.2-10.8-3.2-7.2-6-14.8-7.2-22.8-1.6-8-2-15.6-1.6-23.2 1.2-32 32-75.2 51.6-118.4 2-3.6 3.6-7.6 5.2-11.2-0.8 1.2-1.6 2.4-2.4 3.2-26.4 40.4-64 78.8-70.8 110-1.6 7.2-2.4 15.2-2.4 23.2 0.4 16.8 4.8 32 12.4 46 1.6 1.2 4.4 2.8 7.6 2.4z"
        />
        <ellipse
          cx="188.401"
          cy="365.998"
          rx="8.4"
          ry="9.2"
          transform="matrix(-0.042 -0.9991 0.9991 -0.042 -169.3631 569.6013)"
          fill="#84DBFF"
        />
      </g>
    </svg>
  );
}

export function Water_red(props: SVGPropsType) {

  let width = 58
  let height = 58

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 508 508"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="254" cy="254" r="254" fill="#324A5E" />
      <path
        fill="#FA2A00"
        d="M252 414h4c62.8 0 115.2-50.4 114-113.2 0-8-1.2-15.6-2.8-22.8C360 246.4 324 210 298 170.8c-27.2-37.6-44-77.6-44-76.4-0.4-0.8-17.2 39.2-44 76.4-25.6 39.2-62 76-69.2 106.8-2 7.2-2.8 14.8-2.8 22.8C136.8 363.2 189.2 414 252 414z"
      />
      <g>
        <path
          fill="#84DBFF"
          d="M177.2 353.6c6-0.4 9.6-6 7.2-10.8-3.2-7.2-6-14.8-7.2-22.8-1.6-8-2-15.6-1.6-23.2 1.2-32 32-75.2 51.6-118.4 2-3.6 3.6-7.6 5.2-11.2-0.8 1.2-1.6 2.4-2.4 3.2-26.4 40.4-64 78.8-70.8 110-1.6 7.2-2.4 15.2-2.4 23.2 0.4 16.8 4.8 32 12.4 46 1.6 1.2 4.4 2.8 7.6 2.4z"
        />
        <ellipse
          cx="188.401"
          cy="365.998"
          rx="8.4"
          ry="9.2"
          transform="matrix(-0.042 -0.9991 0.9991 -0.042 -169.3631 569.6013)"
          fill="#84DBFF"
        />
      </g>
    </svg>
  );
}

export function NaOH (props: SVGPropsType) {

  return (

    // <svg width="58" height="58" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <img 
      src="/images/icon/NaOH_1.png" 
      alt="Sodium Hydroxide (NaOH)"
      width={58} 
      height={58}
      // If you are using Tailwind or custom CSS
      className="chemical-icon" 
    />
    // <

  );
}

export function HCI (props: SVGPropsType) {

  return (

    <img 
      src="/images/icon/HCI_1.png" 
      alt="Hydrochloric Acid (HCl)"
      width={58} 
      height={58}
      // If you are using Tailwind or custom CSS
      className="chemical-icon" 
    />

  );
}

export function NaOH_2 (props: SVGPropsType) {

  return (

    // <svg width="58" height="58" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <img 
      src="/images/icon/NaOH_2.png" 
      alt="Sodium Hydroxide (NaOH)"
      width={58} 
      height={58}
      // If you are using Tailwind or custom CSS
      className="chemical-icon" 
    />
    // <

  );
}

export function HCI_2 (props: SVGPropsType) {

  return (

    <img 
      src="/images/icon/HCI_2.png" 
      alt="Hydrochloric Acid (HCl)"
      width={88} 
      height={88}
      // If you are using Tailwind or custom CSS
      className="chemical-icon" 
    />

  );
}

export function NaOH_3 (props: SVGPropsType) {

  return (

    <svg width="58" height="58" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="100" height="100" rx="20" fill="#007BFF"/>
    
    <path d="M40 30V60C40 65.5228 44.4772 70 50 70C55.5228 70 60 65.5228 60 60V30" stroke="white" strokeWidth="4" stroke-linecap="round"/>
    <line x1="38" y1="30" x2="62" y2="30" stroke="white" strokeWidth="4" stroke-linecap="round"/>
    
    <circle cx="45" cy="55" r="3" fill="white" fill-opacity="0.6"/>
    <circle cx="55" cy="45" r="2" fill="white" fill-opacity="0.4"/>

    <text x="50" y="88" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle">NaOH</text>
    
    <circle cx="30" cy="40" r="8" fill="#E3F2FD"/>
    <text x="30" y="43" font-family="Arial, sans-serif" font-size="7" font-weight="bold" fill="#007BFF" text-anchor="middle">Na+</text>
    
    <circle cx="70" cy="40" r="8" fill="#E3F2FD"/>
    <text x="70" y="43" font-family="Arial, sans-serif" font-size="7" font-weight="bold" fill="#007BFF" text-anchor="middle">OH-</text>
  </svg>

  );
}

export function HCI_3(props: SVGPropsType) {

  return (

    <svg width="58" height="58" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#2ECC71"/>
      
      <path d="M40 30V60C40 65.5228 44.4772 70 50 70C55.5228 70 60 65.5228 60 60V30" stroke="white" strokeWidth="4" stroke-linecap="round"/>
      <line x1="38" y1="30" x2="62" y2="30" stroke="white" strokeWidth="4" stroke-linecap="round"/>
      
      <circle cx="45" cy="55" r="3" fill="white" fill-opacity="0.6"/>
      <circle cx="55" cy="45" r="2" fill="white" fill-opacity="0.4"/>

      <text x="50" y="88" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle">HCl</text>
      
      <circle cx="30" cy="40" r="8" fill="#E8F5E9"/>
      <text x="30" y="43" font-family="Arial, sans-serif" font-size="7" font-weight="bold" fill="#2ECC71" text-anchor="middle">H+</text>
      
      <circle cx="70" cy="40" r="8" fill="#E8F5E9"/>
      <text x="70" y="43" font-family="Arial, sans-serif" font-size="7" font-weight="bold" fill="#2ECC71" text-anchor="middle">Cl-</text>
    </svg>

  );
}