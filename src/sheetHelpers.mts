import { GoogleSpreadsheet } from "google-spreadsheet";
import z from "zod";

export const RowDataSchema = z.object({
  companyName: z.string(),
  city: z.string(),
  state: z.string(),
  budgetGroup: z.string(),
});

export type Row = z.infer<typeof RowDataSchema>;

export async function load(doc: GoogleSpreadsheet) {
  await doc.loadInfo();
}

export async function addRows(
  doc: GoogleSpreadsheet,
  rows: Row[],
  i: number = 0
) {
  const sheet = doc.sheetsByIndex[i];

  if (!sheet) throw new Error("Sheet not found");

  await sheet.addRows(rows);
}
