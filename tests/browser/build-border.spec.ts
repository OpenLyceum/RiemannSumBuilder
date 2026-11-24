import { expect, test } from "@playwright/test";

test("the keyboard slider follows the selected border's limits", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?screens=1&ea");
  const border = page.getByRole("slider", { name: "Move selected border" });

  await border.press("End");
  await expect(border).toHaveAttribute("aria-valuetext", "0.99");
  await border.press("Home");
  await expect(border).toHaveAttribute("aria-valuetext", "0.01");

  await page.getByRole("button", { name: "Next", exact: true }).press("Enter");
  await border.press("End");
  await expect(border).toHaveAttribute("aria-valuetext", "1.49");
  await border.press("ArrowLeft");
  await expect(border).toHaveAttribute("aria-valuetext", "1.48");

  await page.getByRole("button", { name: "Reset All" }).press("Enter");
  await border.press("End");
  await page.getByRole("button", { name: "Split", exact: true }).press("Enter");
  await page.getByRole("button", { name: "Next", exact: true }).press("Enter");
  await border.press("Home");
  // Splitting at 0.495 makes the new minimum fall between the slider's 0.01 steps.
  await expect(border).toHaveAttribute("aria-valuetext", "0.51");
  expect(errors).toEqual([]);
});
