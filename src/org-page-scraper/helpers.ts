import { GoogleSpreadsheet } from "google-spreadsheet";
import { Browser } from "puppeteer";
import { z } from "zod";

const RowDataSchema = z.object({
  staffListings: z.record(z.string()),
  jobPostings: z.record(z.string()),
  email: z.string().email(),
});

type Row = z.infer<typeof RowDataSchema>;

export async function addRows(
  doc: GoogleSpreadsheet,
  rows: Row[],
  i: number = 0
) {
  const sheet = doc.sheetsByIndex[i];

  if (!sheet) throw new Error("Sheet not found");

  //   await sheet.addRows(rows);
}

export async function scrapeOrgPageData(browser: Browser, url: string) {}
