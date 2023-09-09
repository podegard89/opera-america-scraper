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

export async function scrapeOperaMembershipData(browser: Browser, url: string) {
  const dataCells: string[] = [];

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

export function mapDataCellsToRows(arr: string[]) {
  const rows: Row[] = [];

  // i starts at 6 to skip the header row on the web page,
  // and then increments by 5 to skip the image column at the start of each row
  for (let i = 6; i < arr.length; i += 5) {
    const row = {
      companyName: arr[i],
      city: arr[i + 1],
      state: arr[i + 2],
      budgetGroup: arr[i + 3],
    };

    const validRow = RowDataSchema.parse(row);

    rows.push(validRow);
  }

  return rows;
}
