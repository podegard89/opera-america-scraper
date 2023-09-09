import dotenv from "dotenv";
dotenv.config();

import puppeteer from "puppeteer";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { addRows, scrapeOrgPageData } from "./helpers";

(async () => {
  console.log("Scraping organization page data...");

  const browser = await puppeteer.launch({ headless: "new" });

  const url = process.env.URL;

  if (!url) throw new Error("URL not found");

  const orgData = await scrapeOrgPageData(browser, url);

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

  //   await addRows(doc, orgData, 2);

  console.log("Data scraped and added to spreadsheet! 🎉");
})();
