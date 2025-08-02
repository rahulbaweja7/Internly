import * as React from "react";
import { cn } from "../../lib/utils";

const Dialog = React.forwardRef(({ children, open, onOpenChange, ...props }, ref) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-[999]"
        onClick={onOpenChange}
      />
      {/* Content wrapper */}
      <div className="relative z-[1000] w-full max-w-4xl mx-auto my-auto max-h-[90vh] overflow-y-auto">
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
      "relative bg-white rounded-lg shadow-lg border p-6 z-[1001]",
      "max-h-[90vh] overflow-y-auto",
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
