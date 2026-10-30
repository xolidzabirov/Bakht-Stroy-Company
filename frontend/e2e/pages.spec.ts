import { expect, test } from "@playwright/test";

/**
 * Every public page opens, has one main heading, does not scroll sideways and logs no errors —
 * on a desktop and on a phone (the "phone" project runs this file too).
 */
const pages = [
  { path: "/", heading: /Всё для стройки/ },
  { path: "/catalog", heading: "Каталог" },
  { path: "/news", heading: "Новости и акции" },
  { path: "/about", heading: "О компании" },
  { path: "/delivery", heading: "Доставка и оплата" },
  { path: "/contacts", heading: "Контакты" },
  { path: "/login", heading: "Вход" },
];

for (const { path, heading } of pages) {
  test(`${path} opens cleanly`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    // Product photos live on the private disk of the test API (see e2e/backend.mjs), so they are not served here.
    page.on("console", (message) => message.type() === "error" && !message.location().url.includes("/storage/") && errors.push(message.text()));

    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

    if (path === "/catalog") {
      // Products come from the API: an empty catalog means the site cannot reach it.
      await expect(page.locator('a[href^="/product/"]').first()).toBeVisible();
    }

    const sideways = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(sideways, "the page must not scroll sideways").toBe(false);
    expect(errors, "no errors in the browser console").toEqual([]);
  });
}

test("an unknown address shows the shop 404 page", async ({ page }) => {
  const response = await page.goto("/takoy-stranicy-net");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Страница не найдена");
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
});
