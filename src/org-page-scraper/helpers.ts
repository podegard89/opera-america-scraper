import { GoogleSpreadsheet } from "google-spreadsheet";
import { Browser } from "puppeteer";

// const RowDataSchema = z.object({
//   staffListings: z.array(z.string()),
//   contactEmail: z.string().email(),
// });

export type Row = {
  // these are for variable amounts of staffListings
  [x: string]: string;
  contactEmail: string;
  companyName: string;
};

export async function addRows(
  doc: GoogleSpreadsheet,
  rows: Row[],
  i: number = 0
) {
  const sheet = doc.sheetsByIndex[i];

  if (!sheet) throw new Error("Sheet not found");

  await sheet.addRows(rows);
}

export async function scrapeOrgPageData(
  browser: Browser,
  url: string,
  companyName: string
): Promise<Row> {
  const page = await browser.newPage();

  await page.goto(url);

  const staffListingsTable = await page.$(
    " .membership-org-staff > table.membership-org-events-table"
  );

  if (!staffListingsTable) {
    return { companyName, contactEmail: "No info found" };
  }

  const staffListings = await staffListingsTable.evaluate((node) => {
    const rows = Array.from(node.querySelectorAll("tr"));

    // shift the first row off, which is just the table headers
    rows.shift();

    const staffListings = rows.map((row) => {
      const [nameElement, titleElement] = Array.from(
        row.querySelectorAll("td")
      );

      // names show up with two spaces between first and last name
      const name = nameElement?.textContent?.replace(/\s\s+/g, " ");

      const title = titleElement?.textContent;

      if ((!name && name !== "") || (!title && title !== "")) {
        return "No info found";
      }

      return `${name} - ${title}`;
    });

    return staffListings;
  });

  const shareItemsDiv = await page.$(".share__list");

  // if (!shareItemsDiv) throw new Error("Share items not found");

  const contactEmail = !shareItemsDiv
    ? "No contact email found"
    : await shareItemsDiv.evaluate((node) => {
        const shareItems = node.querySelectorAll("a");

        const emailShareItem = shareItems[shareItems.length - 1];

        if (!emailShareItem) throw new Error("Email share item not found");

        const href = emailShareItem.href;

        if (!href.includes("mailto:")) return "No contact email found";

        return href.split(":")[1] || "No contact email found";
      });

  await page.close();

  const newRow: Row = {
    companyName: companyName,
    contactEmail: contactEmail,
  };

  for (let i = 0; i < staffListings.length; i++) {
    const staffListing = staffListings[i]!;
    newRow[`staffMember${i + 1}`] = staffListing;
  }

  return newRow;
}
