import { expect, test, type Page } from "@playwright/test";
import {
  NO_PERMISSION_STAFF_EMAIL,
  NO_PERMISSION_STAFF_PASSWORD,
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_PASSWORD,
} from "./global-setup";

async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/admin");
}

test.describe("protected-route redirect (logged out)", () => {
  test("visiting /admin redirects to /admin/login", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL("**/admin/login**");
  });

  test("visiting /admin/staff redirects to /admin/login", async ({ page }) => {
    await page.goto("/admin/staff");
    await page.waitForURL("**/admin/login**");
  });
});

test.describe("login", () => {
  test("valid credentials sign in and redirect to the dashboard", async ({ page }) => {
    await loginViaUi(page, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText(SUPER_ADMIN_EMAIL).first()).toBeVisible();
  });

  test("invalid credentials show an error and stay on the login page", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(SUPER_ADMIN_EMAIL);
    await page.getByLabel("Password").fill("the-wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    expect(page.url()).toContain("/admin/login");
  });
});

test.describe("authorization", () => {
  test("a super admin sees staff and roles page content", async ({ page }) => {
    await loginViaUi(page, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD);

    await page.goto("/admin/staff");
    await expect(page.getByRole("heading", { name: "Staff", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Add staff account" })).toBeVisible();

    await page.goto("/admin/roles");
    await expect(page.getByRole("heading", { name: "Roles" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Create role" })).toBeVisible();
  });

  test("a staff member with no permissions is denied on staff and roles pages", async ({ page }) => {
    await loginViaUi(page, NO_PERMISSION_STAFF_EMAIL, NO_PERMISSION_STAFF_PASSWORD);

    await page.goto("/admin/staff");
    await expect(page.getByText("You don't have permission to view this page.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Staff", exact: true })).not.toBeVisible();

    await page.goto("/admin/roles");
    await expect(page.getByText("You don't have permission to view this page.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Roles" })).not.toBeVisible();
  });

  test("a staff member with no permissions does not see Staff/Roles nav links", async ({ page }) => {
    await loginViaUi(page, NO_PERMISSION_STAFF_EMAIL, NO_PERMISSION_STAFF_PASSWORD);
    await expect(page.getByRole("link", { name: "Staff" })).not.toBeVisible();
    await expect(page.getByRole("link", { name: "Roles" })).not.toBeVisible();
  });
});

test.describe("logout", () => {
  test("signing out clears the session and protected routes redirect again", async ({ page }) => {
    await loginViaUi(page, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD);

    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL("**/admin/login**");

    await page.goto("/admin");
    await page.waitForURL("**/admin/login**");
  });
});
