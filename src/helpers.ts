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
): Promise<[string[], string[]]> {
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
    const currentMembershipCategories = await page.$$eval(
      "div.directorytable__type",
      (categories) =>
        categories.map((category) => {
          const text = category.textContent;
          if (!text) throw new Error("error parsing membership categories");
          // if (membershipCategories.includes(text)) return "Duplicate";
          return text;
        })
    );

    membershipCategories.push(...currentMembershipCategories);

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

  const filteredCategories: string[] = [];

  for (const category of membershipCategories) {
    if (category && !filteredCategories.includes(category)) {
      filteredCategories.push(category);
    }
  }

  return [dataCells, filteredCategories];
}

export function mapDataCellsToRows(dataCells: string[], categories: string[]) {
  const rows: Row[] = [];

  let categoryIndex = 0;
  let lastCategoryUsed: string | undefined;

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

    console.log("\nRow is header: " + rowIsHeader);

    const currentCat = categories[categoryIndex];

    const categoryIsUsed = currentCat === lastCategoryUsed;
    console.log("category is used: " + categoryIsUsed + "\n");

    // it feels bad to use a nested conditional but I think in this case it is okay!
    if (rowIsHeader) {
      if (!categoryIsUsed) {
        rows.push({ companyName: "", city: "", state: "", budgetGroup: "" });
        rows.push({
          companyName: currentCat || "",
          city: "",
          state: "",
          budgetGroup: "",
        });
        rows.push(validRow);
        lastCategoryUsed = currentCat;
        categoryIndex++;
      }
      continue;
    }

    rows.push(validRow);
  }

  return rows;
}
