import { Browser } from "puppeteer";

export async function scrapeOperaMembershipData(browser: Browser, url: string) {
  const allMembershipTableDataCells: string[] = [];

  const page = await browser.newPage();

  await page.goto(url);

  await page.select("select.pager__select", "48");

  let currentPage = Number(
    await page.$eval("input.field__input_pager", (input) => {
      return input.textContent || "";
    })
  );

  if (isNaN(currentPage)) throw new Error("error parsing current page number");

  while (currentPage <= 11) {
    const currentMembershipTableDataCells = await page.$$eval(
      "div.directorytable__cell",
      (cells) => {
        return cells.map((cell) => cell.textContent || "");
      }
    );

    allMembershipTableDataCells.push(...currentMembershipTableDataCells);

    await page.click("a.pager__next");
    currentPage++;
  }

  return allMembershipTableDataCells;
}
