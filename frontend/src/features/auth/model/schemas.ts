import { z } from "zod";
import type { Dictionary } from "@/shared/i18n/dictionaries";

/**
 * Client checks are friendly hints only; the backend has the final word (real email, unique phone…).
 * Messages come from the dictionary of the chosen language.
 */
export const passwordRules = [
  { key: "length", test: (value: string) => value.length >= 8 },
  { key: "letters", test: (value: string) => /\p{L}/u.test(value) },
  { key: "digits", test: (value: string) => /\d/.test(value) },
  { key: "symbol", test: (value: string) => /[^\p{L}\d\s]/u.test(value), optional: true },
] as const;

const lettersAndDigits = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

/** The password is built from the login part of the email (the backend refuses it too): new.client@… and newclient2026. */
export function containsEmail(password: string, email: string | null | undefined): boolean {
  const login = lettersAndDigits(email?.split("@")[0] ?? "");

  return login.length >= 4 && lettersAndDigits(password).includes(login);
}

/** A new password: 8+ characters with letters and digits, not built from the email (the same rules as the backend). */
export function newPasswordSchema(t: Dictionary, email?: string | null) {
  const v = t.auth.validation;

  return z
    .string()
    .min(8, v.passwordMin)
    .max(100, v.passwordMax)
    .refine((value) => /\p{L}/u.test(value) && /\d/.test(value), v.passwordMix)
    .refine((value) => !containsEmail(value, email), v.passwordEmail);
}

export function createAuthSchemas(t: Dictionary, accountEmail?: string | null) {
  const v = t.auth.validation;

  const email = z.string().trim().min(1, v.emailRequired).email(v.emailInvalid);

  const password = newPasswordSchema(t, accountEmail);

  const code = z.string().trim().regex(/^\d{6}$/, v.code);

  const r = t.reg.validation;

  return {
    regName: z.object({
      first_name: z.string().trim().min(2, r.firstName).max(50),
      last_name: z.string().trim().min(2, r.lastName).max(50),
    }),
    regPhone: z.object({ phone: z.string().regex(/^\d{9}$/, r.phone) }),
    regPassword: z
      .object({ password, password_confirmation: z.string() })
      .refine((data) => data.password === data.password_confirmation, { path: ["password_confirmation"], message: v.mismatch }),
    login: z.object({ email, password: z.string().min(1, v.passwordRequired), remember: z.boolean() }),
    emailStep: z.object({ email }),
    register: z
      .object({
        code,
        name: z.string().trim().min(2, v.name).max(100),
        phone: z
          .string()
          .trim()
          .refine((value) => value === "" || value === "+992" || /^\+\d[\d\s()-]{7,}$/.test(value), v.phone),
        password,
        password_confirmation: z.string(),
      })
      .refine((data) => data.password === data.password_confirmation, { path: ["password_confirmation"], message: v.mismatch }),
    reset: z
      .object({ code, password, password_confirmation: z.string() })
      .refine((data) => data.password === data.password_confirmation, { path: ["password_confirmation"], message: v.mismatch }),
  };
}

type Schemas = ReturnType<typeof createAuthSchemas>;

export type LoginValues = z.infer<Schemas["login"]>;
export type EmailStepValues = z.infer<Schemas["emailStep"]>;
export type RegisterValues = z.infer<Schemas["register"]>;
export type ResetValues = z.infer<Schemas["reset"]>;
export type RegNameValues = z.infer<Schemas["regName"]>;
export type RegPhoneValues = z.infer<Schemas["regPhone"]>;
export type RegPasswordValues = z.infer<Schemas["regPassword"]>;
