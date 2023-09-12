# Opera America Scraper

The Opera America Scraper is a script designed to gather and store organization data from [OPERA America](https://www.operaamerica.org/). This data is then organized and stored in a Google Spreadsheet for further analysis and use.

## Table of Contents

- [Overview](#overview)
- [Techstack](#techstack)

## Overview

This scraper operates in two main steps:

1. **Metadata Collection**:

   - The script first navigates through the [OPERA America membership directory](https://www.operaamerica.org/membership-directory).
   - It collects metadata about each member organization, including a URL that links to their respective membership pages.

2. **Detailed Scraping**:
   - The script then follows each URL obtained in the previous step to access the membership pages of individual organizations.
   - It extracts specific and unique data for each organization, such as staff members and contact emails.
   - All gathered data is organized and stored in a Google Spreadsheet for easy reference and analysis.

## Techstack

- **TypeScript**
- **Puppeteer**
- **[google-spreadsheet]**(https://www.npmjs.com/package/google-spreadsheet)
- **[google-auth-library]**(https://www.npmjs.com/package/google-auth-library)
