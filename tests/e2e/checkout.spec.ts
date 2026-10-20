import { test, expect, type Page } from "@playwright/test";

const CUSTOMER = {
  email: process.env.SEED_CUSTOMER_EMAIL ?? "customer@anithaarunthadhi.test",
  password: process.env.SEED_CUSTOMER_PASSWORD ?? "Customer@12345",
};
const ADMIN = {
  email: process.env.SEED_ADMIN_EMAIL ?? "admin@anithaarunthadhi.test",
  password: process.env.SEED_ADMIN_PASSWORD ?? "Admin@12345",
};
const USE_RAZORPAY = process.env.E2E_RAZORPAY === "1";

async function login(page: Page, creds: { email: string; password: string }) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(creds.email);
  await page.getByLabel("Password").fill(creds.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}

test.describe.serial("customer checkout → admin status update", () => {
  let orderNumber = "";

  test("customer logs in, adds to cart and checks out", async ({ page }) => {
    await login(page, CUSTOMER);

    // Home → brand grid → products
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Anithaarunthadhi");
    await page.getByRole("tab", { name: "2 Wheeler" }).click();
    await page.getByRole("link", { name: /Hero accessories/i }).click();
    await expect(page).toHaveURL(/\/products\?brand=hero/);

    // Add first in-stock product
    const addBtn = page.getByRole("button", { name: /^Add .* to cart$/ }).first();
    await addBtn.click();
    await expect(page.getByText(/Added 1 ×/)).toBeVisible();

    // Cart → checkout
    await page.goto("/cart");
    await page.getByRole("button", { name: /Place order/ }).click();
    await expect(page).toHaveURL(/\/checkout/);

    // Ensure an address exists
    const hasAddress = await page
      .getByRole("radio")
      .first()
      .isVisible()
      .catch(() => false);
    if (!hasAddress) {
      await page.getByRole("button", { name: "Add new address" }).click();
      await page.getByLabel("Full name").fill("E2E Customer");
      await page.getByLabel("Phone").fill("9876543210");
      await page.getByLabel("Address line 1").fill("1 Test Street");
      await page.getByLabel("City").fill("Chennai");
      await page.getByLabel("State").fill("Tamil Nadu");
      await page.getByLabel("Pincode").fill("600001");
      await page.getByRole("button", { name: "Save address" }).click();
    }

    if (USE_RAZORPAY) {
      await page.getByText("Pay online").click();
      await page.getByRole("button", { name: /^Pay ₹/ }).click();
      // Razorpay test checkout iframe: pick "Success" in the test bank page
      const frame = page.frameLocator("iframe.razorpay-checkout-frame");
      await frame
        .getByText(/Netbanking|Net Banking/i)
        .first()
        .click();
      await frame
        .getByText(/HDFC|SBI|ICICI/)
        .first()
        .click();
      await frame.getByRole("button", { name: /Pay/ }).click();
      const bank = page.waitForEvent("popup").catch(() => null);
      const popup = await bank;
      if (popup) {
        await popup.getByRole("button", { name: /Success/i }).click();
      }
    } else {
      await page.getByText("Cash on Delivery").click();
      await page.getByRole("button", { name: "Place order" }).click();
    }

    await page.waitForURL(/\/orders\/[0-9a-f-]+\?placed=1/);
    await expect(page.getByText("Order placed successfully!")).toBeVisible();
    orderNumber =
      (await page.getByRole("heading", { level: 1 }).textContent())?.replace("Order ", "").trim() ?? "";
    expect(orderNumber).toMatch(/^AN-\d{8}-[A-Z0-9]{4}$/);
  });

  test("admin confirms and ships the order; customer sees timeline", async ({ page }) => {
    test.skip(!orderNumber, "depends on previous test");
    await login(page, ADMIN);
    await expect(page).toHaveURL(/\/admin/);
    await page.goto(`/admin/orders?q=${orderNumber}`);
    await page.getByRole("link", { name: orderNumber }).click();

    // Placed → Confirmed
    await page.getByRole("combobox").filter({ hasText: "Choose next status" }).click();
    await page.getByRole("option", { name: "Confirmed" }).click();
    await page.getByRole("button", { name: /Save status/ }).click();
    await expect(page.getByText("Status updated to confirmed")).toBeVisible();

    // Add tracking
    await page.getByLabel("Courier").fill("Delhivery");
    await page.getByLabel("Tracking number").fill("DLV123456789");
    await page.getByRole("button", { name: "Save tracking" }).click();
    await expect(page.getByText("Tracking saved")).toBeVisible();

    // Confirmed → Packed → Shipped
    for (const next of ["Packed", "Shipped"]) {
      await page.getByRole("combobox").filter({ hasText: "Choose next status" }).click();
      await page.getByRole("option", { name: next }).click();
      await page.getByRole("button", { name: /Save status/ }).click();
      await expect(page.getByText(`Status updated to ${next.toLowerCase()}`)).toBeVisible();
    }

    // Customer view
    await page.request.post("/auth/signout");
    await login(page, CUSTOMER);
    await page.goto("/orders");
    await page.getByRole("link", { name: "View details" }).first().click();
    await expect(page.getByText("DLV123456789")).toBeVisible();
    await expect(page.getByRole("list", { name: "Order progress" })).toBeVisible();
  });
});
