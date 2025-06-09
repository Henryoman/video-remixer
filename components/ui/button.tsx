import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

const buttonVariants = {
  variant: {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
    ghost: "text-gray-700 hover:bg-gray-100",
    link: "text-blue-600 underline hover:no-underline"
  },
  size: {
    default: "h-10 px-4 py-2",
    sm: "h-9 px-3 text-sm",
    lg: "h-11 px-8 text-lg",
    icon: "h-10 w-10 p-0"
  }
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50"
    const variantClasses = buttonVariants.variant[variant]
    const sizeClasses = buttonVariants.size[size]
    return (
      <Comp
        className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className || ''}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
