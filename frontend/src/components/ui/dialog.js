import * as React from "react";
import { cn } from "../../lib/utils";

const Dialog = React.forwardRef(({ children, open, onOpenChange, ...props }, ref) => {
  if (!open) return null;

  return (
    <div className="fixed inset-x-0 top-16 bottom-0 z-[9999] flex items-start justify-center px-4 py-6">
      {/* Backdrop */}
      <div
        className="fixed inset-x-0 top-16 bottom-0 bg-black/20 z-[9998]"
        onClick={onOpenChange}
      />
      {/* Content wrapper - size to content so modal centers */}
      <div className="relative z-[9999] w-full max-w-[700px] sm:max-w-[720px] mx-auto">
        {children}
      </div>
    </div>
  );
});
Dialog.displayName = "Dialog";

const DialogTrigger = React.forwardRef(({ asChild, children, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { ...props, ref });
  }
  return <button {...props} ref={ref}>{children}</button>;
});
DialogTrigger.displayName = "DialogTrigger";

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative rounded-md shadow-lg border p-4 sm:p-5 z-[10000] bg-white text-gray-900 border-gray-200",
      "dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700",
      "max-h-[calc(100vh-7rem)] overflow-y-auto",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
DialogContent.displayName = "DialogContent";

const DialogHeader = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 mb-6", className)}
    {...props}
  >
    {children}
  </div>
));
DialogHeader.displayName = "DialogHeader";

const DialogTitle = React.forwardRef(({ className, children, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-xl font-semibold leading-none tracking-tight", className)}
    {...props}
  >
    {children}
  </h2>
));
DialogTitle.displayName = "DialogTitle";

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle
};
