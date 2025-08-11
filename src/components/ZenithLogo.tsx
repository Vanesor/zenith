"use client";

import React from "react";
import Image from "next/image";

interface ZenithLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
}

const sizeMap = {
  sm: { width: 40, height: 40, textSize: "text-lg" },
  md: { width: 60, height: 60, textSize: "text-xl" },
  lg: { width: 80, height: 80, textSize: "text-2xl" },
  xl: { width: 120, height: 120, textSize: "text-4xl" },
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
          src="/zenith-logo.svg"
          alt="Zenith Logo"
          width={width}
          height={height}
          className="drop-shadow-lg"
          priority
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span
            className={`font-bold text-zenith-brand ${textSize}`}
          >
            ZENITH
          </span>
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
