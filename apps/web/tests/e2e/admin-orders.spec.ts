import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import type { Brand, Category, Product } from "@/core/catalog/entities";
import { buildSearchTokens } from "@/core/catalog/rules";
import { FirestoreBrandRepository } from "@/infrastructure/firebase/repositories/firestore-brand-repository";
import { FirestoreCategoryRepository } from "@/infrastructure/firebase/repositories/firestore-category-repository";
import { FirestoreProductRepository } from "@/infrastructure/firebase/repositories/firestore-product-repository";
import { ORDERS_MANAGER_EMAIL, ORDERS_MANAGER_PASSWORD } from "./global-setup";

let product: Product;

/**
 * A single, purpose-built product fixture — deliberately **not**
 * `storefront-fixtures.ts#seedStorefrontFixtures`, even though that
 * helper would be the obvious reuse. Its `withVariants` product always
 * adds rows to `/admin/inventory` (`services/catalog/inventory-overview.ts`
 * pushes one row per variant whenever `product.hasVariants`, regardless of
 * that variant's own `trackInventory` flag), which collides with
 * `catalog.spec.ts`'s own "exactly one product exists" assumption on that
 * same page — every spec here shares one un-reset Firestore emulator for
 * the whole `pnpm run test:e2e:auth` run (see `playwright.auth.config.ts`'s
 * `workers: 1` doc comment), so any fixture product with variants is a
 * cross-file pollution hazard regardless of file execution order. This
 * fixture's product has no variants and `trackInventory: false` (an
 * ordinary, fully-supported catalog item — see README's Stock reservation
 * lifecycle section on untracked lines), so it can never appear on
 * `/admin/inventory` at all.
 */
async function seedOrderableProduct(): Promise<Product> {
  const categories = new FirestoreCategoryRepository();
  const brands = new FirestoreBrandRepository();
  const products = new FirestoreProductRepository();
  const suffix = randomUUID().slice(0, 8);
  const now = new Date();

  const category: Category = {
    id: randomUUID(),
    name: `Admin Orders E2E ${suffix}`,
    slug: `admin-orders-e2e-${suffix}`,
    parentId: null,
    sortOrder: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    createdBy: "e2e-admin-orders-setup",
    updatedBy: "e2e-admin-orders-setup",
  };
  await categories.create(category);

  const brand: Brand = {
    id: randomUUID(),
    name: `Admin Orders Roasters ${suffix}`,
    slug: `admin-orders-roasters-${suffix}`,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    createdBy: "e2e-admin-orders-setup",
    updatedBy: "e2e-admin-orders-setup",
  };
  await brands.create(brand);

  const name = `Admin Orders Blend ${suffix}`;
  const sku = `AOE-${suffix}`;
  const seeded: Product = {
    id: randomUUID(),
    name,
    slug: `admin-orders-blend-${suffix}`,
    brandId: brand.id,
    primaryCategoryId: category.id,
    additionalCategoryIds: [],
    productType: "coffee_beans",
    status: "active",
    visibility: "visible",
    featured: false,
    sku,
    basePrice: 1899,
    trackInventory: false,
    allowBackorder: false,
    tags: [],
    hasVariants: false,
    variants: [],
    images: [],
    shortDescription: "A blend seeded only for the admin order-management e2e spec.",
    searchTokens: buildSearchTokens({ name, sku, tags: [], productType: "coffee_beans", brandName: brand.name, categoryName: category.name }),
    version: 1,
    createdAt: now,
    updatedAt: now,
    createdBy: "e2e-admin-orders-setup",
    updatedBy: "e2e-admin-orders-setup",
  };
  await products.create(seeded);
  return seeded;
}

test.beforeAll(async () => {
  product = await seedOrderableProduct();
});

/**
 * Phase 6's admin order-management e2e coverage — deliberately **one
 * single login for the entire file** (every assertion below runs in one
 * continuous authenticated `page` session after that one login). This
 * isn't a style choice: `auth.spec.ts` + `catalog.spec.ts` already spend
 * 9 of `config/auth.ts#RATE_LIMITS.sessionCreateByIp`'s 10-per-15-minutes
 * budget (a real production safety limit, never weakened for tests — see
 * `storefront-fixtures.ts`'s doc comment for the same constraint applied
 * to a different tradeoff) within one `pnpm run test:e2e:auth` run, and
 * `SUPER_ADMIN_EMAIL` has *zero* spare `sessionCreateByEmail` attempts
 * left. `global-setup.ts` seeds a brand-new `ORDERS_MANAGER_EMAIL` fixture
 * specifically so this file's one login draws from a fresh per-email
 * budget while still only spending the IP budget's one remaining slot.
 * Placing the order itself needs no login at all — checkout is a public,
 * unauthenticated flow.
 */
