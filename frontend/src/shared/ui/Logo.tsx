import { cn } from "@/shared/lib/cn";

type LogoProps = {
  className?: string;
  /** Show the "BAKHT STROY" wordmark next to the sign. */
  withText?: boolean;
  /** Text color for dark backgrounds. */
  inverted?: boolean;
};

/**
 * Bakht Stroy sign: a bold "B" inside an open ring on the brand yellow (vector version of the logo).
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Bakht Stroy">
      <rect width="100" height="100" rx="24" fill="#FFB800" />
      {/* Open ring: two arcs with straight ends, like the original sign */}
      <path d="M22 41 A30 30 0 0 1 74 28" fill="none" stroke="#0A0A0A" strokeWidth="7" strokeLinecap="butt" />
      <path d="M78 59 A30 30 0 0 1 26 72" fill="none" stroke="#0A0A0A" strokeWidth="7" strokeLinecap="butt" />
      <path d="M14 41 H30" stroke="#0A0A0A" strokeWidth="7" />
      <path d="M70 59 H86" stroke="#0A0A0A" strokeWidth="7" />
      {/* B */}
      <path
        d="M38 30 H54 C62 30 66 34 66 40 C66 44 64 47 60.5 48.5 C65 50 68 53.5 68 58.5 C68 65.5 63 70 54.5 70 H38 Z
           M47 37.5 V46 H53 C56 46 57.5 44.5 57.5 41.8 C57.5 39 56 37.5 53 37.5 Z
           M47 52.5 V62.5 H54 C57.5 62.5 59 60.8 59 57.6 C59 54.3 57.5 52.5 54 52.5 Z"
        fill="#0A0A0A"
        fillRule="evenodd"
      />
    </svg>
  );
}

export function Logo({ className, withText = true, inverted = false }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="size-10 shrink-0" />
      {withText && (
        <span className="leading-none">
          <span
            className={cn(
              "block font-display text-lg font-extrabold tracking-tight",
              inverted ? "text-white" : "text-foreground",
            )}
          >
            BAKHT STROY
          </span>
          <span className={cn("block text-[10px] font-medium uppercase tracking-[0.18em]", inverted ? "text-white/60" : "text-muted")}>
            company · Душанбе
          </span>
        </span>
      )}
    </span>
  );
}
