import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { normalizeCouponCode } from "@/core/coupons/entities";
import { FirestoreCmsPageRepository } from "@/infrastructure/firebase/repositories/firestore-cms-page-repository";
import { FirestoreCouponRepository } from "@/infrastructure/firebase/repositories/firestore-coupon-repository";
import { seedStorefrontFixtures, type StorefrontFixtures } from "./storefront-fixtures";

const cmsPages = new FirestoreCmsPageRepository();
const coupons = new FirestoreCouponRepository();

let fixtures: StorefrontFixtures;
let pageSlug: string;
let pageTitle: string;
let couponCode: string;

test.beforeAll(async () => {
  fixtures = await seedStorefrontFixtures();

  const suffix = randomUUID().slice(0, 8);
  pageSlug = `shipping-policy-${suffix}`;
  pageTitle = `Shipping Policy ${suffix}`;
  const now = new Date();
  await cmsPages.create({
    id: randomUUID(),
    title: pageTitle,
    slug: pageSlug,
    content: "Orders ship within two business days.",
    status: "published",
    showInNav: false,
    showInFooter: true,
    sortOrder: 0,
    version: 1,
    createdAt: now,
    updatedAt: now,
    createdBy: "e2e-setup",
    updatedBy: "e2e-setup",
  });

  couponCode = normalizeCouponCode(`E2E${suffix.toUpperCase()}`);
  await coupons.create({
    code: couponCode,
    description: "E2E test coupon",
    type: "fixed",
    value: 500,
    scope: { categoryIds: [], brandIds: [] },
    excludedProductIds: [],
    excludedCategoryIds: [],
    minSubtotal: null,
    maxDiscountCap: null,
    startsAt: null,
    endsAt: null,
    active: true,
    usageLimit: null,
    usageCount: 0,
    perCustomerLimit: null,
    firstOrderOnly: false,
    stackable: false,
    createdAt: now,
    updatedAt: now,
    createdBy: "e2e-setup",
    updatedBy: "e2e-setup",
  });
});

test.describe("CMS page + footer", () => {
  test("a published page renders at /pages/[slug] and is linked from the footer", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: pageTitle })).toBeVisible();

    await page.goto(`/pages/${pageSlug}`);
    await expect(page.getByText("Orders ship within two business days.")).toBeVisible();
  });
});

test.describe("cart coupon", () => {
  test("applying a valid coupon reduces the cart total", async ({ page }) => {
    await page.goto(`/products/${fixtures.published.slug}`);
    await page.getByRole("button", { name: "Add to cart" }).click();
    await expect(page.getByText("Added to cart.")).toBeVisible();

    await page.goto("/cart");
    await page.getByPlaceholder("Coupon code").fill(couponCode);
    await page.getByRole("button", { name: "Apply" }).click();

    await expect(page.getByText(`Coupon ${couponCode} applied`)).toBeVisible();
  });

  test("an unknown coupon code is rejected with a message", async ({ page }) => {
    await page.goto(`/products/${fixtures.published.slug}`);
    await page.getByRole("button", { name: "Add to cart" }).click();
    await expect(page.getByText("Added to cart.")).toBeVisible();

    await page.goto("/cart");
    await page.getByPlaceholder("Coupon code").fill("NOT-A-REAL-CODE");
    await page.getByRole("button", { name: "Apply" }).click();

    await expect(page.getByText("This coupon code isn't valid.")).toBeVisible();
  });
});

test.describe("customer account", () => {
  test("register, wishlist a product, and save an address", async ({ page }) => {
    const email = `customer-e2e-${randomUUID().slice(0, 8)}@example.com`;

    await page.goto("/account/register");
    await page.getByLabel("Full name").fill("Layla Hassan");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill("supersecret123");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByRole("heading", { name: "Welcome, Layla Hassan" })).toBeVisible();

    await page.goto(`/products/${fixtures.published.slug}`);
    // `.first()` — the product detail page's own wishlist heart is the
    // first one in DOM order; the "related products" grid below it renders
    // one per card, all sharing this same generic accessible name.
    await page.getByRole("button", { name: "Add to wishlist" }).first().click();
    await expect(page.getByRole("button", { name: "Remove from wishlist" }).first()).toBeVisible();

    await page.goto("/account/wishlist");
    await expect(page.getByText(fixtures.published.name)).toBeVisible();
    await expect(page.getByRole("button", { name: "Move to cart" })).toBeVisible();

    await page.goto("/account/addresses");
    await page.getByRole("button", { name: "Add a new address" }).click();
    await page.getByLabel("Recipient name").fill("Layla Hassan");
    await page.getByLabel("Mobile").fill("36007777");
    await page.getByLabel("Area").fill("Manama");
    await page.getByLabel("Block").fill("304");
    await page.getByLabel("Road").fill("1502");
    await page.getByLabel("Building").fill("12");
    await page.getByRole("button", { name: "Add address" }).click();

    await expect(page.getByText("Layla Hassan · +973 3600 7777").or(page.getByText("Layla Hassan"))).toBeVisible();
  });
});
