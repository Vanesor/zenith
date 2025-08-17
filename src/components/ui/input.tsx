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
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors duration-200 z-10">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-14 w-full rounded-2xl border border-gray-200/80 bg-white/80 px-6 py-4 text-base text-gray-900 dark:text-gray-100 ring-offset-white file:border-0 file:bg-transparent file:text-base file:font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:focus-visible:ring-blue-400/20 focus-visible:ring-offset-2 focus-visible:border-blue-500 dark:focus-visible:border-blue-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700/80 dark:bg-gray-800/80 dark:ring-offset-gray-950 transition-all duration-300 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 shadow-sm backdrop-blur-sm caret-blue-600 dark:caret-blue-400",
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

export { Input }
