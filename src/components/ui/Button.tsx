import type { AnchorHTMLAttributes, ButtonHTMLAttributes, PropsWithChildren } from "react";
import Link from "next/link";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

type ButtonLinkProps = PropsWithChildren<
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  ariaLabel?: string;
  }
>;

const styles: Record<ButtonVariant, string> = {
  primary:
    "border border-transparent bg-[linear-gradient(110deg,var(--color-accent-primary),var(--color-accent-pink))] text-text-primary shadow-[var(--shadow-accent)] hover:brightness-110",
  secondary:
    "border border-border-strong bg-surface-glass text-text-primary shadow-[var(--shadow-soft)] hover:border-accent-light hover:bg-surface-elevated",
  ghost: "border border-transparent text-text-secondary hover:bg-surface-glass hover:text-text-primary",
};

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full font-semibold tracking-[-0.01em] transition-[color,background-color,border-color,filter] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45";

const sizes: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "min-h-12 px-6 py-3 text-base",
};

export function Button({ className = "", variant = "primary", size = "md", type = "button", ...props }: ButtonProps) {
  return <button className={`${base} ${styles[variant]} ${sizes[size]} ${className}`} type={type} {...props} />;
}

export function ButtonLink({ children, className = "", href, variant = "primary", size = "md", ariaLabel, ...props }: ButtonLinkProps) {
  return (
    <Link aria-label={ariaLabel} className={`${base} ${styles[variant]} ${sizes[size]} ${className}`} href={href} {...props}>
      {children}
    </Link>
  );
}
