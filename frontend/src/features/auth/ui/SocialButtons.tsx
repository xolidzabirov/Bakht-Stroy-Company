"use client";

import { toast } from "sonner";
import { cn } from "@/shared/lib/cn";
import { buttonClasses } from "@/shared/ui";

type Props = {
  or: string;
  next: string;
  googleLabel: string;
  appleLabel: string;
  /** Apple needs a paid developer account first: until then its button only says that it is coming. */
  appleSoon: string;
};

const button = "h-12 w-full gap-2.5 rounded-xl transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md active:translate-y-0";

/** The "или" line and two equal buttons under the form: Google on the left, Apple on the right. */
export function SocialButtons({ or, next, googleLabel, appleLabel, appleSoon }: Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden>
        <span className="h-px flex-1 bg-border" />
        {or}
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {/* A plain link: the page goes away to Google and comes back. */}
        <a href={`/api/auth/google${next === "/" ? "" : `?next=${encodeURIComponent(next)}`}`} aria-label={googleLabel} className={buttonClasses({ variant: "outline", size: "lg", className: button })}>
          <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden>
            <path fill="#4285F4" d="M23.04 12.26c0-.82-.07-1.6-.21-2.36H12v4.46h6.19a5.3 5.3 0 0 1-2.3 3.48v2.89h3.72c2.18-2 3.43-4.96 3.43-8.47z" />
            <path fill="#34A853" d="M12 24c3.1 0 5.7-1.03 7.61-2.77l-3.72-2.89c-1.03.69-2.35 1.1-3.89 1.1-2.99 0-5.53-2.02-6.43-4.74H1.73v2.98A11.5 11.5 0 0 0 12 24z" />
            <path fill="#FBBC05" d="M5.57 14.7A6.9 6.9 0 0 1 5.2 12c0-.94.16-1.85.37-2.7V6.32H1.73A11.5 11.5 0 0 0 .5 12c0 1.86.44 3.61 1.23 5.68z" />
            <path fill="#EA4335" d="M12 4.56c1.69 0 3.2.58 4.39 1.72l3.3-3.3C17.7 1.13 15.1 0 12 0A11.5 11.5 0 0 0 1.73 6.32L5.57 9.3C6.47 6.58 9.01 4.56 12 4.56z" />
          </svg>
          Google
        </a>
        <button type="button" onClick={() => toast.info(appleSoon, { id: "apple-soon" })} aria-label={appleLabel} className={cn(buttonClasses({ size: "lg", className: button }), "bg-foreground text-background hover:bg-foreground/90")}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-5 shrink-0" aria-hidden>
            <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
          </svg>
          Apple
        </button>
      </div>
    </div>
  );
}
