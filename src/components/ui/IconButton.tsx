import type { ButtonHTMLAttributes, ReactNode } from "react";

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "children"> & {
  icon: ReactNode;
  label: string;
  size?: "md" | "lg";
};

const sizes = { md: "size-11", lg: "size-12" } as const;

export function IconButton({ className = "", icon, label, size = "md", type = "button", ...props }: IconButtonProps) {
  return (
    <button aria-label={label} className={`inline-flex shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface-glass text-text-secondary transition-[color,background-color,border-color] hover:border-border-strong hover:bg-surface-elevated hover:text-text-primary disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 ${sizes[size]} ${className}`} type={type} {...props}>
      <span aria-hidden="true">{icon}</span>
    </button>
  );
}
