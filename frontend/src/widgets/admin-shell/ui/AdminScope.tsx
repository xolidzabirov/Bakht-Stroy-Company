"use client";

import { useEffect } from "react";

/**
 * Dialogs, dropdowns and the phone menu render in <body>, outside the panel's own box —
 * so while the admin panel is open <body> carries the "admin-ui" look too (fonts, buttons, scrollbars).
 */
export function AdminScope() {
  useEffect(() => {
    document.body.classList.add("admin-ui");
    return () => document.body.classList.remove("admin-ui");
  }, []);

  return null;
}