test.describe("admin order management", () => {
  test("place an order, then manage it end-to-end through the admin screens", async ({ page }) => {
    const customerName = `Zainab Yusuf ${randomUUID().slice(0, 6)}`;
    const email = `admin-orders-e2e-${randomUUID().slice(0, 8)}@example.com`;

    // --- Place a real cash/pickup order through the public storefront (no login). ---
    await page.goto(`/products/${product.slug}`);
    await page.getByRole("button", { name: "Add to cart" }).click();
    await expect(page.getByText("Added to cart.")).toBeVisible();

    await page.goto("/checkout");
    await page.getByLabel("Full name").fill(customerName);
    await page.getByLabel("Mobile number").fill("36007777");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Pickup", { exact: true }).check();
    await page.getByLabel("Cash on pickup").check();
    await page.getByRole("button", { name: "Place order" }).click();

    await expect(page).toHaveURL(/\/checkout\/success\?order=/);
    const orderNumberMatch = /order=([^&]+)/.exec(page.url());
    const orderNumber = decodeURIComponent(orderNumberMatch?.[1] ?? "");
    expect(orderNumber).toMatch(/^ORD-\d{6}-[A-Z0-9]{6}$/);

    // --- The one login for this whole file. ---
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(ORDERS_MANAGER_EMAIL);
    await page.getByLabel("Password").fill(ORDERS_MANAGER_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/admin");

    // --- Orders list: search finds the order by its order number. ---
    await page.goto("/admin/orders");
    await page.getByLabel("Search").fill(orderNumber);
    await page.getByRole("button", { name: "Apply filters" }).click();
    await expect(page.getByRole("link", { name: orderNumber })).toBeVisible();

    // --- Order detail: customer/payment/fulfillment panels and the initial status. ---
    await page.getByRole("link", { name: orderNumber }).click();
    await expect(page).toHaveURL(/\/admin\/orders\//);
    await expect(page.getByRole("heading", { name: orderNumber })).toBeVisible();
    await expect(page.getByText(customerName)).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
    await expect(page.getByText("Confirmed", { exact: true })).toBeVisible();

    // --- Confirm cash payment, then walk the full status workflow to completion. ---
    await page.getByRole("button", { name: "Confirm cash payment" }).click();
    await expect(page.getByText("cash confirmed")).toBeVisible();

    await page.getByRole("button", { name: "Mark preparing" }).click();
    await expect(page.getByText("Preparing", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Mark ready" }).click();
    await expect(page.getByText("Ready", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Complete order" }).click();
    await expect(page.getByText("Completed", { exact: true })).toBeVisible();
    // A terminal order has no further status actions.
    await expect(page.getByRole("button", { name: "Cancel order" })).toHaveCount(0);

    // The status timeline recorded every transition, oldest first — scoped
    // to its own panel so these checks can't ambiguously match the status
    // badge/action buttons rendered elsewhere on the same page.
    const timeline = page.locator("ol").filter({ hasText: "Created as" });
    await expect(timeline.getByText(/Created as\s*confirmed/i)).toBeVisible();
    await expect(timeline.locator("li")).toHaveCount(4);

    // --- Customer management: the order rolled up into the customer aggregate. ---
    await page.goto("/admin/customers");
    await page.getByLabel("Search").fill(customerName.split(" ")[0]!);
    await page.getByRole("button", { name: "Apply filters" }).click();
    await expect(page.getByRole("link", { name: customerName })).toBeVisible();

    await page.getByRole("link", { name: customerName }).click();
    await expect(page.getByRole("heading", { name: customerName })).toBeVisible();
    // The order rolled up into this customer's order-history panel — the
    // exact totals math (totalOrders/totalSpent) is covered by
    // core/customer/rules.ts's own unit tests, not re-asserted pixel-by-
    // pixel here.
    await expect(page.getByRole("link", { name: orderNumber })).toBeVisible();

    // --- Dashboard: tiles and recent orders render. ---
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Total orders")).toBeVisible();
    await expect(page.getByText("Completed", { exact: true }).first()).toBeVisible();

    // --- Reports: the reporting foundation screens render, including
    // Phase 8's cash/online payments summaries and the pending-cash
    // collection worklist. ---
    await page.goto("/admin/reports");
    await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Best selling products" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Orders by status" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cash payments" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Online payments (Tap)" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pending cash collection" })).toBeVisible();
    // This order was confirmed above, so it no longer counts as pending —
    // the section renders its empty state rather than a stale row.
    await expect(page.getByText("No cash payments are waiting to be collected.")).toBeVisible();

    // --- Integrations: renders with no runtime error. ORDERS_MANAGER has
    // no integrations:view (least-privilege — see global-setup.ts), so
    // this also doubles as coverage that the permission gate itself works. ---
    await page.goto("/admin/integrations");
    await expect(page.getByText("You don't have permission to view this page.")).toBeVisible();

    // --- AI Admin Assistant: renders and answers using the rules-based
    // fallback (no ANTHROPIC_API_KEY in this test environment — see
    // infrastructure/ai/rule-based-assistant-provider.ts). ---
    await page.goto("/admin/ai-assistant");
    await expect(page.getByRole("heading", { name: "AI Admin Assistant" })).toBeVisible();
    await page.getByLabel("Ask about your store").fill("How's business?");
    await page.getByRole("button", { name: "Ask" }).click();
    await expect(page.getByText(/Total orders:/)).toBeVisible();
    await expect(page.getByText("Store data snapshot")).toBeVisible();
  });
});
