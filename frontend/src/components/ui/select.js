import * as React from "react"
import { cn } from "../../lib/utils"
import { ChevronDown } from "lucide-react"

const Select = React.forwardRef(({ children, value, onValueChange, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState(value || "")
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
  const triggerRef = React.useRef(null)
  const listId = React.useId()

  const handleSelect = (newValue) => {
    setSelectedValue(newValue)
    setIsOpen(false)
    setHighlightedIndex(-1)
    triggerRef.current?.focus()
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

  // Flatten items once so keyboard nav and rendering share the same order/indices
  const items = content
    ? React.Children.toArray(content.props.children).filter(
        (c) => React.isValidElement(c) && c.type === SelectItem
      )
    : []

  const openAt = (index) => {
    setIsOpen(true)
    setHighlightedIndex(index)
  }

  const closeAndFocusTrigger = () => {
    setIsOpen(false)
    setHighlightedIndex(-1)
    triggerRef.current?.focus()
  }

  const handleTriggerKeyDown = (e) => {
    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault()
        if (!isOpen) {
          const selectedIdx = items.findIndex((i) => i.props.value === selectedValue)
          openAt(selectedIdx >= 0 ? selectedIdx : 0)
        } else if (highlightedIndex >= 0 && items[highlightedIndex]) {
          handleSelect(items[highlightedIndex].props.value)
        }
        break
      case "ArrowDown":
        e.preventDefault()
        if (!isOpen) {
          const selectedIdx = items.findIndex((i) => i.props.value === selectedValue)
          openAt(selectedIdx >= 0 ? selectedIdx : 0)
        } else {
          setHighlightedIndex((i) => Math.min(items.length - 1, (i < 0 ? -1 : i) + 1))
        }
        break
      case "ArrowUp":
        e.preventDefault()
        if (!isOpen) {
          openAt(items.length - 1)
        } else {
          setHighlightedIndex((i) => Math.max(0, (i < 0 ? items.length : i) - 1))
        }
        break
      case "Escape":
        if (isOpen) {
          e.preventDefault()
          closeAndFocusTrigger()
        }
        break
      case "Tab":
        if (isOpen) setIsOpen(false)
        break
      default:
        break
    }
  }

  const activeOptionId = highlightedIndex >= 0 ? `${listId}-option-${highlightedIndex}` : undefined

  return (
    <div className="relative" ref={ref}>
      {trigger && React.cloneElement(trigger, {
        ref: triggerRef,
        onClick: () => (isOpen ? closeAndFocusTrigger() : openAt(items.findIndex((i) => i.props.value === selectedValue))),
        onKeyDown: handleTriggerKeyDown,
        isOpen: isOpen,
        tabIndex: 0,
        role: "combobox",
        "aria-haspopup": "listbox",
        "aria-expanded": isOpen,
        "aria-controls": listId,
        "aria-activedescendant": activeOptionId,
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
        <div
          id={listId}
          role="listbox"
          className="absolute top-full left-0 right-0 z-[9999] mt-1 max-h-80 overflow-auto rounded-md border bg-white shadow-lg dark:bg-gray-800 dark:border-gray-700"
        >
          {items.map((child, index) =>
            React.cloneElement(child, {
              key: child.props.value ?? index,
              id: `${listId}-option-${index}`,
              role: "option",
              "aria-selected": child.props.value === selectedValue,
              onClick: () => handleSelect(child.props.value),
              onMouseEnter: () => setHighlightedIndex(index),
              className: cn(
                "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-3 pr-2 text-sm outline-none transition-colors",
                index === highlightedIndex
                  ? "bg-gray-100 dark:bg-gray-700"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700",
                child.props.value === selectedValue && "bg-blue-50 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300"
              )
            })
          )}
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
