import dotenv from "dotenv";
dotenv.config();

import puppeteer from "puppeteer";
import z from "zod";
import { scrapeOperaMembershipData } from "./scraper";

//   const doc = new GoogleSpreadsheet(
//     process.env.SHEET_ID || "",
//     import("../credentials.json")
//   );

(async () => {
  const browser = await puppeteer.launch({ headless: false });

  const url = process.env.URL;

  if (!url) throw new Error("URL not found");

  const allMembershipTableDataCells = await scrapeOperaMembershipData(
    browser,
    url
  );

  await browser.close();

  console.log(allMembershipTableDataCells);
})();
