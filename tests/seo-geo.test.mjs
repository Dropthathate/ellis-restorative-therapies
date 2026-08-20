import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (name) => readFileSync(new URL(name, root), 'utf8');
const index = read('index.html');
const booking = read('book.html');
const robots = read('robots.txt');
const sitemap = read('sitemap.xml');
const llms = read('llms.txt');
const informationalPages = ['about.html', 'services.html', 'contact.html', 'blog.html'].map((name) => ({ name, html: read(name) }));

const schemaMatch = index.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
assert.ok(schemaMatch, 'Homepage must contain JSON-LD');
const schema = JSON.parse(schemaMatch[1]);
const business = schema['@graph'].find((item) => item['@id'] === 'https://www.restorewithellis.com/#business');

assert.equal(business.name, 'Ellis Restorative Therapies');
assert.equal(business.address.streetAddress, '2209 Coffee Rd, Suite M');
assert.equal(business.address.addressLocality, 'Modesto');
assert.equal(business.address.addressRegion, 'CA');
assert.equal(business.address.postalCode, '95355');
assert.equal(business.telephone, '+12094505296');
assert.ok(business.sameAs.includes('https://www.instagram.com/ellisrestorativetherapies/'));
assert.ok(business.sameAs.includes('https://www.facebook.com/p/Ellis-Restorative-Therapies-61580974690488/'));
assert.match(index, /Therapeutic & Neuromuscular Massage in Modesto, CA/);
assert.match(index, /Therapeutic massage in Modesto, CA/);
assert.match(index, /Neuromuscular Massage in Modesto/);
assert.match(booking, /Book Therapeutic Massage in Modesto, CA/);
assert.match(robots, /Sitemap: https:\/\/www\.restorewithellis\.com\/sitemap\.xml/);
assert.match(sitemap, /https:\/\/www\.restorewithellis\.com\/services\.html/);
assert.match(sitemap, /https:\/\/www\.restorewithellis\.com\/book\.html/);
assert.match(llms, /Ellis Restorative Therapies/);
assert.match(llms, /client\.restorewithellis\.com/);

for (const { name, html } of informationalPages) {
  assert.doesNotMatch(html, /aggregateRating|reviewCount|ratingValue/);
  assert.match(html, /Ellis Restorative Therapies/);
  assert.match(html, /2209 Coffee Rd, Suite M/);
  assert.match(html, /instagram\.com\/ellisrestorativetherapies/);
  assert.match(html, /facebook\.com\/p\/Ellis-Restorative-Therapies/);
  assert.doesNotMatch(html, /HSA\/FSA/);
  console.log(`${name} local entity assertions passed.`);
}

console.log('SEO and GEO entity assertions passed.');
