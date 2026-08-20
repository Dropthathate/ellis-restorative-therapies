# Restore With Ellis SEO and GEO Audit

**Audit date:** August 20, 2026

## Verified local entity signals

| Field | Verified value |
| --- | --- |
| Business name | Ellis Restorative Therapies |
| Website | `https://www.restorewithellis.com/` |
| Client portal | `https://client.restorewithellis.com/` |
| Address | 2209 Coffee Rd, Suite M, Modesto, CA 95355 |
| Phone | (209) 450-5296 |
| Primary public services | Therapeutic massage, neuromuscular therapy, clinical bodywork |
| Instagram | `https://www.instagram.com/ellisrestorativetherapies/` |
| Facebook | `https://www.facebook.com/p/Ellis-Restorative-Therapies-61580974690488/` |

## Current strengths

The public homepage is crawlable, includes a canonical URL, has a location and phone number visible to visitors, offers therapist-specific booking routes, and points clients to the separate portal. The `robots.txt` file allows general crawling, and the sitemap already lists the principal public pages. Existing secondary pages contain valuable Modesto and neuromuscular-therapy content.

## Priority gaps

1. The redesigned homepage needs a more complete and specific `LocalBusiness` entity graph, including consistently visible services, social `sameAs` references, images, practitioner connections, and business-level local signals.
2. The service language should distinguish therapeutic massage and neuromuscular massage in clear, non-diagnostic terms while mentioning Modesto and Coffee Road naturally.
3. The sitemap must use proper XML syntax and include every canonical public page, including the relevant service pages.
4. The client portal should remain private-client oriented. It needs accurate local identity and social preview metadata, but it should not be positioned as a replacement for the crawlable public service website.
5. Google Business Profile, Bing Places, Instagram, and Facebook must use the exact same business name, phone, address, website, category, services, hours, and photos. Do not add fabricated reviews, unverified rankings, unsupported health claims, or HSA/FSA claims pending payment-processor confirmation.

## Implementation guardrails

Google supports `LocalBusiness` JSON-LD with an address and name required, and recommends more complete business details such as a primary phone, URL, price range, business hours, geo-coordinates, and crawlable images where applicable. The markup must match visible page content and does not guarantee a rich-result presentation.[1][2]

Google’s own local-ranking guidance emphasizes verified, complete and accurate Business Profile data, accurate categories and hours, review responses, photos, relevance, distance, and prominence. Rankings cannot be purchased or guaranteed.[3]

## References

[1]: https://developers.google.com/search/docs/appearance/structured-data/local-business
[2]: https://developers.google.com/search/docs/appearance/structured-data/sd-policies
[3]: https://support.google.com/business/answer/7091?hl=en
