import Image from "next/image";
import logo from "@/assets/logos/logo.svg";
import darkLogo from "@/assets/logos/logo-dark.svg";

export function Logo() {
  return (
    <div className="relative translate-x-8 translate-y-3">
      <Image
        src={logo}
        className="dark:hidden"
        alt="NextAdmin logo"
        role="presentation"
        quality={100}
        height={100}
        width={125}
      />

      <Image
        src={darkLogo}
        className="hidden dark:block"
        alt="NextAdmin logo"
        role="presentation"
        quality={100}
        height={100}
        width={125}
      />
    </div>
  );
}
