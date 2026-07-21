import { expect, test } from "@playwright/test";

async function presetLanguage(page, language = "en") {
  await page.addInitScript((lang) => {
    window.localStorage.setItem("app-language", lang);
  }, language);
}

async function presetStoredUser(page, user) {
  await page.addInitScript((storedUser) => {
    window.localStorage.setItem("app-user", JSON.stringify(storedUser));
  }, user);
}

test("first-visit language chooser closes and homepage navigation still works", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Choose your language")).toBeVisible();
  await page.getByRole("button", { name: "English" }).click();

  await expect(page.getByText("Choose your language")).toHaveCount(0);

  const projectsLink = page.locator('a[href="/projects"]:visible').first();
  await expect(projectsLink).toBeVisible();
  await projectsLink.click();

  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.locator("body")).toContainText(/Projects|Espoir|Association/i);
});

test("public home renders meaningful content", async ({ page }) => {
  await presetLanguage(page);
  await page.goto("/");
  await expect(page).toHaveTitle(/Ibt|Espoir|Association/i);
  await expect(page.locator("body")).toContainText(/Ibt|Espoir|Ibtassim/i);
});

test("projects catalog route still renders for public users", async ({ page }) => {
  await presetLanguage(page);
  await page.goto("/projects");
  await expect(page.locator("body")).toContainText(/PROJECTS|Projects/i);
  await expect(page.locator('input[placeholder*="earch"], input[placeholder*="بحث"]')).toBeVisible();
});

test("donation route renders the wizard shell", async ({ page }) => {
  await presetLanguage(page);
  await page.goto("/donate");
  await expect(page.locator("body")).toContainText(/Donation|تبرع/i);
  await expect(page.locator("body")).toContainText(/donation|تبرع|project/i);
});

test("kafala route renders the sponsorship surface", async ({ page }) => {
  await presetLanguage(page);
  await page.goto("/kafala");
  await expect(page.locator("body")).toContainText(/Kafala|Sponsor|كفالة/i);
});

test("about route still renders the association story", async ({ page }) => {
  await presetLanguage(page);
  await page.goto("/about");
  await expect(page.locator("body")).toContainText(/Who are we|Qui sommes-nous|من نحن/i);
  await expect(page.locator("body")).toContainText(/2018|Association Ibtassim|Ibtassim/i);
});

test("contact route still renders the contact form surface", async ({ page }) => {
  await presetLanguage(page);
  await page.goto("/contact");
  await expect(page.locator("body")).toContainText(/Contact Us|Contactez-nous|تواصل معنا/i);
  await expect(page.getByRole("button", { name: /Send Message|Envoyer|إرسال/i })).toBeVisible();
});

test("impact stories route still renders for public users", async ({ page }) => {
  await presetLanguage(page);
  await page.goto("/impact");
  await expect(page.locator("body")).toContainText(/Association Blog|Blog de l'association|مدونة الجمعية/i);
  await expect(page.locator("body")).toContainText(/All Posts|Tous les articles|جميع المنشورات|No posts yet|Aucun article|لا توجد منشورات/i);
});

test("admin login renders without a framework crash overlay", async ({ page }) => {
  await presetLanguage(page);
  await page.goto("/admin/login");
  await expect(page.getByRole("button", { name: /Login|دخول/i })).toBeVisible();
  await expect(page.locator("text=Unhandled Runtime Error")).toHaveCount(0);
});

test("anonymous users are redirected away from protected admin receipt routes", async ({ page }) => {
  await presetLanguage(page);
  await page.goto("/admin/receipts");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole("button", { name: /Login|دخول/i })).toBeVisible();
});

test("anonymous users are redirected away from protected admin settings routes", async ({ page }) => {
  await presetLanguage(page);
  await page.goto("/admin/settings");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole("button", { name: /Login|دخول/i })).toBeVisible();
});

test("spoofed admin local storage without a session token still fails closed", async ({ page }) => {
  await presetLanguage(page);
  await presetStoredUser(page, {
    id: "fake_admin",
    role: "admin",
    name: "Spoofed Admin",
    email: "spoof@example.com",
  });

  await page.goto("/admin/settings");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole("button", { name: /Login|دخول/i })).toBeVisible();
});

test("stale admin session tokens do not expose protected admin settings", async ({ page }) => {
  await presetLanguage(page);
  await presetStoredUser(page, {
    id: "admin_stale",
    role: "owner",
    name: "Expired Admin",
    email: "expired@example.com",
    sessionToken: "expired_session_token",
  });

  await page.goto("/admin/settings");
  await expect(page.getByText(/Checking|Login|Welcome|جاري|مرحب/i)).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/WhatsApp|الإعدادات|Team/i);
});
