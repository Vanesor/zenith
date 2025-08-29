import * as React from "react";
import { cn } from "@/lib/utils";

interface ToggleSwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
}

const ToggleSwitch = React.forwardRef<HTMLInputElement, ToggleSwitchProps>(
  ({ className, label, description, ...props }, ref) => {
    return (
      <label className="flex items-center cursor-pointer">
        <div className="relative inline-flex items-center mr-3">
          <input
            type="checkbox"
            className="sr-only peer"
            ref={ref}
            {...props}
          />
          <div className="w-11 h-6 bg-zenith-section peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zenith-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </div>
        {(label || description) && (
          <div>
            {label && <div className="font-medium text-zenith-primary">{label}</div>}
            {description && <div className="text-sm text-zenith-secondary">{description}</div>}
          </div>
        )}
      </label>
    );
  }
);

ToggleSwitch.displayName = "ToggleSwitch";

export { ToggleSwitch };
