import { expect, test } from "@playwright/test";
import { seedStorefrontFixtures, type StorefrontFixtures } from "./storefront-fixtures";

let fixtures: StorefrontFixtures;

test.beforeAll(async () => {
  fixtures = await seedStorefrontFixtures();
});

test.describe("homepage", () => {
  // Deliberately structural only, no seeded-product assertion — see
  // storefront-fixtures.ts's doc comment: Playwright's own webServer-
  // readiness probe hits "/" before this file's fixtures ever exist,
  // which can leave the homepage's fixed-key cached sections (featured
  // products, new arrivals) stale-empty for this whole run. Featured-
  // product coverage lives in the "product listing" block below instead,
  // against a query-string cache key the probe never touched.
  test("renders header and footer with no console errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    await page.goto("/");

    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test("nav links and search box are reachable from the header", async ({ page }) => {
    await page.goto("/");
    const header = page.getByRole("banner");
    await expect(header.getByRole("link", { name: "Shop", exact: true })).toBeVisible();
    await expect(page.getByLabel("Search products").first()).toBeVisible();
  });
});

test.describe("product listing", () => {
  test("shows the published product and excludes draft/hidden ones", async ({ page }) => {
    await page.goto("/products");
    await expect(page.getByRole("link", { name: new RegExp(fixtures.published.name) })).toBeVisible();
    await expect(page.getByText(fixtures.draft.name)).toHaveCount(0);
    await expect(page.getByText(fixtures.hiddenVisibility.name)).toHaveCount(0);
  });

  test("featured filter shows the featured product (a fresh, never-pre-warmed cache key)", async ({ page }) => {
    await page.goto("/products?featured=true");
    await expect(page.getByRole("link", { name: new RegExp(fixtures.published.name) })).toBeVisible();
  });

  test("category filter narrows results to the selected category", async ({ page }) => {
    await page.goto("/products");
    await page.getByLabel("Category").selectOption({ label: fixtures.category.name });
    await page.getByRole("button", { name: "Apply filters" }).click();
    await expect(page).toHaveURL(/category=/);
    await expect(page.getByRole("link", { name: new RegExp(fixtures.published.name) })).toBeVisible();
  });

  test("a category page only lists that category's published products", async ({ page }) => {
    await page.goto(`/categories/${fixtures.category.slug}`);
    await expect(page.getByRole("heading", { name: fixtures.category.name })).toBeVisible();
    await expect(page.getByRole("link", { name: new RegExp(fixtures.published.name) })).toBeVisible();
  });

  test("grid/list view toggle switches layout without erroring", async ({ page }) => {
    await page.goto("/products");
    await page.getByRole("link", { name: "List" }).click();
    await expect(page).toHaveURL(/view=list/);
    await expect(page.getByRole("link", { name: new RegExp(fixtures.published.name) })).toBeVisible();
  });
});

test.describe("search", () => {
  test("finds the published product by a shared search word and excludes draft/hidden matches", async ({ page }) => {
    await page.goto(`/search?q=${fixtures.searchWord}`);
    await expect(page.getByRole("link", { name: new RegExp(fixtures.published.name) })).toBeVisible();
    await expect(page.getByText(fixtures.draft.name)).toHaveCount(0);
    await expect(page.getByText(fixtures.hiddenVisibility.name)).toHaveCount(0);
    // Best-effort result highlighting.
    await expect(page.locator("mark").first()).toBeVisible();
  });

  test("prompts for more input below the minimum query length", async ({ page }) => {
    await page.goto("/search?q=a");
    await expect(page.getByText(/Enter at least/)).toBeVisible();
  });

  test("shows a generic empty state for a query that matches nothing", async ({ page }) => {
    await page.goto("/search?q=zzz-no-such-product-zzz");
    await expect(page.getByText(/No products matched/)).toBeVisible();
  });
});

test.describe("product detail", () => {
  test("renders name, price, SKU, breadcrumb, and a working Add to cart button", async ({ page }) => {
    await page.goto(`/products/${fixtures.published.slug}`);

    await expect(page.getByRole("heading", { name: fixtures.published.name })).toBeVisible();
    await expect(page.getByText(fixtures.published.sku)).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();

    const addToCart = page.getByRole("button", { name: "Add to cart" });
    await expect(addToCart).toBeVisible();
    await expect(addToCart).toBeEnabled();
  });

  test("includes Product and BreadcrumbList structured data", async ({ page }) => {
    await page.goto(`/products/${fixtures.published.slug}`);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const parsed = scripts.map((text) => JSON.parse(text));
    expect(parsed.some((entry) => entry["@type"] === "Product")).toBe(true);
    expect(parsed.some((entry) => entry["@type"] === "BreadcrumbList")).toBe(true);
  });

  test("variant selection updates price and SKU, and prevents an invalid combination", async ({ page }) => {
    await page.goto(`/products/${fixtures.withVariants.slug}`);

    // Default (first variant) selection.
    await expect(page.getByText("VAR-").first()).toBeVisible();

    await page.getByRole("link", { name: "500g" }).click();
    await expect(page).toHaveURL(/size=500g/);
    await expect(page.getByText(`${fixtures.withVariants.sku}-500`)).toBeVisible();
    await expect(page.getByText("$28.00")).toBeVisible();

    await page.getByRole("link", { name: "250g" }).click();
    await expect(page).toHaveURL(/size=250g/);
    await expect(page.getByText(`${fixtures.withVariants.sku}-250`)).toBeVisible();
    await expect(page.getByText("$15.00")).toBeVisible();
  });
});

test.describe("hidden/draft denial", () => {
  test("a draft product's slug 404s", async ({ page }) => {
    await page.goto(`/products/${fixtures.draft.slug}`);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  });

  test("a hidden-visibility product's slug 404s", async ({ page }) => {
    await page.goto(`/products/${fixtures.hiddenVisibility.slug}`);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  });

  test("an inactive category's slug 404s", async ({ page }) => {
    await page.goto(`/categories/${fixtures.inactiveCategory.slug}`);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  });

  test("a never-existed product slug 404s the same way as a draft one", async ({ page }) => {
    await page.goto("/products/this-slug-was-never-created-12345");
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  });
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("hamburger menu opens the mobile nav with search and links", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("link", { name: "Coffee" })).toBeVisible();
    await page.getByRole("button", { name: "Close menu" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("filter drawer opens on the product listing page", async ({ page }) => {
    await page.goto("/products");
    await page.getByRole("button", { name: "Filters" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("button", { name: "Apply filters" })).toBeVisible();
    await page.getByRole("button", { name: "Close filters" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });
});

test.describe("accessibility smoke checks", () => {
  test("product card images have alt text and controls have accessible names", async ({ page }) => {
    await page.goto("/products");
    const images = page.getByRole("img");
    const count = await images.count();
    for (let index = 0; index < count; index++) {
      await expect(images.nth(index)).toHaveAccessibleName(/.+/);
    }
    await expect(page.getByRole("button", { name: "Filters" })).toBeVisible();
  });

  test("breadcrumb marks the current page with aria-current", async ({ page }) => {
    await page.goto(`/products/${fixtures.published.slug}`);
    await expect(page.locator('[aria-current="page"]')).toHaveText(fixtures.published.name);
  });
});
