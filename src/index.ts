import dotenv from "dotenv";
dotenv.config();

import puppeteer from "puppeteer";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import {
  addRows,
  mapDataCellsToRows,
  scrapeOperaMembershipData,
} from "./helpers";

(async () => {
  console.log("Scraping data...");

  const browser = await puppeteer.launch({ headless: "new" });

  const url = process.env.URL;

  if (!url) throw new Error("URL not found");

  const allMembershipTableDataCells = await scrapeOperaMembershipData(
    browser,
    url
  );

  await browser.close();

  const serviceAccountAuth = new JWT({
    email: process.env.CLIENT_EMAIL,
    key: process.env.PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(
    process.env.SHEET_ID || "",
    serviceAccountAuth
  );

  await doc.loadInfo();

  const rowsToBeAdded = mapDataCellsToRows(allMembershipTableDataCells);

  await addRows(doc, rowsToBeAdded);

  console.log("Data scraped and added to spreadsheet! 🎉");
})();
