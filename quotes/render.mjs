import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * Renders a quotation to PDF.
 *
 *   node quotes/render.mjs quotes/social-media-quotation.html
 *
 * Edit the HTML, run this, send the PDF.
 *
 * Playwright is resolved out of frontend/node_modules rather than installed
 * again here: this folder is business paperwork, not a package. pathToFileURL
 * rather than string concatenation, because Windows paths are full of
 * backslashes and they do not survive being pasted into a URL.
 */
const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, "..", "frontend", "package.json"));
const { chromium } = require("@playwright/test");

const input = resolve(process.argv[2] ?? join(here, "social-media-quotation.html"));
const output = input.replace(/\.html$/i, ".pdf");

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(input).href, { waitUntil: "networkidle" });
await page.pdf({
  path: output,
  format: "A4",
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
});
await browser.close();
console.log("wrote", output);
