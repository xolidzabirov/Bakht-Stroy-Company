import { readFileSync } from "node:fs";
import path from "node:path";
import { type Browser, expect, type Page, test } from "@playwright/test";
import { E2E_ADMIN, E2E_API } from "./config";

/**
 * The main story of the shop, end to end in a real browser:
 * a new customer registers (with the phone code), buys a product with pickup,
 * the administrator confirms the order, and the customer sees the new status.
 */

const LOG = path.resolve(__dirname, "../../backend/storage/logs/laravel.log");

/** The code the API "sent" to Telegram — the E2E API writes it to the log instead (TELEGRAM_CODES_DRIVER=log). */
async function phoneCode(phone: string): Promise<string> {
  const pattern = new RegExp(`Telegram code for \\${phone}: (\\d{6})`, "g");
  for (let attempt = 0; attempt < 40; attempt++) {
    const found = [...readFileSync(LOG, "utf8").matchAll(pattern)].at(-1);
    if (found) return found[1];
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`No code for ${phone} in ${LOG}`);
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Пароль", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Войти", exact: true }).click();
}

async function asAdmin(browser: Browser) {
  const context = await browser.newContext({ locale: "ru-RU" });
  const page = await context.newPage();
  await signIn(page, E2E_ADMIN.email, E2E_ADMIN.password);
  // Staff land in the admin panel right after signing in.
  await expect(page).toHaveURL(/\/admin$/);
  return { page, close: () => context.close() };
}

test("a new customer registers, orders with pickup, the admin confirms, the customer sees it", async ({ page, browser, request }) => {
  const local = `93${Math.floor(1_000_000 + Math.random() * 8_999_999)}`;
  const phone = `+992${local}`;
  // A real mail domain: the API checks that the domain has a mail server (MX). Nothing is sent — MAIL_MAILER=log.
  const email = `bakhtstroy.e2e.${Date.now()}@gmail.com`;
  const password = "Stroika2026e2e";

  await test.step("registration: name → phone → code from Telegram → email and password", async () => {
    await page.goto("/register");
    await page.getByLabel("Имя", { exact: true }).fill("Тест");
    await page.getByLabel("Фамилия", { exact: true }).fill("Покупатель");
    await page.getByRole("button", { name: "Далее" }).click();

    await page.getByLabel("Номер телефона").fill(local);
    await page.getByRole("button", { name: "Получить код в Telegram" }).click();

    const code = await phoneCode(phone);
    // The sixth digit submits the code by itself, like on a phone.
    await page.locator('input[autocomplete="one-time-code"]').fill(code);

    await expect(page.getByRole("heading", { name: "Почта и пароль" })).toBeVisible();
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Пароль", { exact: true }).fill(password);
    await page.getByLabel("Повторите пароль", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Создать аккаунт" }).click();
    await expect(page).not.toHaveURL(/\/register/);
  });

  const product = await test.step("pick a product that is in stock", async () => {
    const response = await request.get(`${E2E_API}/products?per_page=12&sort=new&in_stock=1`);
    const { data } = (await response.json()) as { data: { slug: string; name: string; min_order: number }[] };
    const item = data.find((candidate) => candidate.min_order <= 1) ?? data[0];
    expect(item, "the seeded catalog has products").toBeTruthy();
    return item;
  });

  await test.step("add it to the cart from the product page", async () => {
    await page.goto(`/product/${product.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(product.name);
    // Wait until the API has the item, not just for the click.
    const added = page.waitForResponse((response) => response.url().includes("/api/proxy/cart") && response.request().method() === "POST" && response.ok());
    await page.getByRole("button", { name: "В корзину" }).first().click();
    await added;
    await page.goto("/cart");
    await expect(page.getByText(product.name).first()).toBeVisible();
  });

  const orderNumber = await test.step("checkout with pickup", async () => {
    await page.goto("/checkout");
    await page.getByRole("radio", { name: /Самовывоз/ }).click();
    await page.getByRole("button", { name: "Подтвердить заказ" }).click();
    // The single-threaded PHP test server can take a while to create the order.
    await expect(page).toHaveURL(/\/checkout\/success\//, { timeout: 60_000 });
    return decodeURIComponent(page.url().split("/checkout/success/")[1]);
  });

  await test.step("the admin moves the order to «Подтверждён»", async () => {
    const admin = await asAdmin(browser);
    await admin.page.goto(`/admin/orders/${encodeURIComponent(orderNumber)}`);
    await admin.page.getByRole("button", { name: "Перевести: Подтверждён" }).click();
    const dialog = admin.page.getByRole("dialog");
    await expect(dialog).toContainText("Подтверждён");
    await dialog.getByRole("button", { name: "Сохранить" }).click();
    await expect(dialog).toBeHidden();
    await expect(admin.page.getByRole("button", { name: "Перевести: Подтверждён" })).toBeHidden();
    await admin.close();
  });

  await test.step("the customer sees the new status in the account", async () => {
    await page.goto(`/account/orders/${encodeURIComponent(orderNumber)}`);
    await expect(page.getByText("Подтверждён").first()).toBeVisible();
  });
});
