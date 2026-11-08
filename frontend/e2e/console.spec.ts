import { expect, test, type Page } from "@playwright/test";

/**
 * The owner's console and the signed-in header, in a real browser.
 *
 * These exist because the bugs they cover were invisible to curl: a header
 * that still offered "Sign in" to someone already signed in, and a sidebar
 * that had to survive a phone-width screen without pushing the page sideways.
 */

const OWNER = process.env.E2E_OWNER_EMAIL ?? "owner@orbit.local";
const PASSWORD = process.env.E2E_OWNER_PASSWORD ?? "";
const CLIENT = process.env.E2E_CLIENT_EMAIL ?? "";
const CLIENT_PASSWORD = process.env.E2E_CLIENT_PASSWORD ?? "";

const SIZES = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "laptop", width: 1440, height: 900 },
];

async function signInAs(page: Page, email: string, password: string, lands: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(`**${lands}**`, { timeout: 20000 });
}

async function signIn(page: Page) {
  await signInAs(page, OWNER, PASSWORD, "/dashboard");
}

test.describe("signed out", () => {
  test("the header offers a way in", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
  });
});

test.describe("signed in as the owner", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("lands on the console with a sidebar, not the marketing header", async ({
    page,
  }) => {
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Dashboard" })).toBeVisible();
    // The promotional strip sells the offer. Someone signed in is past it.
    await expect(page.getByText("Website build from R500")).toHaveCount(0);
  });

  test("the public site no longer offers Sign in", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Dashboard" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0);
    await expect(page.getByText("Website build from R500")).toBeHidden();
  });

  test("every console page loads and names itself", async ({ page }) => {
    for (const [path, heading] of [
      ["/dashboard", "Overview"],
      ["/dashboard/clients", "Clients"],
      ["/dashboard/payments", "Payments"],
      ["/dashboard/requests", "Requests"],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
    }
  });

  test("the sidebar marks where you are", async ({ page }) => {
    await page.goto("/dashboard/payments");
    const nav = page.getByRole("navigation", { name: "Dashboard" });
    await expect(nav.getByRole("link", { name: /Payments/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(nav.getByRole("link", { name: /Overview/ })).not.toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});

test.describe("responsive", () => {
  for (const size of SIZES) {
    test(`console fits a ${size.name} without sideways scrolling`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await signIn(page);

      for (const path of [
        "/dashboard",
        "/dashboard/clients",
        "/dashboard/payments",
        "/dashboard/requests",
      ]) {
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

        // A page wider than its own window is the classic broken layout.
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `${path} at ${size.name} overflows by ${overflow}px`).toBeLessThanOrEqual(1);
      }
    });
  }

  test("phone gets a drawer instead of a fixed sidebar", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page);

    // Hidden until asked for, because 64 columns of sidebar leaves no page.
    await expect(page.getByRole("navigation", { name: "Dashboard" })).toBeHidden();
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByRole("navigation", { name: "Dashboard" })).toBeVisible();

    await page.getByRole("link", { name: /Clients/ }).first().click();
    await expect(page.getByRole("heading", { name: "Clients", level: 1 })).toBeVisible();
  });

  test("the public pages fit a phone too", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const path of ["/", "/services", "/pricing", "/contact", "/login", "/register"]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} overflows by ${overflow}px`).toBeLessThanOrEqual(1);
    }
  });
});

// The client portal. Skipped unless a client login is supplied, so the suite
// still runs on a database that has no clients in it yet.
test.describe("the client portal", () => {
  test.skip(
    !CLIENT || !CLIENT_PASSWORD,
    "set E2E_CLIENT_EMAIL and E2E_CLIENT_PASSWORD to run these",
  );

  test.beforeEach(async ({ page }) => {
    await signInAs(page, CLIENT, CLIENT_PASSWORD, "/account");
  });

  test("has its own sidebar and none of the marketing chrome", async ({ page }) => {
    await expect(page.getByRole("navigation", { name: "Your account" })).toBeVisible();
    await expect(page.getByText("Website build from R500")).toHaveCount(0);
    // A signed-in client being offered "Sign in" was the bug that started this.
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0);
  });

  test("every page loads and names itself", async ({ page }) => {
    for (const [path, heading] of [
      ["/account/website", "My website"],
      ["/account/services", "Services"],
      ["/account/billing", "Billing"],
      ["/account/support", "Support"],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
    }
  });

  test("a client cannot reach the owner's console", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/account**", { timeout: 20000 });
    await expect(page.getByRole("navigation", { name: "Dashboard" })).toHaveCount(0);
  });

  test("fits a phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const path of [
      "/account",
      "/account/website",
      "/account/services",
      "/account/billing",
      "/account/support",
    ]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} overflows by ${overflow}px`).toBeLessThanOrEqual(1);
    }
  });
});
