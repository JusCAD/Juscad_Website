import { expect, test } from "@playwright/test";

for (const [path, heading] of [["/blog", "Ideas under construction."], ["/privacy", "Privacy Policy"], ["/terms", "Terms and Conditions"], ["/sign-in", "Return to your workspace."]] as const) {
  test(`${path} renders without horizontal overflow`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    const sizes = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: window.innerWidth }));
    expect(sizes.document).toBeLessThanOrEqual(sizes.viewport);
  });
}

test("metadata endpoints expose only public routes", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toContain("Disallow: /admin/");
  const sitemap = await request.get("/sitemap.xml");
  const xml = await sitemap.text();
  expect(xml).toContain("https://juscad.com/privacy");
  expect(xml).not.toContain("/settings");
});

test("protected account routes redirect anonymous users", async ({ page }) => {
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/sign-in/);
});

test("beta form exposes accessible validation", async ({ page }) => {
  await page.goto("/beta");
  await page.getByRole("button", { name: "Request access" }).click();
  await expect(page.getByText("Enter your name.")).toBeVisible();
});

test("signup requires legal consent and keeps marketing optional", async ({ page }) => {
  await page.goto("/sign-up");
  const createAccount = page.getByRole("button", { name: "Create account" });
  const google = page.getByRole("button", { name: "Continue with Google" });
  await expect(createAccount).toBeDisabled();
  await expect(google).toBeDisabled();
  const legal = page.getByRole("checkbox", { name: /I agree to the Terms/ });
  const marketing = page.getByRole("checkbox", { name: /Send me occasional JusCAD product updates/ });
  await expect(legal).not.toBeChecked();
  await expect(marketing).not.toBeChecked();
  await legal.check();
  await expect(createAccount).toBeEnabled();
  await expect(google).toBeEnabled();
});

test("beta newsletter opt-in is optional", async ({ page }) => {
  await page.goto("/beta");
  await expect(page.getByRole("checkbox", { name: /product and beta updates/ })).not.toBeChecked();
});

test("invalid unsubscribe links fail safely", async ({ page }) => {
  await page.goto("/unsubscribe?token=invalid");
  await expect(page.getByRole("heading", { name: "This link is no longer valid." })).toBeVisible();
});
