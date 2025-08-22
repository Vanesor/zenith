"use client";

import React from "react";
import Image from "next/image";
import { 
  Code, 
  MessageSquare, 
  GraduationCap, 
  Heart 
} from "lucide-react";

interface ClubLogoProps {
  clubId: string;
  clubName: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fallbackIcon?: string;
  showText?: boolean;
}

const sizeMap = {
  sm: { width: 40, height: 40 },
  md: { width: 48, height: 48 },
  lg: { width: 64, height: 64 },
  xl: { width: 80, height: 80 },
};

// Fallback icon mapping for clubs without SVG logos
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Code: Code,
  MessageSquare: MessageSquare,
  GraduationCap: GraduationCap,
  Heart: Heart,
};

export function ClubLogo({
  clubId,
  clubName,
  size = "md",
  className = "",
  fallbackIcon,
  showText = false,
}: ClubLogoProps) {
  const { width, height } = sizeMap[size];
  const [logoError, setLogoError] = React.useState(false);
  const [logoExists, setLogoExists] = React.useState(false);

  // Check if SVG logo exists
  React.useEffect(() => {
    const checkLogo = async () => {
      try {
        const response = await fetch(`/uploads/club-logos/${clubId}.svg`, {
          method: 'HEAD'
        });
        setLogoExists(response.ok);
      } catch {
        setLogoExists(false);
      }
    };
    
    checkLogo();
  }, [clubId]);

  const handleLogoError = () => {
    setLogoError(true);
  };

  // If SVG logo exists and hasn't errored, show it
  if (logoExists && !logoError) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Image
          src={`/uploads/club-logos/${clubId}.svg`}
          alt={`${clubName} logo`}
          width={width}
          height={height}
          className="object-contain"
          onError={handleLogoError}
          priority={false}
        />
        {showText && (
          <span className="font-semibold">{clubName}</span>
        )}
      </div>
    );
  }

  // Fallback to Lucide icon
  const FallbackIcon = fallbackIcon ? iconMap[fallbackIcon] || Code : Code;
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <FallbackIcon 
        className={`text-current`}
        style={{ width, height }}
      />
      {showText && (
        <span className="font-semibold">{clubName}</span>
      )}
    </div>
  );
}

export default ClubLogo;
