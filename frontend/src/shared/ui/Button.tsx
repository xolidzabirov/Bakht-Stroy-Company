import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Button as KitButton, buttonVariants } from "./kit/button";

/**
 * Bakht Stroy buttons on top of shadcn/ui: one look for every button and button-link on the site.
 */
type Variant = "primary" | "dark" | "outline" | "ghost" | "secondary";
type Size = "sm" | "md" | "lg";

const variants = { primary: "default", dark: "dark", outline: "outline", ghost: "ghost", secondary: "secondary" } as const;
const sizes = { sm: "sm", md: "default", lg: "lg" } as const;

type StyleProps = { variant?: Variant; size?: Size; className?: string; children: ReactNode };

export function buttonClasses({ variant = "primary", size = "md", className }: Omit<StyleProps, "children">): string {
  return buttonVariants({ variant: variants[variant], size: sizes[size], className });
}

export function Button({ variant = "primary", size = "md", className, children, ...props }: StyleProps & ComponentProps<"button">) {
  return (
    <KitButton variant={variants[variant]} size={sizes[size]} className={className} {...props}>
      {children}
    </KitButton>
  );
}

export function ButtonLink({ variant = "primary", size = "md", className, children, ...props }: StyleProps & ComponentProps<typeof Link>) {
  return (
    <KitButton asChild variant={variants[variant]} size={sizes[size]} className={className}>
      <Link {...props}>{children}</Link>
    </KitButton>
  );
}
