import { expect, test } from "@playwright/test";
import { EMAIL, PASSWORD, SECRET, signIn } from "./support";

test.skip(!EMAIL || !PASSWORD || !SECRET, "E2E_EMAIL, E2E_PASSWORD and E2E_TOTP_SECRET are not set");

const MESSAGE = "Запись не найдена. Обновите страницу и попробуйте ещё раз.";

const CASES: { name: string; path: string; fields: Record<string, string> }[] = [
  { name: "petId on the animal list", path: "/volunteer", fields: { petId: "not-a-uuid", status: "в процессе" } },
  { name: "projectId on the project list", path: "/volunteer/projects", fields: { intent: "status", projectId: "not-a-uuid", status: "идёт" } },
  { name: "itemId when receiving a purchase", path: "/volunteer/needs", fields: { intent: "receive", itemId: "not-a-uuid", amount: "1" } },
  { name: "logId when undoing a purchase", path: "/volunteer/needs", fields: { intent: "undo", logId: "1 or 1=1" } },
  { name: "itemId when recording consumption", path: "/volunteer/needs/open", fields: { intent: "consume", itemId: "not-a-uuid", amount: "1" } },
  { name: "itemId on the stock list", path: "/volunteer/needs/stock", fields: { intent: "consume", itemId: "00000000-0000-0000-0000-00000000000g", amount: "1" } },
  { name: "itemId when archiving a need", path: "/volunteer/needs/closed", fields: { intent: "archive", itemId: "not-a-uuid", archived: "1" } },
];

test.skip(({ viewport }) => (viewport?.width ?? 0) < 900, "forms do not depend on the screen");

for (const { name, path, fields } of CASES) {
  test(`a wrong ${name} returns to the list with a message`, async ({ page }) => {
    await signIn(page);
    await page.goto(path);
    const response = page.waitForResponse((answer) => answer.request().method() === "POST");
    await page.evaluate(
      ({ action, values }) => {
        const form = document.createElement("form");
        form.method = "post";
        form.action = action;
        for (const [key, value] of Object.entries(values)) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value;
          form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
      },
      { action: path, values: { ...fields, back: path } },
    );
    expect((await response).status()).toBe(303);
    await expect(page).toHaveURL(new RegExp(`${path.replace(/\//g, "\\/")}$`));
    await expect(page.getByRole("alert").filter({ hasText: MESSAGE })).toBeVisible();
    await page.reload();
    await expect(page.getByText(MESSAGE)).toHaveCount(0);
  });
}
