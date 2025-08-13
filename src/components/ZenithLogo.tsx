"use client";

import React from "react";
import Image from "next/image";

interface ZenithLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
}

const sizeMap = {
  sm: { width: 60, height: 60, textSize: "text-lg" },
  md: { width: 80, height: 80, textSize: "text-xl" },
  lg: { width: 120, height: 120, textSize: "text-2xl" },
  xl: { width: 160, height: 160, textSize: "text-4xl" },
};

export function ZenithLogo({
  size = "md",
  className = "",
  showText = true,
}: ZenithLogoProps) {
  const { width, height, textSize } = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        <Image
          src="/zenithlogo.png"
          alt="Zenith Logo"
          width={width}
          height={height}
          className="drop-shadow-lg object-contain"
          priority
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          {size === "xl" && (
            <span className="text-xs text-zenith-muted font-medium tracking-wider">
              DRIVEN BY PASSION, BUILT FOR EXCELLENCE
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Logo-only version for headers
export function ZenithLogoOnly({
  size = "md",
  className = "",
}: Omit<ZenithLogoProps, "showText">) {
  return <ZenithLogo size={size} className={className} showText={false} />;
}
