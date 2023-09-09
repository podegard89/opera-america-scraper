import { GoogleSpreadsheet } from "google-spreadsheet";
import z from "zod";
import { Browser, ElementHandle } from "puppeteer";

const RowDataSchema = z.object({
  companyName: z.string(),
  city: z.string(),
  state: z.string(),
  budgetGroup: z.string(),
  url: z.string(),
});

type Row = z.infer<typeof RowDataSchema>;

export async function addRows(
  doc: GoogleSpreadsheet,
  rows: Row[],
  i: number = 0
) {
  const sheet = doc.sheetsByIndex[i];

  if (!sheet) throw new Error("Sheet not found");

  await sheet.addRows(rows);
}

export async function scrapeOperaMembershipData(
  browser: Browser,
  url: string
): Promise<Row[]> {
  const dataCells: Row[] = [];

  const page = await browser.newPage();

  await page.goto(url);

  await page.select("select.pager__select", "48");

  let currentPage = 1;

  while (currentPage <= 11) {
    const currentMembershipTableDataRows = await page.$$(
      "div.directorytable__row"
    );

    for (const row of currentMembershipTableDataRows) {
      const [imgCell, companyCell, cityCell, stateCell, budgetCell] =
        await row.$$("div.directorytable__cell");

      const isHeaderRow =
        (await evaluateAndCleanCell(imgCell)) === "COMPANY NAME";

      if (isHeaderRow) continue;

      const url = await companyCell?.$eval(
        "h6 > a.directorytable__preview",
        (a) => a.href
      );

      const rowObj = {
        companyName: await evaluateAndCleanCell(companyCell),
        city: await evaluateAndCleanCell(cityCell),
        state: await evaluateAndCleanCell(stateCell),
        budgetGroup: await evaluateAndCleanCell(budgetCell),
        url: url?.trim(),
      };

      const validRow = RowDataSchema.parse(rowObj);
      dataCells.push(validRow);
    }

    await page.click("a.pager__next");
    currentPage++;
  }

  return dataCells;
}

async function evaluateAndCleanCell(
  cell: ElementHandle<HTMLDivElement> | undefined
) {
  const textContent = await cell?.evaluate((node) => node.textContent);

  if (!textContent && textContent !== "") {
    throw new Error("textContent not found");
  }

  return textContent.trim().toUpperCase();
}
