import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import Link from "next/link";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

type ButtonLinkProps = PropsWithChildren<{
  href: string;
  variant?: ButtonVariant;
  ariaLabel?: string;
}>;

const styles: Record<ButtonVariant, string> = {
  primary:
    "bg-violet text-white shadow-[0_16px_38px_rgba(139,92,246,0.28)] hover:bg-violet-strong",
  secondary:
    "border border-white/15 bg-white/10 text-foreground hover:bg-white/15",
  ghost: "text-muted hover:bg-white/10 hover:text-foreground",
};

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}

export function ButtonLink({ children, href, variant = "primary", ariaLabel }: ButtonLinkProps) {
  return (
    <Link aria-label={ariaLabel} className={`${base} ${styles[variant]}`} href={href}>
      {children}
    </Link>
  );
}
