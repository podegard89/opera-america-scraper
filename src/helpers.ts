import { GoogleSpreadsheet } from "google-spreadsheet";
import z from "zod";
import { Browser } from "puppeteer";

const RowDataSchema = z.object({
  companyName: z.string(),
  city: z.string(),
  state: z.string(),
  budgetGroup: z.string(),
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
): Promise<string[]> {
  const dataCells: string[] = [];

  const membershipCategories: string[] = [];

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

    dataCells.push(...currentMembershipTableDataCells);

    await page.click("a.pager__next");
    currentPage++;
  }

  return dataCells;
}

export function mapDataCellsToRows(dataCells: string[]) {
  const rows: Row[] = [];

  // start at 1 to skip the initial image cell
  for (let i = 1; i < dataCells.length; i += 5) {
    const row = {
      companyName: dataCells[i]?.trim().toUpperCase(),
      city: dataCells[i + 1]?.trim().toUpperCase(),
      state: dataCells[i + 2]?.trim().toUpperCase(),
      budgetGroup: dataCells[i + 3]?.trim().toUpperCase(),
    };

    const validRow = RowDataSchema.parse(row);

    const rowIsHeader =
      validRow.companyName === "COMPANY NAME" &&
      validRow.city === "CITY" &&
      validRow.state === "STATE" &&
      validRow.budgetGroup === "BUDGET GROUP";

    if (rowIsHeader) continue;

    rows.push(validRow);
  }

  return rows;
}
