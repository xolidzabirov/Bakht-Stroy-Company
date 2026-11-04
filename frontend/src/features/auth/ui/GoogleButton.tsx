import { buttonClasses } from "@/shared/ui";

/**
 * "Войти через Google", with the "или" line that separates it from the form.
 * A plain link: the page goes away to Google and comes back, there is nothing for a script to do here.
 */
export function GoogleButton({ label, or, next, separator }: { label: string; or: string; next: string; separator: "above" | "below" }) {
  const line = (
    <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden>
      <span className="h-px flex-1 bg-border" />
      {or}
      <span className="h-px flex-1 bg-border" />
    </div>
  );

  return (
    <div className="space-y-5">
      {separator === "above" && line}
      <a href={`/api/auth/google${next === "/" ? "" : `?next=${encodeURIComponent(next)}`}`} className={buttonClasses({ variant: "outline", size: "lg", className: "w-full" })}>
        <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden>
          <path fill="#4285F4" d="M23.04 12.26c0-.82-.07-1.6-.21-2.36H12v4.46h6.19a5.3 5.3 0 0 1-2.3 3.48v2.89h3.72c2.18-2 3.43-4.96 3.43-8.47z" />
          <path fill="#34A853" d="M12 24c3.1 0 5.7-1.03 7.61-2.77l-3.72-2.89c-1.03.69-2.35 1.1-3.89 1.1-2.99 0-5.53-2.02-6.43-4.74H1.73v2.98A11.5 11.5 0 0 0 12 24z" />
          <path fill="#FBBC05" d="M5.57 14.7A6.9 6.9 0 0 1 5.2 12c0-.94.16-1.85.37-2.7V6.32H1.73A11.5 11.5 0 0 0 .5 12c0 1.86.44 3.61 1.23 5.68z" />
          <path fill="#EA4335" d="M12 4.56c1.69 0 3.2.58 4.39 1.72l3.3-3.3C17.7 1.13 15.1 0 12 0A11.5 11.5 0 0 0 1.73 6.32L5.57 9.3C6.47 6.58 9.01 4.56 12 4.56z" />
        </svg>
        {label}
      </a>
      {separator === "below" && line}
    </div>
  );
}
