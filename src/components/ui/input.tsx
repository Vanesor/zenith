import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, error, ...props }, ref) => {
    return (
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zenith-secondary group-focus-within:text-blue-500 transition-colors duration-200 z-10">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-14 w-full rounded-2xl border border-zenith-border bg-zenith-input px-6 py-4 text-base text-zenith-primary ring-offset-white file:border-0 file:bg-transparent file:text-base file:font-medium placeholder:text-zenith-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 hover:shadow-md hover:border-blue-500/30 shadow-sm backdrop-blur-sm caret-blue-500",
            icon && "pl-12",
            error && "border-red-500 focus-visible:ring-red-500/20 dark:border-red-500 focus-visible:border-red-500 mb-6",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="absolute -bottom-5 left-0 text-sm text-red-500 font-medium">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export default Input
export { Input }
