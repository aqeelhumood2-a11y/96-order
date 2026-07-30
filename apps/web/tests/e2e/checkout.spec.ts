import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { seedStorefrontFixtures, type StorefrontFixtures } from "./storefront-fixtures";

let fixtures: StorefrontFixtures;

test.beforeAll(async () => {
  fixtures = await seedStorefrontFixtures();
});

test.describe("checkout — cash on pickup", () => {
  test("add to cart, checkout with cash, and track the resulting order", async ({ page }) => {
    const email = `checkout-e2e-${randomUUID().slice(0, 8)}@example.com`;

    await page.goto(`/products/${fixtures.published.slug}`);
    await page.getByRole("button", { name: "Add to cart" }).click();
    await expect(page.getByText("Added to cart.")).toBeVisible();

    await page.goto("/cart");
    await expect(page.getByText(fixtures.published.name)).toBeVisible();
    await page.getByRole("link", { name: "Proceed to checkout" }).click();

    await expect(page).toHaveURL(/\/checkout$/);
    await page.getByLabel("Full name").fill("Ahmed Ali");
    await page.getByLabel("Mobile number").fill("36001234");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Pickup", { exact: true }).check();
    await page.getByLabel("Cash on delivery/pickup").check();

    await page.getByRole("button", { name: "Place order" }).click();

    await expect(page).toHaveURL(/\/checkout\/success\?order=/);
    const orderNumberMatch = /order=([^&]+)/.exec(page.url());
    const orderNumber = decodeURIComponent(orderNumberMatch?.[1] ?? "");
    expect(orderNumber).toMatch(/^ORD-\d{6}-[A-Z0-9]{6}$/);

    await expect(page.getByLabel("Order number")).toHaveValue(orderNumber);
    await page.getByLabel("Mobile number or email").fill(email);
    await page.getByRole("button", { name: "Track order" }).click();

    await expect(page.getByText(orderNumber)).toBeVisible();
    await expect(page.getByText("Confirmed")).toBeVisible();
    await expect(page.getByText("Pay on delivery/pickup")).toBeVisible();
    await expect(page.getByText(fixtures.published.name)).toBeVisible();
  });

  test("cart empties after a completed checkout", async ({ page }) => {
    await page.goto(`/products/${fixtures.published.slug}`);
    await page.getByRole("button", { name: "Add to cart" }).click();
    await expect(page.getByText("Added to cart.")).toBeVisible();

    await page.goto("/checkout");
    await page.getByLabel("Full name").fill("Fatima Ahmed");
    await page.getByLabel("Mobile number").fill("36009999");
    await page.getByLabel("Email").fill(`checkout-e2e-${randomUUID().slice(0, 8)}@example.com`);
    await page.getByLabel("Pickup", { exact: true }).check();
    await page.getByLabel("Cash on delivery/pickup").check();
    await page.getByRole("button", { name: "Place order" }).click();

    await expect(page).toHaveURL(/\/checkout\/success/);

    await page.goto("/cart");
    await expect(page.getByText("Your cart is empty.")).toBeVisible();
  });
});

test.describe("checkout — card payment (fake Tap provider)", () => {
  test("redirects to the fake Tap hosted payment page", async ({ page }) => {
    await page.route("https://fake-tap.test/**", (route) =>
      route.fulfill({ status: 200, contentType: "text/html", body: "<html><body>Fake Tap hosted payment page</body></html>" }),
    );

    await page.goto(`/products/${fixtures.published.slug}`);
    await page.getByRole("button", { name: "Add to cart" }).click();
    await expect(page.getByText("Added to cart.")).toBeVisible();

    await page.goto("/checkout");
    await page.getByLabel("Full name").fill("Sara Yousif");
    await page.getByLabel("Mobile number").fill("36005555");
    await page.getByLabel("Email").fill(`checkout-e2e-${randomUUID().slice(0, 8)}@example.com`);
    await page.getByLabel("Pickup", { exact: true }).check();
    await page.getByLabel("Pay by card").check();
    await page.getByRole("button", { name: "Place order" }).click();

    await expect(page).toHaveURL(/^https:\/\/fake-tap\.test\/pay\//);
  });
});

test.describe("order tracking privacy", () => {
  test("a mismatched verification factor returns the same generic message as a nonexistent order", async ({ page }) => {
    await page.goto("/orders/track");
    await page.getByLabel("Order number").fill("ORD-999999-ZZZZZZ");
    await page.getByLabel("Mobile number or email").fill("36001234");
    await page.getByRole("button", { name: "Track order" }).click();

    await expect(page.getByText("We couldn't find an order matching those details.")).toBeVisible();
  });
});
