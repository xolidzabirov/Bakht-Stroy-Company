"use client";

import { useLayoutEffect } from "react";

/**
 * A script for the first paint: it arrives in the page's HTML and the browser runs it before anything is shown.
 * React has nothing to do with it in the browser: a script React creates itself never runs, and React says so
 * in the console. That happens on pages drawn entirely in the browser (404), so there it runs from here.
 */
export function HeadScript({ code, ran }: { code: string; ran?: string }) {
  useLayoutEffect(() => {
    if (ran && !(ran in document.documentElement.dataset)) new Function(code)();
  }, [code, ran]);

  return typeof window === "undefined" ? <script dangerouslySetInnerHTML={{ __html: code }} /> : null;
}
