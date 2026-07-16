import { test, expect } from "@playwright/test";

test("public landing page leads to the account flow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "PPL Prep Designed for You." })).toBeVisible();
  await page.getByRole("link", { name: "Create account" }).first().click();
  await expect(page).toHaveURL(/\/login\?mode=signup/);
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  await expect(page.getByLabel("Preferred aircraft")).toBeVisible();
});

test("login provides password visibility and recovery controls", async ({ page }) => {
  await page.goto("/login");
  const password = page.locator("#password");
  await expect(password).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(password).toHaveAttribute("type", "text");
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
});

test("protected pages redirect signed-out visitors to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard|\/login\?next=\/dashboard/);
});

test("AI chat rejects requests without a verified session", async ({ request }) => {
  const response = await request.post("/api/chat", {
    data: {
      messages: [{ role: "user", content: "Begin the oral examination." }],
      mode: "intermediate",
      questionCount: 10,
      sessionKey: "5a1b9b2a-f75d-4fbb-9d89-25e1e8c2d57a",
    },
  });
  expect(response.status()).toBe(401);
});
