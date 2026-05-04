import darkLogo from "@/assets/logos/dark.png";
import logo from "@/assets/logos/mian.png";
import Image from "next/image";

export function Logo() {
  return (

    <div className="relative h-14 w-full">

      {/* <Image
        src={logo}
        fill
        className="dark:hidden"
        alt="NextAdmin logo"
        role="presentation"
        quality={100}
      />

      <Image
        src={darkLogo}
        fill
        className="hidden dark:block"
        alt="NextAdmin logo"
        role="presentation"
        quality={100}
      /> */}

      <div className="max-xl:hidden w-full">
        {/* <h1 className="mb-0.5 text-heading-7 text-center font-bold text-dark dark:text-white">
          WGC
        </h1> */}

        {/* <p className="font-medium text-xs text-center">World's Best Hydrolyzed Starch</p> */}
        <img src="/images/logo/logo-wgc.png" alt="WGC Logo" className="flex items-center justify-center w-full h-full px-10"/>
      </div>
    </div>
  );
}
