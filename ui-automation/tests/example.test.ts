import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:5173");
});

test("has title", async ({ page }) => {
  await expect(page).toHaveTitle(/WebChat/);
});

test("connects to websocket", async ({ page }) => {
  await page.getByTestId("connect-btn").click();
  await page.waitForTimeout(500);

  await page.screenshot({ path: "screenshot.png" });
  await expect(page.getByText("Connected Successfully")).toBeVisible();

  await expect(page.getByTestId("chat-interface")).toBeVisible();

  await expect(page.getByTestId("connect-btn")).toBeDisabled();

  await expect(page.getByTestId("disconnect-btn")).toBeEnabled();
});

test("disconnects websocket", async ({ page }) => {
  await page.getByTestId("connect-btn").click();

  await expect(page.getByText("Connected Successfully")).toBeVisible();

  await page.getByTestId("disconnect-btn").click();

  await expect(page.getByText("Disconnected Successfully")).toBeVisible();

  await expect(page.getByTestId("connect-btn")).toBeEnabled();
});
