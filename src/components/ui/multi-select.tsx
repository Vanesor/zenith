"use client"

import * as React from "react"
import { X, Check, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface MultiSelectOption {
  value: string
  label: string
  icon?: React.ReactNode
  description?: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value?: string[]
  onValueChange?: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  maxItems?: number
  maxDisplay?: number
}

const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  ({
    options,
    value = [],
    onValueChange,
    placeholder = "Select items...",
    searchPlaceholder = "Search options...",
    emptyMessage = "No options found.",
    disabled = false,
    className,
    maxItems,
    maxDisplay = 3,
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

    const selectedOptions = React.useMemo(() => {
      return options.filter((option) => value.includes(option.value))
    }, [options, value])

    const availableOptions = React.useMemo(() => {
      return filteredOptions.filter((option) => !value.includes(option.value))
    }, [filteredOptions, value])

    const handleSelect = (optionValue: string) => {
      if (value.includes(optionValue)) {
        onValueChange?.(value.filter(v => v !== optionValue))
      } else {
        if (maxItems && value.length >= maxItems) return
        onValueChange?.([...value, optionValue])
      }
    }

    const handleRemove = (optionValue: string) => {
      onValueChange?.(value.filter(v => v !== optionValue))
    }

    const handleClear = () => {
      onValueChange?.([])
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
          if (highlightedIndex >= 0 && highlightedIndex < availableOptions.length) {
            handleSelect(availableOptions[highlightedIndex].value)
          }
          break
        case "ArrowDown":
          e.preventDefault()
          setHighlightedIndex(prev => 
            prev < availableOptions.length - 1 ? prev + 1 : 0
          )
          break
        case "ArrowUp":
          e.preventDefault()
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : availableOptions.length - 1
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

    const displayItems = selectedOptions.slice(0, maxDisplay)
    const remainingCount = selectedOptions.length - maxDisplay

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
              "min-h-12 w-full justify-between rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm px-4 py-3 text-sm font-medium text-gray-900 dark:text-white hover:border-purple-300 dark:hover:border-purple-500 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300",
              selectedOptions.length === 0 && "text-gray-500 dark:text-gray-400"
            )}
          >
            <div className="flex items-center gap-1 flex-1 text-left min-h-6">
              {selectedOptions.length === 0 ? (
                <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {displayItems.map((option) => (
                    <Badge
                      key={option.value}
                      variant="secondary"
                      className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors duration-200"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemove(option.value)
                      }}
                    >
                      <div className="flex items-center gap-1">
                        {option.icon}
                        <span className="truncate max-w-24">{option.label}</span>
                        <X className="h-3 w-3 hover:text-purple-600 dark:hover:text-purple-300" />
                      </div>
                    </Badge>
                  ))}
                  {remainingCount > 0 && (
                    <Badge variant="outline" className="border-purple-300 text-purple-600 dark:border-purple-600 dark:text-purple-400">
                      +{remainingCount} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 ml-2">
              {selectedOptions.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-purple-100 dark:hover:bg-purple-900/20"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClear()
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              <ChevronDown 
                className={cn(
                  "h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400 transition-transform duration-200",
                  open && "rotate-180"
                )} 
              />
            </div>
          </Button>

          {open && (
            <div className="absolute z-50 w-full mt-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-2xl shadow-purple-500/10 dark:shadow-purple-500/20 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
              <div className="flex items-center border-b border-gray-200 dark:border-gray-600 p-2">
                <Search className="mr-2 h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
                <Input
                  ref={inputRef}
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => {
                    setSearchValue(e.target.value)
                    setHighlightedIndex(0)
                  }}
                  onKeyDown={handleKeyDown}
                  className="border-0 bg-transparent p-0 focus:ring-0 focus:ring-offset-0"
                />
              </div>
              
              <div className="max-h-60 overflow-auto p-1">
                {availableOptions.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    {searchValue ? "No matching options found." : "All options selected."}
                  </div>
                ) : (
                  availableOptions.map((option, index) => (
                    <div
                      key={option.value}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center rounded-lg px-3 py-3 text-sm font-medium outline-none transition-all duration-200 group",
                        index === highlightedIndex && "bg-purple-50 dark:bg-purple-900/20",
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
                      {maxItems && value.length >= maxItems && (
                        <div className="text-xs text-gray-400 ml-2">Max reached</div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {selectedOptions.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-600 p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                  >
                    Clear all ({selectedOptions.length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
)

MultiSelect.displayName = "MultiSelect"

export { MultiSelect }
export type { MultiSelectOption }
