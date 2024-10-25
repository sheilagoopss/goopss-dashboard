import axios from "axios";
import * as cheerio from "cheerio";
import { IStoreDetail } from "../types/StoreDetail";

// Helper function to clean HTML
function cleanHTML(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim()
    .replace(/\n{3,}/g, "\n\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export async function processStoreDetails(
  url: string,
): Promise<IStoreDetail | null> {
  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    const storeName = $("title").text().split(" - ")[0].trim();
    const sales = $("span.wt-text-caption.wt-no-wrap").text().trim();
    const announcement = $(
      ".announcement-section p.wt-text-gray.announcement-collapse",
    )
      .text()
      .trim();
    const about = $("#about-story").text().trim();

    const faqScript = $('script[type="application/ld+json"]').html();
    let faq = "Not Found";
    if (faqScript) {
      try {
        const faqJson = JSON.parse(faqScript);
        if (faqJson["@type"] === "FAQPage") {
          faq = faqJson.mainEntity
            .map((f: any) => `${f.name}\n${f.acceptedAnswer.text}`)
            .join("\n\n");
        }
      } catch (error) {
        console.log("Error parsing FAQ JSON:", error);
      }
    }

    const bannerImageUrl = $("img.wt-display-block").attr("src") || "Not Found";

    return {
      storeName: cleanHTML(storeName),
      sales: Number(sales),
      announcement: cleanHTML(announcement),
      about: cleanHTML(about),
      faq,
      bannerImage: bannerImageUrl,
    };
  } catch (error) {
    console.error(`Error fetching details for ${url}:`, error);
    return null;
  }
}

export async function extractStoreDetails(urls: string[]) {
  const results = [];

  for (const url of urls) {
    const details = await processStoreDetails(url);
    results.push({ url, ...details });
  }

  return results;
}
