import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[6px] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-basil text-ledger-paper border border-transparent hover:bg-basil/90 active:bg-basil/95 shadow-none",
        secondary:
          "bg-ledger-paper text-basil border border-basil hover:bg-[#E9E2D2] active:bg-[#DFD7C4] shadow-none",
        outline:
          "bg-transparent text-ink border border-line hover:bg-[#EAE4D7] shadow-none",
        ghost:
          "text-ink hover:bg-[#EAE4D7] hover:text-ink shadow-none",
        destructive:
          "bg-[#8A4331] text-ledger-paper border border-transparent hover:bg-[#783929] shadow-none",
        link:
          "text-basil underline-offset-4 hover:underline p-0 h-auto font-normal",
        saffron:
          "bg-saffron text-ink border border-transparent hover:bg-saffron/90 font-medium",
        plum:
          "bg-plum text-ledger-paper border border-transparent hover:bg-plum/90 font-medium",
      },
      size: {
        default: "h-9 px-4 py-2 text-sm",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6 text-base",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        className: cn(
          buttonVariants({ variant, size }),
          (children as React.ReactElement<any>).props.className,
          className
        ),
        ...props,
      });
    }
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
