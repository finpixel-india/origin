"use client";

import {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
  useEffect,
  useId,
} from "react";

export function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`glass min-w-0 rounded-[var(--radius-card)] ${className}`}>{children}</div>;
}

export function SectionLabel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`text-[0.66rem] font-medium uppercase tracking-[0.28em] text-silver-500 ${className}`}
    >
      {children}
    </div>
  );
}

export function Progress({
  value,
  className = "",
  tone = "amethyst",
}: {
  value: number;
  className?: string;
  tone?: "amethyst" | "silver";
}) {
  const pct = Math.max(0, Math.min(100, value));
  const bar =
    tone === "amethyst"
      ? "linear-gradient(90deg, #6353a8, #9788db)"
      : "linear-gradient(90deg, #56576a, #a6a7b6)";
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06] ${className}`}>
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${pct}%`, background: bar }}
      />
    </div>
  );
}

export function Ring({
  value,
  size = 116,
  stroke = 9,
  tone = "amethyst",
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  tone?: "amethyst" | "emerald";
  children?: ReactNode;
}) {
  const gradId = useId();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = c - (pct / 100) * c;
  
  const stops = tone === "emerald" 
    ? { start: "#2d8a6e", end: "#6ee7b7" }
    : { start: "#6353a8", end: "#b3a6ea" };

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)" }}
        />
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={stops.start} />
            <stop offset="1" stopColor={stops.end} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

const TONES: Record<string, string> = {
  silver: "text-silver-300 bg-white/[0.05] border-white/10",
  amethyst: "text-amethyst-200 bg-amethyst-500/12 border-amethyst-400/25",
  gold: "text-[#d8bd86] bg-[#c9a86a]/10 border-[#c9a86a]/25",
  teal: "text-[#8fcfca] bg-[#5fa9a0]/12 border-[#5fa9a0]/25",
  red: "text-[#d99a9a] bg-[#c97070]/12 border-[#c97070]/25",
};

export function Badge({
  children,
  tone = "silver",
  className = "",
}: {
  children: ReactNode;
  tone?: keyof typeof TONES | string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.66rem] font-medium uppercase tracking-[0.14em] ${
        TONES[tone] ?? TONES.silver
      } ${className}`}
    >
      {children}
    </span>
  );
}

export function badgeTone(status: string): keyof typeof TONES {
  switch (status) {
    case "Dream":
    case "Not Started":
    case "Low":
      return "silver";
    case "Planning":
    case "Medium":
    case "On Hold":
      return "amethyst";
    case "In Progress":
    case "High":
      return "gold";
    case "Completed":
    case "Done":
      return "teal";
    case "Critical":
      return "red";
    default:
      return "silver";
  }
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md";
};

export function Button({
  variant = "ghost",
  size = "md",
  className = "",
  children,
  ...props
}: BtnProps) {
  const sizes =
    size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm";
  const variants: Record<string, string> = {
    primary:
      "bg-gradient-to-b from-amethyst-500 to-amethyst-600 text-white border border-amethyst-400/40 hover:from-amethyst-400 hover:to-amethyst-500 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-14px_rgba(124,108,196,0.85)] shadow-[0_10px_30px_-12px_rgba(124,108,196,0.7)]",
    ghost:
      "text-silver-300 hover:text-silver-100 hover:bg-white/[0.06] border border-transparent",
    outline:
      "text-silver-200 border border-white/10 hover:-translate-y-0.5 hover:border-amethyst-400/30 hover:bg-white/[0.05]",
    danger:
      "text-white bg-gradient-to-b from-red-600/85 to-red-800/85 border border-red-400/30 hover:from-red-500/85 hover:to-red-700/85 shadow-[0_10px_30px_-12px_rgba(201,112,112,0.6)]",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium tracking-wide transition-[transform,background,border-color,box-shadow,color,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${sizes} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export const inputClass =
  "w-full rounded-xl border border-white/8 bg-white/[0.03] px-3.5 py-2.5 text-sm text-silver-100 placeholder:text-silver-600 outline-none transition-colors duration-200 focus:border-amethyst-400/40 focus:bg-white/[0.05]";

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-silver-500">
          {label}
        </span>
        {hint && <span className="text-[0.66rem] text-silver-600">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Modal({
  open,
  onClose,
  children,
  title,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 animate-overlay-in bg-black/80"
        onClick={onClose}
      />
      <div
        className={`glass relative z-10 w-full animate-scale-in overflow-hidden rounded-t-[22px] sm:rounded-[var(--radius-card)] ${
          wide ? "max-w-2xl" : "max-w-md"
        } max-h-[92vh] overflow-y-auto`}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
            <h3 className="font-serif text-xl text-silver-100">{title}</h3>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full text-silver-400 transition hover:bg-white/10 hover:text-silver-100"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-white/10 px-6 py-16 text-center">
      {icon && <div className="mb-4 text-silver-600">{icon}</div>}
      <p className="font-serif text-xl text-silver-300">{title}</p>
      {subtitle && <p className="mt-2 max-w-sm text-sm text-silver-500">{subtitle}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
