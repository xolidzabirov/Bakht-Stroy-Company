import { z } from "zod";

/**
 * Client checks are friendly hints only; the backend has the final word (real email, unique phone…).
 */
const email = z.string().trim().min(1, "Введите email").email("Похоже, в email опечатка — проверьте, пожалуйста");

export const passwordRules = [
  { test: (value: string) => value.length >= 8, label: "Не короче 8 символов" },
  { test: (value: string) => /\p{L}/u.test(value), label: "Есть буквы" },
  { test: (value: string) => /\d/.test(value), label: "Есть цифры" },
  { test: (value: string) => /[^\p{L}\d\s]/u.test(value), label: "Символ (!, #, ?) — ещё надёжнее", optional: true },
];

const password = z
  .string()
  .min(8, "Нужно хотя бы 8 символов")
  .max(100, "Слишком длинный пароль")
  .refine((value) => /\p{L}/u.test(value) && /\d/.test(value), "Добавьте и буквы, и цифры — так пароль надёжнее");

const code = z.string().trim().regex(/^\d{6}$/, "Код из письма — 6 цифр");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Введите пароль"),
  remember: z.boolean(),
});

export const emailStepSchema = z.object({ email });

export const registerSchema = z
  .object({
    code,
    name: z.string().trim().min(2, "Как к вам обращаться? Минимум 2 буквы").max(100),
    phone: z
      .string()
      .trim()
      .refine((value) => value === "" || value === "+992" || /^\+\d[\d\s()-]{7,}$/.test(value), "Номер с кодом страны: +992 93 123 45 67"),
    password,
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, { path: ["password_confirmation"], message: "Пароли не совпадают" });

export const resetSchema = z
  .object({ code, password, password_confirmation: z.string() })
  .refine((data) => data.password === data.password_confirmation, { path: ["password_confirmation"], message: "Пароли не совпадают" });

export type LoginValues = z.infer<typeof loginSchema>;
export type EmailStepValues = z.infer<typeof emailStepSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ResetValues = z.infer<typeof resetSchema>;
