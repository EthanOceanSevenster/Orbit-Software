import { site } from "@/lib/site";

/**
 * What Google reads instead of guessing.
 *
 * Schema.org JSON-LD describing the business, what it sells and what it
 * costs. This is how a search result can show a price and a service area
 * rather than a bare blue link, and it is the single cheapest piece of SEO
 * there is: no design, no copy, no ongoing work.
 *
 * Every fact here already appears on the page. Structured data that
 * contradicts the page is worse than none, because Google checks.
 */
export function StructuredData() {
  const base = site.url.replace(/\/$/, "");

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfessionalService",
        "@id": `${base}/#business`,
        name: site.name,
        description: site.description,
        url: base,
        areaServed: { "@type": "Country", name: "South Africa" },
        priceRange: `R${site.pricing.setupFee} setup, R${site.pricing.monthlyFee}/month`,
        serviceType: [
          "Website design",
          "Managed web hosting",
          "Website maintenance",
          "Dashboards and reporting",
          "Business automation",
        ],
        knowsLanguage: ["en-ZA"],
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: base,
        name: site.name,
        publisher: { "@id": `${base}/#business` },
        inLanguage: "en-ZA",
      },
      {
        "@type": "Service",
        name: "Website design and managed hosting",
        provider: { "@id": `${base}/#business` },
        areaServed: { "@type": "Country", name: "South Africa" },
        description:
          "A website designed, built, hosted and maintained for one once-off fee and one monthly fee.",
        offers: {
          "@type": "Offer",
          priceCurrency: site.pricing.currency,
          price: String(site.pricing.monthlyFee),
          priceSpecification: [
            {
              "@type": "UnitPriceSpecification",
              priceType: "https://schema.org/Subscription",
              price: String(site.pricing.monthlyFee),
              priceCurrency: site.pricing.currency,
              billingDuration: 1,
              billingIncrement: 1,
              unitText: "MONTH",
            },
            {
              "@type": "UnitPriceSpecification",
              name: "Once-off setup",
              price: String(site.pricing.setupFee),
              priceCurrency: site.pricing.currency,
            },
          ],
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // Our own object, serialised here. Nothing from a user reaches it.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
