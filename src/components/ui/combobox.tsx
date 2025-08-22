"use client"

import * as React from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ComboboxOption {
  value: string
  label: string
  icon?: React.ReactNode
  description?: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  allowCustomValue?: boolean
}

const Combobox = React.forwardRef<HTMLDivElement, ComboboxProps>(
  ({
    options,
    value,
    onValueChange,
    placeholder = "Select option...",
    searchPlaceholder = "Search options...",
    emptyMessage = "No options found.",
    disabled = false,
    className,
    allowCustomValue = false,
    ...props
  }, ref) => {
    const [open, setOpen] = React.useState(false)
    const [searchValue, setSearchValue] = React.useState("")
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
    const dropdownRef = React.useRef<HTMLDivElement>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)

    const filteredOptions = React.useMemo(() => {
      if (!searchValue) return options
      return options.filter((option) =>
        option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
        option.value.toLowerCase().includes(searchValue.toLowerCase())
      )
    }, [options, searchValue])

    const selectedOption = React.useMemo(() => {
      return options.find((option) => option.value === value)
    }, [options, value])

    const handleSelect = (optionValue: string) => {
      onValueChange?.(optionValue === value ? "" : optionValue)
      setOpen(false)
      setSearchValue("")
      setHighlightedIndex(-1)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault()
          setOpen(true)
          setHighlightedIndex(0)
        }
        return
      }

      switch (e.key) {
        case "Escape":
          setOpen(false)
          setSearchValue("")
          setHighlightedIndex(-1)
          break
        case "Enter":
          e.preventDefault()
          if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
            handleSelect(filteredOptions[highlightedIndex].value)
          } else if (allowCustomValue && searchValue) {
            onValueChange?.(searchValue)
            setOpen(false)
            setSearchValue("")
          }
          break
        case "ArrowDown":
          e.preventDefault()
          setHighlightedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          )
          break
        case "ArrowUp":
          e.preventDefault()
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          )
          break
      }
    }

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setOpen(false)
          setSearchValue("")
          setHighlightedIndex(-1)
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        <div
          ref={dropdownRef}
          className="relative"
        >
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            onClick={() => {
              setOpen(!open)
              if (!open) {
                setTimeout(() => inputRef.current?.focus(), 0)
              }
            }}
            onKeyDown={handleKeyDown}
            className={cn(
              "h-12 w-full justify-between rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm px-4 py-3 text-sm font-medium text-gray-900 dark:text-primary hover:border-purple-300 dark:hover:border-purple-500 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300",
              !selectedOption && "text-gray-500 dark:text-gray-400"
            )}
          >
            <div className="flex items-center gap-2 flex-1 text-left">
              {selectedOption?.icon}
              <span className="truncate">
                {selectedOption ? selectedOption.label : placeholder}
              </span>
            </div>
            <ChevronDown 
              className={cn(
                "ml-2 h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400 transition-transform duration-200",
                open && "rotate-180"
              )} 
            />
          </Button>

          {open && (
            <div className="absolute z-50 w-full mt-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-2xl shadow-purple-500/10 dark:shadow-purple-500/20 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
              <div className="flex items-center border-b border-gray-200 dark:border-gray-600 p-2">
                <Search className="mr-2 h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
                <Input
                  ref={inputRef}
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSearchValue(e.target.value)
                    setHighlightedIndex(0)
                  }}
                  onKeyDown={handleKeyDown}
                  className="border-0 bg-transparent p-0 focus:ring-0 focus:ring-offset-0"
                />
              </div>
              
              <div className="max-h-60 overflow-auto p-1">
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    {allowCustomValue && searchValue ? (
                      <div
                        className="cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg p-2 transition-colors duration-200"
                        onClick={() => {
                          onValueChange?.(searchValue)
                          setOpen(false)
                          setSearchValue("")
                        }}
                      >
                        Create "{searchValue}"
                      </div>
                    ) : (
                      emptyMessage
                    )}
                  </div>
                ) : (
                  filteredOptions.map((option, index) => (
                    <div
                      key={option.value}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center rounded-lg px-3 py-3 text-sm font-medium outline-none transition-all duration-200 group",
                        index === highlightedIndex && "bg-purple-50 dark:bg-purple-900/20",
                        value === option.value && "bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100",
                        "hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      )}
                      onClick={() => handleSelect(option.value)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                    >
                      <div className="flex items-start gap-2 flex-1">
                        {option.icon && (
                          <div className="mt-0.5">{option.icon}</div>
                        )}
                        <div className="flex-1">
                          <div className="truncate group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-200">
                            {option.label}
                          </div>
                          {option.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {option.description}
                            </div>
                          )}
                        </div>
                      </div>
                      {value === option.value && (
                        <Check className="ml-2 h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
)

Combobox.displayName = "Combobox"

export { Combobox }
export type { ComboboxOption }
