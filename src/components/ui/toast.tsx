import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-xl border backdrop-blur-lg shadow-2xl transition-all duration-300 data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full p-4 pr-6",
  {
    variants: {
      variant: {
        default: "bg-slate-900/90 border-purple-500/30 text-slate-100 shadow-[0_0_20px_rgba(139,92,246,0.3)] before:absolute before:inset-0 before:bg-gradient-to-r before:from-purple-900/20 before:via-transparent before:to-blue-900/20 before:pointer-events-none",
        destructive: "bg-red-950/90 border-red-500/40 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.4)] before:absolute before:inset-0 before:bg-gradient-to-r before:from-red-900/30 before:via-transparent before:to-orange-900/20 before:pointer-events-none",
        success: "bg-emerald-950/90 border-emerald-500/40 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.4)] before:absolute before:inset-0 before:bg-gradient-to-r before:from-emerald-900/30 before:via-transparent before:to-green-900/20 before:pointer-events-none"
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-lg border bg-transparent px-3 text-sm font-medium transition-all duration-200 hover:bg-purple-900/50 hover:border-purple-400/60 hover:text-purple-200 hover:shadow-[0_0_10px_rgba(139,92,246,0.3)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:pointer-events-none disabled:opacity-50 border-purple-500/40 text-purple-300 group-[.destructive]:border-red-500/40 group-[.destructive]:text-red-300 group-[.destructive]:hover:border-red-400/60 group-[.destructive]:hover:bg-red-900/50 group-[.destructive]:hover:text-red-200 group-[.destructive]:focus:ring-red-500/50",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-lg p-1.5 text-slate-400 opacity-70 transition-all duration-200 hover:text-slate-200 hover:opacity-100 hover:bg-purple-900/30 hover:shadow-[0_0_8px_rgba(139,92,246,0.2)] focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 group-hover:opacity-100 group-[.destructive]:text-red-400 group-[.destructive]:hover:text-red-200 group-[.destructive]:hover:bg-red-900/30 group-[.destructive]:focus:ring-red-500/50",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-bold font-['Cinzel'] text-slate-100 relative z-10", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm text-slate-300 relative z-10", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
