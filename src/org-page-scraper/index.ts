import dotenv from "dotenv";
dotenv.config();

import puppeteer from "puppeteer";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { Row, addRows, scrapeOrgPageData } from "./helpers";
import { fruitLoader, stopFruitLoader } from "../log-loader/index";

(async () => {
  const intervalID1 = fruitLoader("Getting organizations from spreadsheet");

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

  const orgSheet = doc.sheetsByIndex[0];

  if (!orgSheet) throw new Error("Sheet not found");

  const allOrgs = await orgSheet.getRows();

  const intervalID2 = fruitLoader(
    "Scraping organization page data",
    intervalID1
  );

  const browser = await puppeteer.launch({ headless: "new" });

  const orgPageDataPromises = allOrgs.map((org) => {
    const orgPageData = scrapeOrgPageData(
      browser,
      org.get("url"),
      org.get("companyName")
    );

    return orgPageData;
  });

  const orgPageDataResults = await Promise.allSettled(orgPageDataPromises);

  const successfulResults: Row[] = [];

  for (const result of orgPageDataResults) {
    if (result.status === "fulfilled") {
      successfulResults.push(result.value);
    } else {
      console.error("Scraping failed for a URL:", result.reason);
    }
  }

  await browser.close();

  await addRows(doc, successfulResults, 1);

  stopFruitLoader(intervalID2);
})();
