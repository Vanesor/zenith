"use client";

import React from "react";
import Image from "next/image";

interface CollegeHeaderProps {
  className?: string;
}

export function CollegeHeader({ className = "" }: CollegeHeaderProps) {
  return (
    <div className={`bg-zenith-card border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-6">
            {/* Left - College Logo */}
            <div className="flex items-center">
              <Image
                src="/collegelogo.jpeg"
                alt="St. Vincent Pallotti College Logo"
                width={80}
                height={80}
                className="object-contain shadow-lg md:w-[100px] md:h-[100px]"
                priority
              />
            </div>          {/* Center - College and Department Name */}
          <div className="flex-1 text-center px-4 md:px-8">
            <h1 className="text-lg md:text-2xl font-bold text-black mb-1">
              St. Vincent Pallotti College of Engineering & Technology
            </h1>
            <p className="text-sm md:text-lg text-black font-semibold">
              Department of Computer Engineering
            </p>
            <p className="text-xs md:text-sm text-gray-600 mt-1">
              Nagpur - An Autonomous Institution
            </p>
          </div>

          {/* Right - Zenith Platform Logo */}
          {/* <div className="flex items-center">
            <Image
              src="/zenithlogo.png"
              alt="Zenith Logo"
              width={110}
              height={90}
              className="object-contain shadow-lg md:w-[140px] md:h-[110px]"
              priority
            />
          </div> */}
        </div>
      </div>
    </div>
  );
}
