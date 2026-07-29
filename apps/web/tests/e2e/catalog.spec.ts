import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { NO_PERMISSION_STAFF_EMAIL, NO_PERMISSION_STAFF_PASSWORD, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD } from "./global-setup";

async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/admin");
}

/**
 * One long, ordered flow (category -> brand -> product -> inventory ->
 * archive) rather than several independent `test()` blocks: this spec file
 * shares one live emulator instance for its whole run (no per-test reset),
 * so keeping the state-mutating steps sequential in a single test avoids
 * one test's fixture data (e.g. a second product) breaking another test's
 * assumption that exactly one row exists on a list page.
 */
test.describe("catalog admin (super admin)", () => {
  test("create category, brand, and product; adjust inventory; archive the product", async ({ page }) => {
    const suffix = randomUUID().slice(0, 8);
    const categoryName = `Coffee Beans ${suffix}`;
    const brandName = `Acme Coffee Co ${suffix}`;
    const productName = `Ethiopia Yirgacheffe ${suffix}`;
    const sku = `ETH-${suffix}`;

    await loginViaUi(page, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD);

    // --- Category ---
    await page.goto("/admin/categories");
    await page.getByLabel("Name", { exact: true }).fill(categoryName);
    await page.getByRole("button", { name: "Create category" }).click();
    await expect(page.getByText(categoryName)).toBeVisible();

    // --- Brand ---
    await page.goto("/admin/brands");
    await page.getByLabel("Name", { exact: true }).fill(brandName);
    await page.getByRole("button", { name: "Create brand" }).click();
    await expect(page.getByText(brandName)).toBeVisible();

    // --- Product ---
    await page.goto("/admin/products/new");
    await page.getByLabel("Name", { exact: true }).fill(productName);
    await page.getByLabel("Product type (e.g. coffee_beans, grinder)").fill("coffee_beans");
    await page.getByLabel("Primary category").selectOption({ label: categoryName });
    await page.getByLabel("Brand").selectOption({ label: brandName });
    await page.getByLabel("SKU").fill(sku);
    await page.getByLabel("Base price").fill("1500");
    await page.getByRole("button", { name: "Create product" }).click();

    // Not waitForURL("**/admin/products/*") — that pattern already matches
    // the /admin/products/new page this test starts on, so it would
    // resolve immediately instead of waiting for the post-create
    // navigation. Waiting for the heading (which only exists on the
    // created product's own page) waits for the real thing.
    await expect(page.getByRole("heading", { name: productName })).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/products\/(?!new)[^/]+$/);

    // --- Inventory: the new product's inventory record was auto-seeded on
    // creation (trackInventory defaults to true), so it should already
    // appear on the overview page with zero stock.
    await page.goto("/admin/inventory");
    await expect(page.getByText(`SKU ${sku}`)).toBeVisible();
    await expect(page.getByText("On hand: 0")).toBeVisible();

    await page.getByLabel("Quantity change").fill("50");
    await page.getByLabel("Reason").selectOption("initial_stock");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText(/Updated: on-hand is now 50/)).toBeVisible();

    // --- Archive ---
    await page.goto("/admin/products");
    await expect(page.getByText(productName)).toBeVisible();
    const productRow = page.locator("li", { hasText: productName });
    await productRow.getByRole("button", { name: "Archive" }).click();
    await expect(productRow.getByText(/archived/)).toBeVisible();
  });
});

test.describe("catalog admin (no-permission staff)", () => {
  test("is denied on every catalog admin page", async ({ page }) => {
    await loginViaUi(page, NO_PERMISSION_STAFF_EMAIL, NO_PERMISSION_STAFF_PASSWORD);

    for (const path of ["/admin/products", "/admin/categories", "/admin/brands", "/admin/inventory"]) {
      await page.goto(path);
      await expect(page.getByText("You don't have permission to view this page.")).toBeVisible();
    }
  });

  test("does not see catalog nav links", async ({ page }) => {
    await loginViaUi(page, NO_PERMISSION_STAFF_EMAIL, NO_PERMISSION_STAFF_PASSWORD);

    for (const label of ["Products", "Categories", "Brands", "Inventory"]) {
      await expect(page.getByRole("link", { name: label })).not.toBeVisible();
    }
  });
});
