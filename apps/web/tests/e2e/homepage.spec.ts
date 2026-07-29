import { expect, test } from "@playwright/test";

test("homepage renders the foundation landing shell with no console errors", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "96 Order" })).toBeVisible();
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
  expect(consoleErrors).toEqual([]);
});

test("an unknown route renders the not-found page", async ({ page }) => {
  await page.goto("/this-route-does-not-exist");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});
