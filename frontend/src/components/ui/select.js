import * as React from "react"
import { cn } from "../../lib/utils"
import { ChevronDown } from "lucide-react"

const Select = React.forwardRef(({ children, value, onValueChange, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState(value || "")
  
  const handleSelect = (newValue) => {
    setSelectedValue(newValue)
    setIsOpen(false)
    if (onValueChange) {
      onValueChange(newValue)
    }
  }

  React.useEffect(() => {
    setSelectedValue(value || "")
  }, [value])

  // Find SelectTrigger and SelectContent from children
  let trigger = null
  let content = null
  
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      if (child.type === SelectTrigger) {
        trigger = child
      } else if (child.type === SelectContent) {
        content = child
      }
    }
  })

  return (
    <div className="relative" ref={ref}>
      {trigger && React.cloneElement(trigger, {
        onClick: () => setIsOpen(!isOpen),
        isOpen: isOpen,
        className: cn(
          trigger.props.className,
          "cursor-pointer",
          isOpen && "ring-2 ring-ring ring-offset-2"
        ),
        children: React.Children.map(trigger.props.children, (child) => {
          if (React.isValidElement(child) && child.type === SelectValue) {
            // Only override if it's the dashboard filter (when selectedValue is "all")
            if (selectedValue === "all" && child.props.children === "Filters") {
              return React.cloneElement(child, {
                children: "Filters"
              })
            }
            // For other cases (like forms), show the actual selected value
            return React.cloneElement(child, {
              children: selectedValue || child.props.placeholder || "Select an option"
            })
          }
          return child
        })
      })}
      
      {isOpen && content && (
        <div className="absolute top-full left-0 right-0 z-[9999] mt-1 max-h-80 overflow-auto rounded-md border bg-white shadow-lg dark:bg-gray-800 dark:border-gray-700">
          {React.Children.map(content.props.children, (child) => {
            if (React.isValidElement(child) && child.type === SelectItem) {
              return React.cloneElement(child, {
                onClick: () => handleSelect(child.props.value),
                className: cn(
                  "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-3 pr-2 text-sm outline-none hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                  child.props.value === selectedValue && "bg-blue-50 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300"
                )
              })
            }
            return child
          })}
        </div>
      )}
    </div>
  )
})
Select.displayName = "Select"

const SelectTrigger = React.forwardRef(({ className, children, isOpen, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm",
      "bg-white text-gray-900 border-gray-300",
      "dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white",
      className
    )}
    {...props}
  >
    {children}
    <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
  </div>
))
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = React.forwardRef(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn("block truncate", className)}
    {...props}
  />
))
SelectValue.displayName = "SelectValue"

const SelectContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative z-[9999] min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef(({ className, children, value, onClick, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-3 pr-2 text-sm outline-none hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
      className
    )}
    onClick={onClick}
    {...props}
  >
    {children}
  </div>
))
SelectItem.displayName = "SelectItem"

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } 